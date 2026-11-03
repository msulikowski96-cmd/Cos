import { CHAMP_BY_ID, CHAMPIONS, ROLES, type Champion, type Role, type StatKey, type Stats, STAT_KEYS } from "./champs";

export type Side = "blue" | "red";
export type Slot = string | null;

export interface Draft {
  blue: Slot[]; // 5 slotów: Top, Jungle, Mid, ADC, Support
  red: Slot[];
  blueBans: Slot[];
  redBans: Slot[];
}

export const emptyDraft = (): Draft => ({
  blue: [null, null, null, null, null],
  red: [null, null, null, null, null],
  blueBans: [null, null, null, null, null],
  redBans: [null, null, null, null, null],
});

export const RADAR_KEYS = ["engage", "peel", "cc", "poke", "front", "mobility", "split"] as const;
export type RadarKey = (typeof RADAR_KEYS)[number];
export const RADAR_LABEL: Record<RadarKey, string> = {
  engage: "Inicjacja",
  peel: "Ochrona",
  cc: "Kontrola",
  poke: "Poke",
  front: "Frontline",
  mobility: "Mobilność",
  split: "Split push",
};
// Suma ocen całej drużyny (5 championów), którą uznajemy za „solidną” — daje 70/100 na radarze.
const RADAR_TARGET: Record<RadarKey, number> = { engage: 7, peel: 6, cc: 10, poke: 6, front: 6, mobility: 7, split: 5 };

export type ArchetypeId = "teamfight" | "dive" | "poke" | "protect" | "pick" | "split";
export interface Archetype {
  id: ArchetypeId;
  name: string;
  score: number;
  winCon: string;
}

const ARCH_META: Record<ArchetypeId, { name: string; winCon: string; counter: string }> = {
  teamfight: {
    name: "Teamfight 5v5",
    winCon: "Grupujcie się przy obiektywach i wymuszajcie walki 5 na 5 — wasze AoE i CC wygrywa długie starcia.",
    counter: "nie dawajcie im walki w zwartej grupie — rozdzielajcie mapę i łapcie pojedynczych graczy",
  },
  dive: {
    name: "Dive",
    winCon: "Wskakujcie razem na tylną linię wroga, zanim zdąży ustawić walkę. Tempo i wspólne wejście to klucz.",
    counter: "trzymajcie się blisko carry, zostawiajcie CC na wchodzących i nie walczcie w otwartym terenie",
  },
  poke: {
    name: "Poke i oblężenie",
    winCon: "Obijajcie wroga z dystansu przed obiektywem i oblegajcie wieże. Unikajcie walk, dopóki ich HP nie spadnie.",
    counter: "wchodźcie szybko i zdecydowanie — każda sekunda czekania to ich darmowe obrażenia",
  },
  protect: {
    name: "Ochrona carry",
    winCon: "Grajcie wokół jednego hiper-carry. Frontline i support trzymają wroga z dala, carry zadaje obrażenia.",
    counter: "skupcie się na flankowaniu i zabiciu ich carry — bez niego skład traci obrażenia",
  },
  pick: {
    name: "Łapanie (pick)",
    winCon: "Kontrolujcie wizję i łapcie pojedynczych graczy w dżungli. Każdy pick to darmowy obiektyw.",
    counter: "poruszajcie się w grupach i nie wchodźcie do dżungli bez wizji",
  },
  split: {
    name: "Split push",
    winCon: "Najsilniejszy pojedynek wysyłajcie na boczną linię, reszta gra na czas przy obiektywach i wymienia się.",
    counter: "wymuszajcie walki 5v4, gdy ich splitpusher jest daleko, albo wyślijcie na niego dwie osoby",
  },
};

export interface Note {
  tone: "good" | "warn" | "bad";
  title: string;
  text: string;
}

export interface ScoreParts {
  front: number;
  engage: number;
  cc: number;
  peel: number;
  dmg: number;
  phase: number;
  identity: number;
}

