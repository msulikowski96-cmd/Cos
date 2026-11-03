import { CHAMP_BY_ID, ROLES, ROLE_LABEL, type Stats } from "./champs";
import { analyzeDraft, gamePlan, teamNotes, type Draft, type Side } from "./analysis";

/** Raport trenera AI — kształt, który zwraca serwer i rysuje interfejs. */
export interface CoachReport {
  summary: string;
  winCondition: string;
  lanes: { role: string; ally: string; enemy: string; tip: string }[];
  threats: { champion: string; answer: string }[];
  teamfight: string;
  powerSpikes: string;
  firstMinutes: string;
}

const name = (id: string | null) => (id ? (CHAMP_BY_ID[id]?.name ?? id) : "—");

const PHASE = ["słaby", "przeciętny", "mocny", "bardzo mocny"];
const TRAITS: [keyof Stats, string][] = [
  ["engage", "inicjacja"],
  ["peel", "ochrona"],
  ["cc", "kontrola tłumu"],
  ["poke", "poke"],
  ["front", "wytrzymałość"],
  ["mobility", "mobilność"],
  ["split", "split push"],
];

/** Fakty o championie z bazy ocen — kotwica, żeby model nie wymyślał (np. „Ahri bez mobilności”). */
export function champFacts(id: string) {
  const c = CHAMP_BY_ID[id];
  if (!c) return "";
  const s = c.stats;
  const strong = TRAITS.filter(([k]) => s[k] >= 2).map(([k, l]) => `${l} ${s[k]}/3`);
  const weak = TRAITS.filter(([k]) => s[k] === 0).map(([, l]) => l);
  return `${c.name} (${c.dmg}): early ${PHASE[s.early]}, mid ${PHASE[s.mid]}, late ${PHASE[s.late]}; mocne: ${strong.join(", ") || "brak wyróżników"}${weak.length ? `; brak: ${weak.join(", ")}` : ""}`;
}

export function coachPrompt(d: Draft, mySide: Side, myChampion?: string | null) {
  const r = analyzeDraft(d);
  const me = mySide === "blue" ? r.blue : r.red;
  const them = mySide === "blue" ? r.red : r.blue;
  const ours = d[mySide];
  const theirs = d[mySide === "blue" ? "red" : "blue"];
  const win = Math.round((mySide === "blue" ? r.blueWin : 1 - r.blueWin) * 100);

  const lanes = ROLES.map((role, i) => `- ${ROLE_LABEL[role]}: ${name(ours[i])} vs ${name(theirs[i])}`).join("\n");
  const notes = (t: typeof me, o: typeof me) => teamNotes(t, o).map((n) => `${n.title}`).join("; ") || "brak";
  const plan = gamePlan(me, them).map((p) => `${p.label}: ${p.state === "ahead" ? "przewaga" : p.state === "behind" ? "rywal silniejszy" : "wyrównanie"}`).join(", ");

  const system = `Jesteś doświadczonym trenerem League of Legends (poziom Challenger, analityk drużyn zawodowych).
Piszesz po polsku, konkretnie i praktycznie, językiem graczy (np. "all-in", "wave management", "peel", "split push").
Analizujesz WYŁĄCZNIE draft, który dostajesz. Nie wymyślaj statystyk, procentów ani nazw przedmiotów, których nie jesteś pewien.
Opisuj umiejętność championa tylko wtedy, gdy jesteś pewien, jak działa — w przeciwnym razie pisz o pozycjonowaniu, timingach, falach minionów i celach na mapie.
Nie używaj liter klawiszy (Q/W/E/R), jeśli nie masz pewności, która umiejętność to która — pisz wtedy "ultimate", "doskok", "tarcza" itp.
Poziomy zapisuj jako "lvl 6", minuty jako "10. minuta". Profile championów w danych są sprawdzone — nie przeczy im.
Odpowiadasz wyłącznie poprawnym JSON-em, bez komentarzy i bez bloków kodu.`;

  const user = `Draft (moja drużyna to ${mySide === "blue" ? "niebiescy" : "czerwoni"}${myChampion ? `, gram ${name(myChampion)}` : ""}):
MOJA DRUŻYNA: ${ours.filter(Boolean).map(name).join(", ")}
PRZECIWNICY: ${theirs.filter(Boolean).map(name).join(", ")}
Uwaga: "chroń", "peeluj", "graj wokół" dotyczy tylko championów z MOJEJ DRUŻYNY; "threats" to wyłącznie PRZECIWNICY.

Linia po linii (mój champion vs przeciwnik):
${lanes}
Profile championów (skala 0–3, z bazy Nexus Draft):
${ours.filter(Boolean).map((id) => `- [MOJA DRUŻYNA] ${champFacts(id as string)}`).join("\n")}
${theirs.filter(Boolean).map((id) => `- [PRZECIWNIK] ${champFacts(id as string)}`).join("\n")}

Bany: ${[...d.blueBans, ...d.redBans].filter(Boolean).map(name).join(", ") || "brak"}

Wyniki algorytmu (traktuj jako wskazówkę):
- Szansa mojej drużyny z samego draftu: ${win}%
- Styl mojej drużyny: ${me.archetypes[0]?.name ?? "?"}; styl rywala: ${them.archetypes[0]?.name ?? "?"}
- Obrażenia: my ${Math.round(me.damage.ad * 100)}% AD / ${Math.round(me.damage.ap * 100)}% AP, rywal ${Math.round(them.damage.ad * 100)}% AD / ${Math.round(them.damage.ap * 100)}% AP
- Fazy gry (my względem rywala): ${plan}
- Nasze cechy: ${notes(me, them)}
- Cechy rywala: ${notes(them, me)}

Zwróć JSON o dokładnie takim kształcie:
{
  "summary": "2–3 zdania: kto ma lepszy draft i dlaczego",
  "winCondition": "1–2 zdania: jak moja drużyna wygrywa ten mecz",
  "lanes": [{"role": "Top", "tip": "jak grać ten matchup: kiedy wymieniać, czego się bać, kiedy jest power spike"}],
  "threats": [{"champion": "nazwa championa rywala", "answer": "jak go neutralizować (pozycjonowanie, cel w walce, ewentualnie typ przedmiotu)"}],
  "teamfight": "2–3 zdania: jak ustawić się i kogo bić w walce drużynowej",
  "powerSpikes": "1–2 zdania: kluczowe momenty siły obu drużyn",
  "firstMinutes": "1–2 zdania: plan na pierwsze 3–5 minut (inwazja, ścieżka junglera, priorytet linii)"
}
"lanes" ma mieć 5 elementów (Top, Jungle, Mid, ADC, Support) — dla Jungle i Support opisz rywalizację w dżungli i na dolnej linii. "threats" — 2 lub 3 najgroźniejszych championów rywala.`;

  return { system, user };
}

