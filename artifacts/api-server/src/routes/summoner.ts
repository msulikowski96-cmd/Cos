import { Router, type IRouter } from "express";
import {
  SearchSummonerResponse,
  GetSummonerRankedResponse,
  GetSummonerMatchesResponse,
  GetSummonerMasteryResponse,
  GetLiveGameResponse,
} from "@workspace/api-zod";
import { riotFetch, handleRiotError, RiotApiError } from "../lib/riot-fetch";
import { cache } from "../lib/cache";
import { getDDVersion, getChampionName, getChampionMap } from "../lib/ddragon";
import { riotLimit } from "../middlewares/rateLimit";
import { requireUsage } from "../middlewares/auth";

const router: IRouter = Router();

router.use(riotLimit);

const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

export const REGION_TO_CLUSTER: Record<string, string> = {
  NA1: "americas", BR1: "americas", LA1: "americas", LA2: "americas",
  KR: "asia", JP1: "asia",
  EUW1: "europe", EUN1: "europe", TR1: "europe", RU: "europe",
  OC1: "sea", PH2: "sea", SG2: "sea", TH2: "sea", TW2: "sea", VN2: "sea",
};

function computeOpScore(
  kills: number, deaths: number, assists: number,
  cs: number, gameDuration: number, totalDamageDealt: number,
  teamKills: number, win: boolean
): number {
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
  const csPerMin = gameDuration > 0 ? (cs / gameDuration) * 60 : 0;
  const kp = teamKills > 0 ? ((kills + assists) / teamKills) * 100 : 0;
  const winBonus = win ? 15 : 0;
  const raw =
    Math.log2(kda + 1) * 30 * 0.35 +
    Math.min((csPerMin / 10) * 100, 100) * 0.15 +
    Math.min((kp / 70) * 100, 100) * 0.2 +
    Math.min((totalDamageDealt / 15000) * 100, 100) * 0.15 +
    Math.min(100 - deaths * 12, 100) * 0.15 +
    winBonus;
  return Math.round(Math.max(0, Math.min(100, raw))) / 10;
}

// GET /api/summoner/search?gameName=&tagLine=&region=
router.get("/search", async (req, res) => {
  const { gameName, tagLine, region } = req.query as {
    gameName: string; tagLine: string; region: string;
  };

  if (!gameName || !tagLine || !region) {
    res.status(400).json({ error: "bad_request", message: "gameName, tagLine, and region are required" });
    return;
  }

  const regionUpper = region.toUpperCase();
  const cacheKey = `search:${regionUpper}:${gameName.toLowerCase()}:${tagLine.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const cluster = REGION_TO_CLUSTER[regionUpper] ?? "europe";
  const regionLower = region.toLowerCase();

  try {
    const accountUrl = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const accountRes = await riotFetch(accountUrl);
    const account = (await accountRes.json()) as { puuid: string; gameName: string; tagLine: string };

    let summonerId = "";
    let summonerLevel = 0;
    let profileIconId = 29;

    try {
      const summonerUrl = `https://${regionLower}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`;
      const summonerRes = await fetch(summonerUrl, {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      });
      if (summonerRes.ok) {
        const summoner = (await summonerRes.json()) as {
          id: string; profileIconId: number; summonerLevel: number;
        };
        summonerId = summoner.id ?? "";
        summonerLevel = summoner.summonerLevel ?? 0;
        profileIconId = summoner.profileIconId ?? 29;
      }
    } catch {
      // summoner v4 lookup failed — continue with defaults
    }

    const profile = SearchSummonerResponse.parse({
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerId,
      summonerLevel,
      profileIconId,
      region: regionUpper,
    });

    cache.set(cacheKey, profile, 60);
    res.json(profile);
  } catch (err) {
    handleRiotError(err, res);
  }
});

// GET /api/summoner/:puuid/ranked?region=
router.get("/:puuid/ranked", async (req, res) => {
  const { puuid } = req.params;
  const { region } = req.query as { region: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }

  const cacheKey = `ranked:${region.toUpperCase()}:${puuid}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const regionLower = region.toLowerCase();

  try {
    const url = `https://${regionLower}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    const apiRes = await riotFetch(url);
    const data = (await apiRes.json()) as Array<{
      queueType: string; tier: string; rank: string; leaguePoints: number;
      wins: number; losses: number; hotStreak: boolean; veteran: boolean;
      freshBlood: boolean; inactive: boolean;
    }>;

    const ranked = GetSummonerRankedResponse.parse(data);
    cache.set(cacheKey, ranked, 120);
    res.json(ranked);
  } catch (err) {
    handleRiotError(err, res);
  }
});

