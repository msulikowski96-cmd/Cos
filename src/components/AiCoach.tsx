import { useState } from "react";
import { Bot, RefreshCw, Shield, Swords, Timer, Zap, Crosshair } from "lucide-react";
import { fetchCoach, type CoachProgress, type CoachResponse } from "../lib/api";
import { encodeDraft } from "../lib/share";
import type { Draft, Side } from "../lib/analysis";

interface Props {
  draft: Draft;
  mySide: Side;
  myChampion: string | null;
}

export function AiCoach({ draft, mySide, myChampion }: Props) {
  const [result, setResult] = useState<(CoachResponse & { key: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<CoachProgress | null>(null);

  const key = `${encodeDraft(draft)}|${mySide}|${myChampion ?? ""}`;
  const ready = draft.blue.filter(Boolean).length >= 3 && draft.red.filter(Boolean).length >= 3;
  const stale = result && result.key !== key;

  const run = async () => {
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      const r = await fetchCoach(draft, mySide, myChampion, setProgress);
      setResult({ ...r, key });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const rep = result?.report;

  return (
    <section className="section rise lg:col-span-2" style={{ borderColor: "color-mix(in srgb, var(--gold) 45%, var(--line))" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow flex items-center gap-1.5 !text-gold">
            <Bot size={13} /> Trener AI
          </div>
          <h2 className="mt-0.5 text-2xl font-bold uppercase tracking-wide">Analiza trenera</h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted">
            Model AI czyta draft i wyniki algorytmu, a potem rozpisuje każdy matchup, największe zagrożenia i plan na walki.
          </p>
        </div>
        <button className="btn btn-gold" onClick={run} disabled={busy || !ready}>
          {busy ? <RefreshCw size={15} className="animate-spin" /> : <Bot size={15} />}
          {busy ? "Analizuję…" : rep ? (stale ? "Analizuj nowy draft" : "Analizuj ponownie") : "Analizuj z AI"}
        </button>
      </div>

      {!ready && <p className="mt-3 text-sm text-muted">Wybierz co najmniej 3 championów w każdej drużynie.</p>}
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      {busy && <ProgressBar progress={progress} />}

      {rep && (
        <div className={`mt-4 flex flex-col gap-4 transition-opacity ${stale || busy ? "opacity-50" : ""}`}>
          {stale && <p className="font-label text-sm font-bold text-warn">Draft się zmienił — ta analiza dotyczy poprzedniego składu.</p>}

          <div className="rounded-xl border border-gold/40 bg-gold-soft p-4">
            <p className="text-[0.95rem] leading-relaxed">{rep.summary}</p>
            {rep.winCondition && (
              <p className="mt-2 flex gap-2 text-sm leading-relaxed text-gold">
                <Crosshair size={16} className="mt-0.5 shrink-0" /> <span>{rep.winCondition}</span>
              </p>
            )}
          </div>

          {rep.lanes.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Linia po linii</div>
              <ul className="grid gap-2 md:grid-cols-2">
                {rep.lanes.map((l) => (
                  <li key={l.role} className="min-w-0 rounded-xl border border-line bg-ink/40 p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="eyebrow">{l.role}</span>
                      <span className="font-label text-sm font-bold">
                        <span style={{ color: `var(--${mySide})` }}>{l.ally}</span>
                        <span className="text-muted"> vs </span>
                        <span style={{ color: `var(--${mySide === "blue" ? "red" : "blue"})` }}>{l.enemy}</span>
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-text/85">{l.tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {rep.threats.length > 0 && (
              <div className="min-w-0">
                <div className="eyebrow mb-2">Największe zagrożenia</div>
                <ul className="flex flex-col gap-2">
                  {rep.threats.map((t) => (
                    <li key={t.champion} className="flex gap-2.5 rounded-lg border border-line bg-ink/40 p-3" style={{ borderLeftColor: "var(--bad)", borderLeftWidth: 3 }}>
                      <Shield size={16} className="mt-0.5 shrink-0 text-bad" />
                      <div className="min-w-0">
                        <div className="font-label font-bold">{t.champion}</div>
                        <div className="text-sm text-text/80">{t.answer}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-2">
              <Block icon={<Timer size={15} />} title="Pierwsze minuty" text={rep.firstMinutes} />
              <Block icon={<Swords size={15} />} title="Walki drużynowe" text={rep.teamfight} />
              <Block icon={<Zap size={15} />} title="Power spike'i" text={rep.powerSpikes} />
            </div>
          </div>

          <p className="text-xs text-muted">
            Wygenerowane przez model AI ({result.model}){result.cached ? " · z pamięci podręcznej" : ""}. Traktuj to jak radę kolegi z drużyny — może się mylić.
          </p>
        </div>
      )}
    </section>
  );
}

function Block({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg border border-line bg-ink/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 font-label font-bold text-gold">
        {icon} {title}
      </div>
      <p className="text-sm leading-relaxed text-text/85">{text}</p>
    </div>
  );
}

function ProgressBar({ progress }: { progress: CoachProgress | null }) {
  // Myślenie modelu to umowne pierwsze 35% paska, pisanie odpowiedzi — reszta.
  const pct = !progress
    ? 4
    : progress.phase === "thinking"
      ? Math.min(35, 5 + (progress.chars / progress.expected) * 30)
      : Math.min(97, 35 + (progress.chars / progress.expected) * 62);
  const label = !progress ? "Łączę z modelem AI…" : progress.phase === "thinking" ? "Trener analizuje draft…" : "Trener spisuje porady…";
  return (
    <div className="mt-4" role="status" aria-live="polite">
      <div className="mb-1.5 flex justify-between font-label text-sm font-bold">
        <span className="text-gold">{label}</span>
        <span className="text-muted num">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">Pełna analiza zajmuje zwykle około 1–1,5 minuty (duży model na darmowym API).</p>
    </div>
  );
}
