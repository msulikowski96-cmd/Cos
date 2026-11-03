import { Router, type IRouter } from "express";
import { riotFetch, handleRiotError } from "../lib/riot-fetch";
import { cache } from "../lib/cache";
import { riotLimit } from "../middlewares/rateLimit";
import { getChampionName } from "../lib/ddragon";

const router: IRouter = Router();
router.use(riotLimit);

const REGION_TO_CLUSTER: Record<string, string> = {
  NA1: "americas", BR1: "americas", LA1: "americas", LA2: "americas",
  KR: "asia", JP1: "asia",
  EUW1: "europe", EUN1: "europe", TR1: "europe", RU: "europe",
  OC1: "sea", PH2: "sea", SG2: "sea", TH2: "sea", TW2: "sea", VN2: "sea",
};

const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

// GET /api/match/:matchId?region=
router.get("/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const { region } = req.query as { region: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }

  const cacheKey = `match:${matchId}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const cluster = REGION_TO_CLUSTER[region.toUpperCase()] ?? "europe";

  try {
    const url = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const apiRes = await riotFetch(url);
    const data = (await apiRes.json()) as any;

    const info = data.info ?? {};
    const participants: any[] = info.participants ?? [];
    const teams: any[] = info.teams ?? [];

    const teamKillMap: Record<number, number> = {};
    for (const p of participants) {
      const tid: number = p.teamId;
      teamKillMap[tid] = (teamKillMap[tid] ?? 0) + (p.kills ?? 0);
    }

    const maxDmg = Math.max(...participants.map((p: any) => p.totalDamageDealtToChampions ?? 0), 1);

    const mappedParticipants = participants.map((p: any) => {
      const kills: number = p.kills ?? 0;
      const deaths: number = p.deaths ?? 0;
      const assists: number = p.assists ?? 0;
      const cs: number = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0);
      const duration: number = info.gameDuration ?? 1;
      const dmg: number = p.totalDamageDealtToChampions ?? 0;
      const teamKills: number = teamKillMap[p.teamId] ?? 1;
      const kda = deaths === 0 ? kills + assists : parseFloat(((kills + assists) / deaths).toFixed(2));

      const goldEarned = (p.goldEarned ?? 0) as number;
      const goldPerMin = duration > 0 ? parseFloat((goldEarned / (duration / 60)).toFixed(0)) : 0;
      const dmgTaken = (p.totalDamageTaken ?? 0) as number;
      const dmgPerGold = goldEarned > 0 ? parseFloat((dmg / goldEarned).toFixed(2)) : 0;

      return {
        puuid: (p.puuid ?? "") as string,
        summonerName: (p.riotIdGameName ?? p.summonerName ?? "Unknown") as string,
        tagLine: (p.riotIdTagline ?? "") as string,
        championName: (p.championName ?? getChampionName(p.championId)) as string,
        championId: (p.championId ?? 0) as number,
        teamId: (p.teamId ?? 100) as number,
        win: (p.win ?? false) as boolean,
        kills, deaths, assists, kda, cs,
        csPerMin: parseFloat((cs / (duration / 60)).toFixed(1)),
        totalDamageDealt: dmg,
        damageTaken: dmgTaken,
        damageShare: parseFloat(((dmg / maxDmg) * 100).toFixed(1)),
        killParticipation: teamKills > 0 ? parseFloat(((kills + assists) / teamKills * 100).toFixed(1)) : 0,
        goldEarned,
        goldPerMin,
        dmgPerGold,
        visionScore: (p.visionScore ?? 0) as number,
        wardsPlaced: (p.wardsPlaced ?? 0) as number,
        wardsKilled: (p.wardsKilled ?? 0) as number,
        controlWardsPlaced: (p.detectorWardsPlaced ?? 0) as number,
        timeCCingOthers: (p.timeCCingOthers ?? 0) as number,
        totalHeal: (p.totalHeal ?? 0) as number,
        totalHealsOnTeammates: (p.totalHealsOnTeammates ?? 0) as number,
        damageSelfMitigated: (p.damageSelfMitigated ?? 0) as number,
        objectivesStolen: (p.objectivesStolen ?? 0) as number,
        turretKills: (p.turretKills ?? 0) as number,
        largestKillingSpree: (p.largestKillingSpree ?? 0) as number,
        bountyLevel: (p.bountyLevel ?? 0) as number,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((i: any) => i ?? 0) as number[],
        summoner1Id: (p.summoner1Id ?? 0) as number,
        summoner2Id: (p.summoner2Id ?? 0) as number,
        teamPosition: (p.teamPosition ?? "") as string,
        perks: {
          primaryStyleId: (p.perks?.styles?.[0]?.style ?? 0) as number,
          subStyleId: (p.perks?.styles?.[1]?.style ?? 0) as number,
        },
        firstBloodKill: (p.firstBloodKill ?? false) as boolean,
        doubleKills: (p.doubleKills ?? 0) as number,
        tripleKills: (p.tripleKills ?? 0) as number,
        quadraKills: (p.quadraKills ?? 0) as number,
        pentaKills: (p.pentaKills ?? 0) as number,
      };
    });

    const mappedTeams = teams.map((t: any) => ({
      teamId: t.teamId as number,
      win: t.win as boolean,
      objectives: {
        baron: t.objectives?.baron?.kills ?? 0,
        dragon: t.objectives?.dragon?.kills ?? 0,
        tower: t.objectives?.tower?.kills ?? 0,
        inhibitor: t.objectives?.inhibitor?.kills ?? 0,
        riftHerald: t.objectives?.riftHerald?.kills ?? 0,
      },
      bans: (t.bans ?? []).map((b: any) => ({
        championId: b.championId as number,
        championName: getChampionName(b.championId),
        pickTurn: b.pickTurn as number,
      })),
    }));

    const result = {
      matchId,
      gameMode: (info.gameMode ?? "CLASSIC") as string,
      gameType: (info.gameType ?? "MATCHED_GAME") as string,
      gameDuration: (info.gameDuration ?? 0) as number,
      gameEndTimestamp: (info.gameEndTimestamp ?? 0) as number,
      participants: mappedParticipants,
      teams: mappedTeams,
    };

    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    handleRiotError(err, res);
  }
});

export default router;