// GET /api/summoner/:puuid/matches?region=&count=
router.get("/:puuid/matches", async (req, res) => {
  const { puuid } = req.params;
  const { region, count } = req.query as { region: string; count?: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }

  const matchCount = Math.min(Number(count ?? 20), 20);
  const cacheKey = `matches:${region.toUpperCase()}:${puuid}:${matchCount}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const cluster = REGION_TO_CLUSTER[region.toUpperCase()] ?? "europe";

  try {
    const matchListUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${matchCount}`;
    const matchListRes = await riotFetch(matchListUrl);
    const matchIds = (await matchListRes.json()) as string[];

    const matches = await Promise.all(
      matchIds.map(async (matchId) => {
        const matchUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchRes = await riotFetch(matchUrl);
        const matchData = (await matchRes.json()) as any;
        const allParticipants: any[] = matchData.info.participants ?? [];

        const participant = allParticipants.find((p: any) => p.puuid === puuid);
        if (!participant) return null;

        const myTeamId: number = participant.teamId;
        const myPosition: string = participant.teamPosition ?? "";
        const totalDamageDealt = participant.totalDamageDealtToChampions as number;
        const cs = (participant.totalMinionsKilled + participant.neutralMinionsKilled) as number;
        const gameDuration = matchData.info.gameDuration as number;
        const win = participant.win as boolean;
        const kills = participant.kills as number;
        const deaths = participant.deaths as number;
        const assists = participant.assists as number;

        const myTeam = allParticipants.filter((p: any) => p.teamId === myTeamId);
        const teamKills = myTeam.reduce((sum: number, p: any) => sum + (p.kills ?? 0), 0);
        const opScore = computeOpScore(kills, deaths, assists, cs, gameDuration, totalDamageDealt, teamKills, win);

        let opponent: { championName: string; kills: number; deaths: number; assists: number } | null = null;
        if (myPosition) {
          const opp = allParticipants.find((p: any) => p.teamId !== myTeamId && p.teamPosition === myPosition);
          if (opp) {
            opponent = {
              championName: opp.championName as string,
              kills: opp.kills as number,
              deaths: opp.deaths as number,
              assists: opp.assists as number,
            };
          }
        }

        const participants = allParticipants.map((p: any) => {
          const pTeamId: number = p.teamId;
          const pKills: number = p.kills ?? 0;
          const pDeaths: number = p.deaths ?? 0;
          const pAssists: number = p.assists ?? 0;
          const pCs: number = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0);
          const pDmg: number = p.totalDamageDealtToChampions ?? 0;
          const pWin: boolean = p.win ?? false;
          const pTeam = allParticipants.filter((x: any) => x.teamId === pTeamId);
          const pTeamKills: number = pTeam.reduce((s: number, x: any) => s + (x.kills ?? 0), 0);
          const pOpScore = computeOpScore(pKills, pDeaths, pAssists, pCs, gameDuration, pDmg, pTeamKills, pWin);
          return {
            summonerName: (p.riotIdGameName ?? p.summonerName ?? "Nieznany") as string,
            puuid: (p.puuid ?? "") as string,
            championName: (p.championName ?? "Unknown") as string,
            kills: pKills, deaths: pDeaths, assists: pAssists,
            cs: pCs, totalDamageDealt: pDmg,
            goldEarned: (p.goldEarned ?? 0) as number,
            win: pWin, teamId: pTeamId,
            items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((i: any) => i ?? 0) as number[],
            opScore: pOpScore,
          };
        });

        return {
          matchId,
          gameMode: matchData.info.gameMode as string,
          gameDuration,
          gameEndTimestamp: matchData.info.gameEndTimestamp as number,
          win, championName: participant.championName as string,
          championId: participant.championId as number,
          kills, deaths, assists, totalDamageDealt,
          goldEarned: participant.goldEarned as number, cs,
          visionScore: participant.visionScore as number,
          items: [
            participant.item0, participant.item1, participant.item2,
            participant.item3, participant.item4, participant.item5, participant.item6,
          ] as number[],
          summoner1Id: participant.summoner1Id as number,
          summoner2Id: participant.summoner2Id as number,
          perks: {
            primaryStyleId: participant.perks?.styles?.[0]?.style ?? 0,
            subStyleId: participant.perks?.styles?.[1]?.style ?? 0,
          },
          opScore, opponent, participants,
        };
      })
    );

    const filtered = matches.filter(Boolean);
    const validated = GetSummonerMatchesResponse.parse(filtered);
    cache.set(cacheKey, validated, 90);
    res.json(validated);
  } catch (err) {
    handleRiotError(err, res);
  }
});

