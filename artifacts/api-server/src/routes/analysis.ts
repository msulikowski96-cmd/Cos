import { Router, type IRouter } from "express";
import { GetSummonerAnalysisResponse } from "@workspace/api-zod";
import { riotFetch, handleRiotError } from "../lib/riot-fetch";
import { cache } from "../lib/cache";
import { riotLimit } from "../middlewares/rateLimit";
import {
  benchmarksForRole,
  scoreVsBenchmark,
  shrinkWinRate,
  wilsonLowerBound,
  ewma,
  proportionZ,
  gradeFromScore,
} from "../lib/stats-utils";

const router: IRouter = Router();

router.use(riotLimit);

const REGION_TO_CLUSTER: Record<string, string> = {
  NA1: "americas", BR1: "americas", LA1: "americas", LA2: "americas",
  KR: "asia", JP1: "asia",
  EUW1: "europe", EUN1: "europe", TR1: "europe", RU: "europe",
  OC1: "sea", PH2: "sea", SG2: "sea", TH2: "sea", TW2: "sea", VN2: "sea",
};

interface MatchData {
  matchId: string;
  gameMode: string;
  gameDuration: number;
  gameEndTimestamp: number;
  win: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  goldEarned: number;
  cs: number;
  visionScore: number;
  teamKills: number;
  teamDamageDealt: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  wardsPlaced: number;
  wardsKilled: number;
  controlWardsPlaced: number;
  damageTaken: number;
  selfMitigatedDamage: number;
  soloKills: number;
  turretKills: number;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  objectivesStolen: number;
  teamPosition: string;
  physicalDamage: number;
  magicDamage: number;
  trueDamage: number;
  timeSpentDead: number;
  longestTimeAlive: number;
  dragonKills: number;
  inhibitorKills: number;
  bountyGold: number;
  maxCsAdvantage: number;
  skillshotsLanded: number;
  skillshotsDodged: number;
  teamDamagePct: number;
  enemyMissedCS: number;
  goldPerMinute: number;
  teamTurretKills: number;
  teamObjectivesStolen: number;
  hadAfkTeammate: boolean;
  wasAfk: boolean;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  return Math.sqrt(arr.reduce((sum, val) => sum + (val - avg) ** 2, 0) / arr.length);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function grade(score: number): string {
  if (score >= 90) return "S+";
  if (score >= 80) return "S";
  if (score >= 70) return "A";
  if (score >= 58) return "B";
  if (score >= 45) return "C";
  if (score >= 30) return "D";
  return "F";
}

function rateValue(value: number, thresholds: [number, string][]): string {
  for (const [threshold, label] of thresholds) {
    if (value >= threshold) return label;
  }
  return thresholds[thresholds.length - 1][1];
}

function computeKda(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists;
  return (kills + assists) / deaths;
}

function computeGameScore(m: MatchData): number {
  const bench = benchmarksForRole(m.teamPosition);
  const isSup = m.teamPosition === "UTILITY";
  const kda = computeKda(m.kills, m.deaths, m.assists);
  const csPerMin = m.gameDuration > 0 ? (m.cs / m.gameDuration) * 60 : 0;
  const dmgPerMin = m.gameDuration > 0 ? (m.totalDamageDealt / m.gameDuration) * 60 : 0;
  const visionPerMin = m.gameDuration > 0 ? (m.visionScore / m.gameDuration) * 60 : 0;
  const kp = m.teamKills > 0 ? ((m.kills + m.assists) / m.teamKills) * 100 : 0;
  const dmgShare = m.teamDamageDealt > 0 ? (m.totalDamageDealt / m.teamDamageDealt) * 100 : 0;
  const timeDeadPct = m.gameDuration > 0 ? (m.timeSpentDead / m.gameDuration) * 100 : 0;

  // Log-scaled KDA: diminishing returns above 5 (a 20 KDA game shouldn't be 4x a 5 KDA game)
  const kdaScore = clamp(Math.log2(kda + 1) * 32, 0, 100);

  // Role-aware metric scores
  const farmScore = isSup
    ? scoreVsBenchmark(visionPerMin, bench.visionPerMin) // support: replace farm weight with vision
    : scoreVsBenchmark(csPerMin, bench.csPerMin);
  const dmgScore = scoreVsBenchmark(dmgPerMin, bench.damagePerMin);
  const kpScore = scoreVsBenchmark(kp, bench.killParticipation);
  const dmgShareScore = scoreVsBenchmark(dmgShare, bench.damageShare);

  // Death/time-dead penalties scale with game length so a 30-min game with 5 deaths
  // is treated differently from a 50-min game with 5 deaths.
  const deathsPerMin = m.gameDuration > 0 ? (m.deaths / m.gameDuration) * 60 : 0;
  const deathPenalty = clamp(100 - deathsPerMin * 400, 0, 100); // 0.25 deaths/min ≈ 0 score
  const timeDeadPenalty = clamp(timeDeadPct * 1.4, 0, 22);

  const winBonus = m.win ? 15 : 0;

  return clamp(
    kdaScore * 0.26 +
      farmScore * 0.12 +
      kpScore * 0.18 +
      dmgScore * 0.12 +
      dmgShareScore * 0.08 +
      deathPenalty * 0.14 +
      winBonus -
      timeDeadPenalty,
    0,
    100
  );
}

function computeAnalysis(matches: MatchData[]) {
  const totalGames = matches.length;

  const empty = {
    overallScore: 0, overallRating: "Niewystarczające dane", totalGamesAnalyzed: 0, winRate: 0,
    metrics: [], championBreakdown: [],
    formTrend: { recentWinRate: 0, overallWinRate: 0, recentKda: 0, overallKda: 0, trend: "neutral", trendDescription: "Za mało danych", recentGames: 0 },
    strengths: [], weaknesses: [],
    playstyleArchetype: "Nieznany", playstyleDescription: "Za mało meczy do określenia profilu gracza.",
    criticalMistakes: [], gameplayPatterns: [],
    primaryRole: "Nieznana", roleDistribution: {},
    currentStreak: { type: "loss" as const, count: 0 },
    bestGame: null, worstGame: null,
    coachingTips: [], championRecommendations: [],
    performanceByGameLength: {
      short: { label: "< 25 min", gamesPlayed: 0, winRate: 0, avgKda: 0, avgCsPerMin: 0 },
      medium: { label: "25-35 min", gamesPlayed: 0, winRate: 0, avgKda: 0, avgCsPerMin: 0 },
      long: { label: "> 35 min", gamesPlayed: 0, winRate: 0, avgKda: 0, avgCsPerMin: 0 },
    },
    damageTypeBreakdown: { physicalPct: 0, magicPct: 0, truePct: 0 },
    predictedTier: { tier: "UNRANKED", division: "", lp: 0, confidence: "Niska", description: "Za mało meczy do oszacowania rangi." },
    playstyleRadar: { aggression: 0, farming: 0, vision: 0, teamfighting: 0, carry: 0 },
    lanePhaseStats: { firstBloodRate: 0, avgEarlyKills: 0, avgCsAdvantage: 0, earlyPressureScore: 0, grade: "F", description: "Za mało danych." },
    objectiveStats: { avgTurretKills: 0, avgDragonKills: 0, avgObjectivesStolen: 0, avgInhibitorKills: 0, objectiveControlScore: 0, grade: "F", description: "Za mało danych." },
    deathAnalysis: { avgDeaths: 0, avgTimeDeadPct: 0, deathSpikeGames: 0, deathSpikeRate: 0, mostDeathsInGame: 0, avgBountyGold: 0, deathScore: 0, grade: "F", description: "Za mało danych." },
    tiltIndicator: { score: 0, description: "Za mało danych.", lossStreakKdaDrop: 0, isTilted: false },
    winConditions: { factors: [], summary: "Za mało meczy do analizy warunków zwycięstwa." },
    powerCurve: { phases: [], strongestPhase: "unknown", description: "Za mało meczy do analizy krzywej mocy." },
    rankBenchmarks: [],
    improvementRoadmap: [],
    comebackAnalysis: { comebackWinRate: 0, snowballWinRate: 0, evenWinRate: 0, comebackGames: 0, snowballGames: 0, evenGames: 0, description: "Za mało danych." },
    skillshotStats: { avgLanded: 0, avgDodged: 0, hitRate: 0, grade: "F", description: "Za mało danych." },
    matchTimeline: [],
  };
  if (totalGames === 0) return empty;

  const validMatches = matches.filter((m) => !m.wasAfk && m.gameDuration > 300);
  if (validMatches.length === 0) return empty;
  const N = validMatches.length;

  const wins = validMatches.filter((m) => m.win).length;
  const winRate = (wins / N) * 100;

  const kdas = validMatches.map((m) => computeKda(m.kills, m.deaths, m.assists));
  const csPerMin = validMatches.map((m) => m.gameDuration > 0 ? (m.cs / m.gameDuration) * 60 : 0);
  const dmgPerMin = validMatches.map((m) => m.gameDuration > 0 ? (m.totalDamageDealt / m.gameDuration) * 60 : 0);
  const goldPerMin = validMatches.map((m) => m.gameDuration > 0 ? (m.goldEarned / m.gameDuration) * 60 : 0);
  const visionPerMin = validMatches.map((m) => m.gameDuration > 0 ? (m.visionScore / m.gameDuration) * 60 : 0);
  const deathsArr = validMatches.map((m) => m.deaths);
  const dmgPerGold = validMatches.map((m) => m.goldEarned > 0 ? m.totalDamageDealt / m.goldEarned : 0);
  const killParticipation = validMatches.map((m) => m.teamKills > 0 ? ((m.kills + m.assists) / m.teamKills) * 100 : 0);
  const damageShare = validMatches.map((m) => m.teamDamageDealt > 0 ? (m.totalDamageDealt / m.teamDamageDealt) * 100 : 0);
  const multikillScore = validMatches.map((m) => m.doubleKills * 1 + m.tripleKills * 2 + m.quadraKills * 4 + m.pentaKills * 8);
  const wardScore = validMatches.map((m) => m.wardsPlaced + m.wardsKilled * 1.5 + m.controlWardsPlaced * 2);
  const dmgEfficiency = validMatches.map((m) => m.damageTaken > 0 ? m.totalDamageDealt / m.damageTaken : 1);
  const soloKillArr = validMatches.map((m) => m.soloKills);
  const timeDeadPct = validMatches.map((m) => m.gameDuration > 0 ? (m.timeSpentDead / m.gameDuration) * 100 : 0);
  const firstBloods = validMatches.filter((m) => m.firstBloodKill || m.firstBloodAssist).length;
  const skillshotHitRate = validMatches.map((m) => {
    const total = m.skillshotsLanded + m.skillshotsDodged;
    return total > 0 ? (m.skillshotsLanded / total) * 100 : 0;
  });
  const turretContrib = validMatches.map((m) => m.teamTurretKills > 0 ? (m.turretKills / m.teamTurretKills) * 100 : 0);

  const avgKda = mean(kdas);
  const medianKda = median(kdas);
  const avgCsPerMin = mean(csPerMin);
  const avgDmgPerMin = mean(dmgPerMin);
  const avgVisionPerMin = mean(visionPerMin);
  const avgDeaths = mean(deathsArr);
  const avgDmgPerGold = mean(dmgPerGold);
  const avgKillParticipation = mean(killParticipation);
  const avgDamageShare = mean(damageShare);
  const avgMultikillScore = mean(multikillScore);
  const avgWardScore = mean(wardScore);
  const avgDmgEfficiency = mean(dmgEfficiency);
  const avgSoloKills = mean(soloKillArr);
  const firstBloodRate = (firstBloods / N) * 100;
  const avgTimeDeadPct = mean(timeDeadPct);
  const avgGoldPerMin = mean(goldPerMin);
  const avgDragonKills = mean(validMatches.map((m) => m.dragonKills));
  const avgTurretKills = mean(validMatches.map((m) => m.turretKills));
  const avgInhibitorKills = mean(validMatches.map((m) => m.inhibitorKills));
  const avgObjectivesStolen = mean(validMatches.map((m) => m.objectivesStolen));
  const avgBountyGold = mean(validMatches.map((m) => m.bountyGold));
  const avgMaxCsAdvantage = mean(validMatches.map((m) => m.maxCsAdvantage));
  const avgTurretContrib = mean(turretContrib);
  const avgEnemyMissedCS = mean(validMatches.map((m) => m.enemyMissedCS));

  const winMatches = validMatches.filter((m) => m.win);
  const lossMatches = validMatches.filter((m) => !m.win);
  const winKda = winMatches.length > 0 ? mean(winMatches.map((m) => computeKda(m.kills, m.deaths, m.assists))) : 0;
  const lossKda = lossMatches.length > 0 ? mean(lossMatches.map((m) => computeKda(m.kills, m.deaths, m.assists))) : 0;
  const kdaDiff = winKda - lossKda;

  const kdaScore = clamp(Math.log2(avgKda + 1) * 30, 0, 100);
  const csScore = clamp((avgCsPerMin / 10) * 100, 0, 100);
  const visionScoreVal = clamp((avgVisionPerMin / 1.5) * 100, 0, 100);
  const wardScore100 = clamp((avgWardScore / 15) * 100, 0, 100);
  const combinedVisionScore = visionScoreVal * 0.55 + wardScore100 * 0.45;
  const dmgScore = clamp((avgDmgPerMin / 1500) * 100, 0, 100);
  const goldEffScore = clamp((avgDmgPerGold / 2.0) * 100, 0, 100);
  const survivalDeathScore = clamp(100 - avgDeaths * 11, 0, 100);
  const timeDeadScore = clamp(100 - avgTimeDeadPct * 4, 0, 100);
  const survivalEffScore = clamp(avgDmgEfficiency * 35, 0, 50);
  const survivalScore = clamp(survivalDeathScore * 0.55 + survivalEffScore * 0.5 + timeDeadScore * 0.15, 0, 100);
  const kdaStdDev = stdDev(kdas);
  const coeffOfVariation = avgKda > 0 ? kdaStdDev / avgKda : 1;
  const consistencyScore = clamp(100 - coeffOfVariation * 70, 0, 100);
  const carryScore = clamp(50 + kdaDiff * 10, 0, 100);
  const kpScore = clamp((avgKillParticipation / 70) * 100, 0, 100);
  const multikillScoreNorm = clamp((avgMultikillScore / 5) * 100, 0, 100);
  const dmgShareScore = clamp((avgDamageShare / 30) * 100, 0, 100);
  const objectiveScore = clamp(
    (avgDragonKills / 1.5) * 30 +
    (avgTurretKills / 3) * 30 +
    (avgObjectivesStolen * 25) +
    clamp(avgTurretContrib * 1.5, 0, 20),
    0, 100
  );
  const goldEfficiencyScore = clamp((avgGoldPerMin / 400) * 100, 0, 100);
  const winRateScore = winRate;
  const pentaRate = validMatches.filter((m) => m.pentaKills > 0).length;
  const quadraRate = validMatches.filter((m) => m.quadraKills > 0).length;
  const tripleRate = validMatches.filter((m) => m.tripleKills > 0).length;

  const overallScore = Math.round(clamp(
    kdaScore * 0.16 + csScore * 0.08 + combinedVisionScore * 0.06 +
    dmgScore * 0.11 + goldEffScore * 0.05 + survivalScore * 0.12 +
    consistencyScore * 0.06 + carryScore * 0.07 + kpScore * 0.10 +
    dmgShareScore * 0.05 + multikillScoreNorm * 0.03 + winRateScore * 0.07 +
    objectiveScore * 0.04,
    0, 100
  ));

  const overallRating = rateValue(overallScore, [
    [88, "S+"], [78, "S"], [68, "A"], [56, "B"], [44, "C"], [32, "D"], [0, "F"],
  ]);

  const roleCounts: Record<string, number> = {};
  for (const m of validMatches) roleCounts[m.teamPosition] = (roleCounts[m.teamPosition] ?? 0) + 1;
  const primaryRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const isSupport = primaryRole === "UTILITY";

  const metrics = [
    {
      name: "KDA", value: Math.round(kdaScore), maxValue: 100,
      rating: rateValue(avgKda, [[8, "Legendarny"], [5, "Doskonały"], [3, "Dobry"], [2, "Przeciętny"], [1.5, "Poniżej normy"], [0, "Słaby"]]),
      description: `Śr. KDA ${avgKda.toFixed(2)} (mediana ${medianKda.toFixed(2)}) | W zwycięstwach: ${winKda.toFixed(2)} vs porażkach: ${lossKda.toFixed(2)}`,
    },
    {
      name: "Uczestnictwo w zabójstwach", value: Math.round(kpScore), maxValue: 100,
      rating: rateValue(avgKillParticipation, [[85, "Dominujący"], [70, "Wysoki"], [55, "Przeciętny"], [40, "Niski"], [0, "Bierny"]]),
      description: `Śr. KP% = ${avgKillParticipation.toFixed(1)}% — obecność drużyny w walkach`,
    },
    {
      name: "Efektywność CS", value: Math.round(csScore), maxValue: 100,
      rating: isSupport ? "Rola supportu" : rateValue(avgCsPerMin, [[9, "Elitarny"], [7.5, "Doskonały"], [6, "Dobry"], [5, "Przeciętny"], [4, "Poniżej normy"], [0, "Słaby"]]),
      description: isSupport ? `Support: ${avgCsPerMin.toFixed(1)} CS/min` : `${avgCsPerMin.toFixed(1)} CS/min | Przewaga na min. nad lane opp.: ${avgMaxCsAdvantage.toFixed(0)} CS`,
    },
    {
      name: "Obrażenia", value: Math.round(dmgScore), maxValue: 100,
      rating: rateValue(avgDmgPerMin, [[1300, "Dominujący"], [1000, "Wysoki"], [700, "Przeciętny"], [450, "Poniżej normy"], [0, "Niski"]]),
      description: `${avgDmgPerMin.toFixed(0)} DMG/min | Udział w drużynowych: ${avgDamageShare.toFixed(1)}% | Efektywność: ${avgDmgEfficiency.toFixed(2)}x`,
    },
    {
      name: "Udział w obrażeniach drużyny", value: Math.round(dmgShareScore), maxValue: 100,
      rating: rateValue(avgDamageShare, [[35, "Dominujący"], [25, "Wysoki"], [18, "Przeciętny"], [12, "Niski"], [0, "Minimalny"]]),
      description: `Śr. ${avgDamageShare.toFixed(1)}% obrażeń całej drużyny | Gold/min: ${avgGoldPerMin.toFixed(0)}`,
    },
    {
      name: "Multikille", value: Math.round(multikillScoreNorm), maxValue: 100,
      rating: rateValue(avgMultikillScore, [[4, "Masowy zabójca"], [2, "Zabójca"], [1, "Aktywny"], [0.3, "Okazjonalny"], [0, "Rzadki"]]),
      description: `${tripleRate}× potrójne, ${quadraRate}× quadra, ${pentaRate}× penta | Solo kills/mecz: ${avgSoloKills.toFixed(1)}`,
    },
    {
      name: "Kontrola wizji", value: Math.round(combinedVisionScore), maxValue: 100,
      rating: rateValue(avgVisionPerMin, [[1.5, "Elitarny"], [1.0, "Dobry"], [0.7, "Przeciętny"], [0.4, "Poniżej normy"], [0, "Słaby"]]),
      description: `${avgVisionPerMin.toFixed(2)} pkt wizji/min | Pink wardy/mecz: ${mean(validMatches.map((m) => m.controlWardsPlaced)).toFixed(1)} | Zniszczone wardy: ${mean(validMatches.map((m) => m.wardsKilled)).toFixed(1)}`,
    },
    {
      name: "Efektywność złota", value: Math.round(goldEffScore), maxValue: 100,
      rating: rateValue(avgDmgPerGold, [[1.8, "Bardzo wydajny"], [1.4, "Wydajny"], [1.0, "Przeciętny"], [0.7, "Niewydajny"], [0, "Słaby"]]),
      description: `${avgDmgPerGold.toFixed(2)} DMG/złoto | Śr. dochód: ${avgGoldPerMin.toFixed(0)} złota/min`,
    },
    {
      name: "Przeżywalność", value: Math.round(survivalScore), maxValue: 100,
      rating: rateValue(survivalScore, [[85, "Wyjątkowy"], [68, "Dobry"], [50, "Przeciętny"], [30, "Ryzykowny"], [0, "Lekkomyślny"]]),
      description: `Śr. ${avgDeaths.toFixed(1)} śmierci/mecz | Czas martwy: ${avgTimeDeadPct.toFixed(1)}% gry | DMG efektywność: ${avgDmgEfficiency.toFixed(2)}x`,
    },
    {
      name: "Konsekwencja", value: Math.round(consistencyScore), maxValue: 100,
      rating: rateValue(consistencyScore, [[80, "Niezawodny"], [62, "Solidny"], [44, "Zmienny"], [25, "Niestały"], [0, "Nieprzewidywalny"]]),
      description: `Wariancja KDA: ${(coeffOfVariation * 100).toFixed(0)}% | Mediana vs śr: ${medianKda.toFixed(2)} vs ${avgKda.toFixed(2)}`,
    },
    {
      name: "Potencjał carry", value: Math.round(carryScore), maxValue: 100,
      rating: rateValue(carryScore, [[80, "Twardy carry"], [62, "Kluczowy gracz"], [44, "Gracz drużynowy"], [25, "Zależny"], [0, "Mały wpływ"]]),
      description: `KDA w zwycięstwach: ${winKda.toFixed(2)} vs porażkach: ${lossKda.toFixed(2)} (różnica: ${kdaDiff.toFixed(2)})`,
    },
    {
      name: "Kontrola obiektywów", value: Math.round(objectiveScore), maxValue: 100,
      rating: rateValue(objectiveScore, [[80, "Dominacja obiektywna"], [60, "Silny"], [40, "Przeciętny"], [20, "Słaby"], [0, "Ignoruje"]]),
      description: `Śr. ${avgDragonKills.toFixed(1)} smoków | ${avgTurretKills.toFixed(1)} wież | ${avgInhibitorKills.toFixed(1)} inhibitorów | Skradzione: ${avgObjectivesStolen.toFixed(2)}/mecz`,
    },
  ];

  const champMap = new Map<string, MatchData[]>();
  for (const m of validMatches) {
    const arr = champMap.get(m.championName) ?? [];
    arr.push(m);
    champMap.set(m.championName, arr);
  }

  // Player's overall WR acts as a more informative prior for champion-level WR
  // than a flat 50% — a Diamond player's "unknown" champ performance is closer
  // to their overall WR than to 50/50.
  const priorWR = wins / Math.max(N, 1);

  const championBreakdown = Array.from(champMap.entries()).map(([championName, games]) => {
    const champWins = games.filter((g) => g.win).length;
    const champKills = mean(games.map((g) => g.kills));
    const champDeaths = mean(games.map((g) => g.deaths));
    const champAssists = mean(games.map((g) => g.assists));
    const champCsPerMin = mean(games.map((g) => g.gameDuration > 0 ? (g.cs / g.gameDuration) * 60 : 0));
    const champKda = computeKda(champKills, champDeaths, champAssists);
    const champKP = mean(games.map((g) => g.teamKills > 0 ? ((g.kills + g.assists) / g.teamKills) * 100 : 0));
    const champDmgShare = mean(games.map((g) => g.teamDamageDealt > 0 ? (g.totalDamageDealt / g.teamDamageDealt) * 100 : 0));
    const champRawWR = (champWins / games.length) * 100;

    // Bayesian-shrunk WR avoids the "1 game = 100% WR" artifact.
    // Confidence scales smoothly with sample size (prior = player's overall WR, 8 game pseudo-prior).
    const champShrunkWR = shrinkWinRate(champWins, games.length, priorWR, 8) * 100;
    const champWRLower = wilsonLowerBound(champWins, games.length) * 100;

    const champTimeDeadPct = mean(games.map((g) => g.gameDuration > 0 ? (g.timeSpentDead / g.gameDuration) * 100 : 0));

    // Role-aware performance score — same shape as overall game score.
    const champRole = games[0]?.teamPosition ?? "";
    const bench = benchmarksForRole(champRole);
    const isSup = champRole === "UTILITY";
    const champDmgPerMin = mean(games.map((g) => g.gameDuration > 0 ? (g.totalDamageDealt / g.gameDuration) * 60 : 0));
    const champVisionPerMin = mean(games.map((g) => g.gameDuration > 0 ? (g.visionScore / g.gameDuration) * 60 : 0));
    const champPerfScore = Math.round(clamp(
      clamp(Math.log2(champKda + 1) * 32, 0, 100) * 0.26 +
      (isSup ? scoreVsBenchmark(champVisionPerMin, bench.visionPerMin) : scoreVsBenchmark(champCsPerMin, bench.csPerMin)) * 0.10 +
      champShrunkWR * 0.27 +
      clamp(100 - champDeaths * 11, 0, 100) * 0.15 +
      scoreVsBenchmark(champKP, bench.killParticipation) * 0.20 +
      scoreVsBenchmark(champDmgPerMin, bench.damagePerMin) * 0.04 -
      champTimeDeadPct * 1.2,
      0, 100
    ));
    return {
      championName, gamesPlayed: games.length, wins: champWins, losses: games.length - champWins,
      winRate: Math.round(champRawWR * 10) / 10,
      adjustedWinRate: Math.round(champShrunkWR * 10) / 10,
      winRateLowerBound: Math.round(champWRLower * 10) / 10,
      avgKills: Math.round(champKills * 10) / 10, avgDeaths: Math.round(champDeaths * 10) / 10, avgAssists: Math.round(champAssists * 10) / 10,
      avgCs: Math.round(mean(games.map((g) => g.cs))), avgCsPerMin: Math.round(champCsPerMin * 10) / 10,
      avgDamage: Math.round(mean(games.map((g) => g.totalDamageDealt))),
      avgGold: Math.round(mean(games.map((g) => g.goldEarned))),
      avgVisionScore: Math.round(mean(games.map((g) => g.visionScore)) * 10) / 10,
      kda: Math.round(champKda * 100) / 100,
      killParticipation: Math.round(champKP * 10) / 10,
      damageShare: Math.round(champDmgShare * 10) / 10,
      performanceScore: champPerfScore,
    };
  }).sort((a, b) => {
    // Primary: meaningful sample size (≥3 games); Secondary: Wilson lower-bound WR
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return b.winRateLowerBound - a.winRateLowerBound;
  });

  // EWMA-based form trend: gives more weight to recent games without the brittle
  // "last 7 vs rest" cliff. Complementary proportion z-test decides whether the
  // difference is statistically meaningful before labelling a streak.
  const recentCount = Math.min(7, N);
  const recentMatches = validMatches.slice(0, recentCount);
  const olderMatches = validMatches.slice(recentCount);
  const recentWins = recentMatches.filter((m) => m.win).length;
  const olderWins = olderMatches.filter((m) => m.win).length;
  const recentWinRate = (recentWins / recentCount) * 100;
  const recentKda = mean(recentMatches.map((m) => computeKda(m.kills, m.deaths, m.assists)));
  const olderKda = olderMatches.length > 0 ? mean(olderMatches.map((m) => computeKda(m.kills, m.deaths, m.assists))) : avgKda;

  // EWMA (alpha=0.3) on per-game scores — smoother form indicator than raw KDA.
  const perGameScores = validMatches.map((m) => computeGameScore(m));
  const ewmaScore = ewma(perGameScores, 0.3);
  const baselineScore = mean(perGameScores);
  const scoreTrend = ewmaScore - baselineScore;

  // Significance test: is recent WR actually different from the rest, or noise?
  const wrZ = olderMatches.length >= 3 ? proportionZ(recentWins, recentCount, olderWins, olderMatches.length) : 0;
  const winRateDiff = recentWinRate - winRate;
  const kdaDiffTrend = recentKda - olderKda;

  let trend: string, trendDescription: string;
  const sig = Math.abs(wrZ) >= 1.28; // ~80% confidence the change is real
  if (sig && wrZ > 0 && scoreTrend > 5 && kdaDiffTrend > 0.6) {
    trend = "hot";
    trendDescription = `🔥 Rozpalony — ostatnie ${recentCount} meczy: WR ${recentWinRate.toFixed(0)}% (+${winRateDiff.toFixed(0)}pp, istotne), KDA ${recentKda.toFixed(2)}, EWMA score +${scoreTrend.toFixed(1)}`;
  } else if (scoreTrend > 3 || (wrZ > 0.8 && kdaDiffTrend > 0.3)) {
    trend = "improving";
    trendDescription = `📈 Rosnąca forma — EWMA wyniku +${scoreTrend.toFixed(1)} pkt, WR ${winRateDiff >= 0 ? "+" : ""}${winRateDiff.toFixed(0)}pp vs baseline`;
  } else if (sig && wrZ < 0 && scoreTrend < -5 && kdaDiffTrend < -0.6) {
    trend = "cold";
    trendDescription = `❄️ Dołek — ostatnie ${recentCount} meczy: WR ${recentWinRate.toFixed(0)}% (${winRateDiff.toFixed(0)}pp, istotne), KDA ${recentKda.toFixed(2)} — czas na przerwę`;
  } else if (scoreTrend < -3 || (wrZ < -0.8 && kdaDiffTrend < -0.3)) {
    trend = "declining";
    trendDescription = `📉 Lekki spadek — EWMA wyniku ${scoreTrend.toFixed(1)} pkt, ${winRateDiff.toFixed(0)}pp WR poniżej normy`;
  } else {
    trend = "stable";
    trendDescription = `⚖️ Stabilna forma — gra konsekwentnie (WR ${winRate.toFixed(0)}%, KDA ${avgKda.toFixed(2)}, odchylenie nieistotne)`;
  }

  const formTrend = {
    recentWinRate: Math.round(recentWinRate * 10) / 10, overallWinRate: Math.round(winRate * 10) / 10,
    recentKda: Math.round(recentKda * 100) / 100, overallKda: Math.round(avgKda * 100) / 100,
    trend, trendDescription, recentGames: recentCount,
  };

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (kdaScore >= 72) strengths.push(`KDA: ${avgKda.toFixed(2)} — w top 20% graczy. Minimalizuje śmierci i maksymalizuje uczestnictwo`);
  if (csScore >= 72 && !isSupport) strengths.push(`CS: ${avgCsPerMin.toFixed(1)}/min — elitarne farmienie, generuje solidną złotą przewagę nad oponentami`);
  if (combinedVisionScore >= 72) strengths.push(`Wizja: ${avgVisionPerMin.toFixed(2)} pkt/min + ${mean(validMatches.map((m) => m.controlWardsPlaced)).toFixed(1)} pink/mecz — doskonała mapa`);
  if (dmgScore >= 72) strengths.push(`Obrażenia: ${avgDmgPerMin.toFixed(0)}/min, ${avgDamageShare.toFixed(0)}% udział — stale prowadzi walki dla drużyny`);
  if (survivalScore >= 72) strengths.push(`Przeżywalność: tylko ${avgDeaths.toFixed(1)} śmierci/mecz, ${avgTimeDeadPct.toFixed(1)}% czasu martwy — znakomite pozycjonowanie`);
  if (consistencyScore >= 72) strengths.push(`Konsekwencja: niskie wahania KDA (CV=${(coeffOfVariation * 100).toFixed(0)}%) — niezawodny wynik w każdym meczu`);
  if (carryScore >= 72) strengths.push(`Carry: +${kdaDiff.toFixed(2)} KDA w wygranych — statystyki skalują się ze zwycięstwami`);
  if (winRate >= 58) strengths.push(`WR ${winRate.toFixed(0)}% — ponadprzeciętny wpływ na wynik meczy`);
  if (kpScore >= 72) strengths.push(`KP ${avgKillParticipation.toFixed(0)}% — zawsze w środku akcji, kluczowy dla drużyny`);
  if (multikillScoreNorm >= 60) strengths.push(`Multikille: ${tripleRate}× triple, ${quadraRate}× quadra, ${pentaRate}× penta — potrafi dominować walki`);
  if (avgDamageShare >= 27) strengths.push(`Udział DMG: ${avgDamageShare.toFixed(0)}% — główna siła ognia drużyny`);
  if (firstBloodRate >= 30) strengths.push(`First blood: ${firstBloodRate.toFixed(0)}% meczy — presja w early game na najwyższym poziomie`);
  if (avgSoloKills >= 1.5) strengths.push(`Solo kills: ${avgSoloKills.toFixed(1)}/mecz — wyraźna przewaga w starciach 1v1`);
  if (objectiveScore >= 65) strengths.push(`Obiektywy: ${avgDragonKills.toFixed(1)} smoków + ${avgTurretKills.toFixed(1)} wież/mecz — świetna kontrola mapy`);
  if (avgBountyGold >= 900) strengths.push(`Wartość bounty: ${avgBountyGold.toFixed(0)} złota śr. — kluczowy cel dla wrogów = ważny gracz`);

  if (kdaScore < 40) weaknesses.push(`KDA: ${avgKda.toFixed(2)} — zbyt niskie. ${avgDeaths.toFixed(1)} śmierci/mecz to główny hamulec rankingu`);
  if (csScore < 38 && !isSupport) weaknesses.push(`CS: ${avgCsPerMin.toFixed(1)}/min — traci ~${((7 - avgCsPerMin) * 400 / 10).toFixed(0)} złota/min względem dobrych graczy`);
  if (combinedVisionScore < 38) weaknesses.push(`Wizja: ${avgVisionPerMin.toFixed(2)} pkt/min — niewystarczająca kontrola mapy naraża na ganki`);
  if (dmgScore < 38) weaknesses.push(`Obrażenia: ${avgDmgPerMin.toFixed(0)}/min — za małe obrażenia, zbyt mały wpływ na walki`);
  if (survivalScore < 38) weaknesses.push(`Przeżywalność: ${avgDeaths.toFixed(1)} śmierci/mecz, ${avgTimeDeadPct.toFixed(1)}% czasu martwy — złe pozycjonowanie`);
  if (consistencyScore < 38) weaknesses.push(`Konsekwencja: bardzo duże wahania wyników (CV=${(coeffOfVariation * 100).toFixed(0)}%) — niestabilna gra`);
  if (carryScore < 38) weaknesses.push(`Carry: KDA w porażkach (${lossKda.toFixed(2)}) zbliżone do zwycięstw (${winKda.toFixed(2)}) — brak wpływu na wynik`);
  if (winRate < 44) weaknesses.push(`WR ${winRate.toFixed(0)}% — znacznie poniżej normy. Rozważ zmianę puli bohaterów lub roli`);
  if (kpScore < 38) weaknesses.push(`KP ${avgKillParticipation.toFixed(0)}% — izolowana gra, nieobecność w walkach drużynowych`);
  if (avgTimeDeadPct > 18) weaknesses.push(`Czas martwy: ${avgTimeDeadPct.toFixed(1)}% gry — kluczowa strata. Tyle czasu nie wpływasz na mecz`);
  if (avgDamageShare < 10 && dmgScore < 45) weaknesses.push(`Udział DMG: tylko ${avgDamageShare.toFixed(0)}% — za mały wpływ na walki`);
  if (objectiveScore < 30) weaknesses.push(`Obiektywy: ${avgDragonKills.toFixed(1)} smoków/mecz — ignorowanie obiektywów = darmowe buffty dla wroga`);
  if (avgDmgEfficiency < 0.5) weaknesses.push(`Stosunek DMG: zadajesz ${(avgDmgEfficiency * 100).toFixed(0)}% tego co przyjmujesz — złe pozycjonowanie w walkach`);

  if (strengths.length === 0) strengths.push("Zrównoważony gracz bez dominujących mocnych stron — poprawa w dowolnym obszarze przyniesie rank up");
  if (weaknesses.length === 0) weaknesses.push("Brak znaczących słabości — utrzymuj konsekwencję i koncentruj się na wykonaniu");

  const criticalMistakes: string[] = [];
  const deathSpikeGames = validMatches.filter((m) => m.deaths >= 7).length;
  const deathSpikeRate = (deathSpikeGames / N) * 100;
  if (deathSpikeRate > 25) criticalMistakes.push(`💀 Katastrofalne mecze: ${deathSpikeGames}/${N} gier (${deathSpikeRate.toFixed(0)}%) z 7+ śmiercami — jeden tilt mecz cofa 3 dobre gry`);
  if (avgTimeDeadPct > 15) criticalMistakes.push(`⏱️ Czas martwy: ${avgTimeDeadPct.toFixed(1)}% gry — to śr. ${(avgTimeDeadPct * 1800 / 100).toFixed(0)} sekund/mecz bez wpływu na grę`);
  if (avgKillParticipation < 42) criticalMistakes.push(`🏝️ Izolacja: KP=${avgKillParticipation.toFixed(0)}% — za często zostawiasz drużynę w walkach bez siebie`);
  const poorFarmGames = validMatches.filter((m, i) => csPerMin[i] < 4 && m.teamPosition !== "UTILITY").length;
  const nonSupportGames = validMatches.filter((m) => m.teamPosition !== "UTILITY").length;
  if (nonSupportGames > 3 && (poorFarmGames / nonSupportGames) > 0.38) criticalMistakes.push(`🌾 Problemy z farmą: ${poorFarmGames}/${nonSupportGames} gier poniżej 4 CS/min — tracisz kluczowe złoto na liniach`);
  if (avgWardScore < 3 && N >= 5) criticalMistakes.push(`👁️ Brak wizji: ${avgWardScore.toFixed(1)} pkt wizji/mecz — grasz prawie na ślepo, narażasz się na ganki`);
  const zeroVisionGames = validMatches.filter((m) => m.wardsPlaced === 0).length;
  if (zeroVisionGames > 0) criticalMistakes.push(`🚫 ${zeroVisionGames}/${N} meczach BEZ żadnego warda — absolutna ślepota na mapę`);
  if (avgDmgEfficiency < 0.5 && avgDeaths > 4.5) criticalMistakes.push(`📉 Efektywność walki: zadajesz tylko ${(avgDmgEfficiency * 100).toFixed(0)}% tego co przyjmujesz obrażeń — złe ustawienie w teamfightach`);
  const noControlWardGames = validMatches.filter((m) => m.controlWardsPlaced === 0).length;
  if ((noControlWardGames / N) > 0.55 && N >= 5) criticalMistakes.push(`🔴 Pink wardy: ${noControlWardGames}/${N} meczy bez pink warda — kosztują 75g i mogą zmienić wynik`);
  const lateDeathMatches = validMatches.filter((m) => m.deaths > 5 && m.gameDuration > 2400).length;
  if ((lateDeathMatches / N) > 0.22) criticalMistakes.push(`⚡ Fatalne błędy late: ${lateDeathMatches}/${N} gier po 40 min z 5+ śmiercią — jeden błąd late = przegrana gra`);
  if (avgObjectivesStolen < 0.02 && objectiveScore < 30 && N >= 8) criticalMistakes.push(`🐉 Ignorowanie celów: prawie żadnej kontroli Smoka/Barona — drużyna traci buffty przez brak wizji/priorytetu`);

  const gameplayPatterns: string[] = [];
  if (avgKillParticipation >= 68 && avgDamageShare >= 22) gameplayPatterns.push(`Centralny gracz: uczestniczy w ${avgKillParticipation.toFixed(0)}% walk i zadaje ${avgDamageShare.toFixed(0)}% obrażeń drużyny`);
  if (avgCsPerMin >= 7.5 && avgKillParticipation < 52) gameplayPatterns.push(`Pasywny farmiarz: ${avgCsPerMin.toFixed(1)} CS/min, ale tylko ${avgKillParticipation.toFixed(0)}% KP — priorytetyzuje zasoby nad obecność na mapie`);
  if (avgSoloKills >= 1.2) gameplayPatterns.push(`Solowy łowca: ${avgSoloKills.toFixed(1)} solo kills/mecz — przewaga w starciach 1v1 na liniach`);
  if (firstBloodRate >= 28) gameplayPatterns.push(`Agresywny early: uczestniczy w first blood ${firstBloodRate.toFixed(0)}% meczy — dominacja wczesnej fazy`);
  const shortGamesCount = validMatches.filter((m) => m.gameDuration < 1800).length;
  if (shortGamesCount / N > 0.38) {
    const srWR = shortGamesCount > 0 ? (validMatches.filter((m) => m.gameDuration < 1800 && m.win).length / shortGamesCount) * 100 : 0;
    gameplayPatterns.push(`Preferuje krótkie mecze: ${srWR.toFixed(0)}% WR w grach < 30 min — skuteczniejszy przy snowballu niż late-game`);
  }
  const longGamesCount = validMatches.filter((m) => m.gameDuration >= 2400).length;
  if (longGamesCount / N > 0.35) {
    const lgWR = longGamesCount > 0 ? (validMatches.filter((m) => m.gameDuration >= 2400 && m.win).length / longGamesCount) * 100 : 0;
    gameplayPatterns.push(`Gracz late-game: ${lgWR.toFixed(0)}% WR w grach > 40 min — wzrasta w mocy wraz z trwaniem meczu`);
  }
  if (avgWardScore >= 12) gameplayPatterns.push(`Aktywna mapa: ${avgWardScore.toFixed(1)} pkt wizji/mecz — świetna świadomość kluczowych stref`);
  if (avgTurretKills >= 3) gameplayPatterns.push(`Split-push: ${avgTurretKills.toFixed(1)} wież/mecz — presja bocznych linii i zmuszanie wroga do reakcji`);
  if (avgObjectivesStolen >= 0.3) gameplayPatterns.push(`Złodziej obiektywów: ${avgObjectivesStolen.toFixed(2)}/mecz — agresywna próba smite'u na kluczowych celach`);
  if (avgDmgEfficiency >= 1.5 && avgDamageShare >= 22) gameplayPatterns.push(`Efektywny carry: zadaje ${(avgDmgEfficiency * 100).toFixed(0)}% tego co przyjmuje — świetne pozycjonowanie przy dużym impaccie`);
  if (gameplayPatterns.length === 0) gameplayPatterns.push("Zróżnicowany styl gry — brak dominującego wzorca, adaptatywny gracz");

  const isCarry = kdaScore >= 65 && dmgScore >= 62 && carryScore >= 62;
  const isTeamFighter = kpScore >= 65 && avgKillParticipation >= 62;
  const isFarmer = csScore >= 72 && avgCsPerMin >= 7.5;
  const isVisionStar = combinedVisionScore >= 72;
  const isAggressive = avgSoloKills >= 1.3 || firstBloodRate >= 28 || avgKillParticipation >= 72;
  const isInconsistent = consistencyScore < 35;
  const isSafe = survivalScore >= 78 && avgDeaths < 2.8;
  const isObjectivePlayer = objectiveScore >= 65;
  const isScaler = validMatches.filter((m) => m.gameDuration >= 2400 && m.win).length / Math.max(longGamesCount, 1) > 0.6 && longGamesCount >= 3;
  const isSnowballer = shortGamesCount >= 3 && (validMatches.filter((m) => m.gameDuration < 1800 && m.win).length / shortGamesCount) > 0.65;

  let playstyleArchetype: string, playstyleDescription: string;
  if (isInconsistent && consistencyScore < 25) { playstyleArchetype = "Niestały gracz"; playstyleDescription = `Wyniki wahają się dramatycznie (CV KDA: ${(coeffOfVariation * 100).toFixed(0)}%) — od geniusza do fatalnych błędów. Zawęź pulę bohaterów do 2 i graj mechanicznie prosty champ.`; }
  else if (isCarry && isAggressive && isSnowballer) { playstyleArchetype = "Snowball carry"; playstyleDescription = `Zabójczy styl wczesnej gry — ${firstBloodRate.toFixed(0)}% first blood, dominuje zanim gra się rozegra. Wysoki skill gap: świetny gdy snowball zadziała, ryzykowny gdy nie.`; }
  else if (isCarry && isSafe && !isAggressive) { playstyleArchetype = "Metodyczny carry"; playstyleDescription = `Cierpliwy i ostrożny — ${avgDeaths.toFixed(1)} śmierci/mecz to elitarna przeżywalność. Buduje przewagę systematycznie, bez ryzykownych ruchów. Wysoki sufit.`; }
  else if (isCarry && isTeamFighter) { playstyleArchetype = "Dominujący carry"; playstyleDescription = `Pełna dominacja: ${avgKda.toFixed(2)} KDA + ${avgKillParticipation.toFixed(0)}% KP + ${avgDamageShare.toFixed(0)}% obrażeń drużyny. Osi każdej drużyny.`; }
  else if (isTeamFighter && isObjectivePlayer) { playstyleArchetype = "Strategiczny lider"; playstyleDescription = `Osi drużyny: ${avgKillParticipation.toFixed(0)}% KP i ${avgDragonKills.toFixed(1)} smoków/mecz. Wygrywa grę przez kontrolę celów, nie solo carry.`; }
  else if (isTeamFighter && !isCarry) { playstyleArchetype = "Gracz drużynowy"; playstyleDescription = `Zawsze przy drużynie (${avgKillParticipation.toFixed(0)}% KP), ale obrażenia (${avgDamageShare.toFixed(0)}%) mogłyby być wyższe. Skuteczność zależy od jakości drużyny.`; }
  else if (isFarmer && isScaler && !isTeamFighter) { playstyleArchetype = "Hyperscaler"; playstyleDescription = `${avgCsPerMin.toFixed(1)} CS/min i dominacja w grach > 40 min — gra po czas i skalowanie. Słabszy w early, niezniszczalny w late.`; }
  else if (isFarmer && !isTeamFighter) { playstyleArchetype = "Izolowany farmiarz"; playstyleDescription = `${avgCsPerMin.toFixed(1)} CS/min, ale KP ${avgKillParticipation.toFixed(0)}% — skupia się na farmie kosztem map presence. Rotacje zwiększyłyby wpływ.`; }
  else if (isVisionStar && isObjectivePlayer) { playstyleArchetype = "Strażnik mapy"; playstyleDescription = `${avgVisionPerMin.toFixed(2)} pkt wizji/min + ${avgDragonKills.toFixed(1)} smoków — kontroluje informacje i kluczowe cele. Wygrywa przez makro.`; }
  else if (isSafe && !isCarry && !isTeamFighter) { playstyleArchetype = "Ostrożny gracz"; playstyleDescription = `${avgDeaths.toFixed(1)} śmierci to dobra przeżywalność, ale KP ${avgKillParticipation.toFixed(0)}% i ${avgDamageShare.toFixed(0)}% obrażeń za mały wpływ — brakuje agresji.`; }
  else if (isAggressive && !isCarry) { playstyleArchetype = "Agresywny ryzykant"; playstyleDescription = `${firstBloodRate.toFixed(0)}% first blood i ${avgSoloKills.toFixed(1)} solo kills — szuka walki zawsze, ale agresja ${avgDeaths.toFixed(1)} śmierci/mecz kosztuje drużynę.`; }
  else { playstyleArchetype = "Wszechstronny gracz"; playstyleDescription = `Zbalansowany profil bez wyraźnej specjalizacji. WR ${winRate.toFixed(0)}%, KDA ${avgKda.toFixed(2)}, KP ${avgKillParticipation.toFixed(0)}% — skupienie na jednym obszarze da przewagę.`; }

  const roleMap: Record<string, string> = { TOP: "Top", JUNGLE: "Jungler", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Support", "": "Nieznana" };
  const displayRoleCounts: Record<string, number> = {};
  for (const m of validMatches) {
    const role = roleMap[m.teamPosition] ?? "Nieznana";
    displayRoleCounts[role] = (displayRoleCounts[role] ?? 0) + 1;
  }
  const displayPrimaryRole = Object.entries(displayRoleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Nieznana";
  const roleDistribution: Record<string, number> = {};
  for (const [role, count] of Object.entries(displayRoleCounts)) roleDistribution[role] = Math.round((count / N) * 100);

  const streakType = validMatches[0]?.win ? "win" as const : "loss" as const;
  let streakCount = 0;
  for (const m of validMatches) {
    if ((m.win && streakType === "win") || (!m.win && streakType === "loss")) streakCount++;
    else break;
  }
  const currentStreak = { type: streakType, count: streakCount };

  const gameScores = validMatches.map((m) => ({ match: m, score: Math.round(computeGameScore(m)), kda: computeKda(m.kills, m.deaths, m.assists) }));
  gameScores.sort((a, b) => b.score - a.score);
  const makeHighlight = (gs: typeof gameScores[0]) => ({
    matchId: gs.match.matchId, championName: gs.match.championName,
    kills: gs.match.kills, deaths: gs.match.deaths, assists: gs.match.assists,
    kda: Math.round(gs.kda * 100) / 100, totalDamageDealt: gs.match.totalDamageDealt,
    win: gs.match.win, gameDuration: gs.match.gameDuration,
    performanceScore: gs.score, gameEndTimestamp: gs.match.gameEndTimestamp,
  });
  const bestGame = gameScores.length > 0 ? makeHighlight(gameScores[0]) : null;
  const worstGame = gameScores.length > 0 ? makeHighlight(gameScores[gameScores.length - 1]) : null;

  const computeGLS = (games: MatchData[], label: string) => ({
    label, gamesPlayed: games.length,
    winRate: games.length > 0 ? Math.round((games.filter((g) => g.win).length / games.length) * 1000) / 10 : 0,
    avgKda: games.length > 0 ? Math.round(mean(games.map((g) => computeKda(g.kills, g.deaths, g.assists))) * 100) / 100 : 0,
    avgCsPerMin: games.length > 0 ? Math.round(mean(games.map((g) => g.gameDuration > 0 ? (g.cs / g.gameDuration) * 60 : 0)) * 10) / 10 : 0,
  });
  const performanceByGameLength = {
    short: computeGLS(validMatches.filter((m) => m.gameDuration < 1500), "< 25 min"),
    medium: computeGLS(validMatches.filter((m) => m.gameDuration >= 1500 && m.gameDuration < 2100), "25-35 min"),
    long: computeGLS(validMatches.filter((m) => m.gameDuration >= 2100), "> 35 min"),
  };

  const totalPhys = validMatches.reduce((s, m) => s + m.physicalDamage, 0);
  const totalMag = validMatches.reduce((s, m) => s + m.magicDamage, 0);
  const totalTrue2 = validMatches.reduce((s, m) => s + m.trueDamage, 0);
  const totalAllDmg = totalPhys + totalMag + totalTrue2 || 1;
  const damageTypeBreakdown = {
    physicalPct: Math.round((totalPhys / totalAllDmg) * 100),
    magicPct: Math.round((totalMag / totalAllDmg) * 100),
    truePct: Math.round((totalTrue2 / totalAllDmg) * 100),
  };

  const rankScore = clamp(
    overallScore * 0.35 + winRateScore * 0.30 + kdaScore * 0.15 + csScore * 0.10 + objectiveScore * 0.10,
    0, 100
  );
  const TIERS = [
    { tier: "IRON",        min: 0,  max: 18,  hasDivision: true },
    { tier: "BRONZE",      min: 18, max: 32,  hasDivision: true },
    { tier: "SILVER",      min: 32, max: 47,  hasDivision: true },
    { tier: "GOLD",        min: 47, max: 61,  hasDivision: true },
    { tier: "PLATINUM",    min: 61, max: 72,  hasDivision: true },
    { tier: "EMERALD",     min: 72, max: 81,  hasDivision: true },
    { tier: "DIAMOND",     min: 81, max: 88,  hasDivision: true },
    { tier: "MASTER",      min: 88, max: 93,  hasDivision: false },
    { tier: "GRANDMASTER", min: 93, max: 97,  hasDivision: false },
    { tier: "CHALLENGER",  min: 97, max: 101, hasDivision: false },
  ];
  const TIER_LABELS_PL: Record<string, string> = {
    IRON: "Żelazo", BRONZE: "Brąz", SILVER: "Srebro", GOLD: "Złoto",
    PLATINUM: "Platyna", EMERALD: "Szmaragd", DIAMOND: "Diament",
    MASTER: "Mistrz", GRANDMASTER: "Wielki Mistrz", CHALLENGER: "Challenger",
  };
  const DIVISIONS = ["IV", "III", "II", "I"];
  const tierEntry = TIERS.find((t) => rankScore >= t.min && rankScore < t.max) ?? TIERS[0];
  const tierProgress = (rankScore - tierEntry.min) / (tierEntry.max - tierEntry.min);
  let division = "";
  let lp = 0;
  if (tierEntry.hasDivision) {
    const divIndex = Math.floor(tierProgress * 4);
    const divProgress = (tierProgress * 4) - divIndex;
    division = DIVISIONS[Math.min(divIndex, 3)];
    lp = Math.round(divProgress * 100);
  } else {
    lp = Math.round(tierProgress * 1000);
  }
  const confidence = N >= 18 ? "Wysoka" : N >= 9 ? "Średnia" : "Niska";
  const tierLabel = TIER_LABELS_PL[tierEntry.tier] ?? tierEntry.tier;
  const predictedTier = {
    tier: tierEntry.tier, division, lp, confidence,
    description: `Na podstawie ${N} meczy (${confidence.toLowerCase()} pewność) — szacowana ranga: ${tierLabel}${division ? ` ${division}` : ""} ~${lp} LP. Kluczowe wskaźniki: WR ${winRate.toFixed(0)}%, KDA ${avgKda.toFixed(2)}, DMG ${avgDmgPerMin.toFixed(0)}/min.`,
  };

  const killsPerMin = mean(validMatches.map((m) => m.gameDuration > 0 ? (m.kills / m.gameDuration) * 60 : 0));
  const aggressionRaw = clamp(
    avgSoloKills * 14 + firstBloodRate * 0.5 + killsPerMin * 180 +
    clamp((mean(validMatches.map((m) => m.kills)) - 3) * 8, 0, 20) +
    clamp(avgObjectivesStolen * 20, 0, 15),
    0, 100
  );
  const playstyleRadar = {
    aggression: Math.round(aggressionRaw),
    farming: Math.round(clamp((avgCsPerMin / 9) * 100, 0, 100)),
    vision: Math.round(combinedVisionScore),
    teamfighting: Math.round(clamp(kpScore * 0.60 + multikillScoreNorm * 0.40, 0, 100)),
    carry: Math.round(clamp(carryScore * 0.40 + dmgShareScore * 0.35 + clamp(avgDamageShare * 1.5, 0, 25), 0, 100)),
  };

  const coachingTips: string[] = [];
  if (avgDeaths > 6.5) coachingTips.push(`🔴 [KRYTYCZNE] ${avgDeaths.toFixed(1)} śmierci/mecz niszczy Twój WR. Graj z R i Flash na CD, bądź bliżej wieży gdy masz mało HP. Każda śmierć = ~280g dla wroga`);
  else if (avgDeaths > 4.5) coachingTips.push(`🟠 [WYSOKI] Ogranicz śmierci z ${avgDeaths.toFixed(1)} do < 4/mecz: odchodź od walki gdy CD ulti, nie rozgrywaj 1v2 bez flashu`);
  if (avgCsPerMin < 4.5 && !isSupport) coachingTips.push(`🔴 [KRYTYCZNE] ${avgCsPerMin.toFixed(1)} CS/min to bardzo mało — 10 CS = ~400g = 1 zabójstwo. Ćwicz farmy na botgame do 7+ CS/min`);
  else if (avgCsPerMin < 6.0 && !isSupport) coachingTips.push(`🟠 [WYSOKI] ${avgCsPerMin.toFixed(1)} CS/min — do 6+ CS/min: farmi fale między walkami, nie porzucaj linii po każdym kill`);
  if (avgKillParticipation < 45) coachingTips.push(`🟠 [WYSOKI] KP ${avgKillParticipation.toFixed(0)}% jest za niskie — patrz na minimapę co 5 sek, rotuj do walk gdy Twoja fala jest pchnięta, nie stój bezczynnie na linii`);
  if (mean(validMatches.map((m) => m.controlWardsPlaced)) < 0.8) coachingTips.push(`🟡 [ŚREDNI] Kupuj pink warda przy każdym powrocie do sklepu — to tylko 75g. Jeden pink przy Dragonie może zdecydować o meczu`);
  else if (combinedVisionScore < 45) coachingTips.push(`🟡 [ŚREDNI] Warduj przed walką o cel: staw ward przy Dragonie/Baronie 2 min przed odrodzeniem, nie po`);
  if (avgTimeDeadPct > 18) coachingTips.push(`🟠 [WYSOKI] Spędzasz ${avgTimeDeadPct.toFixed(1)}% gry martwym — to ${(avgTimeDeadPct * 30 / 100).toFixed(0)} min/mecz bez wpływu. Graj zachowawczo gdy drużyna nie może pomóc`);
  if (avgDmgEfficiency < 0.65 && avgDeaths > 3.5) coachingTips.push(`🟡 [ŚREDNI] Przyjmujesz za dużo obrażeń (${(avgDmgEfficiency * 100).toFixed(0)}% DMG efektywności) — ustawiaj się z tyłu, atakuj cele które nie skupiają się na Tobie`);
  if (consistencyScore < 45) coachingTips.push(`🟡 [ŚREDNI] Niestałe wyniki (wariancja KDA ${(coeffOfVariation * 100).toFixed(0)}%) — ogranicz pulę do 2-3 bohaterów. Znaj swojego champa na pamięć, nie eksperymentuj w rankingach`);
  if (avgCsPerMin >= 7 && avgKillParticipation < 50) coachingTips.push(`🟡 [ŚREDNI] Świetny CS (${avgCsPerMin.toFixed(1)}/min), ale KP ${avgKillParticipation.toFixed(0)}% za niskie — po pchnięciu fali rotuj do walki zamiast czekać na kolejną`);
  if (winRate < 44 && N >= 12) coachingTips.push(`🟠 [WYSOKI] WR ${winRate.toFixed(0)}% — rozważ: 1) zmianę bohatera na silniejszego w meta, 2) zmianę roli, 3) analizę własnych powtórek po każdej przegranej`);
  if (objectiveScore < 35 && N >= 8) coachingTips.push(`🟡 [ŚREDNI] ${avgDragonKills.toFixed(1)} smoków i ${avgTurretKills.toFixed(1)} wież/mecz — po zabiciu ogłaś "smok za X sekund" do drużyny i staw ward przy celu`);
  if (avgBountyGold >= 800 && winRate < 50) coachingTips.push(`🟡 [ŚREDNI] Jesteś cennym celem (${avgBountyGold.toFixed(0)}g bounty) — unikaj dania wrogowi bounty po zwycięskich walkach: wróć do bazy lub napchaj linię`);
  if (coachingTips.length === 0) coachingTips.push("✅ Bardzo dobra forma! Utrzymuj obecne standardy. Skoncentruj się na przewadze laning phase i konwersji na obiektywy");

  const archetypeRecs: Record<string, { championName: string; reason: string; playstyleMatch: string }[]> = {
    "Snowball carry": [
      { championName: "Katarina", reason: "Resetujące zabójstwa i snowball — nagradza agresywny styl już od lv6", playstyleMatch: "Idealny dla gracza szukającego dominacji early/mid" },
      { championName: "Zed", reason: "One-shot potential i ucieczka — wygrywa przez solo kill i presję", playstyleMatch: "Dla graczy dominujących 1v1 na środkowej" },
      { championName: "Draven", reason: "Największy early spike ADC — gra się agresywnie od lv1", playstyleMatch: "Dla ADC lubiących budować przewagę od pierwszej krwi" },
    ],
    "Dominujący carry": [
      { championName: "Irelia", reason: "Carry potential top/mid z dużą mobilnością przy stackach", playstyleMatch: "Dla graczy z wysokim KDA szukających solo carry" },
      { championName: "Jinx", reason: "Hiperscaling z resetami — eksploduje gdy drużyna wygrywa walki", playstyleMatch: "Dla ADC z wysokim KP budującym na teamfightach" },
      { championName: "Akali", reason: "Zabójca z ucieczką — dominuje gdy snowballing", playstyleMatch: "Dla graczy z dobrą mechaniką i solo kill pattern" },
    ],
    "Metodyczny carry": [
      { championName: "Viktor", reason: "Skalowanie przez farmę — doskonały gdy budujesz spokojnie przewagę CS", playstyleMatch: "Dla cierpliwych graczy z dobrą farmą i ustawieniem" },
      { championName: "Kassadin", reason: "Dominuje od lv11 — wymaga przeżycia early bez ryzyka", playstyleMatch: "Dla ostrożnych graczy z dobrym CS i niską liczbą śmierci" },
      { championName: "Jinx", reason: "Hiperscaler ADC — rośnie gdy drużyna kontroluje obiektywy", playstyleMatch: "Dla ADC z bezpiecznym stylem gry" },
    ],
    "Strategiczny lider": [
      { championName: "Shen", reason: "Globalne R i engage — zawsze obecny w każdej walce na mapie", playstyleMatch: "Idealny dla graczy z wysokim KP i świadomością mapy" },
      { championName: "Sejuani", reason: "Inicjacja i kontrola smoków — wygrywa przez obiektywy", playstyleMatch: "Dla junglera z okiem na obiektywy i engage" },
      { championName: "Orianna", reason: "Ball kontroluje teamfighty — ogromny impact przy dobrym ustawieniu", playstyleMatch: "Dla graczy centralnych dla drużynowych rozegrań" },
    ],
    "Gracz drużynowy": [
      { championName: "Amumu", reason: "Masowe CC dla całej drużyny — najlepszy przy częstych walkach", playstyleMatch: "Idealny dla gracza obecnego w każdej walce" },
      { championName: "Lulu", reason: "Amplifikiuje carry i chroni drużynę w teamfightach", playstyleMatch: "Dla supportów z wysokim KP i obecnością w walkach" },
      { championName: "Jarvan IV", reason: "Engage + obiektywy — jungler który prowadzi drużynę w walkach", playstyleMatch: "Dla graczy aktywnych i inicjujących walki" },
    ],
    "Hyperscaler": [
      { championName: "Nasus", reason: "Q stacki rosną z każdym minionem — wymaga czasu i spokojnej farmy", playstyleMatch: "Ideal dla gracza z dobrym CS i cierpliwością" },
      { championName: "Twitch", reason: "Słaby early, ale z 3 itemami gra ADC solo — wymaga czasu", playstyleMatch: "Dla ADC grającego na late game comeback" },
      { championName: "Veigar", reason: "Nieskończone skalowanie AP — każdy CS i zabójstwo to więcej siły", playstyleMatch: "Dla midlanerów budujących przez farmę" },
    ],
    "Izolowany farmiarz": [
      { championName: "Sion", reason: "Split-push i HP skalowanie — wymaga 1v1 bocznych linii", playstyleMatch: "Dla graczy priorytetyzujących farm nad teamfighty" },
      { championName: "Tristana", reason: "Farmienie i hiperscalowanie z dobrym CS — silna when ahead", playstyleMatch: "ADC z bezpiecznym farmowaniem i late game spike" },
      { championName: "Kayle", reason: "Wyjątkowo silna po 3 itemach — wymaga bezpiecznej fazy laning", playstyleMatch: "Dla cierpliwych farmerów gotowych wait for power spike" },
    ],
    "Strażnik mapy": [
      { championName: "Bard", reason: "Roaming support z ogromnym zasięgiem na mapie", playstyleMatch: "Dla graczy widzących całą mapę i controlujących obiektywy" },
      { championName: "TwistedFate", reason: "Globalne R przy dobrej wizji — roaming mid", playstyleMatch: "Dla graczy myślących globalnie i wardujących by roamować" },
      { championName: "Shen", reason: "R teleportuje do każdego sojusznika — maxymalizuje kp% przez obecność", playstyleMatch: "Dla graczy które wardują i reagują na informacje" },
    ],
    "Ostrożny gracz": [
      { championName: "Malzahar", reason: "Bezpieczny zasięg i proste mechaniki — graj z R w bezpiecznej pozycji", playstyleMatch: "Dla graczy ceniących bezpieczeństwo pozycji" },
      { championName: "Caitlyn", reason: "Największy zasięg AA — farmi bezpiecznie z dystansu", playstyleMatch: "ADC grający bezpiecznie i kontrolujący strefę" },
      { championName: "Lux", reason: "Długi zasięg i zoned kontrola — graj z tyłu i punish błędów", playstyleMatch: "Dla ostrożnych graczy midlane chcących wpływu bez ryzyka" },
    ],
    "Agresywny ryzykant": [
      { championName: "Lee Sin", reason: "Mechanicznie wymagający — nagradza umiejętności i agresję early", playstyleMatch: "Dla graczy szukających show-stopp i dueli" },
      { championName: "Riven", reason: "Combo-zależna i mobilna — rośnie przy agresywnym graniu", playstyleMatch: "Dla graczy inwestujących czas w opanowanie mechaniki" },
      { championName: "Yasuo", reason: "Mobilny i ryzykowny — nagradza agresywne decyzje i anti-cc play", playstyleMatch: "Dla graczy lubiących flowstate i agresywne walki" },
    ],
    "Niestały gracz": [
      { championName: "Garen", reason: "Prosty i skuteczny — pozwala skupić się na decyzjach, nie mechanice", playstyleMatch: "Buduje konsekwencję bez obciążenia mechaniką" },
      { championName: "Warwick", reason: "Intuicyjny jungler — instynkt prowadzi go do niskich HP wrogów", playstyleMatch: "Łatwy do nauki, pomaga skupić się na strategii" },
      { championName: "Malphite", reason: "Wyraźne i efektowne R — prosta decyzja kiedy iść do walki", playstyleMatch: "Dla graczy chcących uprościć moment i podejmowanie decyzji" },
    ],
    "Wszechstronny gracz": [
      { championName: "Ezreal", reason: "Wszechstronny ADC — bezpieczne farmowanie i skillshot expresja", playstyleMatch: "Dla graczy z dobra mechaniką szukających elastycznego stylu" },
      { championName: "Graves", reason: "Silny jungler w każdej fazie gry — dive i farm", playstyleMatch: "Dla wszechstronnych graczy szukajacych skalowalnej siły" },
      { championName: "Syndra", reason: "Mocny burst + bezpieczna range — elastyczna mid", playstyleMatch: "Dla graczy szukajacych wszechstronnego midlaninera" },
    ],
  };
  const championRecommendations = archetypeRecs[playstyleArchetype] ?? archetypeRecs["Wszechstronny gracz"];

  // ─── Lane Phase Stats ───
  const earlyKills = validMatches.map((m) => m.kills);
  const avgEarlyKills = mean(earlyKills);
  const earlyPressureScore = clamp(
    firstBloodRate * 0.5 + avgSoloKills * 15 + clamp((avgEarlyKills - 2) * 8, 0, 20) +
    clamp(avgMaxCsAdvantage / 3, 0, 20) + clamp(avgEnemyMissedCS / 10, 0, 15),
    0, 100
  );
  const laneGrade = grade(earlyPressureScore);
  const lanePhaseStats = {
    firstBloodRate: Math.round(firstBloodRate * 10) / 10,
    avgEarlyKills: Math.round(avgEarlyKills * 10) / 10,
    avgCsAdvantage: Math.round(avgMaxCsAdvantage * 10) / 10,
    earlyPressureScore: Math.round(earlyPressureScore),
    grade: laneGrade,
    description: `Ocena ${laneGrade}: first blood ${firstBloodRate.toFixed(0)}% meczy, ${avgSoloKills.toFixed(1)} solo kills/mecz, przewaga CS ${avgMaxCsAdvantage.toFixed(0)}. Wróg traci ~${avgEnemyMissedCS.toFixed(0)} CS/mecz przez Twoją presję.`,
  };

  // ─── Objective Stats ───
  const objScore = clamp(
    (avgDragonKills / 1.5) * 35 + (avgTurretKills / 3) * 30 +
    (avgObjectivesStolen * 20) + clamp(avgInhibitorKills * 15, 0, 20) - clamp(N > 5 && avgObjectivesStolen < 0.05 ? 5 : 0, 0, 5),
    0, 100
  );
  const objGrade = grade(objScore);
  const objectiveStats = {
    avgTurretKills: Math.round(avgTurretKills * 10) / 10,
    avgDragonKills: Math.round(avgDragonKills * 10) / 10,
    avgObjectivesStolen: Math.round(avgObjectivesStolen * 100) / 100,
    avgInhibitorKills: Math.round(avgInhibitorKills * 10) / 10,
    objectiveControlScore: Math.round(objScore),
    grade: objGrade,
    description: `Ocena ${objGrade}: ${avgDragonKills.toFixed(1)} smoków, ${avgTurretKills.toFixed(1)} wież, ${avgInhibitorKills.toFixed(1)} inhibitorów/mecz. ${avgObjectivesStolen.toFixed(2)} skradzionych celów. ${objScore >= 60 ? "Dominacja obiektywna — presja konwertowana na struktury." : "Wygrywanie walk bez zamieniania na obiektywy traci potencjalne przewagi."}`,
  };

  // ─── Death Analysis ───
  const mostDeathsInGame = Math.max(...validMatches.map((m) => m.deaths));
  const deathScore = clamp(
    survivalDeathScore * 0.55 + timeDeadScore * 0.30 + clamp(100 - deathSpikeRate * 2, 0, 100) * 0.15,
    0, 100
  );
  const deathGrade = grade(deathScore);
  const deathAnalysis = {
    avgDeaths: Math.round(avgDeaths * 10) / 10,
    avgTimeDeadPct: Math.round(avgTimeDeadPct * 10) / 10,
    deathSpikeGames,
    deathSpikeRate: Math.round(deathSpikeRate * 10) / 10,
    mostDeathsInGame,
    avgBountyGold: Math.round(avgBountyGold),
    deathScore: Math.round(deathScore),
    grade: deathGrade,
    description: `Ocena ${deathGrade}: ${avgDeaths.toFixed(1)} śmierci/mecz, ${avgTimeDeadPct.toFixed(1)}% gry martwy (≈ ${(avgTimeDeadPct * 30 / 100).toFixed(1)} min/mecz). ${deathSpikeGames > 0 ? `${deathSpikeGames}/${N} meczy z 7+ śmiercią. ` : ""}Rekord: ${mostDeathsInGame} śmierci. Bounty: śr. ${avgBountyGold.toFixed(0)}g dla wrogów.`,
  };

  // ─── Tilt Indicator ───
  let lossStreakKdaDrop = 0;
  let tiltScore = 0;
  if (N >= 6 && lossMatches.length >= 3) {
    const consLossStreaks: number[][] = [];
    let currentLossStreak: number[] = [];
    for (const m of validMatches) {
      if (!m.win) { currentLossStreak.push(computeKda(m.kills, m.deaths, m.assists)); }
      else { if (currentLossStreak.length >= 2) consLossStreaks.push([...currentLossStreak]); currentLossStreak = []; }
    }
    if (currentLossStreak.length >= 2) consLossStreaks.push(currentLossStreak);
    const streakKdas = consLossStreaks.flat();
    if (streakKdas.length >= 2) {
      const streakAvgKda = mean(streakKdas);
      lossStreakKdaDrop = avgKda - streakAvgKda;
    }
    const lossCount = lossMatches.length;
    const winCount = winMatches.length;
    const lossKdaStdDev = lossMatches.length >= 2 ? stdDev(lossMatches.map((m) => computeKda(m.kills, m.deaths, m.assists))) : 0;
    const winKdaStdDev = winMatches.length >= 2 ? stdDev(winMatches.map((m) => computeKda(m.kills, m.deaths, m.assists))) : 0;
    tiltScore = clamp(
      clamp(lossStreakKdaDrop * 20, 0, 40) +
      clamp(deathSpikeRate * 0.8, 0, 25) +
      clamp(avgTimeDeadPct * 1.2, 0, 20) +
      clamp(lossKdaStdDev > winKdaStdDev + 0.5 ? (lossKdaStdDev - winKdaStdDev) * 10 : 0, 0, 15),
      0, 100
    );
  }
  const isTilted = tiltScore >= 55;
  let tiltDescription: string;
  if (tiltScore >= 75) tiltDescription = `🔴 Silny tilt (${tiltScore.toFixed(0)}/100): KDA spada o ${lossStreakKdaDrop.toFixed(2)} podczas serii porażek. Podejmuj gorsze decyzje pod presją. Zrób przerwę po 2 przegranych z rzędu.`;
  else if (tiltScore >= 55) tiltDescription = `🟠 Umiarkowany tilt (${tiltScore.toFixed(0)}/100): wyniki spadają po porażkach (${lossStreakKdaDrop.toFixed(2)} KDA drop). Ogranicz sesję do max 4 gier/dzień.`;
  else if (tiltScore >= 35) tiltDescription = `🟡 Lekkie wahania (${tiltScore.toFixed(0)}/100): niewielki wpływ porażek na grę. Monitoruj swoje decyzje po 2 stratach z rzędu.`;
  else tiltDescription = `✅ Mentalna odporność (${tiltScore.toFixed(0)}/100): zachowujesz spokój po porażkach. Stabilna gra niezależnie od serii.`;

  const tiltIndicator = {
    score: Math.round(tiltScore),
    description: tiltDescription,
    lossStreakKdaDrop: Math.round(lossStreakKdaDrop * 100) / 100,
    isTilted,
  };

  // ─── Win Condition Analysis ───
  const winConditionFactors: { factor: string; winAvg: number; lossAvg: number; impact: number; description: string }[] = [];
  if (winMatches.length >= 2 && lossMatches.length >= 2) {
    const factorDefs: { key: string; label: string; extract: (m: MatchData) => number; unit: string; higherBetter: boolean }[] = [
      { key: "cs_per_min", label: "CS / min", extract: (m) => m.gameDuration > 0 ? (m.cs / m.gameDuration) * 60 : 0, unit: "", higherBetter: true },
      { key: "vision_score", label: "Wynik wizji / min", extract: (m) => m.gameDuration > 0 ? (m.visionScore / m.gameDuration) * 60 : 0, unit: "", higherBetter: true },
      { key: "deaths", label: "Śmierci", extract: (m) => m.deaths, unit: "", higherBetter: false },
      { key: "kill_participation", label: "Kill Participation %", extract: (m) => m.teamKills > 0 ? ((m.kills + m.assists) / m.teamKills) * 100 : 0, unit: "%", higherBetter: true },
      { key: "damage_share", label: "Udział w obrażeniach %", extract: (m) => m.teamDamageDealt > 0 ? (m.totalDamageDealt / m.teamDamageDealt) * 100 : 0, unit: "%", higherBetter: true },
      { key: "gold_per_min", label: "Złoto / min", extract: (m) => m.gameDuration > 0 ? (m.goldEarned / m.gameDuration) * 60 : 0, unit: "", higherBetter: true },
      { key: "solo_kills", label: "Solo kille", extract: (m) => m.soloKills, unit: "", higherBetter: true },
      { key: "wards_placed", label: "Wardy postawione", extract: (m) => m.wardsPlaced + m.controlWardsPlaced * 2, unit: "", higherBetter: true },
      { key: "turret_kills", label: "Zniszczone wieże", extract: (m) => m.turretKills, unit: "", higherBetter: true },
      { key: "damage_efficiency", label: "Efektywność obrażeń", extract: (m) => m.damageTaken > 0 ? m.totalDamageDealt / m.damageTaken : 1, unit: "x", higherBetter: true },
    ];
    for (const fd of factorDefs) {
      const wAvg = mean(winMatches.map(fd.extract));
      const lAvg = mean(lossMatches.map(fd.extract));
      const diff = wAvg - lAvg;
      const base = Math.max(Math.abs(wAvg), Math.abs(lAvg), 0.01);
      const impactRaw = (diff / base) * 100;
      const impact = fd.higherBetter ? impactRaw : -impactRaw;
      if (Math.abs(impact) < 3) continue;
      const rawDirection = diff > 0 ? "wyższy" : "niższy";
      const desc = fd.higherBetter
        ? `${fd.label} jest ${Math.abs(impactRaw).toFixed(0)}% ${rawDirection} w wygranych (${wAvg.toFixed(1)} vs ${lAvg.toFixed(1)})`
        : `${fd.label} jest ${Math.abs(impactRaw).toFixed(0)}% ${diff < 0 ? "niższy" : "wyższy"} w wygranych (${wAvg.toFixed(1)} vs ${lAvg.toFixed(1)})`;
      winConditionFactors.push({
        factor: fd.label,
        winAvg: Math.round(wAvg * 100) / 100,
        lossAvg: Math.round(lAvg * 100) / 100,
        impact: Math.round(impact),
        description: desc,
      });
    }
    winConditionFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }
  const topFactor = winConditionFactors.length > 0 ? winConditionFactors[0] : null;
  const wcSummary = topFactor
    ? `Główny czynnik zwycięstw: ${topFactor.factor} (${topFactor.impact > 0 ? "+" : ""}${topFactor.impact}% różnicy). ${winConditionFactors.length > 1 ? `Również ważne: ${winConditionFactors.slice(1, 3).map(f => f.factor).join(", ")}.` : ""}`
    : "Za mało danych do porównania wygranych i przegranych.";
  const winConditions = { factors: winConditionFactors.slice(0, 6), summary: wcSummary };

  // ─── Power Curve (Early / Mid / Late) ───
  const earlyGames = validMatches.filter(m => m.gameDuration < 1500);
  const midGames = validMatches.filter(m => m.gameDuration >= 1500 && m.gameDuration < 2100);
  const lateGames = validMatches.filter(m => m.gameDuration >= 2100);

  function phaseStats(games: MatchData[], phase: string, label: string) {
    if (games.length === 0) return { phase, label, winRate: 0, avgKda: 0, avgPerformance: 0, gamesPlayed: 0 };
    const wr = (games.filter(m => m.win).length / games.length) * 100;
    const kda = mean(games.map(m => computeKda(m.kills, m.deaths, m.assists)));
    const perf = mean(games.map(m => computeGameScore(m)));
    return { phase, label, winRate: Math.round(wr * 10) / 10, avgKda: Math.round(kda * 100) / 100, avgPerformance: Math.round(perf), gamesPlayed: games.length };
  }

  const pcPhases = [
    phaseStats(earlyGames, "early", "Early (< 25 min)"),
    phaseStats(midGames, "mid", "Mid (25-35 min)"),
    phaseStats(lateGames, "late", "Late (> 35 min)"),
  ];
  const playedPhases = pcPhases.filter(p => p.gamesPlayed >= 2);
  let strongestPhase = "unknown";
  let pcDesc = "Za mało meczy w poszczególnych fazach gry.";
  if (playedPhases.length >= 2) {
    const best = playedPhases.reduce((a, b) => a.avgPerformance > b.avgPerformance ? a : b);
    const worst = playedPhases.reduce((a, b) => a.avgPerformance < b.avgPerformance ? a : b);
    strongestPhase = best.phase;
    const phaseLabels: Record<string, string> = { early: "wczesnej", mid: "środkowej", late: "późnej" };
    pcDesc = `Najsilniejszy w ${phaseLabels[best.phase] ?? best.phase} fazie gry (WR ${best.winRate}%, KDA ${best.avgKda}). ${best.phase !== worst.phase ? `Najsłabszy w ${phaseLabels[worst.phase] ?? worst.phase} fazie (WR ${worst.winRate}%, KDA ${worst.avgKda}).` : ""} ${strongestPhase === "early" ? "Gracz early game — wykorzystuj przewagę z linii." : strongestPhase === "late" ? "Gracz late game — przetrwaj do late i skaliuj." : "Gracz mid game — kontroluj obiektywy w środkowej fazie."}`;
  }
  const powerCurve = { phases: pcPhases, strongestPhase, description: pcDesc };

  // ─── Rank Benchmarks ───
  const TIER_BENCHMARKS: Record<string, { kda: number; csPerMin: number; visionPerMin: number; kp: number; dmgPerMin: number; deaths: number }> = {
    IRON:        { kda: 1.6, csPerMin: 3.8, visionPerMin: 0.25, kp: 42, dmgPerMin: 550, deaths: 7.2 },
    BRONZE:      { kda: 2.0, csPerMin: 4.5, visionPerMin: 0.35, kp: 46, dmgPerMin: 620, deaths: 6.5 },
    SILVER:      { kda: 2.4, csPerMin: 5.2, visionPerMin: 0.42, kp: 50, dmgPerMin: 700, deaths: 5.8 },
    GOLD:        { kda: 2.8, csPerMin: 5.8, visionPerMin: 0.50, kp: 54, dmgPerMin: 780, deaths: 5.2 },
    PLATINUM:    { kda: 3.2, csPerMin: 6.3, visionPerMin: 0.58, kp: 57, dmgPerMin: 850, deaths: 4.7 },
    EMERALD:     { kda: 3.6, csPerMin: 6.8, visionPerMin: 0.65, kp: 60, dmgPerMin: 920, deaths: 4.2 },
    DIAMOND:     { kda: 4.0, csPerMin: 7.2, visionPerMin: 0.72, kp: 63, dmgPerMin: 980, deaths: 3.8 },
    MASTER:      { kda: 4.5, csPerMin: 7.6, visionPerMin: 0.80, kp: 65, dmgPerMin: 1050, deaths: 3.4 },
    GRANDMASTER: { kda: 5.0, csPerMin: 8.0, visionPerMin: 0.85, kp: 67, dmgPerMin: 1100, deaths: 3.1 },
    CHALLENGER:  { kda: 5.5, csPerMin: 8.5, visionPerMin: 0.90, kp: 70, dmgPerMin: 1200, deaths: 2.8 },
  };
  const predictedBenchmarkTier = tierEntry.tier;
  const benchmarks = TIER_BENCHMARKS[predictedBenchmarkTier] ?? TIER_BENCHMARKS.SILVER;
  const tierLabelForBench = TIER_LABELS_PL[predictedBenchmarkTier] ?? predictedBenchmarkTier;
  const rankBenchmarks = [
    { stat: "KDA", playerValue: Math.round(avgKda * 100) / 100, tierAvg: benchmarks.kda, pctDiff: Math.round(((avgKda - benchmarks.kda) / benchmarks.kda) * 100), unit: "", higherBetter: true },
    { stat: "CS / min", playerValue: Math.round(avgCsPerMin * 10) / 10, tierAvg: benchmarks.csPerMin, pctDiff: Math.round(((avgCsPerMin - benchmarks.csPerMin) / benchmarks.csPerMin) * 100), unit: "", higherBetter: true },
    { stat: "Wizja / min", playerValue: Math.round(avgVisionPerMin * 100) / 100, tierAvg: benchmarks.visionPerMin, pctDiff: Math.round(((avgVisionPerMin - benchmarks.visionPerMin) / benchmarks.visionPerMin) * 100), unit: "", higherBetter: true },
    { stat: "Kill Participation", playerValue: Math.round(avgKillParticipation), tierAvg: benchmarks.kp, pctDiff: Math.round(((avgKillParticipation - benchmarks.kp) / benchmarks.kp) * 100), unit: "%", higherBetter: true },
    { stat: "Obrażenia / min", playerValue: Math.round(avgDmgPerMin), tierAvg: benchmarks.dmgPerMin, pctDiff: Math.round(((avgDmgPerMin - benchmarks.dmgPerMin) / benchmarks.dmgPerMin) * 100), unit: "", higherBetter: true },
    { stat: "Śmierci / mecz", playerValue: Math.round(avgDeaths * 10) / 10, tierAvg: benchmarks.deaths, pctDiff: Math.round(((benchmarks.deaths - avgDeaths) / benchmarks.deaths) * 100), unit: "", higherBetter: false },
  ];

  // ─── Improvement Roadmap ───
  const improvementItems: { priority: number; area: string; currentValue: string; targetValue: string; estimatedLpGain: number; tip: string }[] = [];
  if (!isSupport && avgCsPerMin < benchmarks.csPerMin * 1.05) {
    const csGap = benchmarks.csPerMin - avgCsPerMin;
    const lpGain = Math.round(clamp(csGap * 12, 3, 35));
    improvementItems.push({ priority: 0, area: "CS / min", currentValue: `${avgCsPerMin.toFixed(1)}`, targetValue: `${(benchmarks.csPerMin * 1.1).toFixed(1)}`, estimatedLpGain: lpGain, tip: `Każdy 1 CS/min więcej ≈ 400 złota/min. Ćwicz last-hittowanie na botgame przez 10 min dziennie.` });
  }
  if (avgDeaths > benchmarks.deaths * 0.95) {
    const deathGap = avgDeaths - benchmarks.deaths;
    const lpGain = Math.round(clamp(deathGap * 10, 3, 30));
    improvementItems.push({ priority: 0, area: "Mniej śmierci", currentValue: `${avgDeaths.toFixed(1)}/mecz`, targetValue: `< ${(benchmarks.deaths * 0.9).toFixed(1)}/mecz`, estimatedLpGain: lpGain, tip: `Każda uniknięta śmierć = ~300g mniej dla wroga + więcej czasu na grę. Graj pod wieżą bez wizji.` });
  }
  if (avgVisionPerMin < benchmarks.visionPerMin) {
    const lpGain = Math.round(clamp((benchmarks.visionPerMin - avgVisionPerMin) * 30, 2, 20));
    improvementItems.push({ priority: 0, area: "Wizja", currentValue: `${avgVisionPerMin.toFixed(2)}/min`, targetValue: `${(benchmarks.visionPerMin * 1.1).toFixed(2)}/min`, estimatedLpGain: lpGain, tip: `Kupuj pink warda przy każdym powrocie. Warduj przy obiektywach 90 sek przed spawn.` });
  }
  if (avgKillParticipation < benchmarks.kp) {
    const lpGain = Math.round(clamp((benchmarks.kp - avgKillParticipation) * 0.8, 2, 20));
    improvementItems.push({ priority: 0, area: "Obecność na mapie", currentValue: `${avgKillParticipation.toFixed(0)}% KP`, targetValue: `${Math.round(benchmarks.kp * 1.05)}% KP`, estimatedLpGain: lpGain, tip: `Patrz na minimapę co 5 sek. Rotuj do walk gdy Twoja fala jest pchnięta pod wrogą wieżę.` });
  }
  if (avgDmgPerMin < benchmarks.dmgPerMin) {
    const lpGain = Math.round(clamp((benchmarks.dmgPerMin - avgDmgPerMin) / 30, 2, 18));
    improvementItems.push({ priority: 0, area: "Obrażenia", currentValue: `${avgDmgPerMin.toFixed(0)}/min`, targetValue: `${Math.round(benchmarks.dmgPerMin * 1.05)}/min`, estimatedLpGain: lpGain, tip: `Wymieniaj ciosy na linii częściej (trade stance). Atakuj w walkach ciągle — każda sekunda bez ataku to strata.` });
  }
  if (consistencyScore < 55) {
    const lpGain = Math.round(clamp((55 - consistencyScore) * 0.5, 3, 15));
    improvementItems.push({ priority: 0, area: "Konsekwencja", currentValue: `CV: ${(coeffOfVariation * 100).toFixed(0)}%`, targetValue: `CV < 40%`, estimatedLpGain: lpGain, tip: `Ogranicz pulę bohaterów do 2-3. Grając wąską pulę eliminujesz mechaniczne błędy.` });
  }
  if (objectiveScore < 50) {
    const lpGain = Math.round(clamp((50 - objectiveScore) * 0.4, 2, 15));
    const targetDragons = Math.max(avgDragonKills * 1.5, 0.5);
    improvementItems.push({ priority: 0, area: "Kontrola obiektywów", currentValue: `${avgDragonKills.toFixed(1)} smoków, ${avgTurretKills.toFixed(1)} wież/mecz`, targetValue: `${targetDragons.toFixed(1)} smoków, ${(avgTurretKills + 1).toFixed(1)} wież/mecz`, estimatedLpGain: lpGain, tip: `Po wygranej walce natychmiast idź na smoka/barona. Ogłaszaj cele drużynie 30 sek przed spawn.` });
  }
  improvementItems.sort((a, b) => b.estimatedLpGain - a.estimatedLpGain);
  improvementItems.forEach((item, i) => { item.priority = i + 1; });
  const improvementRoadmap = improvementItems.slice(0, 5);

  // ─── Comeback Analysis ───
  const comebackGames: MatchData[] = [];
  const snowballGames: MatchData[] = [];
  const evenGames: MatchData[] = [];
  for (const m of validMatches) {
    const cspm = m.gameDuration > 0 ? (m.cs / m.gameDuration) * 60 : 0;
    const mKda = computeKda(m.kills, m.deaths, m.assists);
    if (m.deaths > m.kills + 2 || (cspm < avgCsPerMin * 0.7 && m.gameDuration > 1200)) {
      comebackGames.push(m);
    } else if (m.kills > m.deaths + 3 || (mKda > avgKda * 1.4 && m.kills >= 5)) {
      snowballGames.push(m);
    } else {
      evenGames.push(m);
    }
  }
  const comebackWR = comebackGames.length > 0 ? (comebackGames.filter(m => m.win).length / comebackGames.length) * 100 : 0;
  const snowballWR = snowballGames.length > 0 ? (snowballGames.filter(m => m.win).length / snowballGames.length) * 100 : 0;
  const evenWR = evenGames.length > 0 ? (evenGames.filter(m => m.win).length / evenGames.length) * 100 : 0;
  let comebackDesc = "";
  if (comebackGames.length >= 2 && snowballGames.length >= 2) {
    if (comebackWR > 40) comebackDesc = `Silny mentalnie: ${comebackWR.toFixed(0)}% WR nawet gdy z tyłu (${comebackGames.length} meczy). Nie poddajesz się łatwo.`;
    else if (snowballWR > 70) comebackDesc = `Gracz snowballowy: ${snowballWR.toFixed(0)}% WR gdy z przodu (${snowballGames.length} meczy), ale ${comebackWR.toFixed(0)}% gdy z tyłu. Musisz dominować wcześnie.`;
    else comebackDesc = `Comeback: ${comebackWR.toFixed(0)}% WR z tyłu (${comebackGames.length} gier), Snowball: ${snowballWR.toFixed(0)}% z przodu (${snowballGames.length} gier). ${evenGames.length > 0 ? `Wyrównane: ${evenWR.toFixed(0)}% (${evenGames.length} gier).` : ""}`;
  } else {
    comebackDesc = `Za mało meczy w skrajnych sytuacjach do pełnej analizy. Ogólny WR: ${winRate.toFixed(0)}%.`;
  }
  const comebackAnalysis = {
    comebackWinRate: Math.round(comebackWR * 10) / 10,
    snowballWinRate: Math.round(snowballWR * 10) / 10,
    evenWinRate: Math.round(evenWR * 10) / 10,
    comebackGames: comebackGames.length,
    snowballGames: snowballGames.length,
    evenGames: evenGames.length,
    description: comebackDesc,
  };

  // ─── Skillshot Stats ───
  const avgSkillshotsLanded = mean(validMatches.map(m => m.skillshotsLanded));
  const avgSkillshotsDodged = mean(validMatches.map(m => m.skillshotsDodged));
  const totalLanded = validMatches.reduce((s, m) => s + m.skillshotsLanded, 0);
  const totalDodged = validMatches.reduce((s, m) => s + m.skillshotsDodged, 0);
  const matchesWithSkillshotData = validMatches.filter(m => (m.skillshotsLanded + m.skillshotsDodged) > 0).length;
  const totalSkillshotAttempts = totalLanded + totalDodged;
  const hitRateOverall = totalSkillshotAttempts > 0 ? (totalLanded / totalSkillshotAttempts) * 100 : 0;
  const ssGrade = totalSkillshotAttempts > 10 ? grade(clamp(hitRateOverall * 1.2, 0, 100)) : "F";
  const ssDesc = totalSkillshotAttempts > 10
    ? `Celność: ${hitRateOverall.toFixed(0)}% (${totalLanded} trafień / ${totalSkillshotAttempts} prób). Średnio ${(totalLanded / N).toFixed(0)} trafień i ${avgSkillshotsDodged.toFixed(0)} uników/mecz. ${hitRateOverall >= 65 ? "Precyzyjny gracz — skutecznie trafiasz umiejętności." : hitRateOverall >= 45 ? "Przyzwoita celność — trenuj predykcję ruchu przeciwnika." : "Niska celność — ćwicz timing i kąty umiejętności na botgame."}`
    : matchesWithSkillshotData === 0 ? "Grasz bohaterami bez skillshotów — ta sekcja nie dotyczy Twojej puli." : "Za mało danych o skillshotach w tych meczach.";
  const skillshotStats = {
    avgLanded: Math.round(avgSkillshotsLanded * 10) / 10,
    avgDodged: Math.round(avgSkillshotsDodged * 10) / 10,
    hitRate: Math.round(hitRateOverall * 10) / 10,
    grade: ssGrade,
    description: ssDesc,
  };

  // ─── Match Timeline ───
  const matchTimeline = validMatches.map((m, i) => ({
    matchIndex: i,
    matchId: m.matchId,
    championName: m.championName,
    win: m.win,
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    kda: Math.round(computeKda(m.kills, m.deaths, m.assists) * 100) / 100,
    performanceScore: Math.round(computeGameScore(m)),
    csPerMin: Math.round((m.gameDuration > 0 ? (m.cs / m.gameDuration) * 60 : 0) * 10) / 10,
    gameDuration: m.gameDuration,
    gameEndTimestamp: m.gameEndTimestamp,
  }));

  return {
    overallScore, overallRating, totalGamesAnalyzed: N, winRate: Math.round(winRate * 10) / 10,
    metrics, championBreakdown, formTrend, strengths, weaknesses,
    playstyleArchetype, playstyleDescription, criticalMistakes, gameplayPatterns,
    primaryRole: displayPrimaryRole, roleDistribution, currentStreak, bestGame, worstGame,
    coachingTips, championRecommendations, performanceByGameLength, damageTypeBreakdown,
    predictedTier, playstyleRadar, lanePhaseStats, objectiveStats, deathAnalysis, tiltIndicator,
    winConditions, powerCurve, rankBenchmarks, improvementRoadmap, comebackAnalysis, skillshotStats, matchTimeline,
  };
}

router.get("/:puuid/analysis", async (req, res) => {
  const { puuid } = req.params;
  const { region, count } = req.query as { region: string; count?: string };
  if (!region) { res.status(400).json({ error: "bad_request", message: "region is required" }); return; }

  const matchCount = Math.min(Number(count ?? 20), 20);
  const cacheKey = `analysis:${region.toUpperCase()}:${puuid}:${matchCount}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const cluster = REGION_TO_CLUSTER[region.toUpperCase()] ?? "europe";
  try {
    const matchListUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${matchCount}`;
    const matchListRes = await riotFetch(matchListUrl);
    const matchIds = (await matchListRes.json()) as string[];
    const matchDataArr: MatchData[] = [];
    for (const matchId of matchIds) {
      try {
        const matchUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchRes = await riotFetch(matchUrl);
        const matchData = (await matchRes.json()) as any;
        if (matchData.info?.gameMode === "CHERRY") continue;
        const participant = matchData.info?.participants?.find((p: any) => p.puuid === puuid);
        if (!participant) continue;
        const teamParticipants = matchData.info.participants.filter((p: any) => p.teamId === participant.teamId);
        const allParticipants = matchData.info.participants;
        const afkTeammate = teamParticipants.some((p: any) => p.puuid !== puuid && p.timePlayed < matchData.info.gameDuration * 0.5);
        const wasAfk = participant.timePlayed < matchData.info.gameDuration * 0.5;
        matchDataArr.push({
          matchId, gameMode: matchData.info.gameMode,
          gameDuration: matchData.info.gameDuration, gameEndTimestamp: matchData.info.gameEndTimestamp,
          win: participant.win, championName: participant.championName,
          kills: participant.kills ?? 0, deaths: participant.deaths ?? 0, assists: participant.assists ?? 0,
          totalDamageDealt: participant.totalDamageDealtToChampions ?? 0,
          goldEarned: participant.goldEarned ?? 0,
          cs: (participant.totalMinionsKilled ?? 0) + (participant.neutralMinionsKilled ?? 0),
          visionScore: participant.visionScore ?? 0,
          teamKills: teamParticipants.reduce((s: number, p: any) => s + (p.kills ?? 0), 0),
          teamDamageDealt: teamParticipants.reduce((s: number, p: any) => s + (p.totalDamageDealtToChampions ?? 0), 0),
          doubleKills: participant.doubleKills ?? 0, tripleKills: participant.tripleKills ?? 0,
          quadraKills: participant.quadraKills ?? 0, pentaKills: participant.pentaKills ?? 0,
          wardsPlaced: participant.wardsPlaced ?? 0, wardsKilled: participant.wardsKilled ?? 0,
          controlWardsPlaced: participant.detectorWardsPlaced ?? 0,
          damageTaken: participant.totalDamageTaken ?? 0, selfMitigatedDamage: participant.damageSelfMitigated ?? 0,
          soloKills: participant.challenges?.soloKills ?? 0,
          turretKills: participant.turretKills ?? 0,
          firstBloodKill: participant.firstBloodKill ?? false, firstBloodAssist: participant.firstBloodAssist ?? false,
          objectivesStolen: participant.objectivesStolen ?? 0,
          teamPosition: participant.teamPosition ?? "",
          physicalDamage: participant.physicalDamageDealtToChampions ?? 0,
          magicDamage: participant.magicDamageDealtToChampions ?? 0,
          trueDamage: participant.trueDamageDealtToChampions ?? 0,
          timeSpentDead: participant.totalTimeSpentDead ?? 0,
          longestTimeAlive: participant.longestTimeSpentLiving ?? 0,
          dragonKills: participant.challenges?.dragonKills ?? 0,
          inhibitorKills: participant.inhibitorKills ?? 0,
          bountyGold: participant.bountyLevel ? (participant.bountyLevel * 150) : (participant.challenges?.bountyGold ?? 0),
          maxCsAdvantage: participant.challenges?.maxCsAdvantageOnLaneOpponent ?? 0,
          skillshotsLanded: participant.challenges?.skillshotsLanded ?? 0,
          skillshotsDodged: participant.challenges?.skillshotsDodged ?? 0,
          teamDamagePct: participant.challenges?.teamDamagePercentage ? participant.challenges.teamDamagePercentage * 100 : 0,
          enemyMissedCS: participant.challenges?.enemyMissedCS ?? 0,
          goldPerMinute: participant.challenges?.goldPerMinute ?? (matchData.info.gameDuration > 0 ? (participant.goldEarned / matchData.info.gameDuration) * 60 : 0),
          teamTurretKills: teamParticipants.reduce((s: number, p: any) => s + (p.turretKills ?? 0), 0),
          teamObjectivesStolen: allParticipants.filter((p: any) => p.teamId === participant.teamId).reduce((s: number, p: any) => s + (p.objectivesStolen ?? 0), 0),
          hadAfkTeammate: afkTeammate,
          wasAfk,
        });
      } catch { continue; }
    }
    const analysis = computeAnalysis(matchDataArr);
    const validated = GetSummonerAnalysisResponse.parse(analysis);
    cache.set(cacheKey, validated, 120);
    res.json(validated);
  } catch (err: any) {
    req.log.error({ err }, "Analysis error");
    handleRiotError(err, res);
  }
});

export default router;
