import { useState, type FormEvent } from "react";
import { Radio, RefreshCw, UserRound, LogOut } from "lucide-react";
import { ChampIcon } from "./ChampIcon";
import { fetchPlayer, type PlayerResponse, type ServerStatus } from "../lib/api";
import type { LiveDraft } from "../lib/live";

const STORE = "nd-riot";

function load(): { region: string; riotId: string } {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "{}");
    return { region: typeof v.region === "string" ? v.region : "eun1", riotId: typeof v.riotId === "string" ? v.riotId : "" };
  } catch {
    return { region: "eun1", riotId: "" };
  }
}

interface Props {
  status: ServerStatus;
  player: PlayerResponse | null;
  onPlayer: (p: PlayerResponse | null) => void;
  onLive: (live: LiveDraft) => void;
}

export function RiotPanel({ status, player, onPlayer, onLive }: Props) {
  const saved = load();
  const [region, setRegion] = useState(saved.region);
  const [riotId, setRiotId] = useState(saved.riotId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!riotId.includes("#")) {
      setError("Wpisz Riot ID razem z tagiem, np. Faker#KR1.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const p = await fetchPlayer(region, riotId);
      onPlayer(p);
      if (p.live) onLive(p.live);
      try {
        localStorage.setItem(STORE, JSON.stringify({ region, riotId }));
      } catch {
        /* bez pamięci przeglądarki też działa */
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!status.riot) return null;

  return (
    <section className="section">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow flex items-center gap-1.5 !text-gold">
            <UserRound size={13} /> Konto Riot
          </div>
          <h2 className="mt-0.5 text-2xl font-bold uppercase tracking-wide">
            {player ? `${player.account.gameName}#${player.account.tagLine}` : "Wczytaj swój mecz"}
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted">
            {player
              ? player.live
                ? "Jesteś w grze — draft z meczu na żywo został wczytany. Podpowiedzi uwzględniają twoją pulę championów."
                : player.inUnsupportedGame
                  ? "Jesteś w trybie, którego nie analizujemy (np. Arena). Podpowiedzi uwzględniają twoją pulę championów."
                  : "Nie jesteś teraz w grze. Podpowiedzi uwzględniają twoją pulę championów — odśwież, gdy mecz wystartuje."
              : "Podaj Riot ID: wczytamy oba składy z trwającego meczu i dopasujemy podpowiedzi do championów, którymi grasz najwięcej."}
          </p>
        </div>
        {player && (
          <div className="flex gap-2">
            <button className="btn" onClick={() => connect()} disabled={busy}>
              <RefreshCw size={15} className={busy ? "animate-spin" : ""} /> Odśwież
            </button>
            <button className="btn" onClick={() => onPlayer(null)} aria-label="Rozłącz konto">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

      {!player && (
        <form onSubmit={connect} className="mt-4 flex flex-wrap gap-2">
          <select
            id="riot-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-[10px] border border-line bg-ink/60 px-3 py-2 font-label font-bold"
            aria-label="Region"
          >
            {status.regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            id="riot-id"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Nazwa#TAG"
            autoComplete="off"
            className="min-w-0 flex-1 basis-40 rounded-[10px] border border-line bg-ink/60 px-3 py-2 text-base outline-none placeholder:text-muted focus:border-gold"
          />
          <button className="btn btn-gold" disabled={busy}>
            {busy ? <RefreshCw size={15} className="animate-spin" /> : <Radio size={15} />} {busy ? "Szukam…" : "Wczytaj"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-bad">{error}</p>}

      {player && player.pool.length > 0 && (
        <div className="mt-4">
          <div className="eyebrow mb-2">Twoja pula · najwyższe mastery</div>
          <div className="flex flex-wrap gap-1.5">
            {player.pool.slice(0, 12).map((c) => (
              <div key={c.id} className="flex flex-col items-center gap-0.5" title={`${c.points.toLocaleString("pl-PL")} pkt`}>
                <ChampIcon id={c.id} size={38} />
                <span className="font-label text-[0.65rem] font-bold text-muted num">M{c.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
