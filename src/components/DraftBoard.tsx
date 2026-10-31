import { X, Plus, Ban } from "lucide-react";
import { ChampIcon } from "./ChampIcon";
import { CHAMP_BY_ID, ROLES, ROLE_LABEL } from "../lib/champs";
import type { Draft, Side, TeamAnalysis } from "../lib/analysis";

export interface SlotRef {
  side: Side;
  kind: "pick" | "ban";
  index: number;
}

interface Props {
  draft: Draft;
  blue: TeamAnalysis;
  red: TeamAnalysis;
  mySide: Side;
  onOpen: (ref: SlotRef) => void;
  onClear: (ref: SlotRef) => void;
  myChampion?: string | null;
}

const SIDE_NAME: Record<Side, string> = { blue: "Niebiescy", red: "Czerwoni" };

export function DraftBoard({ draft, blue, red, mySide, onOpen, onClear, myChampion }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      <TeamColumn side="blue" draft={draft} team={blue} mine={mySide === "blue"} onOpen={onOpen} onClear={onClear} me={mySide === "blue" ? myChampion : null} />
      <TeamColumn side="red" draft={draft} team={red} mine={mySide === "red"} onOpen={onOpen} onClear={onClear} me={mySide === "red" ? myChampion : null} />
    </div>
  );
}

function TeamColumn({
  side,
  draft,
  team,
  mine,
  onOpen,
  onClear,
  me,
}: {
  me?: string | null;
  side: Side;
  draft: Draft;
  team: TeamAnalysis;
  mine: boolean;
  onOpen: Props["onOpen"];
  onClear: Props["onClear"];
}) {
  const picks = side === "blue" ? draft.blue : draft.red;
  const bans = side === "blue" ? draft.blueBans : draft.redBans;
  const color = side === "blue" ? "var(--blue)" : "var(--red)";
  const mirrored = side === "red";

  return (
    <div
      className="min-w-0 rounded-[14px] border p-2 sm:p-3"
      style={{ borderColor: `color-mix(in srgb, ${color} 35%, var(--line))`, background: `linear-gradient(180deg, color-mix(in srgb, ${color} 9%, var(--panel)), var(--panel))` }}
    >
      <div className={`mb-2 flex items-end justify-between gap-2 ${mirrored ? "flex-row-reverse text-right" : ""}`}>
        <div className="min-w-0">
          <div className="eyebrow truncate" style={{ color }}>
            {SIDE_NAME[side]}
          </div>
          <div className="font-label text-xs font-semibold text-muted">{mine ? "Twoja drużyna" : "Przeciwnicy"}</div>
        </div>
        <div className={mirrored ? "text-left" : "text-right"}>
          <div className="font-display text-2xl font-bold leading-none num sm:text-3xl" style={{ color }}>
            {team.count ? team.score : "–"}
          </div>
          <div className="eyebrow !text-[0.6rem]">ocena składu</div>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {ROLES.map((role, i) => {
          const id = picks[i];
          const ref: SlotRef = { side, kind: "pick", index: i };
          return (
            <li key={role} className={`group relative flex items-center gap-2 ${mirrored ? "flex-row-reverse" : ""}`}>
              <button
                id={`slot-${side}-${i}`}
                onClick={() => onOpen(ref)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border bg-ink/40 p-1.5 transition-colors hover:border-gold ${id && id === me ? "border-gold" : "border-line"} ${mirrored ? "flex-row-reverse text-right" : "text-left"}`}
              >
                {id ? (
                  <ChampIcon id={id} size={40} />
                ) : (
                  <span className="hex-frame grid h-10 w-10 min-w-10 place-items-center bg-panel-2 text-muted">
                    <Plus size={18} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="eyebrow block !text-[0.62rem]">
                    {ROLE_LABEL[role]}
                    {id && id === me && <span className="!text-gold"> · ty</span>}
                  </span>
                  <span className={`block truncate font-label text-[0.95rem] font-bold sm:text-base ${id ? "text-text" : "text-muted"}`}>
                    {id ? CHAMP_BY_ID[id]?.name : "Wybierz"}
                  </span>
                </span>
              </button>
              {id && (
                <button
                  aria-label={`Usuń ${CHAMP_BY_ID[id]?.name}`}
                  onClick={() => onClear(ref)}
                  className={`absolute top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/80 text-muted hover:text-text ${mirrored ? "left-1" : "right-1"}`}
                >
                  <X size={12} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className={`mt-2.5 flex items-center gap-1.5 ${mirrored ? "flex-row-reverse" : ""}`}>
        <Ban size={13} className="shrink-0 text-muted" aria-hidden />
        <div className={`flex min-w-0 flex-1 gap-1 ${mirrored ? "flex-row-reverse" : ""}`}>
          {bans.map((id, i) => (
            <button
              key={i}
              id={`ban-${side}-${i}`}
              onClick={() => (id ? onClear({ side, kind: "ban", index: i }) : onOpen({ side, kind: "ban", index: i }))}
              aria-label={id ? `Usuń bana ${CHAMP_BY_ID[id]?.name}` : "Dodaj bana"}
              className="relative aspect-square min-w-0 max-w-8 flex-1 overflow-hidden rounded-md border border-line bg-ink/40 hover:border-gold"
            >
              {id ? (
                <>
                  <ChampIcon id={id} size={32} dim className="!h-full !w-full !min-w-0" />
                  <span className="absolute inset-0 grid place-items-center text-bad">
                    <X size={16} strokeWidth={3} />
                  </span>
                </>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
