import { useParams, Link, useLocation } from "wouter";
import { getDDBase, SPELL_IMG, RUNE_STYLE_ICON, TIER_COLOR } from "../lib/constants";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronLeft, Trophy, Target, Shield, AlertCircle,
  TrendingUp, TrendingDown, Minus, Flame, Snowflake,
  BarChart3, Swords, Eye, Award,
  ChevronUp, ChevronDown, Check, AlertTriangle,
  Brain, Zap, BookOpen, XCircle,
  Wifi, Clock, Star, GraduationCap, Timer,
  Layers, ArrowUpRight, ArrowDownRight, Info, Users,
  Share2, Copy, CheckCheck, ChevronRight, RefreshCw, Crosshair, Activity,
  Heart, ExternalLink, Gauge, Map, Sparkles, RotateCcw, ThumbsUp, ThumbsDown
} from "lucide-react";
import { toggleFavorite, isFavorite } from "@/lib/favorites";
import { addRankSnapshot, getRankHistory } from "@/lib/rankHistory";
import BuildCalculator from "@/components/BuildCalculator";
import CardGenerator from "@/components/CardGenerator";
import { usePageTitle } from "@/lib/usePageTitle";
import AdBanner from "@/components/AdBanner";
import {
  useSearchSummoner,
  useGetSummonerRanked,
  useGetSummonerMatches,
  useGetSummonerMastery,
  useGetSummonerAnalysis,
  useGetLiveGame,
} from "@workspace/api-client-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ROLE_EMOJI: Record<string, string> = { Top: "⚔️", Jungler: "🌿", Mid: "✨", ADC: "🏹", Support: "🛡️", Nieznana: "❓" };
const FALLBACK_ICON = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png";

