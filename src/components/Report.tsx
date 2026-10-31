import { CheckCircle2, AlertTriangle, XCircle, Swords, Clock, Target, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { ChampIcon } from "./ChampIcon";
import { DamageBar, PowerCurve, Radar } from "./Charts";
import { ROLE_LABEL, ROLES } from "../lib/champs";
import {
  gamePlan,
  powerWindows,
  suggest,
  teamCurve,
  teamNotes,
  type Draft,
  type DraftResult,
  type Note,
  type PhasePlan,
  type Side,
  type TeamAnalysis,
} from "../lib/analysis";

const sideColor = (s: Side) => (s === "blue" ? "var(--blue)" : "var(--red)");
const sideName = (s: Side) => (s === "blue" ? "Niebiescy" : "Czerwoni");

function Section({ eyebrow, title, children, className = "" }: { eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`section rise ${className}`}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mb-4 mt-0.5 text-2xl font-bold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

export function Report({ draft, result, mySide, onPick }: { draft: Draft; result: DraftResult; mySide: Side; onPick: (slot: number, id: string) => void }) {
  const { blue, red } = result;
  const me = mySide === "blue" ? blue : red;
  const them = mySide === "blue" ? red : blue;
  const bothStarted = blue.count > 0 && red.count > 0;
  const curveB = teamCurve(blue);
  const curveR = teamCurve(red);

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      <Forecast result={result} mySide={mySide} className="lg:col-span-2" />

      <Section eyebrow="Kiedy kto jest silniejszy" title="Krzywa siły" className="lg:col-span-2">
        {bothStarted ? (
          <PowerCurve blue={curveB} red={curveR} windows={powerWindows(curveB, curveR)} />
        ) : (
          <Empty>Wybierz przynajmniej jednego championa po każdej stronie, aby porównać siłę w czasie.</Empty>
        )}
      </Section>

      <Section eyebrow="Plan dla twojej drużyny" title="Plan gry" className="lg:col-span-2">
        {bothStarted ? <Plan plan={gamePlan(me, them)} /> : <Empty>Plan pojawi się, gdy obie drużyny będą miały picki.</Empty>}
      </Section>

      <Section eyebrow="Cechy składów" title="Profil drużyn">
        <Radar blue={blue} red={red} />
        <Legend />
      </Section>

      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <Section eyebrow="Typ obrażeń" title="AD kontra AP">
          <div className="flex flex-col gap-4">
            <DamageBar team={blue} color="var(--blue)" label="Niebiescy" />
            <DamageBar team={red} color="var(--red)" label="Czerwoni" />
          </div>
        </Section>
        <Section eyebrow="Tożsamość składu" title="Styl gry">
          <div className="grid gap-4 sm:grid-cols-2">
            <Style team={blue} side="blue" />
            <Style team={red} side="red" />
          </div>
        </Section>
      </div>

      <Section eyebrow="Atuty i zagrożenia" title="Wnioski" className="lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          <Notes side="blue" notes={teamNotes(blue, red)} />
          <Notes side="red" notes={teamNotes(red, blue)} />
        </div>
      </Section>

      <NextPick draft={draft} side={mySide} onPick={onPick} />
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">{children}</p>;
}

function Legend() {
  return (
    <div className="mt-2 flex justify-center gap-4 font-label text-sm font-bold">
      <span className="flex items-center gap-1.5 text-blue">
        <i className="h-2.5 w-2.5 rounded-full bg-blue" /> Niebiescy
      </span>
      <span className="flex items-center gap-1.5 text-red">
        <i className="h-2.5 w-2.5 rounded-full bg-red" /> Czerwoni
      </span>
    </div>
  );
}

function Forecast({ result, mySide, className }: { result: DraftResult; mySide: Side; className?: string }) {
  const b = Math.round(result.blueWin * 100);
  const r = 100 - b;
  const ready = result.blue.count > 0 && result.red.count > 0;
  const partial = result.blue.count < 5 || result.red.count < 5;
  const myPct = mySide === "blue" ? b : r;
  const verdict = !ready ? "Czekam na picki" : myPct >= 56 ? "Draft po waszej stronie" : myPct <= 44 ? "Draft po stronie rywala" : "Wyrównany draft";

  return (
    <section className={`section rise ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <div className="eyebrow">Prognoza z samego draftu</div>
          <h2 className="mt-0.5 text-3xl font-bold uppercase tracking-wide sm:text-4xl">{verdict}</h2>
        </div>
        {ready && partial && <span className="font-label text-sm font-semibold text-warn">Niepełne składy — wynik się zmieni</span>}
      </div>

      <div className="mt-4 flex items-end justify-between font-display font-bold leading-none num">
        <span className="text-5xl sm:text-6xl" style={{ color: "var(--blue)" }}>
          {ready ? b : "–"}
          <span className="text-2xl">%</span>
        </span>
        <span className="pb-1 font-label text-sm uppercase tracking-[0.2em] text-muted">szansa na wygraną</span>
        <span className="text-5xl sm:text-6xl" style={{ color: "var(--red)" }}>
          {ready ? r : "–"}
          <span className="text-2xl">%</span>
        </span>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-panel-2">
        <div className="transition-[width] duration-500" style={{ width: `${ready ? b : 50}%`, background: "var(--blue)" }} />
        <div className="w-[3px] bg-ink" />
        <div className="flex-1" style={{ background: "var(--red)" }} />
      </div>

      {result.edge.notes.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {result.edge.notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Swords size={15} className="mt-0.5 shrink-0" style={{ color: sideColor(n.side) }} />
              <span>
                <b className="font-label font-bold" style={{ color: sideColor(n.side) }}>
                  {sideName(n.side)}:
                </b>{" "}
                {n.text}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">
        Draft to tylko część meczu. Ocena bazuje na cechach championów, nie na umiejętnościach graczy — limit to 25–75%.
      </p>
    </section>
  );
}

const STATE_CHIP: Record<PhasePlan["state"], { label: string; color: string }> = {
  ahead: { label: "Przewaga", color: "var(--good)" },
  even: { label: "Wyrównanie", color: "var(--gold)" },
  behind: { label: "Rywal silniejszy", color: "var(--bad)" },
};

function Plan({ plan }: { plan: PhasePlan[] }) {
  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {plan.map((p) => {
        const chip = STATE_CHIP[p.state];
        return (
          <li key={p.phase} className="flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-ink/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-display text-xl font-bold uppercase leading-none">{p.label}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted num">
                  <Clock size={12} /> {p.range}
                </div>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 font-label text-xs font-bold uppercase tracking-wider" style={{ color: chip.color, background: `color-mix(in srgb, ${chip.color} 15%, transparent)` }}>
                {chip.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text/90">{p.text}</p>
            <div className="mt-auto flex items-start gap-1.5 border-t border-line pt-2 text-xs text-gold">
              <Target size={13} className="mt-px shrink-0" /> {p.objective}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Style({ team, side }: { team: TeamAnalysis; side: Side }) {
  if (!team.count) return <Empty>Brak picków.</Empty>;
  const top = team.archetypes.slice(0, 3);
  const max = top[0].score || 1;
  return (
    <div className="min-w-0">
      <div className="font-label text-sm font-bold" style={{ color: sideColor(side) }}>
        {sideName(side)}
      </div>
      <div className="font-display text-2xl font-bold uppercase leading-tight">{top[0].name}</div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {top.map((a) => (
          <li key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-x-2 text-xs">
            <span className="truncate text-muted">{a.name}</span>
            <span className="num text-muted">{a.score}</span>
            <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
              <span className="block h-full rounded-full" style={{ width: `${(a.score / max) * 100}%`, background: sideColor(side) }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-text/80">{top[0].winCon}</p>
    </div>
  );
}

const TONE = {
  good: { Icon: CheckCircle2, color: "var(--good)" },
  warn: { Icon: AlertTriangle, color: "var(--warn)" },
  bad: { Icon: XCircle, color: "var(--bad)" },
};

function Notes({ side, notes }: { side: Side; notes: Note[] }) {
  const order = { bad: 0, warn: 1, good: 2 };
  const sorted = [...notes].sort((a, b) => order[a.tone] - order[b.tone]);
  return (
    <div className="min-w-0">
      <div className="mb-2 font-label text-sm font-bold" style={{ color: sideColor(side) }}>
        {sideName(side)}
      </div>
      {sorted.length === 0 ? (
        <Empty>Za mało picków, żeby ocenić skład.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((n, i) => {
            const { Icon, color } = TONE[n.tone];
            return (
              <li key={i} className="flex gap-2.5 rounded-lg border border-line bg-ink/40 p-3" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
                <Icon size={17} className="mt-0.5 shrink-0" style={{ color }} />
                <div className="min-w-0">
                  <div className="font-label font-bold">{n.title}</div>
                  <div className="text-sm text-text/80">{n.text}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NextPick({ draft, side, onPick }: { draft: Draft; side: Side; onPick: (slot: number, id: string) => void }) {
  const slots = draft[side];
  const slot = slots.findIndex((s) => !s);
  return (
    <section className="section rise lg:col-span-2">
      <div className="eyebrow flex items-center gap-1.5 !text-gold">
        <Sparkles size={13} /> Podpowiedź
      </div>
      <h2 className="mb-4 mt-0.5 text-2xl font-bold uppercase tracking-wide">
        {slot === -1 ? "Skład kompletny" : `Następny pick: ${ROLE_LABEL[ROLES[slot]]}`}
      </h2>
      {slot === -1 ? (
        <p className="text-sm text-muted">Usuń championa z dowolnego slotu twojej drużyny, aby zobaczyć alternatywy dopasowane do reszty draftu.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {suggest(draft, side, slot).map((s, i) => (
            <button
              key={s.champ.id}
              onClick={() => onPick(slot, s.champ.id)}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-ink/40 p-2.5 text-left transition-colors hover:border-gold"
            >
              <span className="w-4 text-center font-display text-lg font-bold text-muted num">{i + 1}</span>
              <ChampIcon id={s.champ.id} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-label text-base font-bold">{s.champ.name}</span>
                <span className="block truncate text-xs text-muted">{s.reasons.join(" · ")}</span>
              </span>
              <span className="font-display text-lg font-bold num" style={{ color: s.delta >= 0 ? "var(--good)" : "var(--muted)" }}>
                {s.delta >= 0 ? "+" : ""}
                {Math.round(s.delta)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
