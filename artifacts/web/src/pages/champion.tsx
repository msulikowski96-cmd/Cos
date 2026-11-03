import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronLeft, Trophy, Target, Shield, Swords, BarChart3,
  Clock, TrendingUp, TrendingDown, Minus, Star, Package, Users
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getDDBase } from "@/lib/constants";
import { usePageTitle } from "@/lib/usePageTitle";

interface ChampionStats {
  championName: string;
  puuid: string;
  region: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKda: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCsPerMin: number;
  avgDamage: number;
  avgGold: number;
  avgVisionScore: number;
  avgGameDuration: number;
  performanceScore: number;
  commonItems: { itemId: number; frequency: number }[];
  matches: {
    matchId: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    csPerMin: number;
    totalDamage: number;
    goldEarned: number;
    visionScore: number;
    gameDuration: number;
    gameEndTimestamp: number;
    items: number[];
    opScore: number;
    teamPosition: string;
    opponentChampion: string | null;
    summoner1Id: number;
    summoner2Id: number;
  }[];
  matchups: {
    championName: string;
    games: number;
    wins: number;
    losses: number;
    winRate: number;
    avgKdaVs: number;
  }[];
  roleDistribution: Record<string, number>;
  bestGame: { matchId: string; win: boolean; kills: number; deaths: number; assists: number; kda: number; totalDamage: number; gameDuration: number; gameEndTimestamp: number; opScore: number } | null;
  worstGame: { matchId: string; win: boolean; kills: number; deaths: number; assists: number; kda: number; totalDamage: number; gameDuration: number; gameEndTimestamp: number; opScore: number } | null;
}

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function fetchChampionStats(puuid: string, region: string, championName: string): Promise<ChampionStats> {
  return fetch(`${BASE_URL}/api/summoner/${puuid}/champion/${encodeURIComponent(championName)}?region=${region}&count=60`)
    .then(r => r.json());
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function WinRateBadge({ wr }: { wr: number }) {
  const color = wr >= 55 ? "text-emerald-400" : wr >= 50 ? "text-gold" : wr >= 45 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-bold text-base ${color}`}>{wr.toFixed(1)}%</span>;
}

function KdaBadge({ kda }: { kda: number }) {
  const color = kda >= 3 ? "text-emerald-400" : kda >= 2 ? "text-gold" : kda >= 1.5 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-bold ${color}`}>{kda.toFixed(2)}</span>;
}

const OP_SCORE_TOOLTIP = `OP Score (skala 0–10) — własna miara wydajności w meczu:

• KDA 35%: (kills+assists)/śmierci (log)
• Udział w killach 20%: % zabójstw drużyny
• Obrażenia 15%: całkowite obrażenia (maks. 15k)
• CS/min 15%: tempo farmienia
• Przeżywalność 15%: 100 − śmierci×12
• Bonus za wygraną: +1.5 pkt`;