function InfoTooltip({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        className="text-muted-foreground/40 hover:text-primary/80 transition-colors cursor-help flex-shrink-0"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >
        <Info className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: -3, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={`absolute top-5 z-[100] w-64 text-[11px] text-foreground/85 leading-relaxed shadow-2xl pointer-events-none ${align === "right" ? "right-0" : "left-0"}`}
            style={{ background: "#121926", border: "1px solid #233047", borderRadius: "8px", padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function SparklineChart({ matches }: { matches: any[] }) {
  if (!matches || matches.length < 3) return null;
  const rev = [...matches].reverse();
  const kdas = rev.map((m: any) => Math.min(m.deaths === 0 ? m.kills + m.assists : (m.kills + m.assists) / m.deaths, 12));
  const max = Math.max(...kdas, 4);
  const w = 280, h = 44, px = 6, py = 4;
  const iw = w - px * 2, ih = h - py * 2;
  const pts = kdas.map((k, i) => ({ x: px + (i / Math.max(kdas.length - 1, 1)) * iw, y: py + (1 - k / max) * ih, win: rev[i].win }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const gradientId = "sparkGrad";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,130,180,0.15)" />
          <stop offset="100%" stopColor="rgba(0,130,180,0)" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`} fill={`url(#${gradientId})`} />
      <path d={d} fill="none" stroke="#d2ad62" strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={p.win ? "#22c55e" : "#ef4444"} />)}
    </svg>
  );
}


const TIER_ABBR: Record<string, string> = {
  CHALLENGER: "C", GRANDMASTER: "GM", MASTER: "M",
  DIAMOND: "D", EMERALD: "E", PLATINUM: "P",
  GOLD: "G", SILVER: "S", BRONZE: "B", IRON: "I",
};

const TIER_COLOR_LP: Record<string, string> = {
  CHALLENGER: "#E9BE5C", GRANDMASTER: "#CF4B4B", MASTER: "#9B5CE8",
  DIAMOND: "#57A8E7", EMERALD: "#3AC48B", PLATINUM: "#4CBFAA",
  GOLD: "#D4A839", SILVER: "#8FA3B1", BRONZE: "#A0724C", IRON: "#8B8B8B",
};

function LPHistoryChart({ puuid }: { puuid: string }) {
  const history = getRankHistory(puuid);
  if (history.length < 2) return (
    <div className="text-center py-4 px-2">
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Historia LP pojawi się tutaj po kolejnych odwiedzinach profilu. Każde wejście na stronę zapisuje aktualny stan rangi.
      </p>
    </div>
  );

  const sorted = [...history].sort((a, b) => a.date - b.date);
  const lpVals = sorted.map(s => s.totalLP);
  const minLP = Math.min(...lpVals);
  const maxLP = Math.max(...lpVals);
  const range = maxLP - minLP || 100;

  const w = 260, h = 80, px = 8, py = 10;
  const iw = w - px * 2;
  const ih = h - py * 2;

  const pts = sorted.map((s, i) => ({
    x: px + (i / Math.max(sorted.length - 1, 1)) * iw,
    y: py + (1 - (s.totalLP - minLP) / range) * ih,
    snap: s,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${h - py + 2} L ${pts[0].x} ${h - py + 2} Z`;

  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  const lpDiff = last.totalLP - first.totalLP;
  const isUp = lpDiff >= 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[10px] text-muted-foreground">{sorted.length} {sorted.length === 1 ? "zapis" : "zapisów"}</span>
        <span className={`text-[10px] font-bold ${isUp ? "text-win" : "text-loss"}`}>
          {isUp ? "+" : ""}{lpDiff} LP
        </span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)"} />
              <stop offset="100%" stopColor={isUp ? "rgba(34,197,94,0)" : "rgba(239,68,68,0)"} />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#lpGrad)" />
          <path d={pathD} fill="none" stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth="1.5" strokeLinejoin="round" />
          {pts.map((p, i) => {
            const color = TIER_COLOR_LP[p.snap.tier] ?? "#888";
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
        <div className="flex items-center justify-between mt-1 px-0.5">
          <span className="text-[9px] text-muted-foreground/50">
            {new Date(first.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold" style={{ color: TIER_COLOR_LP[last.tier] ?? "#888" }}>
              {last.tier} {["CHALLENGER","GRANDMASTER","MASTER"].includes(last.tier) ? "" : last.rank} · {last.lp} LP
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/50">
            {new Date(last.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
    </div>
  );
}

function LiveGameBanner({ data, selfPuuid }: { data: any; selfPuuid?: string }) {
  if (!data) return null;

  const [elapsed, setElapsed] = useState<number>(data.gameLength ?? 0);
  useEffect(() => {
    setElapsed(data.gameLength ?? 0);
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [data.gameLength]);

  const t1 = (data.participants ?? []).filter((p: any) => p.teamId === 100);
  const t2 = (data.participants ?? []).filter((p: any) => p.teamId === 200);
  const b1 = (data.bans ?? []).filter((b: any) => b.teamId === 100).sort((a: any, b: any) => a.pickTurn - b.pickTurn);
  const b2 = (data.bans ?? []).filter((b: any) => b.teamId === 200).sort((a: any, b: any) => a.pickTurn - b.pickTurn);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const modeLabel: Record<string, string> = {
    CLASSIC: "Rankingowa", ARAM: "ARAM", URF: "URF", ONEFORALL: "OFA", TUTORIAL: "Tutorial",
  };

  function SpellIcon({ id }: { id: number }) {
    const name = SPELL_IMG[id];
    if (!name) return <div className="w-4 h-4 rounded bg-muted/30" />;
    return <img src={`${getDDBase()}/spell/${name}.png`} alt={name} className="w-4 h-4 rounded border border-border" onError={(e) => { e.currentTarget.style.display = "none"; }} />;
  }

  function RuneStyleIcon({ styleId, size = 14 }: { styleId: number; size?: number }) {
    const name = RUNE_STYLE_ICON[styleId];
    if (!name) return <div style={{ width: size, height: size }} className="rounded-full bg-muted/20" />;
    return (
      <img
        src={`https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${name}.png`}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }

  function RankBadge({ tier, division }: { tier: string; division: string }) {
    const color = TIER_COLOR[tier] ?? "#6B6B6B";
    const abbr = TIER_ABBR[tier] ?? "?";
    const showDiv = !["CHALLENGER", "GRANDMASTER", "MASTER"].includes(tier) && division;
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center rounded text-[8px] font-extrabold leading-none"
        style={{ color, border: `1px solid ${color}40`, background: `${color}12`, minWidth: 22, height: 16, padding: "0 3px" }}
        title={tier + (showDiv ? ` ${division}` : "")}
      >
        {abbr}{showDiv ? ` ${division}` : ""}
      </div>
    );
  }

  function BanRow({ bans, color }: { bans: any[]; color: string }) {
    if (!bans.length) return null;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {bans.map((b: any, i: number) => (
          <div key={i} title={b.championName === "Brak" ? "Brak bana" : b.championName}
            className={`relative rounded overflow-hidden ${b.championName === "Brak" ? "opacity-30" : ""}`}>
            {b.championName !== "Brak" ? (
              <>
                <img src={`${getDDBase()}/champion/${b.championName}.png`} alt={b.championName}
                  className="w-6 h-6 object-cover grayscale opacity-60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div className={`absolute inset-0 ${color === "blue" ? "bg-blue-100/60" : "bg-red-100/60"}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-foreground/60 text-[8px] font-bold">✕</span>
                </div>
              </>
            ) : (
              <div className="w-6 h-6 rounded bg-muted border border-border flex items-center justify-center">
                <span className="text-muted-foreground/30 text-[9px]">?</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden mb-5 border"
      style={{ background: "linear-gradient(135deg, #12271f 0%, white 100%)", borderColor: "#2a5c45" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "#12271f", background: "#12271f" }}>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span className="text-sm font-bold text-green-600 tracking-wide">LIVE</span>
          <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: "#12271f", color: "#a8b0bf" }}>
            {modeLabel[data.gameMode] ?? data.gameMode}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-green-600">
          <Clock className="w-3.5 h-3.5" />
          {fmt(elapsed)}
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {[{ participants: t1, bans: b1, color: "blue", label: "Niebiescy" }, { participants: t2, bans: b2, color: "red", label: "Czerwoni" }].map(({ participants, bans, color, label }) => (
          <div key={color} className="p-3">
            <p className={`text-[9px] uppercase tracking-[0.18em] font-bold mb-2 ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>{label}</p>
            <div className="space-y-1.5">
              {participants.map((pl: any, i: number) => {
                const isSelf = pl.puuid === selfPuuid;
                return (
                  <div key={i} className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg transition-colors ${isSelf ? (color === "blue" ? "bg-blue-50 ring-1 ring-blue-200" : "bg-red-50 ring-1 ring-red-200") : "hover:bg-muted"}`}>
                    {/* Champion icon */}
                    <img src={`${getDDBase()}/champion/${pl.championName}.png`} alt={pl.championName}
                      className="w-7 h-7 rounded-md border flex-shrink-0"
                      style={{ borderColor: color === "blue" ? "rgba(59,130,246,0.2)" : "rgba(239,68,68,0.2)" }}
                      onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }} />
                    {/* Name + champion */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] truncate font-medium leading-tight ${isSelf ? (color === "blue" ? "text-blue-700" : "text-red-700") : "text-foreground/80"}`}>
                        {isSelf ? "▶ " : ""}{pl.summonerName}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 truncate leading-tight">{pl.championName}</p>
                    </div>
                    {/* Rank badge */}
                    {pl.rankedTier && pl.rankedTier !== "UNRANKED" && (
                      <RankBadge tier={pl.rankedTier} division={pl.rankedDivision ?? ""} />
                    )}
                    {/* Rune path icons */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <RuneStyleIcon styleId={pl.perks?.perkStyle ?? 0} size={14} />
                      <RuneStyleIcon styleId={pl.perks?.perkSubStyle ?? 0} size={12} />
                    </div>
                    {/* Summoner spells */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <SpellIcon id={pl.spell1Id} />
                      <SpellIcon id={pl.spell2Id} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bans */}
            {bans.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-border">
                <p className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1.5">Bany</p>
                <BanRow bans={bans} color={color} />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const OP_SCORE_TOOLTIP = `OP Score (skala 0–10) — własna miara wydajności w meczu:

• KDA 35%: (kills+assists)/śmierci (log)
• Udział w killach 20%: % zabójstw drużyny
• Obrażenia 15%: całkowite obrażenia (maks. 15k)
• CS/min 15%: tempo farmienia
• Przeżywalność 15%: 100 − śmierci×12
• Bonus za wygraną: +1.5 pkt

Zielony ≥ 8.0 · Żółty ≥ 6.0 · Czerwony < 6.0`;

function OpScoreBadge({ score }: { score: number }) {
  const [open, setOpen] = useState(false);
  const color = score >= 8 ? "text-green-400 bg-green-500/10 border-green-500/20"
    : score >= 6 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className="relative flex-shrink-0 inline-flex">
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-help ${color}`}
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
            className="absolute bottom-6 right-0 z-[100] w-56 text-[10px] text-foreground/85 leading-relaxed pointer-events-none whitespace-pre-line"
            style={{ background: "#121926", border: "1px solid #233047", borderRadius: "8px", padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            {OP_SCORE_TOOLTIP}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

const GRADE_TOOLTIP = `Ocena literowa (skala 0–100):
S+ ≥ 90 · S ≥ 80 · A ≥ 70
B ≥ 58 · C ≥ 45 · D ≥ 30 · F < 30`;

function GradeBadge({ grade, score, color }: { grade: string; score: number; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <span
        className={`text-3xl font-black cursor-help select-none ${color}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >{grade}</span>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: -3, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-9 left-0 z-[100] w-48 text-[10px] text-foreground/85 leading-relaxed pointer-events-none whitespace-pre-line"
            style={{ background: "#121926", border: "1px solid #233047", borderRadius: "8px", padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <span className="block font-bold mb-1 text-foreground">Wynik: {score}/100</span>
            {GRADE_TOOLTIP}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function RadarChart({ data }: { data: { aggression: number; farming: number; vision: number; teamfighting: number; carry: number } }) {
  const cx = 100, cy = 100, r = 70;
  const labels = [
    { key: "aggression", label: "Agresja" },
    { key: "farming", label: "Farmienie" },
    { key: "vision", label: "Wizja" },
    { key: "teamfighting", label: "Walki" },
    { key: "carry", label: "Carry" },
  ];
  const angles = labels.map((_, i) => (i * 72 - 90) * (Math.PI / 180));
  const values = labels.map((l) => (data as any)[l.key] / 100);
  const pts = (fracs: number[]) => fracs.map((f, i) => ({
    x: cx + f * r * Math.cos(angles[i]),
    y: cy + f * r * Math.sin(angles[i]),
  }));
  const toPath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const axisEndPts = pts(Array(5).fill(1));
  const dataPts = pts(values);
  const labelPts = pts(Array(5).fill(1.28));
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {gridLevels.map((lvl) => {
        const gPts = pts(Array(5).fill(lvl));
        return <path key={lvl} d={toPath(gPts)} fill="none" stroke="#233047" strokeWidth="1" />;
      })}
      {axisEndPts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#233047" strokeWidth="1" />
      ))}
      <path d={toPath(dataPts)} fill="rgba(0,130,180,0.12)" stroke="#d2ad62" strokeWidth="1.5" />
      {dataPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#d2ad62" />)}
      {labelPts.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          className="fill-muted-foreground" style={{ fontSize: "9px", fill: "#a8b0bf", fontFamily: "inherit" }}>
          {labels[i].label}
          <tspan x={p.x} dy="10" style={{ fontSize: "8px", fill: "#d2ad62", fontWeight: "bold" }}>
            {Math.round((data as any)[labels[i].key])}
          </tspan>
        </text>
      ))}
    </svg>
  );
}

type ChampSortCol = "gamesPlayed" | "winRate" | "kda" | "killParticipation" | "avgCsPerMin" | "damageShare" | "performanceScore";

function ChampionBreakdownTable({ championBreakdown, region, gameName, tagLine }: { championBreakdown: any[]; region: string; gameName: string; tagLine: string }) {
  const [sortCol, setSortCol] = useState<ChampSortCol>("gamesPlayed");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  function handleSort(col: ChampSortCol) {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sorted = [...(championBreakdown ?? [])].sort((a: any, b: any) => {
    const diff = (a[sortCol] ?? 0) - (b[sortCol] ?? 0);
    return sortDir === "desc" ? -diff : diff;
  });

  function SortIcon({ col }: { col: ChampSortCol }) {
    if (sortCol !== col) return <span className="opacity-20">↕</span>;
    return <span className="text-primary">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  function Th({ col, label, className = "" }: { col: ChampSortCol; label: string; className?: string }) {
    return (
      <th className={`pb-2 px-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
        onClick={() => handleSort(col)}>
        <span className="flex items-center gap-0.5 justify-center">{label} <SortIcon col={col} /></span>
      </th>
    );
  }

  if (!championBreakdown || championBreakdown.length === 0) return null;

  return (
    <div className="glass-panel p-4">
      <p className="section-title"><Swords className="w-3.5 h-3.5 text-primary" /> Wyniki na bohaterach <InfoTooltip text="Statystyki z ostatnich 20 meczy pogrupowane po bohaterach. Kliknij nagłówek kolumny, żeby posortować. KDA = (Zabójstwa+Asysty)/Śmierci. KP% = udział w zabójstwach drużyny. CS/min = minionki na minutę. Dmg% = Twój procent obrażeń całej drużyny. Wynik = ogólna ocena 0–100." /></p>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
          <thead>
            <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 px-2 font-medium">Bohater</th>
              <Th col="gamesPlayed" label="G" className="w-10" />
              <th className="pb-2 px-2 text-center font-medium w-28">W / L</th>
              <Th col="winRate" label="WR" />
              <th className="pb-2 px-2 text-center font-medium">K / D / A</th>
              <Th col="kda" label="KDA" />
              <Th col="killParticipation" label="KP%" />
              <Th col="avgCsPerMin" label="CS/min" />
              <Th col="damageShare" label="Dmg%" />
              <Th col="performanceScore" label="Wynik" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sorted.map((ch: any, i: number) => {
              const pc = ch.performanceScore >= 70 ? "bg-green-500" : ch.performanceScore >= 50 ? "bg-yellow-500" : "bg-red-500";
              const champUrl = `/champion/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/${ch.championName}`;
              const wins = ch.wins ?? Math.round((ch.winRate / 100) * ch.gamesPlayed);
              const losses = ch.losses ?? (ch.gamesPlayed - wins);
              const totalForBar = wins + losses || 1;
              return (
                <tr key={i} className="hover:bg-muted/15 transition-colors">
                  <td className="py-2 px-2">
                    <Link href={champUrl} className="flex items-center gap-2 group">
                      <img src={`${getDDBase()}/champion/${ch.championName}.png`} alt="" className="w-6 h-6 rounded-full border border-border"
                        onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }} />
                      <span className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">{ch.championName}</span>
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-center text-xs font-mono">{ch.gamesPlayed}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1 text-[9px] font-mono mb-0.5">
                      <span className="text-win">{wins}W</span>
                      <span className="text-muted-foreground/40">/</span>
                      <span className="text-loss">{losses}L</span>
                    </div>
                    <div className="flex h-1 rounded-full overflow-hidden w-20">
                      <div className="bg-win rounded-l-full" style={{ width: `${(wins / totalForBar) * 100}%` }} />
                      <div className="bg-loss rounded-r-full flex-1" />
                    </div>
                  </td>
                  <td className={`py-2 px-2 text-center text-xs font-mono font-semibold ${ch.winRate >= 50 ? "text-win" : "text-loss"}`}>{ch.winRate}%</td>
                  <td className="py-2 px-2 text-center text-[10px] font-mono text-muted-foreground">
                    {ch.avgKills != null ? (
                      <span>
                        <span className="text-foreground/80">{ch.avgKills.toFixed(1)}</span>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="text-loss">{ch.avgDeaths?.toFixed(1)}</span>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="text-foreground/80">{ch.avgAssists?.toFixed(1)}</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2 px-2 text-center text-xs font-mono">{ch.kda.toFixed(2)}</td>
                  <td className="py-2 px-2 text-center text-xs font-mono">
                    <span className={ch.killParticipation >= 60 ? "text-green-400" : ch.killParticipation >= 40 ? "text-yellow-400" : "text-red-400"}>
                      {(ch.killParticipation ?? 0).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center text-xs font-mono">{ch.avgCsPerMin.toFixed(1)}</td>
                  <td className="py-2 px-2 text-center text-xs font-mono">
                    <span className={(ch.damageShare ?? 0) >= 25 ? "text-orange-400" : "text-muted-foreground"}>{(ch.damageShare ?? 0).toFixed(0)}%</span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{ch.performanceScore}</span>
                      <div className="w-12 h-1 bg-muted/60 rounded-full overflow-hidden"><div className={`h-full ${pc}`} style={{ width: `${ch.performanceScore}%` }} /></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchParticipantRow({ p, isSelf }: { p: any; isSelf: boolean }) {
  const kda = p.deaths === 0 ? "Perf" : ((p.kills + p.assists) / p.deaths).toFixed(1);
  const dmgK = Math.round(p.totalDamageDealt / 1000);
  const goldK = (p.goldEarned / 1000).toFixed(1);
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${isSelf ? (p.win ? "bg-win/10 ring-1 ring-win/30" : "bg-loss/10 ring-1 ring-loss/30") : "hover:bg-muted"}`}>
      <img
        src={`${getDDBase()}/champion/${p.championName}.png`}
        alt={p.championName}
        className="w-7 h-7 rounded-md border border-border flex-shrink-0"
        onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }}
      />
      <div className="flex-1 min-w-0">
        <span className={`text-xs truncate block font-medium ${isSelf ? "text-primary" : "text-foreground/80"}`}>
          {p.summonerName || p.championName}
        </span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground w-16 text-center flex-shrink-0">
        {p.kills}/<span className="text-loss">{p.deaths}</span>/{p.assists}
      </span>
      <span className="text-[10px] text-muted-foreground w-8 text-right flex-shrink-0">{kda}</span>
      <span className="text-[10px] text-muted-foreground w-10 text-right flex-shrink-0">{p.cs} CS</span>
      <span className="text-[10px] text-muted-foreground w-10 text-right flex-shrink-0">{dmgK}K</span>
      <span className="text-[10px] text-yellow-500/80 w-10 text-right flex-shrink-0">{goldK}K</span>
      <OpScoreBadge score={p.opScore} />
    </div>
  );
}

function MatchRow({ match, index, selfPuuid, region, gameName, tagLine }: { match: any; index: number; selfPuuid?: string; region?: string; gameName?: string; tagLine?: string }) {
  const [expanded, setExpanded] = useState(false);
  const w = match.win;
  const kda = match.deaths === 0 ? "Perf" : ((match.kills + match.assists) / match.deaths).toFixed(1);
  const dur = `${Math.floor(match.gameDuration / 60)}:${(match.gameDuration % 60).toString().padStart(2, "0")}`;
  const timeAgo = formatDistanceToNow(new Date(match.gameEndTimestamp), { addSuffix: true, locale: pl });

  const participants: any[] = match.participants ?? [];
  const team1 = participants.filter((p: any) => p.teamId === 100);
  const team2 = participants.filter((p: any) => p.teamId === 200);
  const hasParticipants = participants.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}>
      {/* Main row — click to expand */}
      <div
        title={timeAgo}
        onClick={() => hasParticipants && setExpanded(v => !v)}
        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border-l-2 transition-colors
          ${w ? "border-l-win bg-win-bg/30" : "border-l-loss bg-loss-bg/30"}
          ${hasParticipants ? "cursor-pointer hover:bg-muted" : ""}
          ${expanded ? (w ? "rounded-b-none" : "rounded-b-none") : ""}`}
      >
        <div className="relative flex-shrink-0">
          <img src={`${getDDBase()}/champion/${match.championName}.png`} alt={match.championName} className="w-8 h-8 rounded-lg border border-border"
            onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }} />
          {match.opponent && (
            <img src={`${getDDBase()}/champion/${match.opponent.championName}.png`} alt={match.opponent.championName}
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-border bg-card"
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold ${w ? "text-win" : "text-loss"}`}>{w ? "W" : "L"}</span>
            <span className="font-mono text-xs font-semibold">
              {match.kills}<span className="text-muted-foreground/50">/</span><span className="text-loss">{match.deaths}</span><span className="text-muted-foreground/50">/</span>{match.assists}
            </span>
            <span className="text-[10px] text-muted-foreground">{kda}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">{match.cs} CS · {dur}</div>
        </div>
        {match.opScore !== undefined && <OpScoreBadge score={match.opScore} />}
        {region && gameName && tagLine && match.matchId && (
          <Link
            href={`/match/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/${match.matchId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 text-muted-foreground/30 hover:text-primary transition-colors"
            title="Szczegóły meczu"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
        {hasParticipants && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
          </motion.div>
        )}
      </div>

      {/* Expanded participants panel */}
      <AnimatePresence>
        {expanded && hasParticipants && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`border border-t-0 rounded-b-lg px-3 pb-3 pt-2 ${w ? "border-win/20 bg-win/5" : "border-loss/20 bg-loss/5"}`}>
              {/* Header row */}
              <div className="flex items-center gap-2 px-2 pb-1.5 mb-1 border-b border-border">
                <div className="w-7 flex-shrink-0" />
                <div className="flex-1" />
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider w-16 text-center flex-shrink-0">KDA</span>
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider w-8 text-right flex-shrink-0">Ratio</span>
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider w-10 text-right flex-shrink-0">CS</span>
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider w-10 text-right flex-shrink-0">DMG</span>
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider w-10 text-right flex-shrink-0">Złoto</span>
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider w-8 text-right flex-shrink-0">OP</span>
              </div>

              {/* Team 1 */}
              <div className="mb-2">
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest px-2 mb-1">
                  {w && team1.some((p: any) => p.puuid === selfPuuid) ? "✓ " : ""}Drużyna Niebieska
                  <span className={`ml-1.5 ${team1[0]?.win ? "text-win" : "text-loss"}`}>
                    {team1[0]?.win ? "WYGRANA" : "PRZEGRANA"}
                  </span>
                </p>
                <div className="space-y-0.5">
                  {team1.map((p: any, i: number) => (
                    <MatchParticipantRow key={i} p={p} isSelf={p.puuid === selfPuuid} />
                  ))}
                </div>
              </div>

              {/* Team 2 */}
              <div>
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest px-2 mb-1">
                  {!w && team2.some((p: any) => p.puuid === selfPuuid) ? "✓ " : ""}Drużyna Czerwona
                  <span className={`ml-1.5 ${team2[0]?.win ? "text-win" : "text-loss"}`}>
                    {team2[0]?.win ? "WYGRANA" : "PRZEGRANA"}
                  </span>
                </p>
                <div className="space-y-0.5">
                  {team2.map((p: any, i: number) => (
                    <MatchParticipantRow key={i} p={p} isSelf={p.puuid === selfPuuid} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RankedCard({ entry }: { entry: any }) {
  const tier = entry?.tier ?? "UNRANKED";
  const totalGames = entry ? entry.wins + entry.losses : 0;
  const wr = totalGames ? Math.round((entry.wins / totalGames) * 100) : 0;
  const queueLabel = entry?.queueType === "RANKED_SOLO_5x5" ? "Solo / Duo" : entry?.queueType === "RANKED_FLEX_SR" ? "Flex 5v5" : "Rankingowe";
  const wrBarColor = wr >= 55 ? "#22c55e" : wr >= 50 ? "#eab308" : "#ef4444";
  const tierColor = TIER_COLOR[tier] ?? "#6B6B6B";

  const lpToPromo = entry ? 100 - (entry.leaguePoints ?? 0) : 0;
  const lpPct = entry ? Math.min(entry.leaguePoints ?? 0, 100) : 0;
  const isApex = ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier);

  const avgLPPerGame = totalGames > 0 ? Math.round((wr / 100) * 22 - ((100 - wr) / 100) * 18) : 0;
  const gamesToPromo = avgLPPerGame > 0 && !isApex ? Math.ceil(lpToPromo / avgLPPerGame) : null;

  const NEXT_RANK: Record<string, string> = {
    IV: "III", III: "II", II: "I", I: "następny tier",
  };
  const nextLabel = entry?.rank ? (entry.rank === "I" ? (() => {
    const tiers = ["IRON","BRONZE","SILVER","GOLD","PLATINUM","EMERALD","DIAMOND"];
    const idx = tiers.indexOf(tier);
    if (idx >= 0 && idx < tiers.length - 1) return tiers[idx + 1] + " IV";
    if (tier === "DIAMOND") return "Master";
    return "Wyżej";
  })() : `${tier} ${NEXT_RANK[entry.rank] ?? ""}`) : "";

  return (
    <div className="relative overflow-hidden gradient-border-cyan"
      style={{
        background: "#121926",
        border: "1px solid #233047",
        borderRadius: "8px",
        borderLeft: `3px solid ${tierColor}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tier.toLowerCase()}.png`}
              alt={tier} className="w-12 h-12 object-contain drop-shadow-lg" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="data-label mb-0">{queueLabel}</p>
              {entry?.hotStreak && (
                <span className="flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-[3px]"
                  style={{ background: "#2a2212", color: "#e8a93c", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.05em" }}>
                  <Flame className="w-2.5 h-2.5" /> SERIA
                </span>
              )}
              {entry?.veteran && (
                <span className="flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-[3px]"
                  style={{ background: "#1f1a33", color: "#9c7bff", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.05em" }}>
                  <Award className="w-2.5 h-2.5" /> WETERAN
                </span>
              )}
              {entry?.freshBlood && (
                <span className="flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-[3px]"
                  style={{ background: "#12271f", color: "#46c08a", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.05em" }}>
                  <Sparkles className="w-2.5 h-2.5" /> NOWY
                </span>
              )}
            </div>
            <p className="text-sm font-bold leading-tight" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, color: tierColor }}>
              {tier}{entry?.rank ? ` ${entry.rank}` : ""}
            </p>
            {entry && (
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="text-foreground font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                  {entry.leaguePoints} <span className="text-muted-foreground font-normal text-[10px]">LP</span>
                </span>
                <span className="text-muted-foreground text-[10px]">·</span>
                <span className="text-muted-foreground text-[10px]">{entry.wins}W {entry.losses}L</span>
                <span className={`font-bold text-[10px] ml-auto ${wr >= 50 ? "text-win" : "text-loss"}`}>{wr}%</span>
              </div>
            )}
          </div>
        </div>

        {entry && !isApex && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-muted-foreground">Postęp do awansu</span>
              <span className="text-[9px] font-bold" style={{ color: tierColor, fontFamily: "'Barlow Condensed',sans-serif" }}>
                {nextLabel}
              </span>
            </div>
            <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: "#233047" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${lpPct}%`,
                background: `linear-gradient(90deg, ${tierColor}88, ${tierColor})`,
              }} />
              <div className="absolute top-0 right-0 h-full w-px" style={{ background: "#233047" }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{entry.leaguePoints}/100 LP</span>
              {gamesToPromo !== null && gamesToPromo > 0 && (
                <span className="text-[9px] text-muted-foreground">
                  ~{gamesToPromo} {gamesToPromo === 1 ? "gra" : gamesToPromo < 5 ? "gry" : "gier"} do promo
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {entry && (
        <div className="px-3 pb-2.5 pt-0">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="text-center py-1.5 rounded-[5px]" style={{ background: "#172031" }}>
              <p className="text-[10px] font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif", color: "#ece6d6" }}>{totalGames}</p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Gier</p>
            </div>
            <div className="text-center py-1.5 rounded-[5px]" style={{ background: "#172031" }}>
              <p className="text-[10px] font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif", color: wrBarColor }}>{wr}%</p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'Rajdhani',sans-serif" }}>WR</p>
            </div>
            <div className="text-center py-1.5 rounded-[5px]" style={{ background: "#172031" }}>
              <p className="text-[10px] font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif", color: avgLPPerGame > 0 ? "#22c55e" : avgLPPerGame < 0 ? "#ef4444" : "#888" }}>
                {avgLPPerGame > 0 ? `+${avgLPPerGame}` : avgLPPerGame}
              </p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'Rajdhani',sans-serif" }}>LP/mecz</p>
            </div>
          </div>

          <div className="mt-2 w-full h-1 rounded-full overflow-hidden flex" style={{ background: "#233047" }}>
            <div className="h-full rounded-l-full" style={{ width: `${wr}%`, background: "#22c55e" }} />
            <div className="h-full rounded-r-full" style={{ width: `${100 - wr}%`, background: "#ef4444" }} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[8px] font-bold" style={{ color: "#22c55e" }}>{entry.wins}W</span>
            <span className="text-[8px] font-bold" style={{ color: "#ef4444" }}>{entry.losses}L</span>
          </div>
        </div>
      )}
    </div>
  );
}

function GradeChip({ grade, score, label }: { grade: string; score?: number; label: string }) {
  const color = grade === "S" ? "#22c55e" : grade === "A" ? "#3b82f6" : grade === "B" ? "#f59e0b" : grade === "C" ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}40` }}>
      <span className="font-black text-base leading-none" style={{ color, fontFamily: "'Barlow Condensed',sans-serif" }}>{grade}</span>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-wide leading-none">{label}</span>
        {score !== undefined && <span className="text-[10px] font-bold leading-none mt-0.5" style={{ color }}>{score}/100</span>}
      </div>
    </div>
  );
}

function BenchmarkRow({ stat, playerValue, tierAvg, unit, pctDiff }: { stat: string; playerValue: number; tierAvg: number; unit: string; pctDiff: number }) {
  const isGood = pctDiff >= 0;
  const color = isGood ? "#22c55e" : "#ef4444";
  const barPct = Math.min(Math.abs(pctDiff) / 50, 1) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-foreground/60 w-20 flex-shrink-0 leading-tight">{stat}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#233047" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums flex-shrink-0" style={{ color }}>{isGood ? "+" : ""}{pctDiff}%</span>
      <span className="text-[9px] text-foreground/45 flex-shrink-0 w-20 text-right">{playerValue}{unit} vs {tierAvg}{unit}</span>
    </div>
  );
}

function ProfileTextSummary({ data, gameName }: { data: any; gameName: string }) {
  if (!data || data.totalGamesAnalyzed === 0) return null;
  const {
    overallScore, overallRating, totalGamesAnalyzed, winRate, playstyleArchetype, playstyleDescription,
    primaryRole, formTrend, championBreakdown, rankBenchmarks, predictedTier,
    lanePhaseStats, improvementRoadmap, metrics, currentStreak, objectiveStats,
  } = data;

  const topChamps = (championBreakdown ?? []).slice(0, 4);
  const allBenchmarks = rankBenchmarks ?? [];
  const aboveAvg = allBenchmarks.filter((b: any) => b.pctDiff >= 5);
  const belowAvg = allBenchmarks.filter((b: any) => b.pctDiff <= -5);

  const kdaMetric = metrics?.find((m: any) => m.name === "KDA");
  const csMetric = metrics?.find((m: any) => m.name === "Efektywność CS");
  const visionMetric = metrics?.find((m: any) => m.name === "Kontrola wizji");
  const dmgMetric = metrics?.find((m: any) => m.name === "Obrażenia");
  const kpMetric = metrics?.find((m: any) => m.name === "Uczestnictwo w zabójstwach");

  const RATING_COLOR: Record<string, string> = {
    "S+": "#d97706", S: "#d97706", "A+": "#22c55e", A: "#22c55e",
    "B+": "#3b82f6", B: "#3b82f6", "C+": "#f97316", C: "#f97316", D: "#ef4444",
  };
  const ratingColor = RATING_COLOR[overallRating] ?? "#3b82f6";

  const formIsHot = formTrend?.recentWinRate != null && formTrend.recentWinRate > (formTrend.overallWinRate ?? 50);
  const formColor = formIsHot ? "#22c55e" : "#ef4444";

  const topPriority = (improvementRoadmap ?? [])[0];
  const secondPriority = (improvementRoadmap ?? [])[1];

  const ROLE_PL: Record<string, string> = { Top: "top", Jungler: "jungle", Mid: "mid", ADC: "ADC", Support: "support", Nieznana: "?" };

  return (
    <article className="glass-panel p-4 mb-4 space-y-4">
      <h2 className="section-title">
        <BookOpen className="w-3.5 h-3.5 text-primary" /> Profil gracza — podsumowanie
      </h2>

      {/* Hero row: rating + archetype + key chips */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-shrink-0 text-center px-3 py-2 rounded-xl" style={{ background: `${ratingColor}15`, border: `1px solid ${ratingColor}40` }}>
          <div className="font-black leading-none" style={{ fontSize: 36, color: ratingColor, fontFamily: "'Barlow Condensed',sans-serif" }}>{overallRating ?? "?"}</div>
          <div className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider mt-0.5">{overallScore}/100</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {playstyleArchetype && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "linear-gradient(135deg,hsl(220,60%,15%),hsl(220,50%,28%))", color: "#C89B3C", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.03em" }}>
                {playstyleArchetype}
              </span>
            )}
            {primaryRole && primaryRole !== "Nieznana" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#262418", color: "#d2ad62" }}>
                {ROLE_EMOJI[primaryRole]} {ROLE_PL[primaryRole] ?? primaryRole}
              </span>
            )}
            {currentStreak && currentStreak.count >= 2 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: currentStreak.type === "win" ? "#12271f" : "#2a1519", color: currentStreak.type === "win" ? "#16a34a" : "#dc2626" }}>
                {currentStreak.type === "win" ? <Flame className="w-2.5 h-2.5" /> : <Snowflake className="w-2.5 h-2.5" />}
                {currentStreak.count} {currentStreak.type === "win" ? "wygranych" : "przegranych"} z rzędu
              </span>
            )}
          </div>
          <p className="text-[11px] text-foreground/70 leading-relaxed">{playstyleDescription}</p>
        </div>
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <div className="text-center px-2.5 py-1.5 rounded-lg" style={{ background: "#172031", border: "1px solid #233047" }}>
            <div className="text-sm font-black" style={{ color: winRate >= 55 ? "#22c55e" : winRate >= 50 ? "#3b82f6" : "#ef4444", fontFamily: "'Barlow Condensed',sans-serif" }}>{winRate}%</div>
            <div className="text-[8px] text-foreground/45 uppercase tracking-wide font-bold">WR</div>
          </div>
          <div className="text-center px-2.5 py-1.5 rounded-lg" style={{ background: "#172031", border: "1px solid #233047" }}>
            <div className="text-sm font-black text-foreground/80" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{totalGamesAnalyzed}</div>
            <div className="text-[8px] text-foreground/45 uppercase tracking-wide font-bold">meczy</div>
          </div>
        </div>
      </div>

      {/* Champion pool */}
      {topChamps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Swords className="w-3 h-3 text-primary/70" />
            <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider">Pool</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {topChamps.map((c: any, i: number) => {
              const wrColor = c.winRate >= 55 ? "#22c55e" : c.winRate >= 50 ? "#3b82f6" : "#f97316";
              return (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "#172031", border: "1px solid #233047" }}>
                  <img src={`${getDDBase()}/champion/${c.championName}.png`} alt={c.championName}
                    className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                    onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }} />
                  <div>
                    <div className="text-[10px] font-bold text-foreground/85 leading-none">{c.championName}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold" style={{ color: wrColor }}>{c.winRate}% WR</span>
                      <span className="text-[8px] text-foreground/40">{c.gamesPlayed}g</span>
                      <span className="text-[8px] text-foreground/40">{c.kda} KDA</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key metrics chips */}
      {(kdaMetric || csMetric || dmgMetric || kpMetric || visionMetric) && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3 h-3 text-primary/70" />
            <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider">Kluczowe wskaźniki</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[kdaMetric, csMetric, dmgMetric, kpMetric, visionMetric].filter(Boolean).map((m: any, i: number) => {
              const isGood = m.grade === "S" || m.grade === "A";
              const isBad = m.grade === "C" || m.grade === "D";
              return (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px]"
                  style={{ background: isGood ? "#12271f" : isBad ? "#2a1519" : "#172031", border: `1px solid ${isGood ? "#2a5c45" : isBad ? "#6b2a30" : "#233047"}` }}>
                  <span className="font-black text-[9px]" style={{ color: isGood ? "#16a34a" : isBad ? "#dc2626" : "#3b82f6", fontFamily: "'Barlow Condensed',sans-serif" }}>{m.grade}</span>
                  <span className="text-foreground/70 font-medium">{m.name}</span>
                  {m.value != null && <span className="font-bold text-foreground/90">{m.value}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Benchmark vs rank avg */}
      {allBenchmarks.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="w-3 h-3 text-primary/70" />
            <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider">
              vs. Średnia rangi{predictedTier?.tier ? ` ${predictedTier.tier}` : ""}
            </span>
          </div>
          <div className="space-y-1.5">
            {[...aboveAvg.slice(0, 3), ...belowAvg.slice(0, 3)].map((b: any, i: number) => (
              <BenchmarkRow key={i} stat={b.stat} playerValue={b.playerValue} tierAvg={b.tierAvg} unit={b.unit ?? ""} pctDiff={b.pctDiff} />
            ))}
          </div>
        </div>
      )}

      {/* Form + Lane + Objectives row */}
      <div className="flex gap-2 flex-wrap">
        {formTrend?.trendDescription && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[140px]" style={{ background: `${formColor}10`, border: `1px solid ${formColor}35` }}>
            <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: formColor }} />
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-wide text-foreground/50">Forma</div>
              <div className="text-[10px] font-bold leading-tight truncate" style={{ color: formColor }}>{formTrend.trendDescription}</div>
              {formTrend.recentWinRate != null && (
                <div className="text-[9px] text-foreground/50">{formTrend.recentWinRate}% WR (ost. {formTrend.recentGames ?? 7} meczy)</div>
              )}
            </div>
          </div>
        )}
        {lanePhaseStats?.grade && (
          <GradeChip grade={lanePhaseStats.grade} score={lanePhaseStats.earlyPressureScore} label="Laning" />
        )}
        {objectiveStats?.grade && (
          <GradeChip grade={objectiveStats.grade} score={objectiveStats.objectiveControlScore} label="Oboektywu" />
        )}
      </div>

      {/* Lane phase quick stats */}
      {lanePhaseStats?.earlyPressureScore > 0 && (
        <div className="flex gap-3 flex-wrap text-[10px] text-foreground/65">
          <span className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-primary/50" /> First blood: <b className="text-foreground/80">{lanePhaseStats.firstBloodRate?.toFixed(0) ?? 0}%</b></span>
          <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-primary/50" /> Solo kills/mecz: <b className="text-foreground/80">{lanePhaseStats.avgEarlyKills?.toFixed(1) ?? 0}</b></span>
          <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-primary/50" /> CS przewaga: <b className="text-foreground/80">{lanePhaseStats.avgCsAdvantage?.toFixed(0) ?? 0}</b></span>
        </div>
      )}

      {/* Improvement roadmap */}
      {topPriority && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowUpRight className="w-3 h-3 text-primary/70" />
            <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider">Priorytety rozwoju</span>
          </div>
          <div className="space-y-1.5">
            {[topPriority, secondPriority].filter(Boolean).map((p: any, i: number) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: i === 0 ? "#2a1519" : "#172031", border: `1px solid ${i === 0 ? "#6b2a30" : "#233047"}` }}>
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black mt-0.5"
                  style={{ background: i === 0 ? "#f0545c" : "#3a4760", color: "white" }}>{i + 1}</div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-foreground/85">{p.area}</div>
                  <div className="text-[9px] text-foreground/55 leading-snug mt-0.5">
                    {p.currentValue} → {p.targetValue}
                    {p.estimatedLpGain > 0 && <span className="ml-1.5 font-bold text-green-600">+~{p.estimatedLpGain} LP</span>}
                  </div>
                  {p.tip && <div className="text-[9px] text-foreground/55 leading-snug mt-0.5 italic">{p.tip}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function PlaystyleSection({ data }: { data: any }) {
  if (!data) return null;
  const { playstyleArchetype, playstyleDescription, gameplayPatterns, playstyleRadar, primaryRole, roleDistribution } = data;
  if (!playstyleArchetype) return null;

  const roleEntries = Object.entries(roleDistribution ?? {}).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div className="glass-panel p-4">
      <h2 className="section-title"><Sparkles className="w-3.5 h-3.5 text-primary" /> Styl gry</h2>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{playstyleArchetype}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{primaryRole}</span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed mb-3">{playstyleDescription}</p>
        {roleEntries.length > 1 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Role:</span>
            {roleEntries.map(([role, pct]: any) => (
              <span key={role} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/70 font-medium">
                {ROLE_EMOJI[role] ?? "❓"} {role} {pct}%
              </span>
            ))}
          </div>
        )}
      </div>
      {gameplayPatterns?.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Wzorce gry</h3>
          {gameplayPatterns.map((p: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span className="leading-relaxed">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BiggestMistakesSection({ data }: { data: any }) {
  if (!data) return null;
  const { criticalMistakes, deathAnalysis, tiltIndicator } = data;
  const hasMistakes = criticalMistakes?.length > 0;
  const hasDeath = deathAnalysis && deathAnalysis.avgDeaths > 0;
  const hasTilt = tiltIndicator && tiltIndicator.score > 0;
  if (!hasMistakes && !hasDeath && !hasTilt) return null;

  return (
    <div className="glass-panel p-4 border-red-200/50">
      <h2 className="section-title"><XCircle className="w-3.5 h-3.5 text-red-400" /> Największe błędy</h2>

      {hasDeath && (
        <div className="mb-3">
          <h3 className="text-[10px] uppercase tracking-wider text-red-400/80 font-bold mb-1.5">Analiza śmierci</h3>
          <p className="text-xs text-foreground/80 leading-relaxed mb-2">{deathAnalysis.description}</p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>Śr. śmierci: <span className="font-bold text-red-400">{deathAnalysis.avgDeaths?.toFixed(1)}</span>/mecz</span>
            <span>Czas martwy: <span className="font-bold text-red-400">{deathAnalysis.avgTimeDeadPct?.toFixed(1)}%</span></span>
            {deathAnalysis.deathSpikeRate > 0 && (
              <span>Mecze 7+ śmierci: <span className="font-bold text-red-400">{deathAnalysis.deathSpikeRate?.toFixed(0)}%</span></span>
            )}
          </div>
        </div>
      )}

      {hasTilt && (
        <div className="mb-3">
          <h3 className="text-[10px] uppercase tracking-wider text-orange-400/80 font-bold mb-1.5">Wskaźnik tiltu</h3>
          <p className="text-xs text-foreground/80 leading-relaxed">{tiltIndicator.description}</p>
        </div>
      )}

      {hasMistakes && (
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-red-400/80 font-bold mb-1.5">Krytyczne nawyki</h3>
          <div className="space-y-1.5">
            {criticalMistakes.slice(0, 4).map((m: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground/80 stat-card bg-red-50/50 border-red-200/50 py-2 px-3">
                <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StrengthsSection({ data }: { data: any }) {
  if (!data) return null;
  const { strengths, rankBenchmarks } = data;
  const aboveAvg = (rankBenchmarks ?? []).filter((b: any) => b.pctDiff >= 5);
  if (!strengths?.length && !aboveAvg.length) return null;

  return (
    <div className="glass-panel p-4">
      <h2 className="section-title"><ThumbsUp className="w-3.5 h-3.5 text-green-500" /> Mocne strony</h2>
      {strengths?.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {strengths.map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs text-foreground/80 stat-card py-2 px-3">
              <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{s}</span>
            </div>
          ))}
        </div>
      )}
      {aboveAvg.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-green-600/80 font-bold mb-2">Powyżej średniej rangi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {aboveAvg.map((b: any, i: number) => (
              <div key={i} className="stat-card py-2 px-3 flex items-center justify-between">
                <span className="text-xs text-foreground/80">{b.stat}</span>
                <div className="text-right">
                  <span className="text-xs font-semibold text-foreground">{b.playerValue}{b.unit}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">vs {b.tierAvg}{b.unit}</span>
                  <span className="text-[10px] font-bold text-green-600 ml-1.5">+{b.pctDiff}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeaknessesSection({ data }: { data: any }) {
  if (!data) return null;
  const { weaknesses, rankBenchmarks } = data;
  const belowAvg = (rankBenchmarks ?? []).filter((b: any) => b.pctDiff <= -5);
  if (!weaknesses?.length && !belowAvg.length) return null;

  return (
    <div className="glass-panel p-4">
      <h2 className="section-title"><ThumbsDown className="w-3.5 h-3.5 text-red-500" /> Obszary do poprawy</h2>
      {weaknesses?.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {weaknesses.map((w: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs text-foreground/80 stat-card py-2 px-3">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{w}</span>
            </div>
          ))}
        </div>
      )}
      {belowAvg.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-red-600/80 font-bold mb-2">Poniżej średniej rangi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {belowAvg.map((b: any, i: number) => (
              <div key={i} className="stat-card py-2 px-3 flex items-center justify-between">
                <span className="text-xs text-foreground/80">{b.stat}</span>
                <div className="text-right">
                  <span className="text-xs font-semibold text-foreground">{b.playerValue}{b.unit}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">vs {b.tierAvg}{b.unit}</span>
                  <span className="text-[10px] font-bold text-red-600 ml-1.5">{b.pctDiff}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationsSection({ data }: { data: any }) {
  if (!data) return null;
  const { coachingTips, improvementRoadmap, championRecommendations } = data;
  const hasTips = coachingTips?.length > 0;
  const hasRoadmap = improvementRoadmap?.length > 0;
  const hasChamps = championRecommendations?.length > 0;
  if (!hasTips && !hasRoadmap && !hasChamps) return null;

  return (
    <div className="glass-panel p-4">
      <h2 className="section-title"><GraduationCap className="w-3.5 h-3.5 text-primary" /> Rekomendacje</h2>

      {hasTips && (
        <div className="mb-4">
          <h3 className="text-[10px] uppercase tracking-wider text-primary/80 font-bold mb-2">Wskazówki coachingowe</h3>
          <div className="space-y-2">
            {coachingTips.slice(0, 4).map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/80 stat-card py-2.5 px-3">
                <Zap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasRoadmap && (
        <div className="mb-4">
          <h3 className="text-[10px] uppercase tracking-wider text-primary/80 font-bold mb-2">Priorytety rozwoju</h3>
          <div className="space-y-2">
            {improvementRoadmap.slice(0, 3).map((item: any) => (
              <div key={item.priority} className="stat-card flex items-start gap-3 py-2.5 px-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]"
                  style={{
                    background: item.priority === 1 ? "#2a1519" : item.priority === 2 ? "#2a2212" : "#262418",
                    color: item.priority === 1 ? "#f0545c" : item.priority === 2 ? "#e8a93c" : "#d2ad62",
                    border: `1px solid ${item.priority === 1 ? "#6b2a30" : item.priority === 2 ? "#6b4f22" : "#6b5a35"}`,
                  }}>
                  #{item.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-foreground">{item.area}</span>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">+~{item.estimatedLpGain} LP</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                    <span>Teraz: <span className="font-semibold text-red-500">{item.currentValue}</span></span>
                    <ArrowUpRight className="w-2.5 h-2.5 text-primary" />
                    <span>Cel: <span className="font-semibold text-green-600">{item.targetValue}</span></span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasChamps && (
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-primary/80 font-bold mb-2">Rekomendowane postacie</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {championRecommendations.map((rec: any, i: number) => (
              <div key={i} className="stat-card flex items-start gap-2.5 py-2.5 px-3">
                <img src={`${getDDBase()}/champion/${rec.championName}.png`} alt={rec.championName}
                  className="w-9 h-9 rounded-lg border border-border flex-shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{rec.championName}</p>
                  <p className="text-[10px] text-primary leading-snug">{rec.playstyleMatch}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisSection({ data, isLoading, recentMatches, region, gameName, tagLine }: { data: any; isLoading: boolean; recentMatches?: any[]; region: string; gameName: string; tagLine: string }) {
  if (isLoading) return <div className="glass-panel p-8 flex items-center justify-center min-h-[200px]"><LoadingSpinner text="Analizowanie wyników..." /></div>;
  if (!data || data.totalGamesAnalyzed === 0) return (
    <div className="glass-panel p-6 text-center">
      <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
      <p className="text-sm text-muted-foreground">Za mało danych do analizy. Zagraj więcej meczy.</p>
    </div>
  );

  const { overallScore, overallRating, totalGamesAnalyzed, winRate, metrics, championBreakdown, formTrend, strengths, weaknesses,
    playstyleArchetype, playstyleDescription, criticalMistakes, gameplayPatterns, primaryRole, roleDistribution, currentStreak,
    bestGame, worstGame, coachingTips, championRecommendations, performanceByGameLength, damageTypeBreakdown,
    predictedTier, playstyleRadar, lanePhaseStats, objectiveStats, deathAnalysis, tiltIndicator,
    winConditions, powerCurve, rankBenchmarks, improvementRoadmap, comebackAnalysis, skillshotStats, matchTimeline } = data;

  const sc = overallScore >= 70 ? "text-green-400" : overallScore >= 50 ? "text-yellow-400" : "text-red-400";
  const sr = overallScore >= 70 ? "stroke-green-400" : overallScore >= 50 ? "stroke-yellow-400" : "stroke-red-400";
  const trendIcon = (t: string) => {
    if (t === "hot") return <Flame className="w-4 h-4 text-orange-400" />;
    if (t === "improving") return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    if (t === "declining") return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    if (t === "cold") return <Snowflake className="w-4 h-4 text-blue-300" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">

      {/* Profile Text Summary */}
      <ProfileTextSummary data={data} gameName={gameName} />

      {/* Structured Sections */}
      <PlaystyleSection data={data} />
      <StrengthsSection data={data} />
      <WeaknessesSection data={data} />
      <BiggestMistakesSection data={data} />
      <RecommendationsSection data={data} />

      {/* Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="stat-card flex items-center gap-3 col-span-1">
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" className="stroke-muted/30" strokeWidth="3" fill="transparent" />
              <circle cx="18" cy="18" r="15" className={sr} strokeWidth="3" fill="transparent" strokeDasharray={`${overallScore * 0.942} 94.2`} strokeLinecap="round" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${sc}`}>{overallRating}</span>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Wynik</p>
            <p className={`text-lg font-bold ${sc}`}>{overallScore}</p>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">% wygranych</p>
          <p className={`text-lg font-bold ${winRate >= 50 ? "text-win" : "text-loss"}`}>{winRate}%</p>
          <p className="text-[10px] text-muted-foreground">{totalGamesAnalyzed} meczy</p>
        </div>

        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Rola</p>
          <p className="text-lg font-bold text-foreground flex items-center gap-1.5">{ROLE_EMOJI[primaryRole] ?? "❓"} {primaryRole}</p>
          <p className="text-[10px] text-muted-foreground">
            {Object.entries(roleDistribution ?? {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 2).map(([r, p]) => `${r} ${p}%`).join(" · ")}
          </p>
        </div>

        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Streak</p>
          <p className={`text-lg font-bold flex items-center gap-1 ${currentStreak?.type === "win" ? "text-win" : "text-loss"}`}>
            {currentStreak?.type === "win" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {currentStreak?.count}×{currentStreak?.type === "win" ? "W" : "L"}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Forma</p>
            {trendIcon(formTrend?.trend)}
          </div>
          <p className="text-xs text-foreground mt-1">{formTrend?.trendDescription}</p>
        </div>

        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Trend KDA</p>
          <div className="h-8"><SparklineChart matches={recentMatches ?? []} /></div>
        </div>
      </div>

      {/* Playstyle + Radar + Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display text-sm text-foreground">{playstyleArchetype}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{playstyleDescription}</p>
            </div>
          </div>
          {gameplayPatterns?.length > 0 && (
            <div className="border-t border-border/50 pt-3 mt-3">
              <p className="section-title text-[10px]"><BookOpen className="w-3 h-3" /> Wzorce gry</p>
              <div className="space-y-1">
                {gameplayPatterns.map((p: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-foreground/75"><Zap className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />{p}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel p-4 flex flex-col items-center">
          <p className="section-title self-start"><BarChart3 className="w-3.5 h-3.5 text-primary" /> Pajęczyna stylów <InfoTooltip text="Wykres 5 osi (0–100): Agresja = zabójstwa+asysty na minutę, Farmienie = CS/min, Wizja = wynik wizji, Walki = KP% (udział w zabójstwach drużyny), Carry = różnica KDA wygrane vs porażki." /></p>
          <div className="w-48 h-48 mt-1">
            {playstyleRadar && <RadarChart data={playstyleRadar} />}
          </div>
        </div>

        <div className="glass-panel">
          <div className="p-3 border-b border-border/30">
            <p className="text-[10px] uppercase tracking-widest font-bold text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> Mocne strony</p>
            <ul className="mt-2 space-y-1">
              {strengths?.slice(0, 4).map((s: string, i: number) => <li key={i} className="text-xs text-foreground/75 flex items-start gap-1.5"><span className="text-green-500 mt-0.5">•</span>{s}</li>)}
            </ul>
          </div>
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Słabe strony</p>
            <ul className="mt-2 space-y-1">
              {weaknesses?.slice(0, 4).map((w: string, i: number) => <li key={i} className="text-xs text-foreground/75 flex items-start gap-1.5"><span className="text-red-400 mt-0.5">•</span>{w}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Coaching Tips */}
      {coachingTips?.length > 0 && (
        <div className="glass-panel p-4">
          <p className="section-title"><GraduationCap className="w-3.5 h-3.5 text-primary" /> Plan poprawy <InfoTooltip text="Spersonalizowane porady treningowe wygenerowane przez silnik analizy na podstawie Twoich najsłabszych wskaźników wydajności. Skupienie się na tych punktach da najszybszy wzrost rangi." /></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {coachingTips.map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 stat-card">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <p className="text-xs text-foreground/80 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Champion Recommendations */}
      {championRecommendations?.length > 0 && (
        <div className="glass-panel p-4">
          <p className="section-title"><Star className="w-3.5 h-3.5 text-yellow-400" /> Rekomendowane postacie <InfoTooltip text="Bohaterowie dobrani do Twojego stylu gry. Silnik analizy porównuje Twój archetyp (agresja, farmienie, wizja, walki drużynowe) z profilem każdej postaci i wybiera najlepiej pasujące." /></p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {championRecommendations.map((rec: any, i: number) => (
              <div key={i} className="stat-card flex items-start gap-3">
                <img src={`${getDDBase()}/champion/${rec.championName}.png`} alt={rec.championName}
                  className="w-11 h-11 rounded-lg border border-border flex-shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{rec.championName}</p>
                  <p className="text-[10px] text-primary leading-snug">{rec.playstyleMatch}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Timeline Chart */}
      {matchTimeline?.length > 2 && (
        <div className="glass-panel p-4">
          <p className="section-title"><Activity className="w-3.5 h-3.5 text-primary" /> Oś czasu wydajności <InfoTooltip text="Wykres wydajności per mecz — od najstarszego (lewa) do najnowszego (prawa). Kolor słupka: zielony = wygrana, czerwony = porażka. Linia łącząca pokazuje trend wyników w czasie." /></p>
          <div className="mt-3 overflow-x-auto">
            <svg viewBox={`0 0 ${Math.max(matchTimeline.length * 48, 300)} 140`} className="w-full" style={{ minWidth: matchTimeline.length * 36 }}>
              {[20, 40, 60, 80].map((y) => (
                <g key={y}>
                  <line x1="24" y1={120 - y} x2={matchTimeline.length * 48 - 8} y2={120 - y} stroke="#233047" strokeWidth="0.5" strokeDasharray="3,3" />
                  <text x="8" y={124 - y} fontSize="8" fill="#8d97aa" textAnchor="end">{y}</text>
                </g>
              ))}
              {matchTimeline.slice().reverse().map((m: any, i: number, arr: any[]) => {
                const x = 32 + i * 44;
                const h = (m.performanceScore / 100) * 95;
                const barColor = m.win ? "#46c08a" : "#f0545c";
                const nextM = arr[i + 1];
                const nx = nextM ? 32 + (i + 1) * 44 : 0;
                const nh = nextM ? (nextM.performanceScore / 100) * 95 : 0;
                return (
                  <g key={m.matchId}>
                    <rect x={x - 12} y={120 - h} width="24" height={h} rx="3" fill={barColor} opacity="0.7" />
                    <text x={x} y={120 - h - 4} fontSize="8" fontWeight="700" fill={m.win ? "#46c08a" : "#f0545c"} textAnchor="middle">{m.performanceScore}</text>
                    <text x={x} y={133} fontSize="7" fill="#8d97aa" textAnchor="middle">{m.kills}/{m.deaths}/{m.assists}</text>
                    {nextM && <line x1={x} y1={120 - h} x2={nx} y2={120 - nh} stroke="#d2ad62" strokeWidth="1.5" opacity="0.6" />}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm" style={{ background: "#46c08a" }} /> Wygrana</span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm" style={{ background: "#f0545c" }} /> Porażka</span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-0.5" style={{ background: "#d2ad62" }} /> Trend</span>
          </div>
        </div>
      )}

      {/* Rank Benchmarks */}
      {rankBenchmarks?.length > 0 && (
        <div className="glass-panel p-4">
          <p className="section-title"><Gauge className="w-3.5 h-3.5 text-primary" /> Porównanie z rangą <InfoTooltip text="Porównanie Twoich statystyk ze średnią graczy Twojej szacowanej rangi. Zielone = powyżej średniej, czerwone = poniżej. Procentowa różnica pokazuje jak daleko jesteś od typowego gracza na Twoim poziomie." /></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {rankBenchmarks.map((b: any, i: number) => {
              const isGood = b.pctDiff >= 0;
              const absP = Math.abs(b.pctDiff);
              const maxVal = Math.max(b.playerValue, b.tierAvg, 0.01);
              const playerBarW = b.higherBetter
                ? (b.playerValue / maxVal) * 100
                : (b.tierAvg / maxVal) * 100;
              const tierMarkerPos = b.higherBetter
                ? (b.tierAvg / maxVal) * 100
                : (b.playerValue / maxVal) * 100;
              return (
                <div key={i} className="stat-card">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{b.stat}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isGood ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
                      {isGood ? "+" : ""}{b.pctDiff}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
                        <span>Ty: <span className="font-bold text-foreground">{b.playerValue}{b.unit}</span></span>
                        <span>Ranga: {b.tierAvg}{b.unit}</span>
                      </div>
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden relative">
                        <div className="h-full rounded-full absolute left-0 top-0" style={{
                          width: `${Math.min(playerBarW, 100)}%`,
                          background: isGood ? "#46c08a" : "#f0545c",
                        }} />
                        <div className="absolute top-0 h-full w-px bg-foreground/40" style={{
                          left: `${Math.min(tierMarkerPos, 100)}%`,
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improvement Roadmap */}
      {improvementRoadmap?.length > 0 && (
        <div className="glass-panel p-4">
          <p className="section-title"><Map className="w-3.5 h-3.5 text-primary" /> Roadmapa poprawy <InfoTooltip text="Uporządkowana lista obszarów do poprawy, od najważniejszego. Szacowany zysk LP pokazuje przybliżony wpływ poprawy danego wskaźnika na Twój ranking. Skup się na pierwszym punkcie — przyniesie największy efekt." /></p>
          <div className="space-y-2">
            {improvementRoadmap.map((item: any) => (
              <div key={item.priority} className="stat-card flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                  style={{
                    background: item.priority === 1 ? "#2a1519" : item.priority === 2 ? "#2a2212" : "#262418",
                    color: item.priority === 1 ? "#f0545c" : item.priority === 2 ? "#e8a93c" : "#d2ad62",
                    border: `1px solid ${item.priority === 1 ? "#6b2a30" : item.priority === 2 ? "#6b4f22" : "#6b5a35"}`,
                  }}
                >#{item.priority}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-foreground">{item.area}</span>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">+~{item.estimatedLpGain} LP</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                    <span>Teraz: <span className="font-semibold text-red-500">{item.currentValue}</span></span>
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                    <span>Cel: <span className="font-semibold text-green-600">{item.targetValue}</span></span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comeback + Skillshot row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Comeback Analysis */}
        {comebackAnalysis && (comebackAnalysis.comebackGames > 0 || comebackAnalysis.snowballGames > 0) && (
          <div className="glass-panel p-4">
            <p className="section-title"><RotateCcw className="w-3.5 h-3.5 text-primary" /> Comeback vs Snowball <InfoTooltip text="Jak grasz gdy jesteś z tyłu (więcej śmierci niż kills) vs gdy dominujesz (dużo więcej kills). Wysoki WR comebacków = silna mentalność i umiejętność gry od tyłu. Wysoki WR snowballi = dominacja wczesnej gry." /></p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center stat-card py-2">
                <p className={`text-sm font-bold ${comebackAnalysis.comebackWinRate >= 40 ? "text-green-400" : comebackAnalysis.comebackWinRate >= 25 ? "text-yellow-400" : "text-red-400"}`}>
                  {comebackAnalysis.comebackWinRate.toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground">Comeback WR</p>
                <p className="text-[9px] text-muted-foreground/60">{comebackAnalysis.comebackGames} gier</p>
              </div>
              <div className="text-center stat-card py-2">
                <p className={`text-sm font-bold ${comebackAnalysis.snowballWinRate >= 70 ? "text-green-400" : comebackAnalysis.snowballWinRate >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {comebackAnalysis.snowballWinRate.toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground">Snowball WR</p>
                <p className="text-[9px] text-muted-foreground/60">{comebackAnalysis.snowballGames} gier</p>
              </div>
              <div className="text-center stat-card py-2">
                <p className={`text-sm font-bold ${comebackAnalysis.evenWinRate >= 50 ? "text-green-400" : "text-yellow-400"}`}>
                  {comebackAnalysis.evenWinRate.toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground">Wyrównane</p>
                <p className="text-[9px] text-muted-foreground/60">{comebackAnalysis.evenGames} gier</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{comebackAnalysis.description}</p>
          </div>
        )}

        {/* Skillshot Stats */}
        {skillshotStats && (skillshotStats.hitRate > 0 || skillshotStats.avgDodged > 0) && (
          <div className="glass-panel p-4">
            <p className="section-title"><Sparkles className="w-3.5 h-3.5 text-primary" /> Celność skillshotów <InfoTooltip text="Stosunek trafionych umiejętności do unikniętych przez przeciwników. Wyższy % = lepsza precyzja. Celność powyżej 55% to dobry wynik na większości rang." /></p>
            <div className="flex items-center gap-3 mb-3">
              <GradeBadge
                grade={skillshotStats.grade}
                score={skillshotStats.hitRate}
                color={skillshotStats.grade === "S+" || skillshotStats.grade === "S" ? "text-yellow-400" : skillshotStats.grade === "A" || skillshotStats.grade === "B" ? "text-green-400" : skillshotStats.grade === "C" ? "text-yellow-400" : "text-red-400"}
              />
              <div className="flex-1">
                <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(skillshotStats.hitRate, 100)}%`,
                    background: skillshotStats.hitRate >= 60 ? "#46c08a" : skillshotStats.hitRate >= 40 ? "#e8a93c" : "#f0545c",
                  }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Celność: {skillshotStats.hitRate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center stat-card py-2">
                <p className="text-sm font-bold text-green-400">{skillshotStats.avgLanded}</p>
                <p className="text-[10px] text-muted-foreground">Trafienia/mecz</p>
              </div>
              <div className="text-center stat-card py-2">
                <p className="text-sm font-bold text-blue-400">{skillshotStats.avgDodged}</p>
                <p className="text-[10px] text-muted-foreground">Uniki/mecz</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{skillshotStats.description}</p>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="glass-panel p-4">
        <p className="section-title"><BarChart3 className="w-3.5 h-3.5 text-primary" /> Wskaźniki wydajności <InfoTooltip text="11 wskaźników obliczanych z ostatnich 20 meczy: KDA, KP% (udział w zabójstwach), CS/min, obrażenia/min, udział w obrażeniach drużyny, multikille, wizja, efektywność złota, przeżywalność, konsekwencja, potencjał carry. Wartości 0–100 skalowane do wzorca Twojej rangi." /></p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {metrics?.map((m: any, i: number) => {
            const pct = Math.min(100, (m.value / m.maxValue) * 100);
            const c = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
            const tc = pct >= 70 ? "text-green-400 bg-green-500/10" : pct >= 40 ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10";
            return (
              <div key={i} className="stat-card">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-foreground truncate">{m.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${tc}`}>{m.rating}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug mb-2">{m.description}</p>
                <div className="flex items-center gap-2">
                  <div className="metric-bar flex-1"><div className={`h-full ${c} rounded-full`} style={{ width: `${pct}%` }} /></div>
                  <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{m.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Game Length + Damage + Best/Worst */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <p className="section-title"><Timer className="w-3.5 h-3.5 text-primary" /> Długość meczu <InfoTooltip text="Wyniki podzielone na 3 kategorie: krótkie (<25 min), średnie (25–35 min), długie (>35 min). Pokazuje w jakich typach gier osiągasz najlepsze wyniki — pomocne przy wyborze bohaterów z silnym early lub late game." /></p>
          <div className="space-y-2">
            {[performanceByGameLength?.short, performanceByGameLength?.medium, performanceByGameLength?.long].map((gl: any, i: number) => {
              if (!gl || gl.gamesPlayed === 0) return null;
              const wc = gl.winRate >= 55 ? "text-win" : gl.winRate >= 45 ? "text-yellow-400" : "text-loss";
              return (
                <div key={i} className="stat-card flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{gl.label}</p>
                    <p className="text-[10px] text-muted-foreground">{gl.gamesPlayed} meczy</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${wc}`}>{gl.winRate}% WR</p>
                    <p className="text-[10px] text-muted-foreground">{gl.avgKda} KDA · {gl.avgCsPerMin} CS</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-4">
          <p className="section-title"><Layers className="w-3.5 h-3.5 text-primary" /> Typ obrażeń <InfoTooltip text="Rozkład procentowy zadanych obrażeń: fizyczne (AD — postacie atakujące), magiczne (AP — postacie magii), prawdziwe (penetrują pancerz i odporność magiczną — np. Garen, Vayne). Odzwierciedla rodzaj granych bohaterów." /></p>
          {damageTypeBreakdown && (
            <div className="space-y-3">
              {[
                { l: "Fizyczne", p: damageTypeBreakdown.physicalPct, c: "bg-orange-500", t: "text-orange-400" },
                { l: "Magiczne", p: damageTypeBreakdown.magicPct, c: "bg-blue-500", t: "text-blue-400" },
                { l: "Prawdziwe", p: damageTypeBreakdown.truePct, c: "bg-gray-400", t: "text-gray-300" },
              ].map((d) => (
                <div key={d.l}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{d.l}</span>
                    <span className={`text-xs font-bold ${d.t}`}>{d.p}%</span>
                  </div>
                  <div className="metric-bar"><div className={`h-full ${d.c} rounded-full`} style={{ width: `${d.p}%` }} /></div>
                </div>
              ))}
              <div className="flex rounded-lg overflow-hidden h-3 mt-1">
                <div className="bg-orange-500" style={{ width: `${damageTypeBreakdown.physicalPct}%` }} />
                <div className="bg-blue-500" style={{ width: `${damageTypeBreakdown.magicPct}%` }} />
                <div className="bg-gray-400" style={{ width: `${damageTypeBreakdown.truePct}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {bestGame && (
            <div className="stat-card border-green-200 bg-green-50">
              <p className="text-[10px] uppercase tracking-widest text-green-400 font-bold flex items-center gap-1 mb-2"><Award className="w-3 h-3" /> Najlepszy mecz</p>
              <div className="flex items-center gap-2.5">
                <img src={`${getDDBase()}/champion/${bestGame.championName}.png`} alt="" className="w-10 h-10 rounded-lg border border-border"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{bestGame.championName}</p>
                  <p className="text-xs font-mono text-green-400">{bestGame.kills}/{bestGame.deaths}/{bestGame.assists} <span className="text-muted-foreground">({bestGame.kda} KDA)</span></p>
                </div>
                <span className="ml-auto text-xs font-bold text-green-400">{bestGame.performanceScore}</span>
              </div>
            </div>
          )}
          {worstGame && (
            <div className="stat-card border-red-200 bg-red-50">
              <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold flex items-center gap-1 mb-2"><AlertTriangle className="w-3 h-3" /> Najgorszy mecz</p>
              <div className="flex items-center gap-2.5">
                <img src={`${getDDBase()}/champion/${worstGame.championName}.png`} alt="" className="w-10 h-10 rounded-lg border border-border"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{worstGame.championName}</p>
                  <p className="text-xs font-mono text-red-400">{worstGame.kills}/{worstGame.deaths}/{worstGame.assists} <span className="text-muted-foreground">({worstGame.kda} KDA)</span></p>
                </div>
                <span className="ml-auto text-xs font-bold text-red-400">{worstGame.performanceScore}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Critical Mistakes */}
      {criticalMistakes?.length > 0 && (
        <div className="glass-panel p-4 border-red-200">
          <p className="section-title"><XCircle className="w-3.5 h-3.5 text-red-400" /> Krytyczne błędy <InfoTooltip text="Najczęściej powtarzające się szkodliwe nawyki wykryte w Twoich meczach: nadmierna liczba śmierci, słabe farmienie, brak wizji i inne. Wyeliminowanie tych nawyków da najszybszy wzrost rangi." /></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {criticalMistakes.map((m: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground/80 stat-card bg-red-50 border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />{m}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep Analysis: Lane Phase + Objectives + Deaths + Tilt */}
      {(lanePhaseStats || objectiveStats || deathAnalysis || tiltIndicator) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Lane Phase */}
          {lanePhaseStats && (
            <div className="glass-panel p-4">
              <p className="section-title"><Swords className="w-3.5 h-3.5 text-yellow-400" /> Faza linii (Early game) <InfoTooltip text="Analiza agresywności i dominacji w fazie lining. Uwzględnia first blood rate, solo kills, przewagę CS nad oponentem i presję wywieraną na wrogiej linii." /></p>
              <div className="flex items-center gap-3 mb-3">
                <GradeBadge
                  grade={lanePhaseStats.grade}
                  score={lanePhaseStats.earlyPressureScore}
                  color={lanePhaseStats.grade === "S+" || lanePhaseStats.grade === "S" ? "text-yellow-400" : lanePhaseStats.grade === "A" || lanePhaseStats.grade === "B" ? "text-green-400" : lanePhaseStats.grade === "C" ? "text-yellow-400" : "text-red-400"}
                />
                <div className="flex-1">
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${lanePhaseStats.earlyPressureScore}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Wynik presji: {lanePhaseStats.earlyPressureScore}/100</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center stat-card py-2">
                  <p className="text-sm font-bold text-yellow-400">{lanePhaseStats.firstBloodRate.toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">First blood</p>
                </div>
                <div className="text-center stat-card py-2">
                  <p className="text-sm font-bold text-orange-400">{lanePhaseStats.avgEarlyKills.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">Kills/mecz</p>
                </div>
                <div className="text-center stat-card py-2">
                  <p className="text-sm font-bold text-blue-400">{lanePhaseStats.avgCsAdvantage.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Przewaga CS</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{lanePhaseStats.description}</p>
            </div>
          )}

          {/* Objective Stats */}
          {objectiveStats && (
            <div className="glass-panel p-4">
              <p className="section-title"><Star className="w-3.5 h-3.5 text-blue-400" /> Kontrola obiektywów <InfoTooltip text="Twój wpływ na smoki, wieże, inhibitory i cele kluczowe. Gracze wygrywający rankingi konwertują walkowe przewagi na trwałe obiektywy mapy." /></p>
              <div className="flex items-center gap-3 mb-3">
                <GradeBadge
                  grade={objectiveStats.grade}
                  score={objectiveStats.objectiveControlScore}
                  color={objectiveStats.grade === "S+" || objectiveStats.grade === "S" ? "text-blue-400" : objectiveStats.grade === "A" || objectiveStats.grade === "B" ? "text-green-400" : objectiveStats.grade === "C" ? "text-yellow-400" : "text-red-400"}
                />
                <div className="flex-1">
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${objectiveStats.objectiveControlScore}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Wynik: {objectiveStats.objectiveControlScore}/100</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { label: "🐉 Smoki", val: objectiveStats.avgDragonKills.toFixed(1) },
                  { label: "🏰 Wieże", val: objectiveStats.avgTurretKills.toFixed(1) },
                  { label: "🔴 Inhibit.", val: objectiveStats.avgInhibitorKills.toFixed(1) },
                  { label: "⚡ Kradz.", val: objectiveStats.avgObjectivesStolen.toFixed(2) },
                ].map((item, i) => (
                  <div key={i} className="text-center stat-card py-2 px-1">
                    <p className="text-xs font-bold text-foreground">{item.val}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{objectiveStats.description}</p>
            </div>
          )}

          {/* Death Analysis */}
          {deathAnalysis && (
            <div className="glass-panel p-4">
              <p className="section-title"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Analiza śmierci <InfoTooltip text="Szczegółowa analiza wzorców śmierci: kiedy umierasz, jak długo jesteś martwy i jak to wpływa na Twoje mecze. Czas spędzony martwym to czas bez wpływu na grę." /></p>
              <div className="flex items-center gap-3 mb-3">
                <GradeBadge
                  grade={deathAnalysis.grade}
                  score={deathAnalysis.deathScore}
                  color={deathAnalysis.grade === "S+" || deathAnalysis.grade === "S" || deathAnalysis.grade === "A" || deathAnalysis.grade === "B" ? "text-green-400" : deathAnalysis.grade === "C" ? "text-yellow-400" : "text-red-400"}
                />
                <div className="flex-1">
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${deathAnalysis.deathScore >= 70 ? "bg-green-500" : deathAnalysis.deathScore >= 45 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${deathAnalysis.deathScore}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Wynik przeżycia: {deathAnalysis.deathScore}/100</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center stat-card py-2">
                  <p className={`text-sm font-bold ${deathAnalysis.avgDeaths < 3 ? "text-green-400" : deathAnalysis.avgDeaths < 5 ? "text-yellow-400" : "text-red-400"}`}>{deathAnalysis.avgDeaths.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">Śmierci/mecz</p>
                </div>
                <div className="text-center stat-card py-2">
                  <p className={`text-sm font-bold ${deathAnalysis.avgTimeDeadPct < 8 ? "text-green-400" : deathAnalysis.avgTimeDeadPct < 16 ? "text-yellow-400" : "text-red-400"}`}>{deathAnalysis.avgTimeDeadPct.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">Czas martwy</p>
                </div>
                <div className="text-center stat-card py-2">
                  <p className={`text-sm font-bold ${deathAnalysis.deathSpikeRate < 15 ? "text-green-400" : deathAnalysis.deathSpikeRate < 30 ? "text-yellow-400" : "text-red-400"}`}>{deathAnalysis.deathSpikeRate.toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Mecze 7+ śmierci</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{deathAnalysis.description}</p>
            </div>
          )}

          {/* Tilt Indicator */}
          {tiltIndicator && (
            <div className={`glass-panel p-4 ${tiltIndicator.isTilted ? "border-orange-200" : ""}`}>
              <p className="section-title"><Flame className="w-3.5 h-3.5 text-orange-400" /> Wskaźnik tiltu <InfoTooltip text="Mierzy jak bardzo Twoja gra pogarsza się po seriach porażek. Wysoki tilt = duży spadek KDA i jakości decyzji podczas strat z rzędu. Kluczowy wskaźnik zdrowia psychicznego w rankingach." /></p>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" className="stroke-muted/30" strokeWidth="3.5" fill="transparent" />
                    <circle cx="18" cy="18" r="14" strokeWidth="3.5" fill="transparent" strokeLinecap="round"
                      strokeDasharray={`${tiltIndicator.score * 0.88} 88`}
                      className={tiltIndicator.score >= 75 ? "stroke-red-500" : tiltIndicator.score >= 55 ? "stroke-orange-400" : tiltIndicator.score >= 35 ? "stroke-yellow-400" : "stroke-green-500"} />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${tiltIndicator.score >= 55 ? "text-orange-400" : "text-green-400"}`}>{tiltIndicator.score}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${tiltIndicator.score >= 75 ? "text-red-400" : tiltIndicator.score >= 55 ? "text-orange-400" : tiltIndicator.score >= 35 ? "text-yellow-400" : "text-green-400"}`}>
                    {tiltIndicator.score >= 75 ? "Silny tilt" : tiltIndicator.score >= 55 ? "Umiarkowany tilt" : tiltIndicator.score >= 35 ? "Lekkie wahania" : "Mentalnie stabilny"}
                  </p>
                  {tiltIndicator.lossStreakKdaDrop > 0.2 && (
                    <p className="text-[10px] text-muted-foreground">KDA spada o {tiltIndicator.lossStreakKdaDrop.toFixed(2)} podczas serii porażek</p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{tiltIndicator.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Win Conditions */}
      {winConditions && (
        <div className="glass-panel p-4">
          <p className="section-title"><Crosshair className="w-3.5 h-3.5 text-primary" /> Warunki zwycięstwa <InfoTooltip text="Porównanie kluczowych statystyk między Twoimi wygranymi a przegranymi meczami. Pokazuje, co konkretnie różni Twoje dobre gry od złych — nad czym warto popracować." /></p>
          <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{winConditions.summary}</p>
          {winConditions.factors?.length > 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {winConditions.factors.map((f: any, i: number) => {
              const positive = f.impact > 0;
              return (
                <div key={i} className={`stat-card ${positive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-foreground">{f.factor}</span>
                    <span className={`text-[10px] font-bold ${positive ? "text-green-600" : "text-red-500"}`}>
                      {positive ? "+" : ""}{f.impact}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                        <span>Wygrane</span><span className="font-bold text-green-600">{f.winAvg}</span>
                      </div>
                      <div className="h-1 bg-green-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((f.winAvg / Math.max(f.winAvg, f.lossAvg, 0.01)) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                        <span>Przegrane</span><span className="font-bold text-red-500">{f.lossAvg}</span>
                      </div>
                      <div className="h-1 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((f.lossAvg / Math.max(f.winAvg, f.lossAvg, 0.01)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{f.description}</p>
                </div>
              );
            })}
          </div>)}
        </div>
      )}

      {/* Power Curve */}
      {powerCurve && powerCurve.phases?.length > 0 && powerCurve.phases.some((p: any) => p.gamesPlayed > 0) && (
        <div className="glass-panel p-4">
          <p className="section-title"><Activity className="w-3.5 h-3.5 text-primary" /> Krzywa mocy <InfoTooltip text="Analiza Twojej siły w różnych fazach gry (early/mid/late). Pokazuje kiedy jesteś najsilniejszy i najsłabszy — pomaga dopasować styl gry i wybór bohaterów do Twoich naturalnych tendencji." /></p>
          <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{powerCurve.description}</p>
          <div className="grid grid-cols-3 gap-2">
            {powerCurve.phases.map((p: any) => {
              const isStrongest = p.phase === powerCurve.strongestPhase;
              const phaseColors: Record<string, { bg: string; border: string; accent: string }> = {
                early: { bg: "bg-orange-50", border: "border-orange-200", accent: "text-orange-600" },
                mid: { bg: "bg-blue-50", border: "border-blue-200", accent: "text-blue-600" },
                late: { bg: "bg-purple-50", border: "border-purple-200", accent: "text-purple-600" },
              };
              const colors = phaseColors[p.phase] ?? phaseColors.mid;
              return (
                <div key={p.phase} className={`stat-card ${colors.bg} ${colors.border} ${isStrongest ? "ring-2 ring-primary/20" : ""}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`text-[11px] font-bold ${colors.accent}`}>{p.label}</span>
                    {isStrongest && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  </div>
                  {p.gamesPlayed > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-muted-foreground">Win Rate</span>
                        <span className={`text-xs font-bold ${p.winRate >= 50 ? "text-green-600" : "text-red-500"}`}>{p.winRate}%</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-muted-foreground">KDA</span>
                        <span className="text-xs font-bold text-foreground">{p.avgKda}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground">Mecze</span>
                        <span className="text-[10px] text-muted-foreground">{p.gamesPlayed}</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(p.avgPerformance, 100)}%` }} />
                      </div>
                      <p className="text-[8px] text-muted-foreground/70 mt-0.5 text-right">Wynik: {p.avgPerformance}/100</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 text-center py-2">Brak danych</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Champion Breakdown Table */}
      <ChampionBreakdownTable championBreakdown={championBreakdown} region={region} gameName={gameName} tagLine={tagLine} />
    </div>
  );
}

type MobileTab = "analiza" | "rang" | "mecze" | "live" | "kalkulator" | "karta";

const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: "analiza", label: "Analiza", icon: BarChart3 },
  { id: "rang", label: "Rang", icon: Trophy },
  { id: "mecze", label: "Mecze", icon: Shield },
  { id: "kalkulator", label: "Build", icon: Swords },
  { id: "karta", label: "Karta", icon: Sparkles },
  { id: "live", label: "Live", icon: Wifi },
];

function pushHistory(gameName: string, tagLine: string, region: string) {
  try {
    const raw = JSON.parse(localStorage.getItem("nexus_sight_history") ?? "[]") as any[];
    const filtered = raw.filter((e: any) => !(
      e.gameName?.toLowerCase() === gameName.toLowerCase() &&
      e.tagLine?.toLowerCase() === tagLine.toLowerCase() &&
      e.region === region
    ));
    const updated = [{ gameName, tagLine, region, ts: Date.now() }, ...filtered].slice(0, 8);
    localStorage.setItem("nexus_sight_history", JSON.stringify(updated));
  } catch { /* ignore */ }
}

export default function Profile() {
  const params = useParams();
  const region = params.region as string;
  const gameName = decodeURIComponent(params.gameName || "");
  const tagLine = decodeURIComponent(params.tagLine || "");
  usePageTitle(`${gameName}#${tagLine} — Profil gracza LoL`);
  const [, navigate] = useLocation();
  const [mobileTab, setMobileTab] = useState<MobileTab>("analiza");
  const [matchCount, setMatchCount] = useState(10);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [fav, setFav] = useState(false);

  const handleTabClick = (tabId: MobileTab) => {
    if (tabId === "live") {
      navigate(`/live/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
      return;
    }
    setMobileTab(tabId);
  };

  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useSearchSummoner({ region, gameName, tagLine });
  const puuid = profile?.puuid ?? "";
  const summonerId = profile?.summonerId ?? "";

  const { data: rankedStats, isLoading: isLoadingRanked } = useGetSummonerRanked(puuid, { region }, { query: { enabled: !!puuid } });
  const { data: matches, isLoading: isLoadingMatches } = useGetSummonerMatches(puuid, { region, count: matchCount }, { query: { enabled: !!puuid } });
  const { data: mastery, isLoading: isLoadingMastery } = useGetSummonerMastery(puuid, { region, count: 5 }, { query: { enabled: !!puuid } });
  const { data: analysis, isLoading: isLoadingAnalysis } = useGetSummonerAnalysis(puuid, { region, count: 20 }, { query: { enabled: !!puuid } });
  const { data: liveGame, refetch: refetchLiveGame } = useGetLiveGame(puuid, { region, summonerId }, { query: { enabled: !!puuid && !!summonerId, retry: false, staleTime: 0, gcTime: 30_000 } });
  useEffect(() => {
    if (!puuid || !summonerId) return;
    const id = setInterval(() => { refetchLiveGame(); }, 30000);
    return () => clearInterval(id);
  }, [puuid, summonerId, refetchLiveGame]);

  useEffect(() => {
    if (profile?.gameName) pushHistory(profile.gameName, profile.tagLine ?? tagLine, region);
  }, [profile?.gameName]);

  useEffect(() => {
    setFav(isFavorite({ gameName, tagLine, region }));
  }, [gameName, tagLine, region]);

  useEffect(() => {
    if (!puuid || !rankedStats) return;
    const soloEntry = (rankedStats as any[]).find((r: any) => r.queueType === "RANKED_SOLO_5x5");
    if (soloEntry?.tier && soloEntry?.rank && puuid) {
      addRankSnapshot(puuid, {
        date: Date.now(),
        tier: soloEntry.tier,
        rank: soloEntry.rank,
        lp: soloEntry.leaguePoints ?? 0,
        wins: soloEntry.wins ?? 0,
        losses: soloEntry.losses ?? 0,
      });
    }
  }, [puuid, rankedStats]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    });
  };

  if (profileError) return (
    <div className="flex flex-col items-center justify-center p-4 py-20">
      <AlertCircle className="w-12 h-12 text-destructive mb-3" />
      <h2 className="font-display text-2xl mb-1">Nie znaleziono gracza</h2>
      <p className="text-sm text-muted-foreground mb-6">{gameName}#{tagLine} nie istnieje w regionie {region}.</p>
      <Link href="/" className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted transition text-sm flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Wróć
      </Link>
    </div>
  );

  if (isLoadingProfile) return <LoadingSpinner text="Wyszukiwanie gracza..." />;

  const soloQ = rankedStats?.find((r: any) => r.queueType === "RANKED_SOLO_5x5");
  const flexQ = rankedStats?.find((r: any) => r.queueType === "RANKED_FLEX_SR");

  return (
    <div className="pb-16">

      {/* Header */}
      <header className="relative border-b border-border overflow-hidden bg-card">
        <div className="absolute inset-0 pointer-events-none grid-bg opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 py-4 sm:py-5 flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 p-1.5 rounded-[4px] hover:bg-muted"
            style={{ border: "1px solid #233047" }}>
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[8px] overflow-hidden"
              style={{ border: "1.5px solid #6b5a35", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <img src={`${getDDBase()}/profileicon/${profile?.profileIconId}.png`} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-[3px] whitespace-nowrap"
              style={{
                background: "#121926",
                border: "1px solid #6b5a35",
                color: "#d2ad62",
                fontFamily: "'Rajdhani',sans-serif",
                letterSpacing: "0.05em",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              Lv. {profile?.summonerLevel}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none"
                style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, letterSpacing: "0.02em", color: "#ece6d6" }}>
                {profile?.gameName}
              </h1>
              <span className="text-sm text-muted-foreground font-sans font-normal">#{profile?.tagLine}</span>
              <span className="tag-chip flex-shrink-0">{region}</span>
              <button
                onClick={handleShare}
                title="Kopiuj link"
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-[4px] transition-all flex-shrink-0"
                style={shareState === "copied"
                  ? { background: "#12271f", border: "1px solid #2a5c45", color: "#46c08a", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }
                  : { background: "#172031", border: "1px solid #233047", color: "#8d97aa", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}
              >
                {shareState === "copied" ? <CheckCheck className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                {shareState === "copied" ? "Skopiowano!" : "Udostępnij"}
              </button>
              <button
                onClick={() => {
                  const next = toggleFavorite({ gameName, tagLine, region });
                  setFav(next);
                }}
                title={fav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-[4px] transition-all flex-shrink-0"
                style={fav
                  ? { background: "#2a1519", border: "1px solid #6b2a30", color: "#f0545c", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }
                  : { background: "#172031", border: "1px solid #233047", color: "#8d97aa", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}
              >
                <Heart className={`w-3 h-3 transition-all ${fav ? "fill-current" : ""}`} />
                {fav ? "Ulubiony" : "Ulubione"}
              </button>
              <Link to={`/ai-analysis/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`}>
                <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-[4px] flex-shrink-0 cursor-pointer transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#0A1628,#1a3a6b)", border: "1px solid rgba(200,155,60,0.4)", color: "#C89B3C", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: "0.03em" }}>
                  <Brain className="w-3 h-3" />
                  AI ANALIZA
                </span>
              </Link>
              {liveGame && (
                <Link to={`/live/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`}>
                  <span className="text-[9px] px-2 py-0.5 rounded-[3px] font-bold tracking-wider flex items-center gap-1.5 flex-shrink-0 cursor-pointer hover:brightness-125 transition-all"
                    style={{ background: "#12271f", color: "#46c08a", border: "1px solid #2a5c45", fontFamily: "'Rajdhani',sans-serif" }}>
                    <span className="pulse-dot" />
                    LIVE — ZOBACZ MECZ
                  </span>
                </Link>
              )}
            </div>
            {!isLoadingRanked && (
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                {soloQ && (
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-primary" />
                    <span className="font-bold text-primary">{soloQ.tier} {soloQ.rank}</span>
                    <span className="text-muted-foreground/60">{soloQ.leaguePoints} LP</span>
                  </span>
                )}
                {flexQ && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-muted-foreground/70">{flexQ.tier} {flexQ.rank}</span>
                  </span>
                )}
                {!soloQ && !flexQ && <span className="text-muted-foreground/50">Unranked</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-5">
        {liveGame && <LiveGameBanner data={liveGame} selfPuuid={puuid} />}

        {/* Mobile tab navigation */}
        <div className="lg:hidden mb-4 sticky top-0 z-30 py-2"
          style={{ background: "linear-gradient(180deg, #172031 80%, transparent)" }}>
          <div className="mobile-tab-bar">
            {MOBILE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`mobile-tab ${tab.id === "live" ? (liveGame ? "mobile-tab-live" : "mobile-tab-inactive") : (mobileTab === tab.id ? "mobile-tab-active" : "mobile-tab-inactive")}`}
              >
                {tab.id === "live" && liveGame && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Content */}
          <div className={`lg:col-span-9 ${mobileTab !== "analiza" ? "hidden lg:block" : ""}`}>
            <AnalysisSection data={analysis} isLoading={isLoadingAnalysis} recentMatches={matches} region={region} gameName={gameName} tagLine={tagLine} />
          </div>

          {/* Sidebar */}
          <aside className={`lg:col-span-3 space-y-4 ${mobileTab === "analiza" ? "hidden lg:flex lg:flex-col" : ""}`}>

            {/* Live Game Button (desktop) */}
            <Link to={`/live/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`}>
              <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all hover:brightness-95"
                style={{
                  background: liveGame ? "#12271f" : "#172031",
                  border: liveGame ? "1px solid #2a5c45" : "1px solid #233047",
                }}>
                {liveGame && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
                <Wifi className="w-3.5 h-3.5 flex-shrink-0" style={{ color: liveGame ? "#46c08a" : "#d2ad62" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] flex-1" style={{ fontFamily: "'Rajdhani',sans-serif", color: liveGame ? "#46c08a" : "#d2ad62" }}>
                  {liveGame ? "W GRZE — ZOBACZ MECZ" : "LIVE GAME"}
                </span>
                <ChevronRight className="w-3 h-3" style={{ color: liveGame ? "#46c08a" : "#6b5a35" }} />
              </div>
            </Link>

            {/* Rang + Predicted */}
            <div className={(mobileTab === "mecze" || mobileTab === "kalkulator" || mobileTab === "karta") ? "hidden lg:block" : ""}>
              <p className="section-title">
                <Trophy className="w-3.5 h-3.5 text-primary" /> Rang
                <InfoTooltip align="right" text="Twoja liga rankingowa Solo/Duo i Flex. LP (League Points) to punkty do awansu — po 100 LP promujesz do wyższego podziału. WR% = procent wygranych gier w tej kolejce." />
              </p>
              <div className="space-y-2">
                {isLoadingRanked
                  ? <div className="h-20 rounded-xl animate-pulse" style={{ background: "#172031" }} />
                  : <><RankedCard entry={soloQ} />{flexQ && <RankedCard entry={flexQ} />}</>
                }
                {/* LP History */}
                {puuid && (
                  <div className="rounded-xl p-3" style={{ background: "#121926", border: "1px solid #233047", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-2 flex items-center gap-1" style={{ color: "#d2ad62" }}>
                      <TrendingUp className="w-3 h-3" /> Historia LP
                    </p>
                    <LPHistoryChart puuid={puuid} />
                  </div>
                )}

                {!isLoadingAnalysis && analysis?.predictedTier && (
                  <div className="rounded-xl p-3 relative overflow-hidden" style={{
                    background: "linear-gradient(135deg, #1f1a33, white)",
                    border: "1px solid #4a3d80",
                  }}>
                    <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-2 flex items-center gap-1" style={{ color: "#9c7bff" }}>
                      <Brain className="w-3 h-3" /> Szacowana ranga AI
                    </p>
                    <div className="flex items-center gap-2.5">
                      <img src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${analysis.predictedTier.tier.toLowerCase()}.png`}
                        alt={analysis.predictedTier.tier} className="w-11 h-11 object-contain drop-shadow"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      <div>
                        <p className="text-sm font-bold text-gradient-purple">
                          {analysis.predictedTier.tier} {analysis.predictedTier.division}
                        </p>
                        <p className="text-[10px] text-muted-foreground">~{analysis.predictedTier.lp} LP · {analysis.predictedTier.confidence}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mastery */}
            <div className={(mobileTab === "mecze" || mobileTab === "kalkulator" || mobileTab === "karta") ? "hidden lg:block" : ""}>
              <p className="section-title">
                <Target className="w-3.5 h-3.5 text-primary" /> Mistrzostwo
                <InfoTooltip align="right" text="Oficjalny system Riot Games pokazujący ile gier zagrałeś danym bohaterem. Lv. 7 = najwyższy poziom mistrzostwa. Liczba po prawej (K) = tysiące punktów mistrzostwa zdobytych łącznie." />
              </p>
              <div className="glass-panel p-2 space-y-0.5">
                {isLoadingMastery
                  ? Array(3).fill(0).map((_, i) => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "#172031" }} />)
                  : mastery?.length === 0
                    ? <p className="text-xs text-muted-foreground text-center py-3">Brak danych</p>
                    : mastery?.map((ch: any, i: number) => (
                      <Link key={i} href={`/champion/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/${ch.championName}`}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors group">
                        <span className="text-[10px] text-muted-foreground/50 font-mono w-3 text-right">{i + 1}</span>
                        <img src={`${getDDBase()}/champion/${ch.championName}.png`} alt="" className="w-8 h-8 rounded-lg"
                          style={{ border: "1px solid #233047" }}
                          onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground/90 truncate group-hover:text-gold transition-colors">{ch.championName}</p>
                          <p className="text-[10px] text-muted-foreground">Lv. {ch.championLevel}</p>
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: "#d2ad62", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                          {(ch.championPoints / 1000).toFixed(0)}K
                        </span>
                      </Link>
                    ))
                }
              </div>
            </div>

            {/* Champion Pool Analysis */}
            {!isLoadingMatches && matches && matches.length >= 3 && (() => {
              const champMap: Record<string, { games: number; wins: number }> = {};
              for (const m of matches as any[]) {
                if (!champMap[m.championName]) champMap[m.championName] = { games: 0, wins: 0 };
                champMap[m.championName].games++;
                if (m.win) champMap[m.championName].wins++;
              }
              const champs = Object.entries(champMap).sort((a, b) => b[1].games - a[1].games);
              const total = matches.length;
              const top1Pct = Math.round((champs[0]?.[1]?.games ?? 0) / total * 100);
              const top3Pct = Math.round(champs.slice(0, 3).reduce((s, c) => s + c[1].games, 0) / total * 100);
              const poolLabel = champs.length === 1 ? "Mono-main" : champs.length <= 2 ? "Duo-main" : champs.length <= 4 ? "Wąska pula" : champs.length <= 7 ? "Zrównoważona" : "Szeroka pula";
              const poolColor = champs.length <= 2 ? "text-yellow-400" : champs.length <= 5 ? "text-green-400" : "text-blue-400";
              return (
                <div className={(mobileTab === "mecze" || mobileTab === "kalkulator" || mobileTab === "karta") ? "hidden lg:block" : ""}>
                  <p className="section-title">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Pula postaci
                    <InfoTooltip align="right" text="Analiza puli bohaterów z ostatnich meczy. Top1% = ile % gier grasz główną postacią. Top3% = ile % pokrywa 3 najpopularniejsze. Mono-main = 1 postać, Szeroka pula = 8+ postaci." />
                  </p>
                  <div className="glass-panel p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className={`text-sm font-bold ${poolColor}`}>{poolLabel}</p>
                        <p className="text-[10px] text-muted-foreground">{champs.length} {champs.length === 1 ? "bohater" : "bohaterów"} w {total} meczach</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Top1 · Top3</p>
                        <p className="text-xs font-mono font-bold">{top1Pct}% · <span className="text-muted-foreground">{top3Pct}%</span></p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {champs.slice(0, 5).map(([name, stat]) => {
                        const wr = Math.round(stat.wins / stat.games * 100);
                        const pct = Math.round(stat.games / total * 100);
                        return (
                          <div key={name} className="flex items-center gap-2">
                            <img src={`${getDDBase()}/champion/${name}.png`} alt={name}
                              className="w-6 h-6 rounded-md border border-border flex-shrink-0"
                              onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between mb-0.5">
                                <span className="text-[10px] text-foreground/80 font-medium truncate">{name}</span>
                                <span className={`text-[10px] font-mono font-bold ${wr >= 50 ? "text-win" : "text-loss"}`}>{wr}%</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden bg-muted">
                                <div className={`h-full rounded-full ${wr >= 50 ? "bg-win" : "bg-loss"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground w-4 text-right flex-shrink-0">{stat.games}g</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Match History */}
            <div className={(mobileTab === "rang" || mobileTab === "kalkulator" || mobileTab === "karta") ? "hidden lg:block" : ""}>
              <p className="section-title">
                <Shield className="w-3.5 h-3.5 text-primary" /> Ostatnie mecze
              </p>
              <div className="space-y-1.5">
                {isLoadingMatches
                  ? Array(5).fill(0).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#172031" }} />)
                  : matches?.length === 0
                    ? <p className="text-xs text-muted-foreground text-center py-3">Brak historii</p>
                    : matches?.map((m: any, i: number) => <MatchRow key={m.matchId} match={m} index={i} selfPuuid={puuid} region={region} gameName={gameName} tagLine={tagLine} />)
                }
              </div>
              {!isLoadingMatches && (matches?.length ?? 0) > 0 && (
                <div className="mt-2 flex gap-2">
                  {matchCount < 30 && (
                    <button
                      onClick={() => setMatchCount(c => Math.min(c + 10, 30))}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                      style={{ border: "1px solid #233047" }}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      Załaduj {Math.min(matchCount + 10, 30) - matchCount} więcej
                    </button>
                  )}
                  {matchCount > 10 && (
                    <button
                      onClick={() => setMatchCount(10)}
                      className="py-2 px-3 rounded-lg text-xs text-muted-foreground/50 transition-all hover:text-muted-foreground hover:bg-muted"
                      style={{ border: "1px solid #233047" }}
                    >
                      Zwiń
                    </button>
                  )}
                </div>
              )}
              <AdBanner slot="2167950293" format="auto" className="mt-6" />
            </div>

            {/* Build Calculator — osobna zakładka */}
            <div className={mobileTab !== "kalkulator" ? "hidden lg:block" : ""}>
              <p className="section-title">
                <Swords className="w-3.5 h-3.5 text-primary" /> Kalkulator Buildu
              </p>
              <BuildCalculator />
            </div>

            {/* Card Generator — osobna zakładka */}
            <div className={mobileTab !== "karta" ? "hidden lg:block" : ""}>
              <p className="section-title">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Wygeneruj swój profil
              </p>
              <CardGenerator gameName={gameName} tagLine={tagLine} region={region} rankedEntry={soloQ ?? null} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
