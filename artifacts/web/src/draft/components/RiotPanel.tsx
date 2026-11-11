import { useEffect, useState, type FormEvent } from "react";
import { Radio, RefreshCw, UserRound, LogOut } from "lucide-react";
import { ChampIcon } from "./ChampIcon";
import { fetchPlayer, type PlayerResponse, type ServerStatus } from "../api";
import type { LiveDraft } from "@workspace/draft-core";

const STORE = "nd-riot";
const POLL_MS = 45_000;
const WATCH_MS = 15 * 60_000;

function load(): { region: string; riotId: string } {
  // Wejście z innej części aplikacji (np. „Analizuj draft” w meczu na żywo): /draft?riot=Nazwa%23TAG&region=euw1
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search);
    const riot = q.get("riot");
    if (riot) return { region: (q.get("region") ?? "eun1").toLowerCase(), riotId: riot };
  }
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
  const autoLoad = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("riot");

  const [watchUntil, setWatchUntil] = useState(0);
  const [lastCheck, setLastCheck] = useState<number | null>(null);

  const connect = async (e?: FormEvent, silent = false) => {
    e?.preventDefault();
    if (!riotId.includes("#")) {
      setError("Wpisz Riot ID razem z tagiem, np. Faker#KR1.");
      return;
    }
    if (!silent) {
      setBusy(true);
      setError(null);
    }
    try {
      const p = await fetchPlayer(region, riotId);
      onPlayer(p);
      setLastCheck(Date.now());
      if (p.live) onLive(p.live);
      // Serwer wykrywa, gdzie gracz naprawdę gra — zapamiętujemy ten region.
      const realRegion = p.region ?? region;
      if (realRegion !== region) setRegion(realRegion);
      if (!silent && !p.live) setWatchUntil(Date.now() + WATCH_MS);
      try {
        localStorage.setItem(STORE, JSON.stringify({ region: realRegion, riotId }));
      } catch {
        /* bez pamięci przeglądarki też działa */
      }
    } catch (err) {
      // Przy automatycznym sprawdzaniu chwilowy błąd (np. limit zapytań Riot) nie przerywa czekania.
      if (!silent) setError((err as Error).message);
    } finally {
      if (!silent) setBusy(false);
    }
  };

  // Gdy gracz jeszcze nie jest w grze, sprawdzamy sami co 45 s przez 15 minut.
  // Riot pokazuje mecz dopiero od ekranu ładowania — wybór championów nie jest widoczny.
  const waiting = !!player && !player.live && Date.now() < watchUntil;
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => {
      if (Date.now() > watchUntil) setWatchUntil(0);
      else void connect(undefined, true);
    }, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, watchUntil, region, riotId]);

  // Przyszliśmy z linku z Riot ID — wczytaj od razu, bez klikania.
  useEffect(() => {
    if (autoLoad && !player) void connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <p className="mt-1 max-w-[62ch] text-sm text-subtle">
            {player
              ? player.live
                ? "Jesteś w grze — draft z meczu na żywo został wczytany. Podpowiedzi uwzględniają twoją pulę championów."
                : player.liveUnavailable
                  ? "Riot chwilowo nie odpowiada o mecze na żywo (przeciążenie po ich stronie). Sprawdzę ponownie za chwilę — pula championów już jest wczytana."
                : player.inUnsupportedGame
                  ? "Jesteś w trybie, którego nie analizujemy (np. Arena). Podpowiedzi uwzględniają twoją pulę championów."
                  : "Riot nie pokazuje jeszcze twojego meczu. Mecz jest widoczny dopiero od ekranu ładowania (nie w trakcie wyboru championów). Podpowiedzi już uwzględniają twoją pulę."
              : "Podaj Riot ID: wczytamy oba składy z trwającego meczu i dopasujemy podpowiedzi do championów, którymi grasz najwięcej."}
          </p>
          {player && player.regionCorrected && (
            <p className="mt-1 text-xs text-gold">Wykryto twój serwer: {status.regions.find((r) => r.id === player.region)?.label ?? player.region}.</p>
          )}
          {waiting && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle" role="status">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" aria-hidden />
              Czekam na mecz — sprawdzam automatycznie co 45 s
              {lastCheck ? ` (ostatnio ${new Date(lastCheck).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })})` : ""}.
            </p>
          )}
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
            className="min-w-0 flex-1 basis-40 rounded-[10px] border border-line bg-ink/60 px-3 py-2 text-base outline-none placeholder:text-subtle focus:border-gold"
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
                <span className="font-label text-[0.65rem] font-bold text-subtle num">M{c.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
