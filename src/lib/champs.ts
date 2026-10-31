import { RAW_CHAMPIONS, DDRAGON_VERSION, type RawChampion } from "../data/champions.generated";
import { RATINGS, type Dmg, type Role } from "../data/ratings";

export type { Role, Dmg };

export const STAT_KEYS = ["early", "mid", "late", "engage", "peel", "cc", "poke", "front", "mobility", "split"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export interface Champion {
  id: string;
  name: string;
  roles: Role[];
  dmg: Dmg;
  stats: Stats;
  /** true gdy oceny wyliczono automatycznie z tagów (brak ręcznej oceny) */
  estimated: boolean;
}

export const ROLES: Role[] = ["T", "J", "M", "A", "S"];
export const ROLE_LABEL: Record<Role, string> = { T: "Top", J: "Jungle", M: "Mid", A: "ADC", S: "Support" };

function parseStats(s: string): Stats {
  const out = {} as Stats;
  STAT_KEYS.forEach((k, i) => (out[k] = Number(s[i] ?? 0)));
  return out;
}

/** Szacunek dla championa bez ręcznej oceny (np. nowość po patchu). */
function estimate(raw: RawChampion): Omit<Champion, "id" | "name"> {
  const t = new Set(raw.tags);
  const ranged = raw.range > 300;
  const dmg: Dmg = raw.magic >= 6 && raw.attack >= 6 ? "MIX" : raw.magic > raw.attack ? "AP" : "AD";
  const s: Stats = { early: 2, mid: 2, late: 2, engage: 1, peel: 1, cc: 1, poke: ranged ? 2 : 0, front: 0, mobility: 1, split: 1 };
  if (t.has("Tank")) Object.assign(s, { engage: 3, cc: 3, front: 3, peel: 2, split: 0 });
  if (t.has("Fighter")) Object.assign(s, { front: Math.max(s.front, 2), split: 2, engage: Math.max(s.engage, 2) });
  if (t.has("Assassin")) Object.assign(s, { mobility: 3, split: Math.max(s.split, 1) });
  if (t.has("Marksman")) Object.assign(s, { early: 1, late: 3 });
  if (t.has("Support")) Object.assign(s, { peel: 3, cc: Math.max(s.cc, 2) });
  if (t.has("Mage")) Object.assign(s, { cc: Math.max(s.cc, 2), poke: Math.max(s.poke, 2) });
  let roles: Role[] = ["M"];
  if (t.has("Marksman")) roles = ["A"];
  else if (t.has("Support")) roles = ["S"];
  else if (t.has("Tank") || t.has("Fighter")) roles = ["T", "J"];
  else if (t.has("Assassin")) roles = ["M", "J"];
  return { roles, dmg, stats: s, estimated: true };
}

export const CHAMPIONS: Champion[] = RAW_CHAMPIONS.map((raw) => {
  const r = RATINGS[raw.id];
  if (!r) return { id: raw.id, name: raw.name, ...estimate(raw) };
  return { id: raw.id, name: raw.name, roles: r[0].split("") as Role[], dmg: r[1], stats: parseStats(r[2]), estimated: false };
});

export const CHAMP_BY_ID: Record<string, Champion> = Object.fromEntries(CHAMPIONS.map((c) => [c.id, c]));

export { DDRAGON_VERSION };
