import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { ChampIcon } from "./ChampIcon";
import { CHAMPIONS, ROLES, ROLE_LABEL, type Role } from "../lib/champs";
import { suggest, taken, type Draft, type Pool } from "../lib/analysis";
import type { SlotRef } from "./DraftBoard";

interface Props {
  draft: Draft;
  target: SlotRef;
  onPick: (id: string) => void;
  onClose: () => void;
  pool?: Pool;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export function ChampionPicker({ draft, target, onPick, onClose, pool }: Props) {
  const isBan = target.kind === "ban";
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "all">(isBan ? "all" : ROLES[target.index]);
  const input = useRef<HTMLInputElement>(null);
  const used = useMemo(() => taken(draft), [draft]);
  const current = (target.kind === "pick" ? draft[target.side] : target.side === "blue" ? draft.blueBans : draft.redBans)[target.index];

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const tips = useMemo(() => {
    if (isBan) return [];
    const d = structuredClone(draft);
    d[target.side][target.index] = null; // podpowiedzi liczone tak, jakby slot był pusty
    return suggest(d, target.side, target.index, 4, pool);
  }, [draft, target, isBan, pool]);

  const list = useMemo(() => {
    const q = norm(query);
    return CHAMPIONS.filter((c) => (q ? norm(c.name).includes(q) || norm(c.id).includes(q) : role === "all" || c.roles.includes(role)));
  }, [query, role]);

  const title = isBan ? "Zbanuj championa" : `${ROLE_LABEL[ROLES[target.index]]} · ${target.side === "blue" ? "niebiescy" : "czerwoni"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="Zamknij" onClick={onClose} />
      <div
        className="rise relative flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-2xl border border-line bg-panel sm:rounded-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="gutter flex items-center justify-between gap-3 border-b border-line pb-3 pt-4">
          <h2 className="text-xl font-bold uppercase tracking-wide">{title}</h2>
          <button className="btn !p-2" onClick={onClose} aria-label="Zamknij">
            <X size={16} />
          </button>
        </div>

        <div className="gutter flex flex-col gap-3 pt-3">
          {tips.length > 0 && (
            <div>
              <div className="eyebrow mb-1.5 flex items-center gap-1.5 !text-gold">
                <Sparkles size={13} /> Najlepiej pasują do składu
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {tips.map((t) => (
                  <button
                    key={t.champ.id}
                    onClick={() => onPick(t.champ.id)}
                    className="flex min-w-0 items-center gap-2 rounded-[10px] border border-gold/40 bg-gold-soft p-1.5 text-left hover:border-gold"
                  >
                    <ChampIcon id={t.champ.id} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate font-label text-sm font-bold">{t.champ.name}</span>
                      <span className="block truncate text-[0.7rem] text-muted">{t.reasons.join(" · ")}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 rounded-[10px] border border-line bg-ink/60 px-3 py-2 focus-within:border-gold">
            <Search size={16} className="text-muted" aria-hidden />
            <input
              id="champ-search"
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj championa…"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted"
              autoComplete="off"
            />
          </label>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["all", ...ROLES] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setQuery("");
                }}
                className={`btn shrink-0 !px-3 !py-1.5 !text-xs ${role === r && !query ? "!border-gold !text-gold" : ""}`}
              >
                {r === "all" ? "Wszyscy" : ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="gutter mt-2 overflow-y-auto pb-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}>
            {list.map((c) => {
              const disabled = used.has(c.id) && c.id !== current;
              return (
                <button
                  key={c.id}
                  disabled={disabled}
                  onClick={() => onPick(c.id)}
                  className="flex min-w-0 flex-col items-center gap-1 rounded-lg p-1 hover:bg-panel-2 disabled:cursor-not-allowed"
                  title={c.name}
                >
                  <ChampIcon id={c.id} size={52} dim={disabled} />
                  <span className={`w-full truncate text-center text-[0.68rem] ${disabled ? "text-muted/50" : "text-muted"}`}>{c.name}</span>
                </button>
              );
            })}
          </div>
          {list.length === 0 && <p className="py-8 text-center text-muted">Nie znaleziono championa „{query}”.</p>}
        </div>
      </div>
    </div>
  );
}