/** Wyciąga pierwszy obiekt JSON z odpowiedzi modelu (bywa owinięty w ```json albo tekst „myślenia”). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```(?:json)?/g, "");
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("Brak JSON w odpowiedzi modelu");
  let depth = 0;
  let inStr = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
  }
  throw new Error("Niedomknięty JSON w odpowiedzi modelu");
}

/** Tekst z odpowiedzi modelu, przycięty na końcu zdania albo słowa, gdy jest za długi. */
const str = (v: unknown, max = 1000) => {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentence = cut.lastIndexOf(". ");
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]$/, "") + "…";
};

/** Sprawdza i porządkuje odpowiedź modelu — interfejs dostaje zawsze ten sam kształt. */
export function normalizeReport(raw: unknown, d: Draft, mySide: Side): CoachReport {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ours = d[mySide];
  const theirs = d[mySide === "blue" ? "red" : "blue"];
  const rawLanes = Array.isArray(o.lanes) ? (o.lanes as Record<string, unknown>[]) : [];

  const roleOf = (l: Record<string, unknown>) => {
    const r = str(l?.role).toLowerCase();
    return ROLES.find((role) => r.startsWith(ROLE_LABEL[role].toLowerCase().slice(0, 3)));
  };
  // Dopasowanie po nazwie roli; po kolejności tylko wtedy, gdy model w ogóle nie podał ról.
  const byName = rawLanes.some((l) => roleOf(l));

  const lanes = ROLES.map((role, i) => {
    const label = ROLE_LABEL[role];
    const match = byName ? rawLanes.find((l) => roleOf(l) === role) : rawLanes[i];
    return { role: label, ally: name(ours[i]), enemy: name(theirs[i]), tip: str(match?.tip, 800) };
  }).filter((l) => l.tip);

  const threats = (Array.isArray(o.threats) ? (o.threats as Record<string, unknown>[]) : [])
    .map((t) => ({ champion: str(t?.champion, 40), answer: str(t?.answer, 600) }))
    .filter((t) => t.champion && t.answer)
    .slice(0, 3);

  const report: CoachReport = {
    summary: str(o.summary),
    winCondition: str(o.winCondition),
    lanes,
    threats,
    teamfight: str(o.teamfight),
    powerSpikes: str(o.powerSpikes),
    firstMinutes: str(o.firstMinutes),
  };
  if (!report.summary && !lanes.length) throw new Error("Model zwrócił pustą analizę");
  return report;
}
