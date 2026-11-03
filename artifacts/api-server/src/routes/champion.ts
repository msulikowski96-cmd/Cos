import { Router, type IRouter } from "express";
import { riotFetch, handleRiotError } from "../lib/riot-fetch";
import { cache } from "../lib/cache";
import { riotLimit } from "../middlewares/rateLimit";
import { getChampionId } from "../lib/ddragon";

const router: IRouter = Router();

router.use(riotLimit);

const REGION_TO_CLUSTER: Record<string, string> = {
  NA1: "americas", BR1: "americas", LA1: "americas", LA2: "americas",
  KR: "asia", JP1: "asia",
  EUW1: "europe", EUN1: "europe", TR1: "europe", RU: "europe",
  OC1: "sea", PH2: "sea", SG2: "sea", TH2: "sea", TW2: "sea", VN2: "sea",
};

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeOpScore(
  kills: number, deaths: number, assists: number, cs: number,
  gameDuration: number, totalDamage: number, teamKills: number, win: boolean
): number {
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
  const cspm = gameDuration > 0 ? (cs / gameDuration) * 60 : 0;
  const kp = teamKills > 0 ? ((kills + assists) / teamKills) * 100 : 0;
  const raw =
    Math.log2(kda + 1) * 30 * 0.35 +
    Math.min((cspm / 10) * 100, 100) * 0.15 +
    Math.min((kp / 70) * 100, 100) * 0.2 +
    Math.min((totalDamage / 15000) * 100, 100) * 0.15 +
    Math.min(100 - deaths * 12, 100) * 0.15 +
    (win ? 15 : 0);
  return Math.round(Math.max(0, Math.min(100, raw))) / 10;
}

