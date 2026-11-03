import { Router, type IRouter } from "express";
import { getNvidiaClient } from "../lib/nvidia-models";
import { riotFetch, handleRiotError } from "../lib/riot-fetch";
import { cache } from "../lib/cache";
import { getChampionName } from "../lib/ddragon";
import { requireUsage } from "../middlewares/auth";
import { computeIndependentAnalysisV2, type MatchDataV2 } from "../lib/analysis-engine-v2";
import {
  AI_REPORT_PIPELINE_VERSION,
  FALLBACK_AI_MODEL,
  PRIMARY_AI_MODEL,
  generateGroundedAiReport,
} from "../lib/ai-report-v3";

const router: IRouter = Router();

const REGION_TO_CLUSTER: Record<string, string> = {
  NA1: "americas", BR1: "americas", LA1: "americas", LA2: "americas",
  KR: "asia", JP1: "asia",
  EUW1: "europe", EUN1: "europe", TR1: "europe", RU: "europe",
  OC1: "sea", PH2: "sea", SG2: "sea", TH2: "sea", TW2: "sea", VN2: "sea",
};

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseMatch(matchId: string, matchData: any, puuid: string): MatchDataV2 | null {
  if (matchData.info?.gameMode === "CHERRY") return null;
  const participants: any[] = matchData.info?.participants ?? [];
  const participant = participants.find((item: any) => item.puuid === puuid);
  if (!participant) return null;

  const gameDuration = finiteNumber(matchData.info?.gameDuration);
  const teamParticipants = participants.filter((item: any) => item.teamId === participant.teamId);
  const afkTeammate = teamParticipants.some(
    (item: any) => item.puuid !== puuid && finiteNumber(item.timePlayed, gameDuration) < gameDuration * 0.5,
  );
  const wasAfk = finiteNumber(participant.timePlayed, gameDuration) < gameDuration * 0.5;
  const teamPosition = participant.teamPosition || participant.individualPosition || "";

  return {
    matchId,
    gameMode: String(matchData.info?.gameMode ?? ""),
    gameDuration,
    gameEndTimestamp: finiteNumber(matchData.info?.gameEndTimestamp),
    win: Boolean(participant.win),
    championName: String(participant.championName ?? "Unknown"),
    kills: finiteNumber(participant.kills),
    deaths: finiteNumber(participant.deaths),
    assists: finiteNumber(participant.assists),
    totalDamageDealt: finiteNumber(participant.totalDamageDealtToChampions),
    goldEarned: finiteNumber(participant.goldEarned),
    cs: finiteNumber(participant.totalMinionsKilled) + finiteNumber(participant.neutralMinionsKilled),
    visionScore: finiteNumber(participant.visionScore),
    teamKills: teamParticipants.reduce((sum: number, item: any) => sum + finiteNumber(item.kills), 0),
    teamDamageDealt: teamParticipants.reduce((sum: number, item: any) => sum + finiteNumber(item.totalDamageDealtToChampions), 0),
    doubleKills: finiteNumber(participant.doubleKills),
    tripleKills: finiteNumber(participant.tripleKills),
    quadraKills: finiteNumber(participant.quadraKills),
    pentaKills: finiteNumber(participant.pentaKills),
    wardsPlaced: finiteNumber(participant.wardsPlaced),
    wardsKilled: finiteNumber(participant.wardsKilled),
    controlWardsPlaced: finiteNumber(participant.detectorWardsPlaced ?? participant.visionWardsBoughtInGame),
    damageTaken: finiteNumber(participant.totalDamageTaken),
    selfMitigatedDamage: finiteNumber(participant.damageSelfMitigated),
    soloKills: finiteNumber(participant.challenges?.soloKills),
    turretKills: finiteNumber(participant.turretKills),
    firstBloodKill: Boolean(participant.firstBloodKill),
    firstBloodAssist: Boolean(participant.firstBloodAssist),
    objectivesStolen: finiteNumber(participant.objectivesStolen),
    teamPosition: String(teamPosition),
    physicalDamage: finiteNumber(participant.physicalDamageDealtToChampions),
    magicDamage: finiteNumber(participant.magicDamageDealtToChampions),
    trueDamage: finiteNumber(participant.trueDamageDealtToChampions),
    timeSpentDead: finiteNumber(participant.totalTimeSpentDead),
    longestTimeAlive: finiteNumber(participant.longestTimeSpentLiving),
    dragonKills: finiteNumber(participant.challenges?.dragonKills),
    inhibitorKills: finiteNumber(participant.inhibitorKills),
    bountyGold: participant.bountyLevel
      ? finiteNumber(participant.bountyLevel) * 150
      : finiteNumber(participant.challenges?.bountyGold),
    maxCsAdvantage: finiteNumber(participant.challenges?.maxCsAdvantageOnLaneOpponent),
    skillshotsLanded: finiteNumber(participant.challenges?.skillshotsLanded),
    skillshotsDodged: finiteNumber(participant.challenges?.skillshotsDodged),
    teamDamagePct: participant.challenges?.teamDamagePercentage
      ? finiteNumber(participant.challenges.teamDamagePercentage) * 100
      : 0,
    enemyMissedCS: finiteNumber(participant.challenges?.enemyMissedCS),
    goldPerMinute: finiteNumber(
      participant.challenges?.goldPerMinute,
      gameDuration > 0 ? finiteNumber(participant.goldEarned) / gameDuration * 60 : 0,
    ),
    teamTurretKills: teamParticipants.reduce((sum: number, item: any) => sum + finiteNumber(item.turretKills), 0),
    teamObjectivesStolen: teamParticipants.reduce((sum: number, item: any) => sum + finiteNumber(item.objectivesStolen), 0),
    hadAfkTeammate: afkTeammate,
    wasAfk,
  };
}

