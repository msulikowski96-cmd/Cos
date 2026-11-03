// Klient API Riot: klucz tylko po stronie serwera, cache w pamięci i ponowienie przy limicie 429.

export const PLATFORMS: Record<string, { cluster: string; label: string }> = {
  eun1: { cluster: "europe", label: "EUNE" },
  euw1: { cluster: "europe", label: "EUW" },
  tr1: { cluster: "europe", label: "TR" },
  ru: { cluster: "europe", label: "RU" },
  na1: { cluster: "americas", label: "NA" },
  br1: { cluster: "americas", label: "BR" },
  la1: { cluster: "americas", label: "LAN" },
  la2: { cluster: "americas", label: "LAS" },
  kr: { cluster: "asia", label: "KR" },
  jp1: { cluster: "asia", label: "JP" },
  oc1: { cluster: "sea", label: "OCE" },
  sg2: { cluster: "sea", label: "SG" },
  tw2: { cluster: "sea", label: "TW" },
  vn2: { cluster: "sea", label: "VN" },
};

export class RiotError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const cache = new Map<string, { at: number; ttl: number; value: unknown }>();

function key() {
  return process.env.RIOT_API_KEY?.trim() ?? "";
}

export const riotEnabled = () => key().length > 0;

async function riotGet<T>(url: string, ttlMs: number, allow404 = false): Promise<T | null> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value as T | null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "X-Riot-Token": key() } });
    if (res.ok) {
      const value = (await res.json()) as T;
      cache.set(url, { at: Date.now(), ttl: ttlMs, value });
      return value;
    }
    if (res.status === 404 && allow404) {
      cache.set(url, { at: Date.now(), ttl: Math.min(ttlMs, 20_000), value: null });
      return null;
    }
    if (res.status === 429 && attempt < 2) {
      const wait = Math.min(Number(res.headers.get("Retry-After") ?? 1) * 1000, 8000);
      await new Promise((r) => setTimeout(r, Math.max(wait, 1000)));
      continue;
    }
    if (res.status === 404) throw new RiotError("Nie znaleziono gracza o tym Riot ID w tym regionie.", 404);
    if (res.status === 401 || res.status === 403)
      throw new RiotError("Klucz API Riot jest nieprawidłowy albo wygasł (klucz deweloperski działa 24 h).", 503);
    if (res.status === 429) throw new RiotError("Za dużo zapytań do API Riot. Spróbuj za chwilę.", 429);
    throw new RiotError(`API Riot zwróciło błąd ${res.status}.`, 502);
  }
  throw new RiotError("API Riot nie odpowiada.", 502);
}

export interface Account {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export function getAccount(platform: string, gameName: string, tagLine: string) {
  const { cluster } = PLATFORMS[platform];
  return riotGet<Account>(
    `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    10 * 60_000,
  ) as Promise<Account>;
}

export interface Mastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export function getTopMastery(platform: string, puuid: string, count = 25) {
  return riotGet<Mastery[]>(
    `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`,
    10 * 60_000,
  ) as Promise<Mastery[]>;
}

export function getLiveGame<T>(platform: string, puuid: string) {
  return riotGet<T>(`https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`, 20_000, true);
}