// GET /api/summoner/:puuid/champion/:championName?region=&count=
router.get("/:puuid/champion/:championName", async (req, res) => {
  const { puuid, championName } = req.params;
  const { region, count } = req.query as { region: string; count?: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }

  const fetchCount = Math.min(Number(count ?? 60), 100);
  const cacheKey = `champion:${region.toUpperCase()}:${puuid}:${championName}:${fetchCount}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const cluster = REGION_TO_CLUSTER[region.toUpperCase()] ?? "europe";

  try {
    // Try to filter by champion ID so Riot returns only relevant matches
    const championId = getChampionId(championName);
    const champParam = championId != null ? `&champion=${championId}` : "";
    const matchListUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${fetchCount}${champParam}`;
    const matchListRes = await riotFetch(matchListUrl);
    const matchIds = (await matchListRes.json()) as string[];

    interface MatchEntry {
      matchId: string;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      cs: number;
      csPerMin: number;
      totalDamage: number;
      goldEarned: number;
      visionScore: number;
      gameDuration: number;
      gameEndTimestamp: number;
      items: number[];
      opScore: number;
      teamPosition: string;
      opponentChampion: string | null;
      summoner1Id: number;
      summoner2Id: number;
    }

    // Fetch all match details in parallel batches to avoid sequential blocking
    const BATCH_SIZE = 8;
    const championMatches: MatchEntry[] = [];

    async function fetchMatchEntry(matchId: string): Promise<MatchEntry | null> {
      try {
        const matchUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchRes = await riotFetch(matchUrl);
        const md = (await matchRes.json()) as any;
        const all: any[] = md.info?.participants ?? [];
        const p = all.find((x: any) => x.puuid === puuid);
        if (!p) return null;
        if (p.championName !== championName) return null;

        const myTeam = all.filter((x: any) => x.teamId === p.teamId);
        const teamKills = myTeam.reduce((s: number, x: any) => s + (x.kills ?? 0), 0);
        const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0);
        const gd = md.info.gameDuration as number;
        const dmg = p.totalDamageDealtToChampions as number;
        const win = p.win as boolean;
        const opp = all.find(
          (x: any) => x.teamId !== p.teamId && x.teamPosition === p.teamPosition && p.teamPosition
        );

        return {
          matchId,
          win,
          kills: p.kills ?? 0,
          deaths: p.deaths ?? 0,
          assists: p.assists ?? 0,
          cs,
          csPerMin: gd > 0 ? (cs / gd) * 60 : 0,
          totalDamage: dmg,
          goldEarned: p.goldEarned ?? 0,
          visionScore: p.visionScore ?? 0,
          gameDuration: gd,
          gameEndTimestamp: md.info.gameEndTimestamp ?? 0,
          items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((i: any) => Number(i ?? 0)),
          opScore: computeOpScore(p.kills ?? 0, p.deaths ?? 0, p.assists ?? 0, cs, gd, dmg, teamKills, win),
          teamPosition: p.teamPosition ?? "",
          opponentChampion: opp ? (opp.championName as string) : null,
          summoner1Id: p.summoner1Id ?? 0,
          summoner2Id: p.summoner2Id ?? 0,
        };
      } catch { return null; }
    }

    for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
      const batch = matchIds.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(fetchMatchEntry));
      for (const entry of results) {
        if (entry) championMatches.push(entry);
      }
    }

    const total = championMatches.length;
    const wins = championMatches.filter((m) => m.win).length;
    const losses = total - wins;
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;

    const avgKills = Math.round(mean(championMatches.map((m) => m.kills)) * 10) / 10;
    const avgDeaths = Math.round(mean(championMatches.map((m) => m.deaths)) * 10) / 10;
    const avgAssists = Math.round(mean(championMatches.map((m) => m.assists)) * 10) / 10;
    const avgKda = avgDeaths === 0 ? avgKills + avgAssists : Math.round(((avgKills + avgAssists) / avgDeaths) * 100) / 100;
    const avgCsPerMin = Math.round(mean(championMatches.map((m) => m.csPerMin)) * 10) / 10;
    const avgDamage = Math.round(mean(championMatches.map((m) => m.totalDamage)));
    const avgGold = Math.round(mean(championMatches.map((m) => m.goldEarned)));
    const avgVisionScore = Math.round(mean(championMatches.map((m) => m.visionScore)) * 10) / 10;
    const avgGameDuration = Math.round(mean(championMatches.map((m) => m.gameDuration)));
    const performanceScore = Math.round(mean(championMatches.map((m) => m.opScore)) * 10) / 10;

    // Item frequency (slots 0-5, ignore trinket slot 6)
    const itemCounts: Record<number, number> = {};
    for (const m of championMatches) {
      const slots = m.items.slice(0, 6);
      for (const itemId of slots) {
        if (itemId > 0) {
          itemCounts[itemId] = (itemCounts[itemId] ?? 0) + 1;
        }
      }
    }
    const commonItems = Object.entries(itemCounts)
      .map(([id, freq]) => ({ itemId: Number(id), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Opponent matchups
    const matchupMap: Record<string, { wins: number; games: number; kdas: number[] }> = {};
    for (const m of championMatches) {
      if (!m.opponentChampion) continue;
      const opp = m.opponentChampion;
      if (!matchupMap[opp]) matchupMap[opp] = { wins: 0, games: 0, kdas: [] };
      matchupMap[opp].games += 1;
      if (m.win) matchupMap[opp].wins += 1;
      const kda = m.deaths === 0 ? m.kills + m.assists : (m.kills + m.assists) / m.deaths;
      matchupMap[opp].kdas.push(kda);
    }
    const matchups = Object.entries(matchupMap)
      .map(([champ, data]) => ({
        championName: champ,
        games: data.games,
        wins: data.wins,
        losses: data.games - data.wins,
        winRate: Math.round((data.wins / data.games) * 1000) / 10,
        avgKdaVs: Math.round(mean(data.kdas) * 100) / 100,
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 10);

    // Role distribution
    const roleCounts: Record<string, number> = {};
    for (const m of championMatches) {
      if (m.teamPosition) roleCounts[m.teamPosition] = (roleCounts[m.teamPosition] ?? 0) + 1;
    }
    const roleLabels: Record<string, string> = {
      TOP: "Top", JUNGLE: "Jungler", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Support",
    };
    const roleDistribution: Record<string, number> = {};
    for (const [k, v] of Object.entries(roleCounts)) {
      roleDistribution[roleLabels[k] ?? k] = v;
    }

    // Best and worst game by opScore
    const sorted = [...championMatches].sort((a, b) => b.opScore - a.opScore);
    const makeGameEntry = (m: MatchEntry) => ({
      matchId: m.matchId, win: m.win,
      kills: m.kills, deaths: m.deaths, assists: m.assists,
      kda: m.deaths === 0 ? m.kills + m.assists : Math.round(((m.kills + m.assists) / m.deaths) * 100) / 100,
      totalDamage: m.totalDamage,
      gameDuration: m.gameDuration,
      gameEndTimestamp: m.gameEndTimestamp,
      opScore: m.opScore,
    });
    const bestGame = sorted.length > 0 ? makeGameEntry(sorted[0]) : null;
    const worstGame = sorted.length > 0 ? makeGameEntry(sorted[sorted.length - 1]) : null;

    const result = {
      championName,
      puuid,
      region: region.toUpperCase(),
      totalGames: total,
      wins,
      losses,
      winRate,
      avgKda,
      avgKills,
      avgDeaths,
      avgAssists,
      avgCsPerMin,
      avgDamage,
      avgGold,
      avgVisionScore,
      avgGameDuration,
      performanceScore,
      commonItems,
      matches: championMatches.slice(0, 20),
      matchups,
      roleDistribution,
      bestGame,
      worstGame,
    };

    cache.set(cacheKey, result, 180);
    res.json(result);
  } catch (err) {
    handleRiotError(err, res);
  }
});

export default router;
