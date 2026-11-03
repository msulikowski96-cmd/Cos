const KEY = "nexus_sight_rank_history";
const MAX_SNAPSHOTS = 30;

export type RankSnapshot = {
  date: number;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  totalLP: number;
};

const TIER_ORDER: Record<string, number> = {
  IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
  EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
};
const RANK_ORDER: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

export function toTotalLP(tier: string, rank: string, lp: number): number {
  const tierVal = (TIER_ORDER[tier] ?? 0) * 400;
  const rankVal = (RANK_ORDER[rank] ?? 0) * 100;
  return tierVal + rankVal + lp;
}

function loadAll(): Record<string, RankSnapshot[]> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

export function getRankHistory(puuid: string): RankSnapshot[] {
  return loadAll()[puuid] ?? [];
}

export function addRankSnapshot(puuid: string, snap: Omit<RankSnapshot, "totalLP">): void {
  const all = loadAll();
  const history = all[puuid] ?? [];
  const full: RankSnapshot = { ...snap, totalLP: toTotalLP(snap.tier, snap.rank, snap.lp) };

  const last = history[history.length - 1];
  if (last && last.totalLP === full.totalLP && last.wins === full.wins) return;

  all[puuid] = [...history, full].slice(-MAX_SNAPSHOTS);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignore */ }
}