async function fetchSourceData(
  puuid: string,
  region: string,
  signal?: AbortSignal,
  shouldStop?: () => boolean,
) {
  const isStopped = () => signal?.aborted || shouldStop?.() === true;
  if (isStopped()) throw new Error("Request aborted");

  const normalizedRegion = region.toUpperCase();
  const platform = normalizedRegion.toLowerCase();
  const cluster = REGION_TO_CLUSTER[normalizedRegion] ?? "europe";

  const [rankedRes, masteryRes, matchIdsRes] = await Promise.all([
    riotFetch(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, undefined, signal),
    riotFetch(`https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=7`, undefined, signal),
    riotFetch(`https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=20&type=ranked`, undefined, signal),
  ]);

  const ranked = (await rankedRes.json()) as any[];
  const masteryRaw = (await masteryRes.json()) as any[];
  const matchIds = (await matchIdsRes.json()) as string[];

  const soloQ = ranked.find((entry: any) => entry.queueType === "RANKED_SOLO_5x5");
  const flexQ = ranked.find((entry: any) => entry.queueType === "RANKED_FLEX_5x5");
  const mastery = masteryRaw.map((entry: any) => ({
    championName: getChampionName(entry.championId),
    championLevel: finiteNumber(entry.championLevel),
    championPoints: finiteNumber(entry.championPoints),
    lastPlayTime: finiteNumber(entry.lastPlayTime),
  }));

  const matches: MatchDataV2[] = [];
  const batchSize = 5;
  for (let index = 0; index < matchIds.length; index += batchSize) {
    if (isStopped()) throw new Error("Request aborted");
    const batch = matchIds.slice(index, index + batchSize);
    const details = await Promise.all(batch.map(async (matchId) => {
      try {
        const response = await riotFetch(
          `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          undefined,
          signal,
        );
        const matchData = await response.json();
        return parseMatch(matchId, matchData, puuid);
      } catch {
        return null;
      }
    }));
    matches.push(...details.filter((item): item is MatchDataV2 => item !== null));
  }

  return { soloQ, flexQ, mastery, matches };
}

function summarizeMatches(rawMatches: MatchDataV2[]) {
  const matches = rawMatches.filter((match) => !match.wasAfk && match.gameDuration > 300 && match.gameMode !== "CHERRY");
  if (matches.length === 0) return null;

  const durationMinutes = (match: MatchDataV2) => Math.max(match.gameDuration / 60, 1);
  const kda = (match: MatchDataV2) => (match.kills + match.assists) / Math.max(match.deaths, 1);
  const wins = matches.filter((match) => match.win).length;
  const roleCounts: Record<string, number> = {};
  const championCounts = new Map<string, MatchDataV2[]>();

  for (const match of matches) {
    roleCounts[match.teamPosition] = (roleCounts[match.teamPosition] ?? 0) + 1;
    const championMatches = championCounts.get(match.championName) ?? [];
    championMatches.push(match);
    championCounts.set(match.championName, championMatches);
  }

  const primaryRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const results = matches.map((match) => match.win ? "W" : "L");
  let streak = 0;
  for (const result of results) {
    if (result !== results[0]) break;
    streak += 1;
  }

  const recentWinRate = (count: number) => {
    const recent = matches.slice(0, Math.min(count, matches.length));
    return round1(recent.length > 0 ? recent.filter((match) => match.win).length / recent.length * 100 : 0);
  };

  const champStats = [...championCounts.entries()].map(([name, championMatches]) => {
    const championWins = championMatches.filter((match) => match.win).length;
    return {
      name,
      games: championMatches.length,
      winRate: round1(championWins / championMatches.length * 100),
      kda: round2(mean(championMatches.map(kda))),
      avgKills: round1(mean(championMatches.map((match) => match.kills))),
      avgDeaths: round1(mean(championMatches.map((match) => match.deaths))),
      avgAssists: round1(mean(championMatches.map((match) => match.assists))),
    };
  }).sort((a, b) => b.games - a.games).slice(0, 5);

  const totalPhysical = matches.reduce((sum, match) => sum + match.physicalDamage, 0);
  const totalMagic = matches.reduce((sum, match) => sum + match.magicDamage, 0);
  const totalTrue = matches.reduce((sum, match) => sum + match.trueDamage, 0);
  const totalTypedDamage = totalPhysical + totalMagic + totalTrue;

  return {
    totalGames: matches.length,
    winRate: round1(wins / matches.length * 100),
    avgKda: round2(mean(matches.map(kda))),
    avgKills: round1(mean(matches.map((match) => match.kills))),
    avgDeaths: round1(mean(matches.map((match) => match.deaths))),
    avgAssists: round1(mean(matches.map((match) => match.assists))),
    avgCsPerMin: round2(mean(matches.map((match) => match.cs / durationMinutes(match)))),
    avgVisionScore: round1(mean(matches.map((match) => match.visionScore))),
    avgDamagePct: round1(mean(matches.map((match) => match.teamDamageDealt > 0 ? match.totalDamageDealt / match.teamDamageDealt * 100 : 0))),
    avgKillParticipation: round1(mean(matches.map((match) => match.teamKills > 0 ? (match.kills + match.assists) / match.teamKills * 100 : 0))),
    avgGoldPerMin: round1(mean(matches.map((match) => match.goldPerMinute > 0 ? match.goldPerMinute : match.goldEarned / durationMinutes(match)))),
    avgTimeDeadPct: round1(mean(matches.map((match) => match.gameDuration > 0 ? match.timeSpentDead / match.gameDuration * 100 : 0))),
    avgControlWards: round2(mean(matches.map((match) => match.controlWardsPlaced))),
    avgWardsPlaced: round1(mean(matches.map((match) => match.wardsPlaced))),
    avgObjectivesStolen: round2(mean(matches.map((match) => match.objectivesStolen))),
    avgDamagePerMin: round1(mean(matches.map((match) => match.totalDamageDealt / durationMinutes(match)))),
    avgVisionPerMin: round2(mean(matches.map((match) => match.visionScore / durationMinutes(match)))),
    primaryRole,
    roleDistribution: roleCounts,
    champStats,
    streakStr: `${streak}× ${results[0] === "W" ? "wygrana" : "przegrana"}`,
    recent5wr: recentWinRate(5),
    recent10wr: recentWinRate(10),
    tiltedGames: matches.filter((match) => match.deaths > 8).length,
    pentasTotal: matches.reduce((sum, match) => sum + match.pentaKills, 0),
    multiKills: matches.reduce((sum, match) => sum + match.doubleKills + match.tripleKills * 2 + match.quadraKills * 4 + match.pentaKills * 8, 0),
    physicalDmgPct: round1(totalTypedDamage > 0 ? totalPhysical / totalTypedDamage * 100 : 0),
    magicDmgPct: round1(totalTypedDamage > 0 ? totalMagic / totalTypedDamage * 100 : 0),
    trueDmgPct: round1(totalTypedDamage > 0 ? totalTrue / totalTypedDamage * 100 : 0),
    lastResults: results.slice(0, 15).join(""),
  };
}

router.get("/:puuid/ai-report", requireUsage("ai_analysis"), async (req, res) => {
  const puuid = String(req.params.puuid);
  const { region, gameName } = req.query as { region?: string; gameName?: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }

  const normalizedRegion = region.toUpperCase();
  const modelKey = PRIMARY_AI_MODEL.replaceAll("/", "_");
  const cacheKey = `ai-report:${AI_REPORT_PIPELINE_VERSION}:${modelKey}:${normalizedRegion}:${puuid}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const timeoutMs = 240_000; // nemotron-3-ultra potrzebuje do ~2,5 min na pełny raport
  const controller = new AbortController();
  let timedOut = false;
  const isClosed = () => res.headersSent || req.socket?.destroyed;
  const abort = (reason: string) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };
  const onClientClosed = () => abort("Client disconnected");
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    abort("AI generation timed out");
  }, timeoutMs);
  req.on("close", onClientClosed);

  try {
    const fetchStartedAt = Date.now();
    const source = await fetchSourceData(puuid, normalizedRegion, controller.signal, isClosed);
    if (isClosed()) return;

    const stats = summarizeMatches(source.matches);
    const analysis = computeIndependentAnalysisV2(source.matches);
    req.log?.info?.({ durationMs: Date.now() - fetchStartedAt, matches: source.matches.length }, "AI report source data ready");

    const generationStartedAt = Date.now();
    const generated = await generateGroundedAiReport(getNvidiaClient(), {
      gameName: gameName?.trim() || "Gracz",
      soloQ: source.soloQ,
      flexQ: source.flexQ,
      mastery: source.mastery,
      stats,
      analysis,
    }, controller.signal);
    if (isClosed()) return;

    const result = {
      report: generated.report,
      generatedAt: Date.now(),
      stats,
      meta: {
        pipelineVersion: AI_REPORT_PIPELINE_VERSION,
        sourceAlgorithmVersion: analysis.algorithmVersion,
        model: generated.model,
        primaryModel: PRIMARY_AI_MODEL,
        fallbackModel: FALLBACK_AI_MODEL,
        generationMode: generated.mode,
        attempts: generated.attempts,
        generationTimeMs: Date.now() - generationStartedAt,
        scoreConfidence: analysis.scoreConfidence,
      },
    };

    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err: any) {
    if (isClosed()) return;
    const isTimeout = timedOut || err?.name === "AbortError" || String(err?.message ?? "").includes("timed out");
    if (isTimeout) {
      res.status(408).json({ error: "timeout", message: "Generowanie raportu przekroczyło limit czasu." });
      return;
    }

    req.log?.error?.({ err }, "Grounded AI report error");
    if (err?.status || err?.response?.status) {
      handleRiotError(err, res);
      return;
    }
    res.status(500).json({ error: "ai_error", message: err?.message ?? "Unknown error" });
  } finally {
    clearTimeout(timeoutHandle);
    req.off("close", onClientClosed);
  }
});

export default router;