function OpScoreBadge({ score }: { score: number }) {
  const [open, setOpen] = useState(false);
  const color = score >= 8 ? "text-yellow-400" : score >= 6 ? "text-emerald-400" : score >= 4 ? "text-gold" : "text-muted-foreground";
  return (
    <span className="relative inline-flex">
      <span
        className={`font-bold text-sm cursor-help ${color}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >{score.toFixed(1)}</span>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: -3, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-6 left-0 z-[100] w-56 text-[10px] text-foreground/85 leading-relaxed pointer-events-none whitespace-pre-line"
            style={{ background: "#121926", border: "1px solid #233047", borderRadius: "8px", padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            {OP_SCORE_TOOLTIP}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function Champion() {
  const params = useParams<{ region: string; gameName: string; tagLine: string; championName: string }>();
  const { region, gameName, tagLine, championName } = params;
  usePageTitle(`${championName} — ${gameName}#${tagLine}`);

  const { data: summoner } = useQuery({
    queryKey: ["summoner", region, gameName, tagLine],
    queryFn: () =>
      fetch(`${BASE_URL}/api/summoner/search?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`)
        .then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats, isLoading, error } = useQuery<ChampionStats>({
    queryKey: ["champion", region, gameName, tagLine, championName],
    queryFn: () => fetchChampionStats(summoner?.puuid ?? "", region, championName ?? ""),
    enabled: !!summoner?.puuid && !!championName,
    staleTime: 3 * 60 * 1000,
  });

  const profileUrl = `/profile/${region}/${gameName}/${tagLine}`;
  const ddBase = getDDBase();

  if (isLoading || !summoner?.puuid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg">Nie udało się załadować danych dla {championName}</p>
        <Link href={profileUrl} className="text-gold hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Wróć do profilu
        </Link>
      </div>
    );
  }

  const mainRole = Object.entries(stats.roleDistribution).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Back link */}
        <Link href={profileUrl} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          {gameName}#{tagLine} — profil
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border border-white/10"
          style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,0,0,0.4) 100%)" }}
        >
          <img
            src={`${ddBase}/champion/${championName}.png`}
            alt={championName}
            className="w-20 h-20 rounded-xl border border-white/20 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{championName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{stats.totalGames} {stats.totalGames === 1 ? "mecz" : "meczy"}</span>
              {mainRole && <span>· {mainRole}</span>}
              <span>· {region}</span>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Win Rate</div>
              <WinRateBadge wr={stats.winRate} />
              <div className="text-xs text-muted-foreground">{stats.wins}W {stats.losses}L</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">KDA</div>
              <KdaBadge kda={stats.avgKda} />
              <div className="text-xs text-muted-foreground">
                {stats.avgKills}/{stats.avgDeaths}/{stats.avgAssists}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">OP Score</div>
              <OpScoreBadge score={stats.performanceScore} />
              <div className="text-xs text-muted-foreground">śr.</div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "CS/min", value: stats.avgCsPerMin.toFixed(1), icon: <Target className="w-4 h-4 text-yellow-400" /> },
            { label: "Obrażenia/mecz", value: stats.avgDamage.toLocaleString(), icon: <Swords className="w-4 h-4 text-red-400" /> },
            { label: "Złoto/mecz", value: stats.avgGold.toLocaleString(), icon: <Trophy className="w-4 h-4 text-yellow-500" /> },
            { label: "Śr. czas gry", value: fmtDuration(stats.avgGameDuration), icon: <Clock className="w-4 h-4 text-gold" /> },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 p-4 flex flex-col gap-1" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{stat.icon}{stat.label}</div>
              <div className="text-lg font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Item builds */}
          {stats.commonItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 p-5"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                <Package className="w-4 h-4" /> Najczęstsze przedmioty
              </h2>
              <div className="flex flex-wrap gap-3">
                {stats.commonItems.slice(0, 8).map(({ itemId, frequency }) => (
                  <div key={itemId} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <img
                        src={`${ddBase}/item/${itemId}.png`}
                        alt={`Item ${itemId}`}
                        className="w-12 h-12 rounded-lg border border-white/20 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                      />
                      <span className="absolute -bottom-1 -right-1 text-[10px] bg-black/80 text-muted-foreground px-1 rounded">
                        ×{frequency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Matchups */}
          {stats.matchups.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-white/10 p-5"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                <Users className="w-4 h-4" /> Matchupy
              </h2>
              <div className="space-y-2">
                {stats.matchups.slice(0, 5).map((m) => (
                  <div key={m.championName} className="flex items-center gap-3">
                    <img
                      src={`${ddBase}/champion/${m.championName}.png`}
                      alt={m.championName}
                      className="w-8 h-8 rounded-md border border-white/10 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{m.championName}</span>
                        <WinRateBadge wr={m.winRate} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{m.wins}W {m.losses}L</span>
                        <span>·</span>
                        <span>KDA <KdaBadge kda={m.avgKdaVs} /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Best / Worst game */}
        {(stats.bestGame || stats.worstGame) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.bestGame && (
              <div className="rounded-xl border border-emerald-500/20 p-4" style={{ background: "rgba(52,211,153,0.04)" }}>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Najlepsza gra
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-lg">{stats.bestGame.kills}/{stats.bestGame.deaths}/{stats.bestGame.assists}</span>
                    <span className="text-xs text-muted-foreground ml-2">{fmtDuration(stats.bestGame.gameDuration)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">OP Score</div>
                    <OpScoreBadge score={stats.bestGame.opScore} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.bestGame.gameEndTimestamp
                    ? formatDistanceToNow(new Date(stats.bestGame.gameEndTimestamp), { addSuffix: true, locale: pl })
                    : ""}
                </div>
              </div>
            )}
            {stats.worstGame && (
              <div className="rounded-xl border border-red-500/20 p-4" style={{ background: "rgba(239,68,68,0.04)" }}>
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold mb-2">
                  <TrendingDown className="w-3.5 h-3.5" /> Najgorsza gra
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-lg">{stats.worstGame.kills}/{stats.worstGame.deaths}/{stats.worstGame.assists}</span>
                    <span className="text-xs text-muted-foreground ml-2">{fmtDuration(stats.worstGame.gameDuration)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">OP Score</div>
                    <OpScoreBadge score={stats.worstGame.opScore} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.worstGame.gameEndTimestamp
                    ? formatDistanceToNow(new Date(stats.worstGame.gameEndTimestamp), { addSuffix: true, locale: pl })
                    : ""}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Match history */}
        {stats.matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 p-5"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              <BarChart3 className="w-4 h-4" /> Ostatnie mecze ({stats.matches.length})
            </h2>
            <div className="space-y-2">
              {stats.matches.map((match) => {
                const kda = match.deaths === 0 ? match.kills + match.assists : (match.kills + match.assists) / match.deaths;
                return (
                  <div
                    key={match.matchId}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      match.win
                        ? "border-l-4 border-l-cyan-500 border-t-0 border-r-0 border-b-0 bg-gold/5"
                        : "border-l-4 border-l-red-500 border-t-0 border-r-0 border-b-0 bg-red-500/5"
                    }`}
                    style={{ borderTopWidth: "1px", borderRightWidth: "1px", borderBottomWidth: "1px", borderTopColor: "rgba(255,255,255,0.06)", borderRightColor: "rgba(255,255,255,0.06)", borderBottomColor: "rgba(255,255,255,0.06)" }}
                  >
                    <div className={`text-xs font-bold w-8 text-center ${match.win ? "text-gold" : "text-red-400"}`}>
                      {match.win ? "W" : "P"}
                    </div>
                    <div className="flex-1 grid grid-cols-3 sm:grid-cols-5 gap-2 text-sm">
                      <div>
                        <span className="font-bold">{match.kills}/{match.deaths}/{match.assists}</span>
                      </div>
                      <div className="hidden sm:block text-muted-foreground text-xs flex items-center gap-0.5">
                        KDA <KdaBadge kda={kda} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.csPerMin.toFixed(1)} CS/m
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {match.totalDamage.toLocaleString()} dmg
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fmtDuration(match.gameDuration)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {match.opponentChampion && (
                        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <span>vs</span>
                          <img
                            src={`${ddBase}/champion/${match.opponentChampion}.png`}
                            alt={match.opponentChampion}
                            className="w-5 h-5 rounded border border-white/10"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      )}
                      <div className="flex gap-1">
                        {match.items.slice(0, 6).filter(i => i > 0).map((itemId, idx) => (
                          <img
                            key={idx}
                            src={`${ddBase}/item/${itemId}.png`}
                            alt=""
                            className="w-5 h-5 rounded border border-white/10 hidden sm:block"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ))}
                      </div>
                      <div className="text-right ml-1">
                        <OpScoreBadge score={match.opScore} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {stats.totalGames === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Brak meczy na {championName} w ostatnich 60 grach</p>
            <Link href={profileUrl} className="text-gold hover:underline text-sm mt-2 inline-block">
              Wróć do profilu
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