export interface TeamAnalysis {
  champs: Champion[];
  count: number;
  /** sumy przeliczone na pełną drużynę (5 osób) */
  full: Stats;
  /** średnia siła w fazie gry (0–3) */
  phase: { early: number; mid: number; late: number };
  radar: Record<RadarKey, number>;
  damage: { ad: number; ap: number };
  archetypes: Archetype[];
  parts: ScoreParts;
  score: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function archetypeRaw(a: Stats): Record<ArchetypeId, number> {
  return {
    teamfight: a.engage + a.cc + a.front * 0.7,
    dive: a.engage + a.mobility + (a.early + a.mid) / 2,
    poke: a.poke * 1.5 + a.peel * 0.5 + a.cc * 0.3,
    protect: a.peel * 1.2 + a.late + a.front * 0.5,
    pick: a.cc + a.mobility + a.early * 0.5,
    split: a.split * 1.6 + a.mobility * 0.6 + a.late * 0.3,
  };
}

/** Deterministyczny generator liczb losowych (żeby kalibracja była zawsze taka sama). */
export function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Kalibracja: rozkład każdego archetypu w 2000 losowych składach. Dzięki temu „70” znaczy
// to samo dla dive'a i dla split pusha (≈ 1,3 odchylenia powyżej przeciętnego składu).
const ARCH_NORM = (() => {
  const rng = seeded(1337);
  const ids = Object.keys(ARCH_META) as ArchetypeId[];
  const samples: Record<ArchetypeId, number[]> = Object.fromEntries(ids.map((id) => [id, []])) as never;
  const byRole = ROLES.map((r) => CHAMPIONS.filter((c) => c.roles[0] === r));
  for (let n = 0; n < 2000; n++) {
    const team = byRole.map((pool) => pool[Math.floor(rng() * pool.length)]);
    const avg = Object.fromEntries(STAT_KEYS.map((k) => [k, team.reduce((s, c) => s + c.stats[k], 0) / 5])) as Stats;
    const raw = archetypeRaw(avg);
    ids.forEach((id) => samples[id].push(raw[id]));
  }
  return Object.fromEntries(
    ids.map((id) => {
      const xs = samples[id];
      const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
      const sd = Math.sqrt(xs.reduce((s, v) => s + (v - mean) ** 2, 0) / xs.length) || 1;
      return [id, { mean, sd }];
    }),
  ) as Record<ArchetypeId, { mean: number; sd: number }>;
})();

function archetypeScore(id: ArchetypeId, raw: number) {
  const { mean, sd } = ARCH_NORM[id];
  return clamp(Math.round(50 + ((raw - mean) / sd) * 15), 5, 99);
}

/** Kara za braki, bonus za mocną stronę: liniowo między `low` a `high`. */
function need(v: number, low: number, high: number, penalty: number, bonus: number) {
  if (v <= low) return -penalty;
  if (v >= high) return bonus;
  const t = (v - low) / (high - low);
  return -penalty + t * (penalty + bonus);
}

export function analyzeTeam(slots: Slot[]): TeamAnalysis {
  const champs = slots.filter(Boolean).map((id) => CHAMP_BY_ID[id as string]).filter(Boolean);
  const count = champs.length;
  const sum = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;
  let ad = 0;
  let ap = 0;
  for (const c of champs) {
    for (const k of STAT_KEYS) sum[k] += c.stats[k];
    if (c.dmg === "AD") ad += 1;
    else if (c.dmg === "AP") ap += 1;
    else {
      ad += 0.5;
      ap += 0.5;
    }
  }
  const scale = count ? 5 / count : 0;
  const full = Object.fromEntries(STAT_KEYS.map((k) => [k, sum[k] * scale])) as Stats;
  const avg = Object.fromEntries(STAT_KEYS.map((k) => [k, count ? sum[k] / count : 0])) as Stats;

  const radar = Object.fromEntries(
    RADAR_KEYS.map((k) => [k, count ? clamp(Math.round((full[k] / RADAR_TARGET[k]) * 70), 0, 100) : 0]),
  ) as Record<RadarKey, number>;

  const damage = count ? { ad: ad / count, ap: ap / count } : { ad: 0.5, ap: 0.5 };
  const phase = { early: avg.early, mid: avg.mid, late: avg.late };

  const raw = archetypeRaw(avg);
  const archetypes: Archetype[] = (Object.keys(raw) as ArchetypeId[])
    .map((id) => ({ id, name: ARCH_META[id].name, winCon: ARCH_META[id].winCon, score: count ? archetypeScore(id, raw[id]) : 0 }))
    .sort((x, y) => y.score - x.score);

  const minShare = Math.min(damage.ad, damage.ap);
  const bestPhase = Math.max(phase.early, phase.mid, phase.late);
  const worstPhase = Math.min(phase.early, phase.mid, phase.late);
  // Wyraźny styl usprawiedliwia niektóre braki: poke nie musi wchodzić, split push nie musi grać 5v5.
  const style = (archetypes[0]?.score ?? 0) >= 75 ? archetypes[0].id : null;
  const soft = (ids: ArchetypeId[]) => (style && ids.includes(style) ? 0.5 : 1);

  const parts: ScoreParts = count
    ? {
        front: need(full.front, 2, 5, 12 * soft(["poke", "protect"]), 6),
        engage: need(full.engage, 3, 6, 8 * soft(["poke", "split", "protect"]), 6),
        cc: need(full.cc, 5, 9, 8 * soft(["poke", "split"]), 5),
        peel: need(full.peel, 2, 5, 5 * soft(["dive", "split"]), 4),
        dmg: need(minShare, 0.12, 0.3, 12, 6),
        phase: (bestPhase >= 2.4 ? 4 : 0) + (bestPhase < 2 ? -6 : 0) + (worstPhase < 1.2 ? -3 : 0),
        identity: clamp(((archetypes[0]?.score ?? 0) - 70) * 0.3, -3, 8),
      }
    : { front: 0, engage: 0, cc: 0, peel: 0, dmg: 0, phase: 0, identity: 0 };

  const total = Object.values(parts).reduce((s, v) => s + v, 0);
  const score = count ? clamp(Math.round(48 + total * 0.9), 10, 96) : 0;

  return { champs, count, full, phase, radar, damage, archetypes, parts, score };
}

export interface MatchupEdge {
  value: number; // dodatnie = przewaga niebieskich
  notes: { side: Side; text: string }[];
}

export function matchup(blue: TeamAnalysis, red: TeamAnalysis): MatchupEdge {
  const notes: MatchupEdge["notes"] = [];
  let value = 0;
  if (!blue.count || !red.count) return { value, notes };

  const pair = (us: TeamAnalysis, them: TeamAnalysis, side: Side, sign: number) => {
    if (them.full.engage >= 7 && us.full.peel <= 3) {
      value -= 5 * sign;
      notes.push({ side: side === "blue" ? "red" : "blue", text: "silna inicjacja trafia na skład bez ochrony" });
    }
    if (us.full.poke >= 7 && them.full.engage <= 4) {
      value += 5 * sign;
      notes.push({ side, text: "poke bez kary — rywal nie ma czym wejść w walkę" });
    }
    if (Math.min(them.damage.ad, them.damage.ap) < 0.15 && them.count >= 3) {
      value += 4 * sign;
      notes.push({ side, text: `rywal ma jednolite obrażenia (${them.damage.ad > them.damage.ap ? "AD" : "AP"}) — łatwo się obłożyć` });
    }
    if (us.full.cc >= 10 && them.full.mobility >= 9) {
      value += 2 * sign;
      notes.push({ side, text: "dużo CC na mobilnych przeciwników" });
    }
    if (us.full.split >= 7 && them.full.mobility <= 4) {
      value += 2 * sign;
      notes.push({ side, text: "split push na skład, który wolno reaguje na bocznych liniach" });
    }
  };
  pair(blue, red, "blue", 1);
  pair(red, blue, "red", -1);
  return { value, notes };
}

export interface DraftResult {
  blue: TeamAnalysis;
  red: TeamAnalysis;
  edge: MatchupEdge;
  /** szansa niebieskich na wygraną (0–1), tylko z draftu */
  blueWin: number;
}

export function analyzeDraft(d: Draft): DraftResult {
  const blue = analyzeTeam(d.blue);
  const red = analyzeTeam(d.red);
  const edge = matchup(blue, red);
  let blueWin = 0.5;
  if (blue.count && red.count) {
    const x = blue.score - red.score + edge.value;
    blueWin = clamp(1 / (1 + Math.exp(-x / 28)), 0.25, 0.75);
  }
  return { blue, red, edge, blueWin };
}

// ───────────────────────── krzywa siły ─────────────────────────

/** Siła championa w danej minucie gry (0–3), płynna interpolacja między fazami. */
export function championPower(c: Champion, minute: number) {
  const pts: [number, number][] = [
    [0, c.stats.early],
    [8, c.stats.early],
    [20, c.stats.mid],
    [32, c.stats.late],
    [45, c.stats.late],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (minute <= t1) {
      const t = (minute - t0) / (t1 - t0);
      const s = (1 - Math.cos(Math.PI * t)) / 2;
      return v0 + (v1 - v0) * s;
    }
  }
  return c.stats.late;
}

export function teamCurve(team: TeamAnalysis, minutes = 40) {
  return Array.from({ length: minutes + 1 }, (_, m) =>
    team.count ? team.champs.reduce((s, c) => s + championPower(c, m), 0) / team.count : 0,
  );
}

export interface PowerWindow {
  side: Side;
  from: number;
  to: number;
}

export function powerWindows(blue: number[], red: number[], threshold = 0.2): PowerWindow[] {
  const out: PowerWindow[] = [];
  let cur: PowerWindow | null = null;
  for (let m = 0; m < blue.length; m++) {
    const d = blue[m] - red[m];
    const side: Side | null = d > threshold ? "blue" : d < -threshold ? "red" : null;
    if (side && cur && cur.side === side) cur.to = m;
    else {
      if (cur) out.push(cur);
      cur = side ? { side, from: m, to: m } : null;
    }
  }
  if (cur) out.push(cur);
  return out.filter((w) => w.to - w.from >= 2);
}

// ───────────────────────── wnioski ─────────────────────────

export function teamNotes(us: TeamAnalysis, them: TeamAnalysis): Note[] {
  const n: Note[] = [];
  if (us.count < 2) return n;
  const f = us.full;
  const minShare = Math.min(us.damage.ad, us.damage.ap);
  const heavy = us.damage.ad > us.damage.ap ? "AD" : "AP";

  if (minShare < 0.12 && us.count >= 3)
    n.push({ tone: "bad", title: `Prawie same obrażenia ${heavy}`, text: `Rywal kupi ${heavy === "AD" ? "pancerz" : "odporność na magię"} i wasze obrażenia spadną. Rozważ pick ${heavy === "AD" ? "AP" : "AD"}.` });
  else if (minShare >= 0.3) n.push({ tone: "good", title: "Zbalansowane obrażenia", text: "Mieszanka AD i AP — rywal nie obłoży się jednym typem odporności." });

  if (f.front <= 2 && us.count >= 3) n.push({ tone: "bad", title: "Brak frontline'u", text: "Nikt nie przyjmie obrażeń w walce. Carry będą pierwszym celem." });
  else if (f.front >= 6) n.push({ tone: "good", title: "Solidny frontline", text: "Macie kim przyjmować obrażenia — możecie walczyć długo." });

  if (f.engage <= 3 && us.count >= 3) n.push({ tone: "warn", title: "Słaba inicjacja", text: "Trudno wam będzie zacząć walkę na własnych warunkach. Grajcie na kontrę i poke." });
  else if (f.engage >= 8) n.push({ tone: "good", title: "Mocna inicjacja", text: "Wy decydujecie, kiedy zaczyna się walka." });

  if (f.cc <= 5 && us.count >= 3) n.push({ tone: "warn", title: "Mało kontroli tłumu", text: "Mobilni przeciwnicy będą trudni do złapania." });
  else if (f.cc >= 11) n.push({ tone: "good", title: "Dużo CC", text: "Każdy złapany przeciwnik to praktycznie pewne zabójstwo." });

  if (them.full.engage >= 7 && f.peel <= 3)
    n.push({ tone: "bad", title: "Carry bez ochrony", text: "Rywal ma mocne wejście, a wy nie macie czym go odepchnąć. Rozważ supporta z peelem albo Zhonyę/Stoper." });
  else if (f.peel >= 7) n.push({ tone: "good", title: "Świetny peel", text: "Wasza tylna linia jest dobrze chroniona przed dive'em." });

  if (us.phase.late < 1.7 && them.phase.late - us.phase.late > 0.3)
    n.push({ tone: "warn", title: "Słabsza końcówka", text: "Rywal skaluje lepiej. Celujcie w zakończenie gry przed 30. minutą." });
  if (us.phase.early >= 2.4) n.push({ tone: "good", title: "Agresywny start", text: "Wasz skład jest groźny od pierwszych minut — wykorzystajcie to." });
  if (f.mobility <= 3 && us.count >= 4) n.push({ tone: "warn", title: "Niska mobilność", text: "Łatwo was złapać na rotacji. Pilnujcie wizji." });
  return n;
}

export interface PhasePlan {
  phase: "early" | "mid" | "late";
  label: string;
  range: string;
  state: "ahead" | "even" | "behind";
  text: string;
  objective: string;
}

export function gamePlan(us: TeamAnalysis, them: TeamAnalysis): PhasePlan[] {
  const style = us.archetypes[0]?.id;
  const theirStyle = them.archetypes[0]?.id;
  const st = (d: number): PhasePlan["state"] => (d > 0.25 ? "ahead" : d < -0.25 ? "behind" : "even");

  const e = st(us.phase.early - them.phase.early);
  const m = st(us.phase.mid - them.phase.mid);
  const l = st(us.phase.late - them.phase.late);

  const early: Record<PhasePlan["state"], string> = {
    ahead: "Jesteście silniejsi na starcie. Grajcie agresywnie na liniach, rozważcie inwazję i ganki na linię z najlepszym priorytetem.",
    even: "Wyrównany start. Grajcie bezpiecznie, zbierajcie farmę i reagujcie na ruchy junglera rywala.",
    behind: "Rywal jest silniejszy na początku. Unikajcie wymian, oddawajcie niewygodne obiektywy i farmcie pod wieżą.",
  };
  const mid: Record<PhasePlan["state"], string> = {
    ahead: "Wasze okno mocy. Grupujcie się wcześniej przy smokach i Heroldzie i wymuszajcie walki.",
    even: "Wyrównana faza. O wyniku zdecyduje wizja i przygotowanie obiektywów 30–60 s przed ich pojawieniem się.",
    behind: "Rywal ma przewagę. Wymieniajcie obiektywy po przeciwnej stronie mapy zamiast walczyć w ich warunkach.",
  };
  const late: Record<PhasePlan["state"], string> = {
    ahead: "Skalujecie lepiej. Nie ryzykujcie — każda wyrównana walka po 30. minucie działa na waszą korzyść.",
    even: "Późna gra wyrównana. Jeden błąd przy Baronie może zakończyć mecz — grajcie z wizją i cierpliwie.",
    behind: "Rywal jest groźniejszy w końcówce. Zamieńcie przewagę na wieże i Barona, zanim ich carry dokończą buildy.",
  };

  const styleTip = style ? ` Styl: ${ARCH_META[style].name.toLowerCase()} — ${ARCH_META[style].winCon.charAt(0).toLowerCase()}${ARCH_META[style].winCon.slice(1)}` : "";
  const counterTip = theirStyle ? ` Przeciw ich stylowi (${ARCH_META[theirStyle].name.toLowerCase()}): ${ARCH_META[theirStyle].counter}.` : "";

  return [
    { phase: "early", label: "Wczesna gra", range: "0–14 min", state: e, text: early[e], objective: e === "behind" ? "Larwy Otchłani tylko przy przewadze na mapie" : "Larwy Otchłani i pierwszy smok" },
    { phase: "mid", label: "Środek gry", range: "14–25 min", state: m, text: mid[m] + styleTip, objective: m === "behind" ? "Wymiany obiektywów, wieże po drugiej stronie" : "Smoki, Herold, wieże zewnętrzne" },
    { phase: "late", label: "Końcówka", range: "25+ min", state: l, text: late[l] + counterTip, objective: "Baron, Dusza Smoka, Starszy Smok" },
  ];
}

// ───────────────────────── podpowiedzi picków ─────────────────────────

export interface Suggestion {
  champ: Champion;
  delta: number;
  reasons: string[];
  /** champion z puli gracza (mastery z API Riot) */
  inPool: boolean;
}

/** Pula gracza: ID championa → miejsce w rankingu mastery (0 = najwyżej). */
export type Pool = Record<string, number>;

const PART_REASON: Record<keyof ScoreParts, string> = {
  front: "dodaje frontline",
  engage: "daje inicjację",
  cc: "więcej CC",
  peel: "chroni carry",
  dmg: "balansuje obrażenia",
  phase: "wzmacnia okno mocy",
  identity: "wyostrza styl składu",
};

export function taken(d: Draft) {
  return new Set([...d.blue, ...d.red, ...d.blueBans, ...d.redBans].filter(Boolean) as string[]);
}

export function suggest(d: Draft, side: Side, slot: number, limit = 6, pool?: Pool): Suggestion[] {
  const role: Role = ROLES[slot];
  const used = taken(d);
  const ours = side === "blue" ? d.blue : d.red;
  const enemy = analyzeTeam(side === "blue" ? d.red : d.blue);
  const base = analyzeTeam(ours);
  const sign = side === "blue" ? 1 : -1;
  const baseEdge = enemy.count ? matchup(side === "blue" ? base : enemy, side === "blue" ? enemy : base).value * sign : 0;

  const out: Suggestion[] = [];
  for (const c of CHAMPIONS) {
    if (!c.roles.includes(role) || used.has(c.id)) continue;
    const slots = [...ours];
    slots[slot] = c.id;
    const t = analyzeTeam(slots);
    const edge = enemy.count ? matchup(side === "blue" ? t : enemy, side === "blue" ? enemy : t).value * sign : 0;
    // główna rola championa liczy się trochę bardziej niż poboczna
    const mainRole = c.roles[0] === role ? 1.5 : 0;
    // champion, którego gracz dobrze zna, jest wart więcej niż teoretycznie lepszy pick
    const rank = pool?.[c.id];
    const inPool = rank !== undefined;
    const comfort = !inPool ? 0 : rank < 5 ? 6 : rank < 15 ? 4 : 2;
    const delta = t.score - base.score + (edge - baseEdge) + mainRole + comfort;

    const gains = (Object.keys(t.parts) as (keyof ScoreParts)[])
      .map((k) => [k, t.parts[k] - base.parts[k]] as const)
      .filter(([, v]) => v > 1.2)
      .sort((x, y) => y[1] - x[1])
      .map(([k]) => PART_REASON[k]);
    if (edge - baseEdge >= 2) gains.unshift("dobry na ich skład");
    if (inPool) gains.unshift("twoja pula");
    if (!gains.length) gains.push(strongestTrait(c));
    out.push({ champ: c, delta, reasons: gains.slice(0, inPool ? 3 : 2), inPool });
  }
  return out.sort((x, y) => y.delta - x.delta).slice(0, limit);
}

const TRAIT_LABEL: Partial<Record<StatKey, string>> = {
  late: "silna końcówka",
  early: "mocny start",
  engage: "inicjacja",
  peel: "ochrona",
  cc: "kontrola tłumu",
  poke: "poke",
  front: "wytrzymałość",
  mobility: "mobilność",
  split: "split push",
};

function strongestTrait(c: Champion) {
  const best = (Object.keys(TRAIT_LABEL) as StatKey[]).sort((a, b) => c.stats[b] - c.stats[a])[0];
  return TRAIT_LABEL[best] ?? "pasuje do składu";
}

// ───────────────────────── losowy draft ─────────────────────────

export function randomDraft(rng: () => number = Math.random): Draft {
  const d = emptyDraft();
  const used = new Set<string>();
  const pick = (role: Role) => {
    const pool = CHAMPIONS.filter((c) => c.roles[0] === role && !used.has(c.id));
    const c = pool[Math.floor(rng() * pool.length)];
    used.add(c.id);
    return c.id;
  };
  ROLES.forEach((r, i) => {
    d.blue[i] = pick(r);
    d.red[i] = pick(r);
  });
  return d;
}
