import { clamp, ewma, gradeFromScore, mean, shrinkWinRate, stdDev, wilsonLowerBound } from "./stats-utils";

export type AnalysisRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | "";
type ComponentKey = "combat" | "economy" | "teamplay" | "vision" | "survival" | "objectives" | "lane";

export interface MatchDataV2 {
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

interface RoleTargets {
  kda: number;
  csPerMin: number;
  damagePerMin: number;
  damageShare: number;
  killParticipation: number;
  visionPerMin: number;
  goldPerMin: number;
  deathsPer10: number;
  wardScorePer10: number;
  objectiveActions: number;
  lanePressure: number;
}

interface RoleConfig {
  label: string;
  targets: RoleTargets;
  weights: Record<ComponentKey, number>;
}

interface DerivedMatch {
  source: MatchDataV2;
  role: AnalysisRole;
  minutes: number;
  kda: number;
  csPerMin: number;
  damagePerMin: number;
  damageShare: number;
  kp: number;
  visionPerMin: number;
  goldPerMin: number;
  deathsPer10: number;
  timeDeadPct: number;
  wardScorePer10: number;
  objectiveActions: number;
  lanePressure: number;
  components: Record<ComponentKey, number>;
  score: number;
}

const LABELS: Record<ComponentKey, string> = {
  combat: "Wpływ bojowy",
  economy: "Ekonomia roli",
  teamplay: "Gra zespołowa",
  vision: "Kontrola informacji",
  survival: "Zarządzanie ryzykiem",
  objectives: "Konwersja obiektów",
  lane: "Presja we wczesnej grze",
};

const ROLES: Record<AnalysisRole, RoleConfig> = {
  TOP: {
    label: "Top",
    targets: { kda: 3, csPerMin: 7.8, damagePerMin: 720, damageShare: 24, killParticipation: 54, visionPerMin: 0.75, goldPerMin: 405, deathsPer10: 1.8, wardScorePer10: 3.2, objectiveActions: 1.15, lanePressure: 16 },
    weights: { combat: 21, economy: 20, teamplay: 8, vision: 5, survival: 15, objectives: 13, lane: 18 },
  },
  JUNGLE: {
    label: "Jungler",
    targets: { kda: 3.4, csPerMin: 5.6, damagePerMin: 620, damageShare: 20, killParticipation: 70, visionPerMin: 1.05, goldPerMin: 385, deathsPer10: 1.7, wardScorePer10: 4.4, objectiveActions: 1.65, lanePressure: 18 },
    weights: { combat: 13, economy: 10, teamplay: 19, vision: 12, survival: 11, objectives: 24, lane: 11 },
  },
  MIDDLE: {
    label: "Mid",
    targets: { kda: 3.2, csPerMin: 8.1, damagePerMin: 880, damageShare: 27, killParticipation: 63, visionPerMin: 0.85, goldPerMin: 425, deathsPer10: 1.7, wardScorePer10: 3.4, objectiveActions: 0.85, lanePressure: 18 },
    weights: { combat: 25, economy: 19, teamplay: 13, vision: 6, survival: 12, objectives: 8, lane: 17 },
  },
  BOTTOM: {
    label: "ADC",
    targets: { kda: 3.1, csPerMin: 8.7, damagePerMin: 1050, damageShare: 30, killParticipation: 61, visionPerMin: 0.65, goldPerMin: 445, deathsPer10: 1.6, wardScorePer10: 2.7, objectiveActions: 0.65, lanePressure: 15 },
    weights: { combat: 29, economy: 23, teamplay: 12, vision: 3, survival: 18, objectives: 5, lane: 10 },
  },
  UTILITY: {
    label: "Support",
    targets: { kda: 3.6, csPerMin: 1.7, damagePerMin: 330, damageShare: 9, killParticipation: 73, visionPerMin: 2.1, goldPerMin: 285, deathsPer10: 1.75, wardScorePer10: 7.2, objectiveActions: 1.25, lanePressure: 16 },
    weights: { combat: 8, economy: 6, teamplay: 24, vision: 27, survival: 14, objectives: 15, lane: 6 },
  },
  "": {
    label: "Nieznana",
    targets: { kda: 3.2, csPerMin: 7, damagePerMin: 760, damageShare: 22, killParticipation: 62, visionPerMin: 1, goldPerMin: 400, deathsPer10: 1.75, wardScorePer10: 4, objectiveActions: 1, lanePressure: 16 },
    weights: { combat: 20, economy: 16, teamplay: 15, vision: 10, survival: 15, objectives: 12, lane: 12 },
  },
};

const r1 = (value: number) => Math.round(value * 10) / 10;
const r2 = (value: number) => Math.round(value * 100) / 100;
const div = (a: number, b: number) => b > 0 ? a / b : 0;

function roleOf(value: unknown): AnalysisRole {
  const role = String(value ?? "").toUpperCase();
  return role === "TOP" || role === "JUNGLE" || role === "MIDDLE" || role === "BOTTOM" || role === "UTILITY" ? role : "";
}

function weighted(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  return totalWeight > 0 ? values.reduce((sum, value, index) => sum + value * (weights[index] ?? 0), 0) / totalWeight : mean(values);
}

function highScore(value: number, target: number): number {
  if (target <= 0 || value <= 0) return 0;
  const ratio = value / target;
  return ratio <= 1
    ? clamp(80 * Math.pow(ratio, 0.72), 0, 80)
    : clamp(80 + 20 * (1 - Math.exp(-1.8 * (ratio - 1))), 0, 100);
}

function lowScore(value: number, target: number): number {
  if (target <= 0) return 50;
  if (value <= target) return clamp(80 + 20 * (1 - Math.exp(-1.5 * ((target - value) / target))), 0, 100);
  return clamp(80 * Math.exp(-1.65 * ((value - target) / target)), 0, 100);
}

function rating(score: number): string {
  if (score >= 88) return "Elitarny";
  if (score >= 76) return "Bardzo mocny";
  if (score >= 64) return "Dobry";
  if (score >= 50) return "Stabilny";
  if (score >= 36) return "Nierówny";
  return "Do poprawy";
}

function derive(match: MatchDataV2): DerivedMatch {
  const role = roleOf(match.teamPosition);
  const config = ROLES[role];
  const minutes = Math.max(match.gameDuration / 60, 1);
  const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
  const csPerMin = match.cs / minutes;
  const damagePerMin = match.totalDamageDealt / minutes;
  const damageShare = div(match.totalDamageDealt, match.teamDamageDealt) * 100;
  const kp = div(match.kills + match.assists, match.teamKills) * 100;
  const visionPerMin = match.visionScore / minutes;
  const goldPerMin = match.goldPerMinute > 0 ? match.goldPerMinute : match.goldEarned / minutes;
  const deathsPer10 = match.deaths / minutes * 10;
  const timeDeadPct = div(match.timeSpentDead, match.gameDuration) * 100;
  const wardScorePer10 = (match.wardsPlaced + match.wardsKilled * 1.5 + match.controlWardsPlaced * 2) / minutes * 10;
  const objectiveActions = match.turretKills + match.inhibitorKills * 1.5 + match.dragonKills * 1.5 + match.objectivesStolen * 2.2 + (match.firstBloodKill || match.firstBloodAssist ? 0.4 : 0);
  const assistsPer10 = match.assists / minutes * 10;
  const multi = match.doubleKills + match.tripleKills * 2 + match.quadraKills * 4 + match.pentaKills * 7;
  const lanePressure = role === "UTILITY"
    ? kp * 0.12 + visionPerMin * 2.5 + (match.firstBloodKill || match.firstBloodAssist ? 5 : 0)
    : Math.max(match.maxCsAdvantage, 0) * 0.45 + match.soloKills * 5 + (match.firstBloodKill || match.firstBloodAssist ? 5 : 0) + Math.max(match.enemyMissedCS, 0) * 0.08;

  const combat = role === "UTILITY"
    ? highScore(kda, config.targets.kda) * 0.34 + highScore(kp, config.targets.killParticipation) * 0.36 + highScore(damagePerMin, config.targets.damagePerMin) * 0.18 + highScore(assistsPer10, 4.5) * 0.12
    : highScore(kda, config.targets.kda) * 0.32 + highScore(damagePerMin, config.targets.damagePerMin) * 0.32 + highScore(damageShare, config.targets.damageShare) * 0.22 + highScore(match.soloKills + multi * 0.35, 1.2) * 0.14;
  const economy = role === "UTILITY"
    ? highScore(goldPerMin, config.targets.goldPerMin) * 0.55 + highScore(assistsPer10, 4.5) * 0.45
    : highScore(csPerMin, config.targets.csPerMin) * 0.62 + highScore(goldPerMin, config.targets.goldPerMin) * 0.38;
  const teamplay = highScore(kp, config.targets.killParticipation) * 0.68 + highScore(assistsPer10, role === "UTILITY" ? 5.2 : 3.2) * 0.32;
  const vision = highScore(visionPerMin, config.targets.visionPerMin) * 0.62 + highScore(wardScorePer10, config.targets.wardScorePer10) * 0.38;
  const survival = lowScore(deathsPer10, config.targets.deathsPer10) * 0.68 + lowScore(timeDeadPct, 13) * 0.32;
  const objectives = highScore(objectiveActions, config.targets.objectiveActions) * 0.74 + highScore(match.teamObjectivesStolen + match.teamTurretKills * 0.12, 1.1) * 0.26;
  const lane = highScore(lanePressure, config.targets.lanePressure);
  const components = { combat, economy, teamplay, vision, survival, objectives, lane };
  const score = clamp((Object.keys(config.weights) as ComponentKey[]).reduce((sum, key) => sum + components[key] * config.weights[key], 0) / 100 + (match.win ? 2.5 : -1.5) + (match.hadAfkTeammate && !match.win ? 1.5 : 0), 0, 100);

  return { source: match, role, minutes, kda, csPerMin, damagePerMin, damageShare, kp, visionPerMin, goldPerMin, deathsPer10, timeDeadPct, wardScorePer10, objectiveActions, lanePressure, components, score };
}

function emptyAnalysis() {
  return {
    overallScore: 0, overallRating: "Niewystarczające dane", totalGamesAnalyzed: 0, winRate: 0,
    metrics: [], championBreakdown: [],
    formTrend: { recentWinRate: 0, overallWinRate: 0, recentKda: 0, overallKda: 0, trend: "stable", trendDescription: "Za mało danych", recentGames: 0 },
    strengths: [], weaknesses: [], playstyleArchetype: "Nieznany", playstyleDescription: "Za mało danych do zbudowania profilu V2.",
    criticalMistakes: [], gameplayPatterns: [], primaryRole: "Nieznana", roleDistribution: {}, currentStreak: { type: "loss", count: 0 }, bestGame: null, worstGame: null,
    coachingTips: [], championRecommendations: [],
    performanceByGameLength: {
      short: { label: "< 25 min", gamesPlayed: 0, winRate: 0, avgKda: 0, avgCsPerMin: 0 },
      medium: { label: "25-35 min", gamesPlayed: 0, winRate: 0, avgKda: 0, avgCsPerMin: 0 },
      long: { label: "> 35 min", gamesPlayed: 0, winRate: 0, avgKda: 0, avgCsPerMin: 0 },
    },
    damageTypeBreakdown: { physicalPct: 0, magicPct: 0, truePct: 0 },
    predictedTier: { tier: "UNRANKED", division: "", lp: 0, confidence: "Niska", description: "Za mało danych." },
    playstyleRadar: { aggression: 0, farming: 0, vision: 0, teamfighting: 0, carry: 0 },
    lanePhaseStats: { firstBloodRate: 0, avgEarlyKills: 0, avgCsAdvantage: 0, earlyPressureScore: 0, grade: "F", description: "Za mało danych." },
    objectiveStats: { avgTurretKills: 0, avgDragonKills: 0, avgObjectivesStolen: 0, avgInhibitorKills: 0, objectiveControlScore: 0, grade: "F", description: "Za mało danych." },
    deathAnalysis: { avgDeaths: 0, avgTimeDeadPct: 0, deathSpikeGames: 0, deathSpikeRate: 0, mostDeathsInGame: 0, avgBountyGold: 0, deathScore: 0, grade: "F", description: "Za mało danych." },
    tiltIndicator: { score: 0, description: "Za mało danych.", lossStreakKdaDrop: 0, isTilted: false },
    winConditions: { factors: [], summary: "Za mało danych." }, powerCurve: { phases: [], strongestPhase: "unknown", description: "Za mało danych." },
    rankBenchmarks: [], improvementRoadmap: [], comebackAnalysis: { comebackWinRate: 0, snowballWinRate: 0, evenWinRate: 0, comebackGames: 0, snowballGames: 0, evenGames: 0, description: "Za mało danych." },
    skillshotStats: { avgLanded: 0, avgDodged: 0, hitRate: 0, grade: "F", description: "Za mało danych." }, matchTimeline: [],
    algorithmVersion: "2.1-independent", scoreConfidence: { value: 0, label: "Niska" }, scoreBreakdown: {}, roleInsights: [],
  };
}

function archetype(role: AnalysisRole, scores: Record<ComponentKey, number>) {
  if (role === "JUNGLE") {
    if (scores.objectives >= 72 && scores.vision >= 60) return ["Kontroler tempa i obiektów", "Buduje przewagę przez ścieżkę, informację i szybką konwersję akcji na cele mapy."];
    if (scores.teamplay >= 72) return ["Gankujący rozgrywający", "Największą wartość daje przez wczesne łączenie linii i przewagę liczebną."];
    return ["Elastyczny jungler", "Łączy farmę, ganki i cele bez jednego skrajnego priorytetu."];
  }
  if (role === "UTILITY") {
    if (scores.vision >= 76) return ["Kontroler mapy", "Wygrywa przez przygotowanie terenu, informację i bezpieczne ustawianie drużyny przed celami."];
    if (scores.teamplay >= 75) return ["Roamingowy playmaker", "Tworzy przewagę liczebną i rozpoczyna akcje dla drużyny."];
    return ["Uniwersalny support", "Łączy wizję, ochronę i inicjację."];
  }
  if (role === "BOTTOM") {
    if (scores.economy >= 76 && scores.combat >= 72) return ["Hiperskalujący carry", "Buduje przewagę ekonomiczną i zamienia ją w stały DPS."];
    if (scores.lane >= 72) return ["Agresywny lane carry", "Szukając przewagi od początku, chce przejąć kontrolę nad botem przed grą o cele."];
    return ["Pozycyjny strzelec", "Najlepiej działa w uporządkowanych walkach z bezpiecznej pozycji."];
  }
  if (role === "MIDDLE") {
    if (scores.lane >= 72 && scores.teamplay >= 68) return ["Roamingowy playmaker", "Tworzy tempo przez presję środka i rotacje."];
    if (scores.combat >= 76) return ["Burst carry", "Karze błędne ustawienie i buduje wpływ przez przewagę mechaniczną."];
    return ["Wszechstronny midlaner", "Łączy farmę, presję linii i udział w walkach."];
  }
  if (role === "TOP") {
    if (scores.lane >= 74 && scores.economy >= 68) return ["Carry bocznej alei", "Buduje samodzielną przewagę i wymusza reakcję na side lane."];
    if (scores.survival >= 72) return ["Stabilny weakside", "Ogranicza straty i pozostaje użyteczny bez dużej liczby zasobów."];
    return ["Elastyczny toplaner", "Potrafi grać przez linię i walki drużynowe."];
  }
  return ["Wszechstronny gracz", "Próbka obejmuje kilka ról, więc profil nie ma jednego specjalistycznego wzorca."];
}

function recommendations(role: AnalysisRole, style: string) {
  const map: Record<AnalysisRole, string[]> = {
    TOP: ["Jax", "Ornn", "Gwen"], JUNGLE: ["Jarvan IV", "Vi", "Nocturne"], MIDDLE: ["Orianna", "Ahri", "Viktor"],
    BOTTOM: ["Jinx", "Kai'Sa", "Ashe"], UTILITY: ["Nautilus", "Lulu", "Bard"], "": ["Garen", "Annie", "Ashe"],
  };
  return map[role].map((championName) => ({ championName, reason: `Bohater pasuje do wymagań roli ${ROLES[role].label} i pozwala ćwiczyć wykryte priorytety.`, playstyleMatch: style }));
}

function tier(score: number, confidence: string) {
  const levels = [
    [88, "MASTER", ""], [80, "DIAMOND", "II"], [72, "EMERALD", "II"], [64, "PLATINUM", "II"],
    [55, "GOLD", "II"], [46, "SILVER", "II"], [36, "BRONZE", "II"], [0, "IRON", "II"],
  ] as const;
  const selected = levels.find(([minimum]) => score >= minimum) ?? levels[levels.length - 1];
  return { tier: selected[1], division: selected[2], lp: Math.round(clamp((score - selected[0]) * 10, 0, 99)), confidence, description: `Orientacyjna estymacja V2 na podstawie jakości ostatnich gier. Pewność: ${confidence.toLowerCase()}.` };
}

export function computeIndependentAnalysisV2(rawMatches: MatchDataV2[]) {
  const valid = rawMatches.filter((match) => !match.wasAfk && match.gameDuration > 300 && match.gameMode !== "CHERRY");
  if (valid.length === 0) return emptyAnalysis();

  const matches = valid.map(derive);
  const N = matches.length;
  const wins = matches.filter((match) => match.source.win).length;
  const winRate = wins / N * 100;
  const roleCounts = new Map<AnalysisRole, number>();
  matches.forEach((match) => roleCounts.set(match.role, (roleCounts.get(match.role) ?? 0) + 1));
  const roleEntries = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]);
  const primaryRole = roleEntries[0]?.[0] ?? "";
  const roleShare = (roleEntries[0]?.[1] ?? 0) / N * 100;
  const config = ROLES[primaryRole];
  const roleDistribution = Object.fromEntries(roleEntries.map(([role, count]) => [ROLES[role].label, r1(count / N * 100)]));
  const recency = matches.map((_, index) => Math.exp(-index / 7));
  const componentScores = {} as Record<ComponentKey, number>;
  (Object.keys(LABELS) as ComponentKey[]).forEach((key) => componentScores[key] = weighted(matches.map((match) => match.components[key]), recency));
  const rawPerformance = weighted(matches.map((match) => match.score), recency);
  const reliability = N / (N + 8);
  const consistency = clamp(100 - stdDev(matches.map((match) => match.score)) * 2.35, 0, 100);
  const recentForm = ewma(matches.map((match) => match.score), 0.34);
  const shrunkWinRate = shrinkWinRate(wins, N, 0.5, 10) * 100;
  const stabilized = 55 + (rawPerformance - 55) * reliability;
  const overallScore = Math.round(clamp(stabilized * 0.77 + shrunkWinRate * 0.08 + consistency * 0.09 + roleShare * 0.06, 0, 100));
  const confidenceValue = Math.round(clamp(N / 20 * 65 + roleShare * 0.25 + Math.min(N, 10), 0, 100));
  const confidenceLabel = confidenceValue >= 78 ? "Wysoka" : confidenceValue >= 52 ? "Średnia" : "Niska";

  const avgKda = mean(matches.map((match) => match.kda));
  const avgKills = mean(matches.map((match) => match.source.kills));
  const avgDeaths = mean(matches.map((match) => match.source.deaths));
  const avgAssists = mean(matches.map((match) => match.source.assists));
  const avgCs = mean(matches.map((match) => match.csPerMin));
  const avgDpm = mean(matches.map((match) => match.damagePerMin));
  const avgDmgShare = mean(matches.map((match) => match.damageShare));
  const avgKp = mean(matches.map((match) => match.kp));
  const avgVision = mean(matches.map((match) => match.visionPerMin));
  const avgGold = mean(matches.map((match) => match.goldPerMin));
  const avgDead = mean(matches.map((match) => match.timeDeadPct));
  const avgWards = mean(matches.map((match) => match.wardScorePer10));
  const avgObjectives = mean(matches.map((match) => match.objectiveActions));
  const avgControlWards = mean(matches.map((match) => match.source.controlWardsPlaced));
  const avgCsAdvantage = mean(matches.map((match) => match.source.maxCsAdvantage));
  const avgSoloKills = mean(matches.map((match) => match.source.soloKills));
  const firstBloodRate = matches.filter((match) => match.source.firstBloodKill || match.source.firstBloodAssist).length / N * 100;

  const descriptions: Record<ComponentKey, string> = {
    combat: `${Math.round(avgDpm)} obrażeń/min, ${avgDmgShare.toFixed(1)}% udziału w obrażeniach i KDA ${avgKda.toFixed(2)}`,
    economy: primaryRole === "UTILITY" ? `${Math.round(avgGold)} złota/min i ${avgAssists.toFixed(1)} asysty/mecz — ekonomia supporta` : `${avgCs.toFixed(1)} CS/min i ${Math.round(avgGold)} złota/min`,
    teamplay: `${avgKp.toFixed(1)}% KP i ${avgAssists.toFixed(1)} asysty/mecz`,
    vision: `${avgVision.toFixed(2)} wizji/min i ${avgWards.toFixed(1)} punktów wardów/10 min`,
    survival: `${avgDeaths.toFixed(1)} śmierci/mecz i ${avgDead.toFixed(1)}% czasu poza grą`,
    objectives: `${avgObjectives.toFixed(2)} akcji przy celach/mecz`,
    lane: `${avgCsAdvantage.toFixed(1)} przewagi CS, ${avgSoloKills.toFixed(1)} solo killa i ${firstBloodRate.toFixed(0)}% udziału w first blood`,
  };

  const metrics = (Object.keys(LABELS) as ComponentKey[]).map((key) => ({ name: LABELS[key], value: Math.round(componentScores[key]), maxValue: 100, rating: rating(componentScores[key]), description: descriptions[key] }));
  metrics.push({ name: "Konsekwencja wykonania", value: Math.round(consistency), maxValue: 100, rating: rating(consistency), description: `Odchylenie wyników meczowych ${stdDev(matches.map((match) => match.score)).toFixed(1)} pkt.` });
  metrics.push({ name: "Aktualna forma", value: Math.round(recentForm), maxValue: 100, rating: rating(recentForm), description: `EWMA ${recentForm.toFixed(1)} vs średnia ${mean(matches.map((match) => match.score)).toFixed(1)}.` });

  const rankedKeys = (Object.keys(LABELS) as ComponentKey[]).sort((a, b) => componentScores[b] - componentScores[a]);
  const strengths = rankedKeys.filter((key) => componentScores[key] >= 66).slice(0, 4).map((key) => `${LABELS[key]} (${config.label}): ${descriptions[key]}.`);
  if (strengths.length === 0) strengths.push(`Największym atutem jest ${LABELS[rankedKeys[0]].toLowerCase()}, choć nie tworzy jeszcze wyraźnej przewagi dla roli ${config.label}.`);
  const weaknesses = [...rankedKeys].reverse().filter((key) => componentScores[key] < 58).slice(0, 4).map((key) => `${LABELS[key]} (${config.label}): ${descriptions[key]} — wynik poniżej celu tej roli.`);
  if (weaknesses.length === 0) weaknesses.push("Brak jednego krytycznego deficytu; największa rezerwa leży w szybszej konwersji małych przewag.");

  const [styleName, styleDescription] = archetype(primaryRole, componentScores);
  const resultType = matches[0].source.win ? "win" : "loss";
  let streak = 0;
  for (const match of matches) { if ((match.source.win ? "win" : "loss") !== resultType) break; streak += 1; }
  const recentCount = Math.min(5, N);
  const recent = matches.slice(0, recentCount);
  const older = matches.slice(recentCount);
  const recentScore = mean(recent.map((match) => match.score));
  const oldScore = older.length ? mean(older.map((match) => match.score)) : mean(matches.map((match) => match.score));
  const delta = recentScore - oldScore;
  const trend = delta >= 8 ? "hot" : delta >= 3 ? "improving" : delta <= -8 ? "cold" : delta <= -3 ? "declining" : "stable";
  const trendDescription = delta > 0 ? `Ostatnie ${recentCount} gier jest o ${delta.toFixed(1)} pkt lepsze od wcześniejszej bazy.` : delta < 0 ? `Ostatnie ${recentCount} gier jest o ${Math.abs(delta).toFixed(1)} pkt słabsze od wcześniejszej bazy.` : "Forma pozostaje stabilna.";

  const championMap = new Map<string, DerivedMatch[]>();
  matches.forEach((match) => championMap.set(match.source.championName, [...(championMap.get(match.source.championName) ?? []), match]));
  const championBreakdown = [...championMap.entries()].map(([championName, games]) => {
    const champWins = games.filter((match) => match.source.win).length;
    const sampleWeight = games.length / (games.length + 4);
    return {
      championName, gamesPlayed: games.length, wins: champWins, losses: games.length - champWins, winRate: r1(champWins / games.length * 100),
      avgKills: r1(mean(games.map((match) => match.source.kills))), avgDeaths: r1(mean(games.map((match) => match.source.deaths))), avgAssists: r1(mean(games.map((match) => match.source.assists))),
      avgCs: Math.round(mean(games.map((match) => match.source.cs))), avgCsPerMin: r1(mean(games.map((match) => match.csPerMin))), avgDamage: Math.round(mean(games.map((match) => match.source.totalDamageDealt))),
      avgGold: Math.round(mean(games.map((match) => match.source.goldEarned))), avgVisionScore: r1(mean(games.map((match) => match.source.visionScore))), kda: r2(mean(games.map((match) => match.kda))),
      killParticipation: r1(mean(games.map((match) => match.kp))), damageShare: r1(mean(games.map((match) => match.damageShare))),
      performanceScore: Math.round(overallScore + (mean(games.map((match) => match.score)) - overallScore) * sampleWeight),
      adjustedWinRate: r1(shrinkWinRate(champWins, games.length, winRate / 100, 8) * 100), winRateLowerBound: r1(wilsonLowerBound(champWins, games.length) * 100),
    };
  }).sort((a, b) => b.gamesPlayed - a.gamesPlayed || b.performanceScore - a.performanceScore);

  const highlight = (match?: DerivedMatch) => match ? ({ matchId: match.source.matchId, championName: match.source.championName, kills: match.source.kills, deaths: match.source.deaths, assists: match.source.assists, kda: r2(match.kda), totalDamageDealt: match.source.totalDamageDealt, win: match.source.win, gameDuration: match.source.gameDuration, performanceScore: Math.round(match.score), gameEndTimestamp: match.source.gameEndTimestamp }) : null;
  const ordered = [...matches].sort((a, b) => b.score - a.score);
  const group = (list: DerivedMatch[], label: string) => ({ label, gamesPlayed: list.length, winRate: r1(div(list.filter((match) => match.source.win).length, list.length) * 100), avgKda: r2(mean(list.map((match) => match.kda))), avgCsPerMin: r1(mean(list.map((match) => match.csPerMin))) });
  const short = matches.filter((match) => match.minutes < 25), medium = matches.filter((match) => match.minutes >= 25 && match.minutes <= 35), long = matches.filter((match) => match.minutes > 35);

  const totalPhysical = matches.reduce((sum, match) => sum + match.source.physicalDamage, 0);
  const totalMagic = matches.reduce((sum, match) => sum + match.source.magicDamage, 0);
  const totalTrue = matches.reduce((sum, match) => sum + match.source.trueDamage, 0);
  const totalTyped = totalPhysical + totalMagic + totalTrue;

  const targetText: Record<ComponentKey, string> = {
    combat: `${Math.round(config.targets.damagePerMin)}+ DMG/min i KDA ${config.targets.kda.toFixed(1)}+`,
    economy: primaryRole === "UTILITY" ? `${Math.round(config.targets.goldPerMin)}+ gold/min bez zabierania farmy carry` : `${config.targets.csPerMin.toFixed(1)}+ CS/min`,
    teamplay: `${config.targets.killParticipation.toFixed(0)}%+ KP`, vision: `${config.targets.visionPerMin.toFixed(2)}+ wizji/min`,
    survival: `≤ ${(config.targets.deathsPer10 * 3).toFixed(1)} śmierci w 30 min`, objectives: `${config.targets.objectiveActions.toFixed(2)}+ akcji/mecz`, lane: `${config.targets.lanePressure.toFixed(0)} pkt presji`,
  };
  const currentText: Record<ComponentKey, string> = { combat: `${Math.round(avgDpm)} DMG/min, KDA ${avgKda.toFixed(2)}`, economy: primaryRole === "UTILITY" ? `${Math.round(avgGold)} gold/min` : `${avgCs.toFixed(1)} CS/min`, teamplay: `${avgKp.toFixed(0)}% KP`, vision: `${avgVision.toFixed(2)} wizji/min`, survival: `${avgDeaths.toFixed(1)} śmierci, ${avgDead.toFixed(1)}% czasu martwy`, objectives: `${avgObjectives.toFixed(2)} akcji/mecz`, lane: `${avgCsAdvantage.toFixed(1)} przewagi CS, ${firstBloodRate.toFixed(0)}% FB` };
  const tips: Record<ComponentKey, string> = {
    combat: "Przed walką określ główny cel i zachowaj kluczową umiejętność na jego wejście.", economy: primaryRole === "UTILITY" ? "Łącz powroty z odświeżeniem wardów i szukaj bezpiecznych asyst." : "Po każdej akcji sprawdź najbliższą bezpieczną falę i nie czekaj bezczynnie na walkę.",
    teamplay: "Rotuj z pierwszeństwem fali, zanim walka już się rozpocznie.", vision: "Ustaw pierwszą warstwę wizji 75–90 sekund przed celem i wróć po odświeżenie wardów.",
    survival: "Przed wejściem sprawdź, kto może Cię natychmiast ukarać i czy drużyna może kontynuować akcję.", objectives: "Po wygranej walce wskaż jeden konkretny zysk: wieża, smok, Baron albo głęboka wizja.",
    lane: primaryRole === "UTILITY" ? "Roamuj po wypchnięciu fali i wracaj, zanim ADC straci dostęp do farmy." : "Kontroluj falę: szybki push przed rotacją i reset po wprowadzeniu jej pod wieżę.",
  };
  const improvementRoadmap = [...rankedKeys].reverse().slice(0, 4).map((key, index) => ({ priority: index + 1, area: LABELS[key], currentValue: currentText[key], targetValue: targetText[key], estimatedLpGain: Math.round(clamp((68 - componentScores[key]) * 0.45 + (4 - index) * 2, 4, 24)), tip: tips[key] }));

  const avgTurrets = mean(matches.map((match) => match.source.turretKills));
  const avgDragons = mean(matches.map((match) => match.source.dragonKills));
  const avgSteals = mean(matches.map((match) => match.source.objectivesStolen));
  const avgInhibitors = mean(matches.map((match) => match.source.inhibitorKills));
  const avgBounty = mean(matches.map((match) => match.source.bountyGold));
  const deathThreshold = Math.max(7, avgDeaths + 2.5);
  const deathSpikes = matches.filter((match) => match.source.deaths >= deathThreshold).length;
  const worstDeaths = Math.max(...matches.map((match) => match.source.deaths));
  const criticalMistakes = weaknesses.slice(0, 3);
  if (deathSpikes > 0) criticalMistakes.unshift(`${deathSpikes}/${N} meczów miało skok liczby śmierci, co zwykle oznacza dalsze wymuszanie akcji po utracie tempa.`);
  const winsList = matches.filter((match) => match.source.win), lossesList = matches.filter((match) => !match.source.win);
  const gameplayPatterns = [
    `W zwycięstwach KDA wynosi ${mean(winsList.map((match) => match.kda)).toFixed(2)}, a w porażkach ${mean(lossesList.map((match) => match.kda)).toFixed(2)}.`,
    `Konwersja celów: ${mean(winsList.map((match) => match.objectiveActions)).toFixed(2)} w wygranych vs ${mean(lossesList.map((match) => match.objectiveActions)).toFixed(2)} w porażkach.`,
  ];

  const factors = [
    ["KDA", mean(winsList.map((match) => match.kda)), mean(lossesList.map((match) => match.kda)), true],
    ["Śmierci", mean(winsList.map((match) => match.source.deaths)), mean(lossesList.map((match) => match.source.deaths)), false],
    ["KP%", mean(winsList.map((match) => match.kp)), mean(lossesList.map((match) => match.kp)), true],
    ["Akcje przy celach", mean(winsList.map((match) => match.objectiveActions)), mean(lossesList.map((match) => match.objectiveActions)), true],
  ] as const;
  const winFactors = factors.map(([factor, winAvg, lossAvg, higher]) => ({ factor, winAvg: r2(winAvg), lossAvg: r2(lossAvg), impact: Math.round(clamp(div(higher ? winAvg - lossAvg : lossAvg - winAvg, Math.max(Math.abs(winAvg), Math.abs(lossAvg), 1)) * 100, -100, 100)), description: "Wpływ wyliczony z różnicy między wygranymi i przegranymi." })).sort((a, b) => b.impact - a.impact);

  const phase = (phaseName: string, label: string, list: DerivedMatch[]) => ({ phase: phaseName, label, winRate: r1(div(list.filter((match) => match.source.win).length, list.length) * 100), avgKda: r2(mean(list.map((match) => match.kda))), avgPerformance: r1(mean(list.map((match) => match.score))), gamesPlayed: list.length });
  const phases = [phase("early", "Krótka gra", short), phase("mid", "Środkowa długość", medium), phase("late", "Długa gra", long)];
  const strongestPhase = [...phases].filter((item) => item.gamesPlayed > 0).sort((a, b) => b.avgPerformance - a.avgPerformance)[0]?.phase ?? "unknown";

  const snowball = matches.filter((match) => match.source.firstBloodKill || match.source.firstBloodAssist || match.source.soloKills >= 2 || match.source.maxCsAdvantage >= 15);
  const comeback = matches.filter((match) => match.source.maxCsAdvantage < 0 || (match.source.deaths >= 3 && match.minutes > 28));
  const classified = new Set([...snowball, ...comeback].map((match) => match.source.matchId));
  const even = matches.filter((match) => !classified.has(match.source.matchId));
  const groupWr = (list: DerivedMatch[]) => r1(div(list.filter((match) => match.source.win).length, list.length) * 100);

  const landed = mean(matches.map((match) => match.source.skillshotsLanded));
  const dodged = mean(matches.map((match) => match.source.skillshotsDodged));
  const skillTotal = matches.reduce((sum, match) => sum + match.source.skillshotsLanded + match.source.skillshotsDodged, 0);
  const hitRate = skillTotal ? matches.reduce((sum, match) => sum + match.source.skillshotsLanded, 0) / skillTotal * 100 : 0;
  const recentThree = matches.slice(0, Math.min(3, N));
  const tiltScore = clamp((mean(matches.map((match) => match.score)) - mean(recentThree.map((match) => match.score))) * 4 + (resultType === "loss" ? streak * 9 : 0) + deathSpikes * 3, 0, 100);
  const isTilted = tiltScore >= 58 && resultType === "loss";

  const rankBenchmarks = [
    { stat: "KDA", playerValue: r2(avgKda), tierAvg: config.targets.kda, unit: "", higherBetter: true },
    { stat: primaryRole === "UTILITY" ? "Wizja/min" : "CS/min", playerValue: r2(primaryRole === "UTILITY" ? avgVision : avgCs), tierAvg: primaryRole === "UTILITY" ? config.targets.visionPerMin : config.targets.csPerMin, unit: "/min", higherBetter: true },
    { stat: "Obrażenia/min", playerValue: Math.round(avgDpm), tierAvg: config.targets.damagePerMin, unit: "/min", higherBetter: true },
    { stat: "KP", playerValue: r1(avgKp), tierAvg: config.targets.killParticipation, unit: "%", higherBetter: true },
    { stat: "Śmierci/10 min", playerValue: r2(mean(matches.map((match) => match.deathsPer10))), tierAvg: config.targets.deathsPer10, unit: "/10 min", higherBetter: false },
  ].map((item) => ({ ...item, pctDiff: r1(div(item.playerValue - item.tierAvg, item.tierAvg) * 100) }));

  return {
    overallScore, overallRating: gradeFromScore(overallScore), totalGamesAnalyzed: N, winRate: r1(winRate), metrics, championBreakdown,
    formTrend: { recentWinRate: r1(recent.filter((match) => match.source.win).length / recent.length * 100), overallWinRate: r1(winRate), recentKda: r2(mean(recent.map((match) => match.kda))), overallKda: r2(avgKda), trend, trendDescription, recentGames: recentCount },
    strengths, weaknesses, playstyleArchetype: styleName, playstyleDescription: styleDescription, criticalMistakes, gameplayPatterns,
    primaryRole: config.label, roleDistribution, currentStreak: { type: resultType, count: streak }, bestGame: highlight(ordered[0]), worstGame: highlight(ordered[ordered.length - 1]),
    coachingTips: improvementRoadmap.slice(0, 3).map((item) => `${item.priority}. ${item.area}: ${item.tip}`), championRecommendations: recommendations(primaryRole, styleName),
    performanceByGameLength: { short: group(short, "< 25 min"), medium: group(medium, "25-35 min"), long: group(long, "> 35 min") },
    damageTypeBreakdown: { physicalPct: r1(div(totalPhysical, totalTyped) * 100), magicPct: r1(div(totalMagic, totalTyped) * 100), truePct: r1(div(totalTrue, totalTyped) * 100) },
    predictedTier: tier(overallScore, confidenceLabel),
    playstyleRadar: { aggression: Math.round((componentScores.combat + componentScores.lane) / 2), farming: Math.round(componentScores.economy), vision: Math.round(componentScores.vision), teamfighting: Math.round((componentScores.teamplay + componentScores.combat) / 2), carry: Math.round((componentScores.combat + componentScores.economy + componentScores.survival) / 3) },
    lanePhaseStats: { firstBloodRate: r1(firstBloodRate), avgEarlyKills: r1(avgKills), avgCsAdvantage: r1(avgCsAdvantage), earlyPressureScore: Math.round(componentScores.lane), grade: gradeFromScore(componentScores.lane), description: descriptions.lane },
    objectiveStats: { avgTurretKills: r1(avgTurrets), avgDragonKills: r1(avgDragons), avgObjectivesStolen: r2(avgSteals), avgInhibitorKills: r1(avgInhibitors), objectiveControlScore: Math.round(componentScores.objectives), grade: gradeFromScore(componentScores.objectives), description: `Średnio ${avgObjectives.toFixed(2)} akcji przy celach/mecz.` },
    deathAnalysis: { avgDeaths: r1(avgDeaths), avgTimeDeadPct: r1(avgDead), deathSpikeGames: deathSpikes, deathSpikeRate: r1(deathSpikes / N * 100), mostDeathsInGame: worstDeaths, avgBountyGold: Math.round(avgBounty), deathScore: Math.round(componentScores.survival), grade: gradeFromScore(componentScores.survival), description: `${deathSpikes} meczów przekroczyło indywidualny próg skoku śmierci; średnio ${avgDead.toFixed(1)}% czasu poza mapą.` },
    tiltIndicator: { score: Math.round(tiltScore), description: isTilted ? `Wykryto serię ${streak} porażek połączoną ze spadkiem jakości gry.` : "Brak mocnego sygnału tiltu w ostatniej próbce.", lossStreakKdaDrop: r2(Math.max(0, avgKda - mean(recentThree.map((match) => match.kda)))), isTilted },
    winConditions: { factors: winFactors, summary: winFactors[0] ? `Najsilniejszy wykryty warunek zwycięstwa: ${winFactors[0].factor}.` : "Za mało danych." },
    powerCurve: { phases, strongestPhase, description: strongestPhase === "unknown" ? "Za mało danych." : `Najwyższa jakość wykonania występuje w fazie ${strongestPhase}.` },
    rankBenchmarks, improvementRoadmap,
    comebackAnalysis: { comebackWinRate: groupWr(comeback), snowballWinRate: groupWr(snowball), evenWinRate: groupWr(even), comebackGames: comeback.length, snowballGames: snowball.length, evenGames: even.length, description: "Klasyfikacja wykorzystuje proxy wczesnej przewagi: first blood, solo kille i przewagę CS." },
    skillshotStats: { avgLanded: r1(landed), avgDodged: r1(dodged), hitRate: r1(hitRate), grade: skillTotal ? gradeFromScore(highScore(hitRate, 58)) : "N/D", description: skillTotal ? `Wskaźnik trafień do trafień + uników: ${hitRate.toFixed(1)}%.` : "Riot nie zwrócił wystarczających danych challenges." },
    matchTimeline: matches.map((match, index) => ({ matchIndex: index + 1, matchId: match.source.matchId, championName: match.source.championName, win: match.source.win, kills: match.source.kills, deaths: match.source.deaths, assists: match.source.assists, kda: r2(match.kda), performanceScore: Math.round(match.score), csPerMin: r1(match.csPerMin), gameDuration: match.source.gameDuration, gameEndTimestamp: match.source.gameEndTimestamp })),
    algorithmVersion: "2.1-independent", scoreConfidence: { value: confidenceValue, label: confidenceLabel },
    scoreBreakdown: { role: config.label, rawPerformance: r1(rawPerformance), stabilizedPerformance: r1(stabilized), recentFormScore: r1(recentForm), consistencyScore: r1(consistency), shrunkWinRate: r1(shrunkWinRate), roleStability: r1(roleShare), sampleReliability: r1(reliability * 100), components: Object.fromEntries((Object.keys(LABELS) as ComponentKey[]).map((key) => [key, r1(componentScores[key])])) },
    roleInsights: rankedKeys.slice(0, 3).map((key) => ({ area: LABELS[key], score: Math.round(componentScores[key]), interpretation: `${LABELS[key]} (${config.label}): ${descriptions[key]}.` })),
  };
}
