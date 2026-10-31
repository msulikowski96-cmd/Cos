import { useCallback, useEffect, useMemo, useState } from "react";
import { Dices, Eraser, Link2, ArrowLeftRight, Check } from "lucide-react";
import { DraftBoard, type SlotRef } from "./components/DraftBoard";
import { ChampionPicker } from "./components/ChampionPicker";
import { Report } from "./components/Report";
import { analyzeDraft, emptyDraft, randomDraft, type Draft, type Side } from "./lib/analysis";
import { decodeDraft, encodeDraft } from "./lib/share";
import { DDRAGON_VERSION } from "./lib/champs";

const SAMPLE: Draft = {
  blue: ["KSante", "Vi", "Orianna", "Jinx", "Lulu"],
  red: ["Renekton", "LeeSin", "Ahri", "Kalista", "Nautilus"],
  blueBans: ["Yone", "Skarner", "Zed", null, null],
  redBans: ["Ambessa", "Aurora", "Smolder", null, null],
};

function readSide(): Side {
  try {
    return localStorage.getItem("nd-side") === "red" ? "red" : "blue";
  } catch {
    return "blue";
  }
}

export default function App() {
  const initial = useMemo(() => decodeDraft(location.hash), []);
  const [draft, setDraft] = useState<Draft>(initial ?? SAMPLE);
  const [isSample, setIsSample] = useState(!initial);
  const [mySide, setMySide] = useState<Side>(readSide);
  const [picking, setPicking] = useState<SlotRef | null>(null);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => analyzeDraft(draft), [draft]);

  // Draft trafia do adresu, więc link zawsze pokazuje aktualny skład.
  useEffect(() => {
    if (isSample) return;
    const h = "#" + encodeDraft(draft);
    if (location.hash !== h) history.replaceState(null, "", h);
  }, [draft, isSample]);

  useEffect(() => {
    const onHash = () => {
      const d = decodeDraft(location.hash);
      if (d) {
        setDraft(d);
        setIsSample(false);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("nd-side", mySide);
    } catch {
      /* brak dostępu do pamięci — trudno */
    }
  }, [mySide]);

  const update = (fn: (d: Draft) => void) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setIsSample(false);
  };

  const setSlot = (ref: SlotRef, id: string | null) =>
    update((d) => {
      const arr = ref.kind === "pick" ? d[ref.side] : ref.side === "blue" ? d.blueBans : d.redBans;
      arr[ref.index] = id;
    });

  const closePicker = useCallback(() => setPicking(null), []);

  const copyLink = async () => {
    const url = location.href.split("#")[0] + "#" + encodeDraft(draft);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt?.("Skopiuj link do draftu:", url);
    }
  };

  return (
    <div className="gutter mx-auto flex min-h-full max-w-6xl flex-col gap-4 pb-10 pt-4 sm:gap-5 sm:pt-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="eyebrow !text-gold">Analizator draftu · League of Legends</div>
          <h1 className="font-display text-[2.6rem] font-extrabold uppercase leading-[0.9] tracking-wide sm:text-6xl">
            Nexus <span className="text-gold">Draft</span>
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm text-muted">
            Ułóż oba składy, a pokażemy, kto wygrywa w której fazie gry, czego wam brakuje i kogo wybrać następnego.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => update((d) => Object.assign(d, randomDraft()))}>
            <Dices size={15} /> Losuj
          </button>
          <button
            className="btn"
            onClick={() =>
              update((d) => {
                [d.blue, d.red] = [d.red, d.blue];
                [d.blueBans, d.redBans] = [d.redBans, d.blueBans];
              })
            }
          >
            <ArrowLeftRight size={15} /> Zamień
          </button>
          <button className="btn" onClick={() => update((d) => Object.assign(d, emptyDraft()))}>
            <Eraser size={15} /> Wyczyść
          </button>
          <button className="btn btn-gold" onClick={copyLink}>
            {copied ? <Check size={15} /> : <Link2 size={15} />} {copied ? "Skopiowano" : "Udostępnij"}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Twoja strona">
          <span className="eyebrow">Gram po</span>
          {(["blue", "red"] as const).map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={mySide === s}
              onClick={() => setMySide(s)}
              className="btn !px-3 !py-1.5 !text-xs"
              style={mySide === s ? { borderColor: `var(--${s})`, color: `var(--${s})`, background: `var(--${s}-soft)` } : undefined}
            >
              {s === "blue" ? "Niebieskiej" : "Czerwonej"}
            </button>
          ))}
        </div>
        {isSample && (
          <span className="rounded-full border border-gold/50 bg-gold-soft px-3 py-1 font-label text-xs font-bold uppercase tracking-wider text-gold">
            Przykładowy draft — kliknij slot, aby zmienić
          </span>
        )}
      </div>

      <DraftBoard draft={draft} blue={result.blue} red={result.red} mySide={mySide} onOpen={setPicking} onClear={(ref) => setSlot(ref, null)} />

      <Report draft={draft} result={result} mySide={mySide} onPick={(slot, id) => setSlot({ side: mySide, kind: "pick", index: slot }, id)} />

      <footer className="mt-2 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        Nexus Draft · dane championów z Data Dragon (patch <span className="num">{DDRAGON_VERSION}</span>) · oceny cech championów są autorskie i orientacyjne.
        <br />
        Nexus Draft nie jest powiązany z Riot Games. League of Legends jest znakiem towarowym Riot Games, Inc.
      </footer>

      {picking && (
        <ChampionPicker
          draft={draft}
          target={picking}
          onClose={closePicker}
          onPick={(id) => {
            setSlot(picking, id);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}