// GET /api/summoner/:puuid/mastery?region=&count=
router.get("/:puuid/mastery", async (req, res) => {
  const { puuid } = req.params;
  const { region, count } = req.query as { region: string; count?: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }

  const masteryCount = Math.min(Number(count ?? 7), 10);
  const cacheKey = `mastery:${region.toUpperCase()}:${puuid}:${masteryCount}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const regionLower = region.toLowerCase();

  try {
    const url = `https://${regionLower}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${masteryCount}`;
    const apiRes = await riotFetch(url);
    const data = (await apiRes.json()) as Array<{
      championId: number; championLevel: number; championPoints: number; lastPlayTime: number;
    }>;

    const mastery = data.map((entry) => ({
      championId: entry.championId,
      championName: getChampionName(entry.championId),
      championLevel: entry.championLevel,
      championPoints: entry.championPoints,
      lastPlayTime: entry.lastPlayTime,
    }));

    const validated = GetSummonerMasteryResponse.parse(mastery);
    cache.set(cacheKey, validated, 300);
    res.json(validated);
  } catch (err) {
    handleRiotError(err, res);
  }
});

// GET /api/summoner/:puuid/live?region=&summonerId=
router.get("/:puuid/live", async (req, res) => {
  const { puuid } = req.params;
  const { region, summonerId } = req.query as { region: string; summonerId?: string };

  if (!region) {
    res.status(400).json({ error: "bad_request", message: "region is required" });
    return;
  }
  if (!summonerId) {
    res.status(400).json({ error: "bad_request", message: "summonerId is required" });
    return;
  }

  if (!puuid || puuid.length < 10) {
    res.status(400).json({ error: "bad_request", message: "Nieprawidłowy identyfikator gracza (PUUID). Spróbuj wyszukać gracza ponownie." });
    return;
  }

  const cacheKey = `live:${region.toUpperCase()}:${puuid}`;
  const cached = cache.get(cacheKey);
  if (cached) { res.json(cached); return; }

  const regionLower = region.toLowerCase();
  const champById = getChampionMap();

  // Shardy w tym samym regionie routingu — gracz może aktualnie grać na innym shardzie
  // (np. profil EUW1 ale w grze na EUN1). PUUID jest globalny, ale spectator wymaga shardu.
  const SHARD_GROUPS: Record<string, string[]> = {
    euw1: ["euw1", "eun1", "tr1", "ru"],
    eun1: ["eun1", "euw1", "tr1", "ru"],
    tr1:  ["tr1", "euw1", "eun1", "ru"],
    ru:   ["ru", "euw1", "eun1", "tr1"],
    na1:  ["na1", "la1", "la2", "br1", "oc1"],
    br1:  ["br1", "na1", "la1", "la2", "oc1"],
    la1:  ["la1", "la2", "na1", "br1", "oc1"],
    la2:  ["la2", "la1", "na1", "br1", "oc1"],
    oc1:  ["oc1", "na1", "la1", "la2", "br1"],
    kr:   ["kr", "jp1"],
    jp1:  ["jp1", "kr"],
  };
  const shards = SHARD_GROUPS[regionLower] ?? [regionLower];

  try {
    // Riot Spectator-V5: endpoint "by-summoner" wymaga encrypted summoner ID,
    // nie globalnego PUUID. PUUID pozostaje kluczem profilu i odpowiedzi live.
    // Próbujemy najpierw shard z profilu, potem pozostałe shardy w regionie.
    // Sprawdzamy wszystkie shardy RÓWNOLEGLE — pierwszy który odpowie 200 wygrywa.
    // Dla EU: euw1, eun1, tr1, ru — wszystkie odpytane naraz zamiast kolejno.
    type ShardResult = { shard: string; response: Response };
    const shardResults = await Promise.all(
      shards.map(async (shard): Promise<ShardResult | null> => {
        try {
          const url = `https://${shard}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(summonerId)}`;
          const r = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY } });
          return { shard, response: r };
        } catch {
          return null;
        }
      })
    );

    // Check for a found game (200) FIRST — a valid game on one shard must not be
    // blocked by a 403 from an unrelated shard.
    const found = shardResults.find(r => r?.response.ok);
    if (!found) {
      const forbidden = shardResults.find(r => r?.response.status === 403);
      if (forbidden) {
        const bodyText = await forbidden.response.text().catch(() => "");
        console.error("[live] Riot API 403", bodyText.slice(0, 200));
        res.status(403).json({ error: "riot_key_invalid", message: "Klucz Riot API wygasł lub jest nieprawidłowy. Wygeneruj nowy klucz na developer.riotgames.com (klucze developerskie wygasają co 24h)." });
        return;
      }
      const statuses = shardResults.map(r => r?.response.status ?? "null").join(", ");
      const all404 = shardResults.every(r => r?.response.status === 404);
      console.info(`[live] not in game — shard statuses: ${statuses}`);
      res.status(404).json({
        error: "not_in_game",
        message: "Gracz nie jest teraz w meczu",
        hint: all404 ? "spectator_privacy" : undefined,
      });
      return;
    }

    console.info(`[live] found game for ${puuid.slice(0, 12)}... on shard ${found.shard} (profile region: ${regionLower})`);
    const liveData = (await found.response.json()) as any;

    const rankedByPuuid: Record<string, { tier: string; division: string; lp: number; wins: number; losses: number }> = {};
    await Promise.allSettled(
      (liveData.participants ?? []).map(async (p: any) => {
        if (!p.puuid) return;
        try {
          const rUrl = `https://${regionLower}.api.riotgames.com/lol/league/v4/entries/by-puuid/${p.puuid}`;
          const rRes = await fetch(rUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });
          if (!rRes.ok) return;
          const entries = (await rRes.json()) as any[];
          const soloq = entries.find((e: any) => e.queueType === "RANKED_SOLO_5x5");
          if (soloq) {
            rankedByPuuid[p.puuid] = {
              tier: soloq.tier ?? "UNRANKED",
              division: soloq.rank ?? "",
              lp: soloq.leaguePoints ?? 0,
              wins: soloq.wins ?? 0,
              losses: soloq.losses ?? 0,
            };
          }
        } catch { /* ignore individual failures */ }
      })
    );

    const participants = (liveData.participants ?? []).map((p: any) => ({
      puuid: p.puuid ?? "",
      summonerName: p.riotId ?? p.summonerName ?? "Nieznany",
      championId: p.championId ?? 0,
      championName: champById[String(p.championId)] ?? "Nieznany",
      teamId: p.teamId ?? 0,
      spell1Id: p.spell1Id ?? 0,
      spell2Id: p.spell2Id ?? 0,
      rankedTier: rankedByPuuid[p.puuid]?.tier ?? "UNRANKED",
      rankedDivision: rankedByPuuid[p.puuid]?.division ?? "",
      rankedLP: rankedByPuuid[p.puuid]?.lp ?? 0,
      rankedWins: rankedByPuuid[p.puuid]?.wins ?? 0,
      rankedLosses: rankedByPuuid[p.puuid]?.losses ?? 0,
      perks: {
        perkIds: p.perks?.perkIds ?? [],
        perkStyle: p.perks?.perkStyle ?? 0,
        perkSubStyle: p.perks?.perkSubStyle ?? 0,
      },
    }));

    const bans = (liveData.bannedChampions ?? []).map((b: any) => ({
      championId: b.championId ?? -1,
      championName: b.championId && b.championId > 0 ? (champById[String(b.championId)] ?? "Nieznany") : "Brak",
      teamId: b.teamId ?? 0,
      pickTurn: b.pickTurn ?? 0,
    }));

    const result = {
      gameId: liveData.gameId ?? 0,
      gameMode: liveData.gameMode ?? "CLASSIC",
      gameType: liveData.gameType ?? "MATCHED_GAME",
      gameLength: liveData.gameLength ?? 0,
      mapId: liveData.mapId ?? 0,
      participants, bans,
    };

    const validated = GetLiveGameResponse.parse(result);
    cache.set(cacheKey, validated, 30);
    res.json(validated);
  } catch (err: any) {
    res.status(500).json({ error: "riot_api_error", message: err?.message ?? "Unknown error" });
  }
});

export default router;
