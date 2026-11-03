import { Router, type IRouter } from "express";
import { GetSummonerAnalysisResponse } from "@workspace/api-zod";
import { riotFetch, handleRiotError } from "../lib/riot-fetch";
import { cache } from "../lib/cache";
import { riotLimit } from "../middlewares/rateLimit";
import { computeIndependentAnalysisV2, type MatchDataV2 } from "../lib/analysis-engine-v2";

const router: IRouter = Router();
router.use(riotLimit);

const ENGINE_VERSION = "2.1-independent";

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

router.get("/:puuid/analysis", async (req, res) => {
  const { puuid } = req.params;
  const { region, count } = req.query as { region?: string; count?: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }

  const requestedCount = finiteNumber(count, 20);
  const matchCount = Math.max(1, Math.min(Math.floor(requestedCount), 20));
  const normalizedRegion = region.toUpperCase();
  const cacheKey = `analysis:${ENGINE_VERSION}:${normalizedRegion}:${puuid}:${matchCount}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const cluster = REGION_TO_CLUSTER[normalizedRegion] ?? "europe";

  try {
    const matchListUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${matchCount}`;
    const matchListRes = await riotFetch(matchListUrl);
    const matchIds = (await matchListRes.json()) as string[];
    const matchDataArr: MatchDataV2[] = [];

    for (const matchId of matchIds) {
      try {
        const matchUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchRes = await riotFetch(matchUrl);
        const matchData = (await matchRes.json()) as any;
        if (matchData.info?.gameMode === "CHERRY") continue;

        const participant = matchData.info?.participants?.find((item: any) => item.puuid === puuid);
        if (!participant) continue;

        const gameDuration = finiteNumber(matchData.info?.gameDuration);
        const teamParticipants = matchData.info.participants.filter((item: any) => item.teamId === participant.teamId);
        const afkTeammate = teamParticipants.some((item: any) => item.puuid !== puuid && finiteNumber(item.timePlayed, gameDuration) < gameDuration * 0.5);
        const wasAfk = finiteNumber(participant.timePlayed, gameDuration) < gameDuration * 0.5;
        const teamPosition = participant.teamPosition || participant.individualPosition || "";

        matchDataArr.push({
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
          controlWardsPlaced: finiteNumber(participant.detectorWardsPlaced),
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
          bountyGold: participant.bountyLevel ? finiteNumber(participant.bountyLevel) * 150 : finiteNumber(participant.challenges?.bountyGold),
          maxCsAdvantage: finiteNumber(participant.challenges?.maxCsAdvantageOnLaneOpponent),
          skillshotsLanded: finiteNumber(participant.challenges?.skillshotsLanded),
          skillshotsDodged: finiteNumber(participant.challenges?.skillshotsDodged),
          teamDamagePct: participant.challenges?.teamDamagePercentage ? finiteNumber(participant.challenges.teamDamagePercentage) * 100 : 0,
          enemyMissedCS: finiteNumber(participant.challenges?.enemyMissedCS),
          goldPerMinute: finiteNumber(participant.challenges?.goldPerMinute, gameDuration > 0 ? finiteNumber(participant.goldEarned) / gameDuration * 60 : 0),
          teamTurretKills: teamParticipants.reduce((sum: number, item: any) => sum + finiteNumber(item.turretKills), 0),
          teamObjectivesStolen: teamParticipants.reduce((sum: number, item: any) => sum + finiteNumber(item.objectivesStolen), 0),
          hadAfkTeammate: afkTeammate,
          wasAfk,
        });
      } catch (error) {
        req.log?.warn?.({ error, matchId }, "Skipping match that could not be analyzed by V2");
      }
    }

    const analysis = computeIndependentAnalysisV2(matchDataArr);
    const validated = GetSummonerAnalysisResponse.parse(analysis);
    const response = {
      ...validated,
      algorithmVersion: analysis.algorithmVersion,
      scoreConfidence: analysis.scoreConfidence,
      scoreBreakdown: analysis.scoreBreakdown,
      roleInsights: analysis.roleInsights,
    };

    cache.set(cacheKey, response, 120);
    res.json(response);
  } catch (err: any) {
    req.log.error({ err }, "Independent analysis V2 error");
    handleRiotError(err, res);
  }
});

export default router;
