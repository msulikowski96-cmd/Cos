import { logger } from "./logger";

const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let currentVersion = "14.24.1";
let championMap: Record<string, string> = {};
let lastFetchedAt = 0;

async function fetchLatestVersion(): Promise<string> {
  const res = await fetch(VERSIONS_URL);
  if (!res.ok) throw new Error(`Failed to fetch DD versions: ${res.status}`);
  const versions = (await res.json()) as string[];
  return versions[0];
}

async function fetchChampionMap(version: string): Promise<Record<string, string>> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );
  if (!res.ok) throw new Error(`Failed to fetch champion data: ${res.status}`);
  const data = (await res.json()) as { data: Record<string, { key: string; name: string }> };
  const map: Record<string, string> = {};
  for (const [name, champ] of Object.entries(data.data)) {
    map[champ.key] = name;
  }
  return map;
}

export async function refreshDataDragon(): Promise<void> {
  try {
    const version = await fetchLatestVersion();
    const map = await fetchChampionMap(version);
    currentVersion = version;
    championMap = map;
    lastFetchedAt = Date.now();
    logger.info({ version }, "Data Dragon version refreshed");
  } catch (err) {
    logger.warn({ err }, "Failed to refresh Data Dragon version, using cached/default");
  }
}

export function getDDVersion(): string {
  if (Date.now() - lastFetchedAt > REFRESH_INTERVAL_MS) {
    refreshDataDragon().catch(() => {});
  }
  return currentVersion;
}

export function getChampionName(championId: number | string): string {
  return championMap[String(championId)] ?? "Unknown";
}

export function getChampionMap(): Record<string, string> {
  return championMap;
}

export function getChampionId(championName: string): number | null {
  for (const [id, name] of Object.entries(championMap)) {
    if (name === championName) return Number(id);
  }
  return null;
}

refreshDataDragon().catch(() => {});
