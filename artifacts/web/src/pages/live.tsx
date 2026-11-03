import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Shield, Swords, Eye, RefreshCw, ChevronRight, AlertTriangle, Lock, Settings } from "lucide-react";
import {
  useSearchSummoner,
  useGetLiveGame,
} from "@workspace/api-client-react";

import { getDDBase, SPELL_IMG, RUNE_STYLE_ICON, TIER_COLOR, TIER_LABEL } from "../lib/constants";
import { usePageTitle } from "@/lib/usePageTitle";
import LiveAICoach from "@/components/LiveAICoach";


const GAME_MODE_LABEL: Record<string, string> = {
  CLASSIC: "Rankingowa Solo/Duo", ARAM: "ARAM", URF: "URF",
  ONEFORALL: "Jeden za wszystkich", TUTORIAL: "Tutorial",
  CHERRY: "Arena",
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SpellIcon({ id, size = 24 }: { id: number; size?: number }) {
  const name = SPELL_IMG[id];
  if (!name) return <div style={{ width: size, height: size }} className="bg-muted border border-border" />;
  return (
    <img src={`${getDDBase()}/spell/${name}.png`} alt={name}
      style={{ width: size, height: size }}
      className="border border-border"
      onError={(e) => { e.currentTarget.style.display = "none"; }} />
  );
}

function RuneIcon({ styleId, size = 20 }: { styleId: number; size?: number }) {
  const name = RUNE_STYLE_ICON[styleId];
  if (!name) return <div style={{ width: size, height: size }} className="rounded-full bg-muted" />;
  return (
    <img
      src={`https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${name}.png`}
      alt="" style={{ width: size, height: size }} className="rounded-full"
      onError={(e) => { e.currentTarget.style.display = "none"; }} />
  );
}

function WinrateBar({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) return <span className="text-[10px] text-muted-foreground">Brak gier</span>;
  const wr = (wins / total) * 100;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-loss/20 overflow-hidden" style={{ borderRadius: 1 }}>
        <div className="h-full bg-primary/70" style={{ width: `${wr}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: wr >= 50 ? "#d2ad62" : "#f0545c" }}>
        {wr.toFixed(0)}%
      </span>
      <span className="text-[9px] text-muted-foreground tabular-nums" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {wins}W {losses}L
      </span>
    </div>
  );
}

function RankDisplay({ tier, division, lp }: { tier: string; division: string; lp: number }) {
  const color = TIER_COLOR[tier] ?? "#6B6B6B";
  const label = TIER_LABEL[tier] ?? tier;
  const showDiv = !["CHALLENGER", "GRANDMASTER", "MASTER", "UNRANKED"].includes(tier) && division;

  if (tier === "UNRANKED") {
    return <span className="text-[10px] text-muted-foreground font-medium">Unranked</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center justify-center text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded"
        style={{ color, border: `1px solid ${color}40`, background: `${color}12`, minWidth: 28 }}
      >
        {label.substring(0, 1)}{showDiv ? division : ""}
      </div>
      <span className="text-[10px] tabular-nums" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {lp} LP
      </span>
    </div>
  );
}

function PlayerRow({ player, side, isSelf, position, region }: { player: any; side: "blue" | "red"; isSelf: boolean; position: number; region: string }) {
  const borderColor = side === "blue" ? "hsl(220,60%,85%)" : "#6b2a30";
  const highlightBg = side === "blue" ? "hsl(220,60%,96%)" : "#2a1519";
  const sideAccent = side === "blue" ? "#2563EB" : "#DC2626";
  const total = (player.rankedWins ?? 0) + (player.rankedLosses ?? 0);
  const riotId = player.summonerName ?? "";
  const parts = riotId.split("#");
  const pName = parts[0] ?? riotId;
  const pTag = parts[1] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, x: side === "blue" ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.05 }}
      className="group relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
      style={{
        background: isSelf ? highlightBg : "transparent",
        borderLeft: side === "blue" ? `2px solid ${isSelf ? sideAccent : "transparent"}` : "none",
        borderRight: side === "red" ? `2px solid ${isSelf ? sideAccent : "transparent"}` : "none",
      }}
    >
      <div className="relative flex-shrink-0">
        <img
          src={`${getDDBase()}/champion/${player.championName}.png`}
          alt={player.championName}
          className="w-10 h-10 rounded border"
          style={{ borderColor }}
          onError={(e) => { e.currentTarget.src = `${getDDBase()}/profileicon/29.png`; }}
        />
        <div className="absolute -bottom-1 -right-1 flex gap-px">
          <SpellIcon id={player.spell1Id} size={14} />
          <SpellIcon id={player.spell2Id} size={14} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isSelf && <span className="text-[9px] font-bold px-1 py-px rounded" style={{ background: `${sideAccent}15`, color: sideAccent, border: `1px solid ${sideAccent}30` }}>TY</span>}
          {pName && pTag ? (
            <Link to={`/profile/${region}/${encodeURIComponent(pName)}/${encodeURIComponent(pTag)}`}>
              <span className="text-xs font-bold truncate cursor-pointer hover:underline" style={{ color: isSelf ? sideAccent : "#ece6d6", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {pName}<span className="text-muted-foreground">#{pTag}</span>
              </span>
            </Link>
          ) : (
            <span className="text-xs font-bold truncate" style={{ color: isSelf ? sideAccent : "#ece6d6", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {riotId}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{player.championName}</p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <RuneIcon styleId={player.perks?.perkStyle ?? 0} size={18} />
        <RuneIcon styleId={player.perks?.perkSubStyle ?? 0} size={14} />
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[80px]">
        <RankDisplay tier={player.rankedTier} division={player.rankedDivision} lp={player.rankedLP} />
        {total > 0 && (
          <div className="w-full">
            <WinrateBar wins={player.rankedWins ?? 0} losses={player.rankedLosses ?? 0} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BansList({ bans, side }: { bans: any[]; side: "blue" | "red" }) {
  if (!bans.length) return null;
  const color = side === "blue" ? "rgba(37,99,235,0.08)" : "rgba(220,38,38,0.08)";
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border">
      <span className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground font-bold mr-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BANY</span>
      {bans.map((b: any, i: number) => (
        <div key={i} title={b.championName === "Brak" ? "Brak bana" : b.championName}
          className="relative overflow-hidden rounded" style={{ width: 28, height: 28 }}>
          {b.championName !== "Brak" ? (
            <>
              <img src={`${getDDBase()}/champion/${b.championName}.png`} alt={b.championName}
                className="w-full h-full object-cover grayscale opacity-40" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="absolute inset-0" style={{ background: color }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-red-500/70 text-xs font-bold">✕</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-muted border border-border flex items-center justify-center">
              <span className="text-muted-foreground/40 text-[9px]">—</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TeamAvgRank(participants: any[]) {
  const tierValues: Record<string, number> = {
    IRON: 1, BRONZE: 2, SILVER: 3, GOLD: 4, PLATINUM: 5,
    EMERALD: 6, DIAMOND: 7, MASTER: 8, GRANDMASTER: 9, CHALLENGER: 10,
  };
  const ranked = participants.filter(p => p.rankedTier && p.rankedTier !== "UNRANKED");
  if (ranked.length === 0) return { label: "Unranked", color: "#6B6B6B" };
  const avg = ranked.reduce((s, p) => s + (tierValues[p.rankedTier] ?? 0), 0) / ranked.length;
  const tiers = Object.entries(tierValues).sort((a, b) => a[1] - b[1]);
  const closest = tiers.reduce((best, t) => Math.abs(t[1] - avg) < Math.abs(best[1] - avg) ? t : best);
  return { label: TIER_LABEL[closest[0]] ?? closest[0], color: TIER_COLOR[closest[0]] ?? "#6B6B6B" };
}

function TeamPanel({ participants, bans, side, selfPuuid, region }: { participants: any[]; bans: any[]; side: "blue" | "red"; selfPuuid?: string; region: string }) {
  const color = side === "blue" ? "#2563EB" : "#DC2626";
  const label = side === "blue" ? "NIEBIESCY" : "CZERWONI";
  const avg = TeamAvgRank(participants);
  const totalWins = participants.reduce((s, p) => s + (p.rankedWins ?? 0), 0);
  const totalLosses = participants.reduce((s, p) => s + (p.rankedLosses ?? 0), 0);
  const totalGames = totalWins + totalLosses;
  const teamWr = totalGames > 0 ? (totalWins / totalGames * 100) : 0;
  const sortedBans = [...bans].sort((a, b) => a.pickTurn - b.pickTurn);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: color }} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color, fontFamily: "'Rajdhani', sans-serif" }}>{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold" style={{ color: avg.color, fontFamily: "'Rajdhani', sans-serif" }}>
            Śr. {avg.label}
          </span>
          {totalGames > 0 && (
            <span className="text-[9px] tabular-nums" style={{ color: teamWr >= 50 ? "#d2ad62" : "#f0545c", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {teamWr.toFixed(0)}% WR
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {participants.map((p: any, i: number) => (
          <PlayerRow key={i} player={p} side={side} isSelf={p.puuid === selfPuuid} position={i} region={region} />
        ))}
      </div>

      <BansList bans={sortedBans} side={side} />
    </div>
  );
}

function NotInGameView({ gameName, tagLine, region, onRefetch, errorCode, errorHint }: { gameName: string; tagLine: string; region: string; onRefetch?: () => void; errorCode?: string; errorHint?: string }) {
  const [checking, setChecking] = useState(false);
  const isRiotKeyError = errorCode === "riot_key_invalid";
  const showPrivacyHint = errorHint === "spectator_privacy" || errorCode === "not_in_game";

  const handleRefetch = () => {
    if (!onRefetch) return;
    setChecking(true);
    onRefetch();
    setTimeout(() => setChecking(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-muted border border-border">
        {isRiotKeyError ? <AlertTriangle className="w-7 h-7 text-amber-500" /> : <Eye className="w-7 h-7 text-muted-foreground" />}
      </div>
      <h2 className="text-lg font-bold text-foreground/60 mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {isRiotKeyError ? "BŁĄD KLUCZA RIOT API" : "GRACZ NIE JEST W MECZU"}
      </h2>
      <p className="text-sm text-muted-foreground mb-2">
        {isRiotKeyError
          ? "Klucz API Riot wygasł lub jest nieprawidłowy."
          : <>{gameName}#{tagLine} aktualnie nie gra na serwerze {region}</>}
      </p>
      <p className="text-[10px] text-muted-foreground/50 mb-4">
        Dane spectator pojawiają się ~1-3 min po starcie gry
      </p>

      {showPrivacyHint && (
        <div className="max-w-md w-full mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-amber-800 mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                NIE WIDZISZ SWOJEJ GRY?
              </p>
              <p className="text-[10px] text-amber-700 leading-relaxed mb-2">
                Jeśli grasz, ale Nexus Draft nie wykrywa meczu — prawdopodobnie masz włączone <strong>ograniczenie danych spectator</strong> w kliencie LoL.
              </p>
              <div className="flex items-start gap-2 bg-white/60 rounded-lg px-3 py-2 border border-amber-200/50">
                <Settings className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-amber-800 leading-relaxed">
                  <strong>Jak naprawić:</strong><br />
                  1. Otwórz klienta League of Legends<br />
                  2. Wejdź w <strong>Ustawienia</strong> → <strong>Prywatność</strong><br />
                  3. Wyłącz opcję <strong>"Ogranicz dostęp do danych spectator"</strong><br />
                  4. Uruchom nową grę
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        {onRefetch && (
          <button
            onClick={handleRefetch}
            disabled={checking}
            className="text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", fontFamily: "'Rajdhani', sans-serif", opacity: checking ? 0.7 : 1 }}
          >
            <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
            {checking ? "SPRAWDZAM..." : "SPRAWDŹ PONOWNIE"}
          </button>
        )}
        <Link to={`/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`}>
          <span className="text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors" style={{
            background: "#262418", border: "1px solid #6b5a35",
            color: "#d2ad62", fontFamily: "'Rajdhani', sans-serif"
          }}>
            PROFIL <ChevronRight className="w-3 h-3 inline" />
          </span>
        </Link>
      </div>
      <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1.5">
        <RefreshCw className="w-3 h-3" />
        Automatyczne sprawdzanie co 15 sekund
      </p>
    </motion.div>
  );
}

function LiveErrorView({ error, onRefetch }: { error: any; onRefetch?: () => void }) {
  const status = error?.status;
  const apiMessage = error?.data?.message;
  const isUnauthorized = status === 401 || status === 403 || error?.data?.error === "riot_key_invalid";
  const title = isUnauthorized ? "NIEPRAWIDŁOWY KLUCZ RIOT API" : "NIE MOŻNA SPRAWDZIĆ MECZU";
  const message = isUnauthorized
    ? "Klucz developerski Riot API wygasł lub jest nieprawidłowy. Wygeneruj nowy klucz na developer.riotgames.com."
    : apiMessage ?? "Serwer Riot API chwilowo nie odpowiada. Spróbuj ponownie za chwilę.";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 px-4">
      <AlertTriangle className="w-10 h-10 text-destructive/60 mb-3" />
      <h2 className="text-lg font-bold text-foreground/60 mb-1 text-center" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{title}</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">{message}</p>
      {onRefetch && (
        <button
          onClick={onRefetch}
          className="text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", fontFamily: "'Rajdhani', sans-serif" }}
        >
          <RefreshCw className="w-3 h-3" />
          SPRAWDŹ PONOWNIE
        </button>
      )}
    </motion.div>
  );
}

export default function LiveGame() {
  const params = useParams<{ region: string; gameName: string; tagLine: string }>();
  const region = params.region ?? "";
  const gameName = decodeURIComponent(params.gameName ?? "");
  const tagLine = decodeURIComponent(params.tagLine ?? "");
  usePageTitle(`${gameName}#${tagLine} — Live Game`);

  const { data: summoner, isLoading: isSummonerLoading, error: summonerError } = useSearchSummoner({ gameName, tagLine, region }, {
    query: { enabled: !!gameName && !!tagLine && !!region },
  });

  const puuid = summoner?.puuid ?? "";
  const summonerId = summoner?.summonerId ?? "";

  const { data: liveGame, error: liveError, refetch, isLoading, isFetching, status } = useGetLiveGame(
    puuid,
    { region, summonerId },
    { query: { enabled: !!puuid && !!summonerId, retry: false, staleTime: 0, gcTime: 30_000 } }
  );

  useEffect(() => {
    if (!puuid || !summonerId) return;
    const id = setInterval(() => { refetch(); }, 15000);
    return () => clearInterval(id);
  }, [puuid, summonerId, refetch]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!liveGame) return;
    setElapsed((liveGame as any).gameLength ?? 0);
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [(liveGame as any)?.gameLength]);

  const inGame = !!liveGame && !liveError;

  // Extract error details from the API error to show appropriate UI
  const errorData = (liveError as any)?.data as { error?: string; hint?: string } | undefined;
  const errorCode = errorData?.error;
  const errorHint = errorData?.hint;

  const t1 = useMemo(() => (inGame ? ((liveGame as any).participants ?? []).filter((p: any) => p.teamId === 100) : []), [liveGame, inGame]);
  const t2 = useMemo(() => (inGame ? ((liveGame as any).participants ?? []).filter((p: any) => p.teamId === 200) : []), [liveGame, inGame]);
  const b1 = useMemo(() => (inGame ? ((liveGame as any).bans ?? []).filter((b: any) => b.teamId === 100) : []), [liveGame, inGame]);
  const b2 = useMemo(() => (inGame ? ((liveGame as any).bans ?? []).filter((b: any) => b.teamId === 200) : []), [liveGame, inGame]);

  return (
    <div className="bg-background">
      <div className="grid-bg" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.3 }} />

      <div className="relative z-10 max-w-5xl mx-auto px-3 py-4 sm:px-6">
        <div className="flex items-center gap-3 mb-5">
          <Link to={`/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`}>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer transition-colors rounded-lg border border-border text-primary hover:bg-muted">
              <ArrowLeft className="w-4 h-4" />
            </span>
          </Link>
          <div>
            <h1 className="text-lg font-black tracking-wide text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              LIVE GAME
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {gameName}<span className="text-muted-foreground/50">#{tagLine}</span>
              <span className="ml-2 tag-chip">{region}</span>
            </p>
          </div>

          {inGame && (
            <Link
              to={`/draft?riot=${encodeURIComponent(`${gameName}#${tagLine}`)}&region=${encodeURIComponent(region.toLowerCase())}`}
              className="btn btn-gold ml-auto !px-3 !py-1.5 !text-xs"
            >
              <Swords className="w-3.5 h-3.5" /> Analizuj draft
            </Link>
          )}

          {inGame && (
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>W GRZE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                  {GAME_MODE_LABEL[(liveGame as any)?.gameMode] ?? (liveGame as any)?.gameMode}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-sm font-bold text-primary">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(elapsed)}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {summonerError ? (
            <motion.div key="summoner-error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 px-4">
              <AlertTriangle className="w-10 h-10 text-destructive/60 mb-3" />
              <h2 className="text-lg font-bold text-foreground/60 mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>NIE ZNALEZIONO GRACZA</h2>
              <p className="text-sm text-muted-foreground">{gameName}#{tagLine} nie istnieje na serwerze {region}</p>
            </motion.div>
          ) : isSummonerLoading || (isFetching && !liveGame && status !== "error") ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Szukam meczu...</p>
            </motion.div>
          ) : liveError ? (
            <LiveErrorView key="live-error" error={liveError} onRefetch={refetch} />
          ) : !inGame ? (
            <NotInGameView key="not-in-game" gameName={gameName} tagLine={tagLine} region={region} onRefetch={refetch} errorCode={errorCode} errorHint={errorHint} />
          ) : (
            <motion.div key="game" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="overflow-hidden rounded-xl bg-card border border-border shadow-sm">
                <div className="flex divide-x divide-border">
                  <TeamPanel participants={t1} bans={b1} side="blue" selfPuuid={puuid} region={region} />

                  <div className="hidden sm:flex flex-col items-center justify-center px-3 py-2 bg-muted" style={{ minWidth: 48 }}>
                    <Swords className="w-4 h-4 text-muted-foreground/40 mb-1" />
                    <span className="text-[8px] text-muted-foreground/40 font-bold tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif" }}>VS</span>
                  </div>

                  <TeamPanel participants={t2} bans={b2} side="red" selfPuuid={puuid} region={region} />
                </div>
              </div>

              <LiveAICoach
                gameId={(liveGame as any).gameId}
                mySide={t1.some((p: any) => p.puuid === puuid) ? "blue" : "red"}
                gameMode={(liveGame as any).gameMode ?? "CLASSIC"}
                participants={(liveGame as any).participants ?? []}
              />

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Tryb gry", value: GAME_MODE_LABEL[(liveGame as any)?.gameMode] ?? (liveGame as any)?.gameMode, icon: Shield },
                  { label: "Czas gry", value: formatTime(elapsed), icon: Clock },
                  { label: "Mapa", value: (liveGame as any)?.mapId === 11 ? "Summoner's Rift" : (liveGame as any)?.mapId === 12 ? "Howling Abyss" : `Mapa ${(liveGame as any)?.mapId}`, icon: Eye },
                  { label: "Bany", value: `${b1.length + b2.length} / 10`, icon: AlertTriangle },
                ].map((stat, i) => (
                  <div key={i} className="px-3 py-2.5 rounded-lg bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <stat.icon className="w-3 h-3 text-primary/50" />
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 px-3 py-2 flex items-center justify-between rounded-lg bg-card border border-border">
                <span className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Automatyczne odświeżanie co 15s
                </span>
                <button onClick={() => refetch()} className="text-[10px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer text-primary bg-primary/5 border border-primary/20 hover:bg-primary/10" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  ODŚWIEŻ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
