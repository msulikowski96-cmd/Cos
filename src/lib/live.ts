import { CHAMP_BY_ID, CHAMP_ID_BY_KEY, ROLES } from "./champs";
import { emptyDraft, type Draft, type Side, type Slot } from "./analysis";

/** Fragment odpowiedzi Riot spectator-v5, którego potrzebujemy. */
export interface SpectatorGame {
  gameQueueConfigId?: number;
  gameMode?: string;
  gameLength?: number;
  participants: { puuid?: string; teamId: number; championId: number; spell1Id: number; spell2Id: number; riotId?: string }[];
  bannedChampions?: { championId: number; teamId: number; pickTurn: number }[];
}

export interface LiveDraft {
  draft: Draft;
  mySide: Side | null;
  myChampion: string | null;
  gameLength: number;
  queue: number | null;
}

const SMITE = 11;

/** Dopasowanie championa do roli: główna rola > druga > trzecia > brak. */
function fit(id: string, roleIdx: number, smite: boolean) {
  const c = CHAMP_BY_ID[id];
  const role = ROLES[roleIdx];
  let s = 0;
  if (c) {
    const i = c.roles.indexOf(role);
    s = i === 0 ? 10 : i === 1 ? 6 : i === 2 ? 4 : 0;
  }
  if (role === "J") s += smite ? 25 : -25;
  return s;
}

function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  const out: number[][] = [];
  for (const p of permutations(n - 1)) for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}
const PERMS5 = permutations(5);

/**
 * Przypisuje do 5 championów role Top/Jungle/Mid/ADC/Support.
 * API Riot nie podaje ról w trwającej grze, więc wybieramy najlepsze dopasowanie (120 permutacji).
 */
export function assignRoles(champs: { id: string; smite: boolean }[]): Slot[] {
  const list = champs.slice(0, 5);
  while (list.length < 5) list.push({ id: "", smite: false });
  let best = PERMS5[0];
  let bestScore = -Infinity;
  for (const p of PERMS5) {
    // p[i] = indeks roli dla championa i
    const score = list.reduce((s, c, i) => s + (c.id ? fit(c.id, p[i], c.smite) : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  const slots: Slot[] = [null, null, null, null, null];
  list.forEach((c, i) => {
    if (c.id) slots[best[i]] = c.id;
  });
  return slots;
}

export function liveGameToDraft(game: SpectatorGame, myPuuid?: string): LiveDraft {
  const d = emptyDraft();
  let mySide: Side | null = null;
  let myChampion: string | null = null;

  for (const [teamId, side] of [[100, "blue"], [200, "red"]] as const) {
    const players = game.participants.filter((p) => p.teamId === teamId);
    const champs = players
      .map((p) => ({ id: CHAMP_ID_BY_KEY[p.championId] ?? "", smite: p.spell1Id === SMITE || p.spell2Id === SMITE, puuid: p.puuid }))
      .filter((c) => c.id);
    d[side] = assignRoles(champs);
    const me = champs.find((c) => myPuuid && c.puuid === myPuuid);
    if (me) {
      mySide = side;
      myChampion = me.id;
    }
    const bans = (game.bannedChampions ?? [])
      .filter((b) => b.teamId === teamId)
      .sort((a, b) => a.pickTurn - b.pickTurn)
      .map((b) => CHAMP_ID_BY_KEY[b.championId] ?? null)
      .filter(Boolean)
      .slice(0, 5) as string[];
    const banSlots: Slot[] = [null, null, null, null, null];
    bans.forEach((b, i) => (banSlots[i] = b));
    if (side === "blue") d.blueBans = banSlots;
    else d.redBans = banSlots;
  }
  return { draft: d, mySide, myChampion, gameLength: game.gameLength ?? 0, queue: game.gameQueueConfigId ?? null };
}
