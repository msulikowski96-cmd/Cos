import { useParams, Link } from "wouter";
import { useState, useEffect, useRef, Component } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, Brain, Star, TrendingUp, TrendingDown,
  Shield, Swords, Eye, Target, Zap, BookOpen,
  Award, AlertTriangle, CheckCircle2, Lightbulb,
  RefreshCw, Sparkles, Users, Trophy,
  Clock, Activity, Flame, XCircle, ArrowUpRight,
  BarChart3, Crosshair, ChevronRight, Info
} from "lucide-react";
import { useSearchSummoner, useGetSummonerRanked, useGetSummonerMastery } from "@workspace/api-client-react";
import { usePageTitle } from "@/lib/usePageTitle";
import AdBanner from "@/components/AdBanner";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const CARD: React.CSSProperties = {
  background: "#121926",
  border: "1px solid #233047",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const PRIMARY = "#d2ad62";
const FG = "#ece6d6";
const MUTED = "#a8b0bf";
const WIN_COLOR = "#22c55e";
const LOSS_COLOR = "#ef4444";

const RATING_COLOR: Record<string, string> = {
  "S+": "#e8a93c", S: "#e8a93c", "A+": "#46c08a", A: "#46c08a",
  "B+": PRIMARY, B: PRIMARY, "C+": "#e8a93c", C: "#e8a93c",
  "D": "#f0545c",
};

const PRIORITY_COLOR: Record<string, { bg: string; border: string; text: string; label: string; numBg: string }> = {
  high: { bg: "#2a1519", border: "#6b2a30", text: "#f0545c", label: "Wysoki", numBg: "#f0545c" },
  medium: { bg: "#2a2212", border: "#6b4f22", text: "#e8a93c", label: "Średni", numBg: "#e8a93c" },
  low: { bg: "#12271f", border: "#2a5c45", text: "#46c08a", label: "Niski", numBg: "#46c08a" },
};

const CATEGORY_ICON: Record<string, any> = {
  macro: Target, micro: Swords, mental: Brain,
  vision: Eye, champion_pool: BookOpen,
};

const FORM_COLOR: Record<string, string> = {
  "Świetna forma": "#46c08a", "Dobra forma": "#46c08a",
  "Stabilna": PRIMARY, "Zmienna": "#e8a93c",
  "Słaba forma": "#e8a93c", "Kryzys": "#f0545c",
};

const TIER_COLOR: Record<string, string> = {
  IRON: "#8d9fa9", BRONZE: "#cd7f32", SILVER: "#8FA3B1", GOLD: "#D4A839",
  PLATINUM: "#4CBFAA", EMERALD: "#3AC48B", DIAMOND: "#57A8E7",
  MASTER: "#9B5CE8", GRANDMASTER: "#CF4B4B", CHALLENGER: "#E9BE5C",
};

const RADAR_DIMS = [
  { key: "makro", label: "MAKRO", icon: Target, color: "#d2ad62" },
  { key: "mikro", label: "MIKRO", icon: Swords, color: "#e8a93c" },
  { key: "wizja", label: "WIZJA", icon: Eye, color: "#9c7bff" },
  { key: "laning", label: "LANING", icon: Crosshair, color: "#46c08a" },
  { key: "teamfight", label: "TEAMFIGHT", icon: Users, color: "#e8a93c" },
  { key: "konsekwencja", label: "KONSEKWENCJA", icon: Activity, color: "#f0545c" },
];

function SectionTitle({ icon: Icon, children }: { icon: any; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <Icon style={{ width: 13, height: 13, color: PRIMARY, flexShrink: 0 }} />
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
        color: PRIMARY, fontFamily: "'Rajdhani',sans-serif",
      }}>
        {children}
      </span>
    </div>
  );
}

function Card({ children, style, delay = 0, fullWidth = false }: {
  children: ReactNode; style?: React.CSSProperties; delay?: number; fullWidth?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ ...CARD, padding: "14px 14px 12px", gridColumn: fullWidth ? "1 / -1" : undefined, ...style }}
    >
      {children}
    </motion.div>
  );
}

function Prose({ text }: { text: string }) {
  return <p style={{ fontSize: 12, lineHeight: 1.7, color: MUTED, margin: 0 }}>{text}</p>;
}

function StatBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width: "100%", height: 4, borderRadius: 2, background: "#233047", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
    </div>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY, display: "inline-block" }}
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </span>
  );
}

const STEPS = [
  { label: "Pobieranie statystyk gracza...", icon: Target },
  { label: "Analiza stylu gry i archetypów...", icon: Brain },
  { label: "Ocena mikro i makro umiejętności...", icon: Swords },
  { label: "Generowanie wskazówek coachingowych...", icon: Lightbulb },
  { label: "Finalizowanie raportu AI...", icon: Sparkles },
];

function GeneratingCard({ step }: { step: string }) {
  return (
    <div style={{ ...CARD, padding: 20, marginBottom: 12 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#262418", border: `1px solid #6b5a35`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Brain style={{ width: 20, height: 20, color: PRIMARY }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: FG, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.02em" }}>
          Nexus AI generuje raport <LoadingDots />
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Analizujemy ostatnie mecze i wszystkie Twoje dane statystyczne</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {STEPS.map(({ label, icon: Icon }, i) => {
          const active = label === step;
          const done = STEPS.findIndex(s => s.label === step) > i;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 8,
              background: active ? "#262418" : done ? "#12271f" : "#172031",
              border: `1px solid ${active ? "#6b5a35" : done ? "#2a5c45" : "#233047"}`,
              opacity: done || active ? 1 : 0.5, transition: "all 0.3s",
            }}>
              <Icon style={{ width: 12, height: 12, color: active ? PRIMARY : done ? "#46c08a" : MUTED, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: active ? 600 : 400, color: active ? FG : done ? "#46c08a" : MUTED, flex: 1 }}>
                {label}
              </span>
              {active && <LoadingDots />}
              {done && <CheckCircle2 style={{ width: 12, height: 12, color: "#46c08a" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

class AiErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; msg: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(err: any) { return { hasError: true, msg: err?.message ?? "" }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight: "100vh", background: "#172031", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...CARD, padding: 28, textAlign: "center", maxWidth: 340 }}>
          <AlertTriangle style={{ width: 28, height: 28, color: "#f0545c", margin: "0 auto 10px" }} />
          <div style={{ fontWeight: 700, color: FG, marginBottom: 6 }}>Błąd strony</div>
          <div style={{ fontSize: 12, color: MUTED }}>{this.state.msg || "Odśwież stronę"}</div>
        </div>
      </div>
    );
    return this.props.children;
  }
}

function StatsDashboard({ stats }: { stats: any }) {
  if (!stats) return null;
  const wr = Number(stats.winRate ?? 0);
  const kda = Number(stats.avgKda ?? 0);
  const cspm = Number(stats.avgCsPerMin ?? 0);
  const kp = Number(stats.avgKillParticipation ?? 0);
  const dmgPct = Number(stats.avgDamagePct ?? 0);
  const vision = Number(stats.avgVisionScore ?? 0);
  const wards = Number(stats.avgWardsPlaced ?? 0);
  const kills = Number(stats.avgKills ?? 0);
  const deaths = Number(stats.avgDeaths ?? 0);
  const assists = Number(stats.avgAssists ?? 0);
  const recent5 = Number(stats.recent5wr ?? 0);
  const totalGames = Number(stats.totalGames ?? 0);
  const isSupport = stats.primaryRole === "UTILITY";

  const wrColor = wr >= 55 ? WIN_COLOR : wr >= 50 ? "#eab308" : LOSS_COLOR;
  const kdaColor = kda >= 3 ? WIN_COLOR : kda >= 2 ? "#eab308" : LOSS_COLOR;
  const csColor = isSupport ? "#888" : cspm >= 6 ? WIN_COLOR : cspm >= 4.5 ? "#eab308" : LOSS_COLOR;
  const kpColor = kp >= 65 ? WIN_COLOR : kp >= 50 ? "#eab308" : LOSS_COLOR;
  const dmgColor = isSupport
    ? (dmgPct >= 15 ? WIN_COLOR : dmgPct >= 10 ? "#eab308" : LOSS_COLOR)
    : (dmgPct >= 30 ? WIN_COLOR : dmgPct >= 20 ? "#eab308" : LOSS_COLOR);
  const visionColor = vision >= 25 ? WIN_COLOR : vision >= 15 ? "#eab308" : LOSS_COLOR;

  const metricTiles = [
    { label: "KDA", value: kda.toFixed(2), sub: `${kills.toFixed(1)}/${deaths.toFixed(1)}/${assists.toFixed(1)}`, color: kdaColor },
    { label: "CS/min", value: isSupport ? "Support" : cspm.toFixed(1), sub: `${totalGames} meczy`, color: csColor },
    { label: "Win Rate", value: `${Math.round(wr)}%`, sub: `ostat. 5: ${Math.round(recent5)}%`, color: wrColor },
    { label: "Kill Part.", value: `${Math.round(kp)}%`, sub: "udział w zabójstwach", color: kpColor },
    { label: "% DMG", value: `${Math.round(dmgPct)}%`, sub: "obrażeń w drużynie", color: dmgColor },
    { label: "Vision", value: vision.toFixed(1), sub: `${wards.toFixed(1)} ward/mecz`, color: visionColor },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 4 }}>
      {metricTiles.map(({ label, value, sub, color }) => (
        <div key={label} style={{
          background: "#172031", borderRadius: 8, padding: "9px 10px",
          border: "1px solid #233047",
          borderTop: `3px solid ${color}`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: MUTED, textTransform: "uppercase", fontFamily: "'Rajdhani',sans-serif", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

function RecentResultsBar({ lastResults }: { lastResults: string }) {
  if (!lastResults) return null;
  const results = lastResults.split("").slice(0, 15);
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: MUTED, textTransform: "uppercase", fontFamily: "'Rajdhani',sans-serif", marginBottom: 5 }}>Ostatnie wyniki</div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {results.map((r, i) => (
          <div key={i} style={{
            width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
            background: r === "W" ? "#12271f" : "#2a1519",
            border: `1px solid ${r === "W" ? "#2a5c45" : "#6b2a30"}`,
            fontSize: 9, fontWeight: 800, color: r === "W" ? WIN_COLOR : LOSS_COLOR,
            fontFamily: "'Barlow Condensed',sans-serif",
          }}>
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceRadar({ radar }: { radar: any }) {
  if (!radar) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {RADAR_DIMS.map(({ key, label, icon: Icon, color }) => {
        const val = radar[key] ?? 0;
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Icon style={{ width: 10, height: 10, color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: FG, fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.05em" }}>{label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "'Barlow Condensed',sans-serif" }}>{val}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "#233047", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${val}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 3 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChampPoolVisual({ champStats }: { champStats: any[] }) {
  if (!champStats?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {champStats.map((c: any) => {
        const wr = c.winRate;
        const wrColor = wr >= 55 ? WIN_COLOR : wr >= 50 ? "#eab308" : LOSS_COLOR;
        return (
          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${c.name}_0.jpg`}
              style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid #233047" }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png";
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: FG, fontFamily: "'Rajdhani',sans-serif" }}>{c.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: MUTED }}>{c.games}G · {c.kda} KDA</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: wrColor, fontFamily: "'Barlow Condensed',sans-serif" }}>{Math.round(wr)}%</span>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "#233047", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(wr, 100)}%`, background: wrColor, borderRadius: 2, transition: "width 0.4s" }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImprovementPriorities({ priorities }: { priorities: any[] }) {
  if (!priorities?.length) return null;
  const LP_COLORS = ["#f0545c", "#f0545c", "#e8a93c", "#e8a93c", "#d2ad62", "#d2ad62"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {priorities.map((p: any, i: number) => {
        const lpColor = LP_COLORS[i] ?? MUTED;
        return (
          <div key={i} style={{
            display: "flex", gap: 10, padding: "10px 11px", borderRadius: 9,
            background: "#172031", border: "1px solid #233047",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: lpColor, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "white", fontFamily: "'Barlow Condensed',sans-serif",
            }}>
              {p.rank ?? i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: FG, fontFamily: "'Rajdhani',sans-serif" }}>{p.area}</span>
                {p.lp_gain_estimate > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: WIN_COLOR,
                    background: "#12271f", border: "1px solid #2a5c45",
                    borderRadius: 4, padding: "1px 6px", whiteSpace: "nowrap", flexShrink: 0,
                    fontFamily: "'Barlow Condensed',sans-serif",
                  }}>+{p.lp_gain_estimate} LP</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: LOSS_COLOR, fontWeight: 600 }}>Teraz: {p.current}</div>
                <div style={{ fontSize: 10, color: MUTED }}>→</div>
                <div style={{ fontSize: 10, color: WIN_COLOR, fontWeight: 600 }}>Cel: {p.target}</div>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: MUTED, lineHeight: 1.55 }}>{p.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KeyWeaknessCards({ weaknesses }: { weaknesses: any[] }) {
  if (!weaknesses?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {weaknesses.map((w: any, i: number) => (
        <div key={i} style={{
          borderRadius: 9, padding: "10px 12px",
          background: "#2a1519", border: "1px solid #2a1519",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <XCircle style={{ width: 11, height: 11, color: "#f0545c", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 12, color: FG, fontFamily: "'Rajdhani',sans-serif", flex: 1 }}>{w.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: "#f0545c",
              background: "#121926", border: "1px solid #6b2a30",
              borderRadius: 4, padding: "1px 7px", fontFamily: "'Barlow Condensed',sans-serif",
            }}>{w.stat}</span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: MUTED, lineHeight: 1.55 }}>
            <span style={{ color: "#f0545c", fontWeight: 600 }}>Skutek: </span>{w.impact}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: FG, lineHeight: 1.55 }}>
            <span style={{ color: WIN_COLOR, fontWeight: 600 }}>Jak naprawić: </span>{w.fix}
          </p>
        </div>
      ))}
    </div>
  );
}

function AnalysisProseCard({ title, icon: Icon, text, color, accent }: { title: string; icon: any; text: string; color?: string; accent?: string }) {
  const c = color ?? PRIMARY;
  return (
    <div style={{ ...CARD, padding: "13px 14px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, paddingBottom: 8, borderBottom: "1px solid #233047" }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: accent ?? "#262418", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: 12, height: 12, color: c }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: c, fontFamily: "'Rajdhani',sans-serif" }}>{title}</span>
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.75, color: MUTED, margin: 0 }}>{text}</p>
    </div>
  );
}

function AiAnalysisInner() {
  const { region, gameName, tagLine } = useParams<{ region: string; gameName: string; tagLine: string }>();
  usePageTitle(`${gameName}#${tagLine} — Analiza AI`);
  const [report, setReport] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const { data: summonerData } = useSearchSummoner({ region, gameName, tagLine });
  const puuid = (summonerData as any)?.puuid as string | undefined;

  const { data: rankedData } = useGetSummonerRanked(puuid ?? "", { region } as any, { query: { enabled: !!puuid } });
  const { data: masteryData } = useGetSummonerMastery(puuid ?? "", { region, count: 7 } as any, { query: { enabled: !!puuid } });

  const soloQ = (rankedData as any[])?.find((e: any) => e.queueType === "RANKED_SOLO_5x5");
  const tierColor = soloQ ? (TIER_COLOR[soloQ.tier] ?? MUTED) : MUTED;

  const steps = STEPS.map(s => s.label);

  async function generateReport() {
    if (!puuid) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setStats(null);
    fetchedRef.current = true;
    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setLoadingStep(steps[stepIdx]);
    }, 4500);
    try {
      const res = await fetch(`${BASE_URL}/api/summoner/${puuid}/ai-report?region=${region}&gameName=${encodeURIComponent(gameName)}`);
      clearInterval(interval);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReport(data.report);
      setStats(data.stats ?? null);
      setGeneratedAt(data.generatedAt);
    } catch (e: any) {
      clearInterval(interval);
      setError(e.message ?? "Błąd generowania raportu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (puuid && !fetchedRef.current) generateReport();
  }, [puuid]);

  const profileLink = `${BASE_URL}/profile/${region}/${gameName}/${tagLine}`;

  return (
    <div style={{ minHeight: "100vh", background: "#172031" }}>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "#121926", borderBottom: "1px solid #233047",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={profileLink}>
            <button style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "#172031", border: "1px solid #233047",
              borderRadius: 6, padding: "5px 10px", color: MUTED, fontSize: 11,
              fontWeight: 700, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif",
            }}>
              <ChevronLeft style={{ width: 13, height: 13 }} /> Profil
            </button>
          </Link>

          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/profileicon/${(summonerData as any)?.profileIconId ?? 1}.png`}
              style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${tierColor}`, objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://ddragon.leagueoflegends.com/cdn/profileicon/1.png"; }}
            />
            {(summonerData as any)?.summonerLevel && (
              <span style={{
                position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
                background: FG, borderRadius: 4, padding: "1px 4px",
                fontSize: 8, fontWeight: 700, color: "white", whiteSpace: "nowrap",
              }}>
                Lv. {(summonerData as any).summonerLevel}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: FG, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.02em" }}>
                {gameName}
              </span>
              <span style={{ fontSize: 12, color: MUTED }}>#{tagLine}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", padding: "1px 6px",
                background: "#262418", color: PRIMARY, border: "1px solid #6b5a35",
                borderRadius: 4, fontFamily: "'Rajdhani',sans-serif",
              }}>{region}</span>
            </div>
            {soloQ && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <img
                  src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${soloQ.tier.toLowerCase()}.png`}
                  style={{ width: 14, height: 14, objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, color: tierColor }}>{soloQ.tier} {soloQ.rank}</span>
                <span style={{ fontSize: 11, color: MUTED }}>{soloQ.leaguePoints} LP · {soloQ.wins}W {soloQ.losses}L</span>
              </div>
            )}
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
            background: "linear-gradient(135deg,#0A1628,#1a3a6b)",
            border: "1px solid rgba(200,155,60,0.4)", borderRadius: 7, flexShrink: 0,
          }}>
            <Brain style={{ width: 13, height: 13, color: "#C89B3C" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#C89B3C", letterSpacing: "0.08em", fontFamily: "'Rajdhani',sans-serif" }}>NEXUS AI</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "16px 14px 60px" }}>

        {loading && <GeneratingCard step={loadingStep} />}

        {error && !loading && (
          <div style={{ ...CARD, padding: 20, textAlign: "center", marginBottom: 12 }}>
            <AlertTriangle style={{ width: 24, height: 24, color: "#f0545c", margin: "0 auto 10px" }} />
            <div style={{ fontWeight: 700, color: FG, marginBottom: 6, fontSize: 14 }}>Błąd generowania raportu</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>{error}</div>
            <button onClick={generateReport} style={{
              background: "#2a1519", border: "1px solid #6b2a30",
              borderRadius: 7, padding: "7px 16px", color: "#f0545c", fontSize: 12,
              fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
              fontFamily: "'Rajdhani',sans-serif",
            }}>
              <RefreshCw style={{ width: 12, height: 12 }} /> Spróbuj ponownie
            </button>
          </div>
        )}

        {report && !loading && !report.error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Refresh bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              {generatedAt && (
                <span style={{ fontSize: 10, color: MUTED, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock style={{ width: 9, height: 9 }} />
                  {new Date(generatedAt).toLocaleTimeString("pl-PL")}
                </span>
              )}
              <button onClick={generateReport} style={{
                background: "#121926", border: "1px solid #233047",
                borderRadius: 7, padding: "5px 12px", color: MUTED, fontSize: 11,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'Rajdhani',sans-serif",
              }}>
                <RefreshCw style={{ width: 11, height: 11 }} /> Odśwież raport
              </button>
            </div>

            {/* Overall Rating Hero */}
            {(() => {
              // Sanityzacja — jeśli model zwrócił całą skalę (np. "S+/S/A+/..."), bierz pierwszy token
              const VALID_RATINGS = ["S+","S","A+","A","B+","B","C+","C","D"];
              const rawRating: string = report.overall_rating ?? "?";
              const safeRating = VALID_RATINGS.includes(rawRating)
                ? rawRating
                : (VALID_RATINGS.find(r => rawRating.startsWith(r)) ?? rawRating.split(/[/,\s]/)[0] ?? "?");
              const ratingColor = RATING_COLOR[safeRating] ?? PRIMARY;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "linear-gradient(135deg, #262418, white)",
                    border: "1px solid #6b5a35",
                    borderRadius: 14, padding: "18px 16px 16px",
                    overflow: "hidden",
                  }}
                >
                  {/* Hero row: badge + chips obok siebie */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14, minWidth: 0 }}>
                    {/* Ocena badge */}
                    <div style={{
                      textAlign: "center", flexShrink: 0,
                      paddingRight: 14, borderRight: "1px solid #233047",
                      minWidth: 56,
                    }}>
                      <div style={{
                        fontSize: 48, fontWeight: 900, lineHeight: 1,
                        fontFamily: "'Barlow Condensed',sans-serif",
                        color: ratingColor,
                        whiteSpace: "nowrap",
                      }}>
                        {safeRating}
                      </div>
                      <div style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                        color: MUTED, textTransform: "uppercase", marginTop: 2,
                        fontFamily: "'Rajdhani',sans-serif",
                      }}>OCENA</div>
                    </div>

                    {/* Prawa strona: chipy + paski */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Chipy — WEWNĄTRZ ramki, zawijają się */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                        {report.form_assessment && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "4px 10px",
                            background: "#121926", border: `1px solid #233047`,
                            borderRadius: 20, fontSize: 11, fontWeight: 700,
                            color: FORM_COLOR[report.form_assessment] ?? MUTED,
                            fontFamily: "'Rajdhani',sans-serif",
                            whiteSpace: "nowrap",
                          }}>
                            <Activity style={{ width: 10, height: 10, flexShrink: 0 }} />
                            {report.form_assessment}
                          </span>
                        )}
                        {report.playstyle_archetype && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "4px 10px",
                            background: "linear-gradient(135deg,#0A1628,#1a3a6b)",
                            borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#C89B3C",
                            fontFamily: "'Rajdhani',sans-serif",
                            whiteSpace: "nowrap",
                          }}>
                            <Zap style={{ width: 10, height: 10, flexShrink: 0 }} />
                            {report.playstyle_archetype}
                          </span>
                        )}
                      </div>

                      {/* Pasek wyniku ogólnego */}
                      {report.overall_score != null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#233047", overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${report.overall_score}%` }}
                              transition={{ duration: 0.8 }}
                              style={{ height: "100%", background: ratingColor, borderRadius: 3 }}
                            />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: FG, fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0 }}>
                            {report.overall_score}/100
                          </span>
                        </div>
                      )}

                      {/* Pasek konsekwencji */}
                      {report.consistency_score != null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#233047", overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${report.consistency_score}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              style={{ height: "100%", background: PRIMARY, borderRadius: 3 }}
                            />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: PRIMARY, fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0 }}>
                            {report.consistency_score}<span style={{ fontSize: 9, fontWeight: 600, color: MUTED }}>/100 KON</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: 12.5, lineHeight: 1.75, color: FG, margin: 0 }}>
                    {report.executive_summary}
                  </p>
                </motion.div>
              );
            })()}

            {/* Stats Dashboard from real data */}
            {stats && (
              <Card delay={0.04}>
                <SectionTitle icon={BarChart3}>Kluczowe Statystyki</SectionTitle>
                <StatsDashboard stats={stats} />
                <div style={{ marginTop: 10 }}>
                  <RecentResultsBar lastResults={stats.lastResults} />
                </div>
              </Card>
            )}

            {/* Best habit + Biggest mistake — 2-col */}
            {(report.best_habit || report.biggest_mistake_pattern) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {report.best_habit && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{
                      borderRadius: 10, padding: "12px 13px",
                      background: "#12271f", border: "1px solid #2a5c45",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                      <TrendingUp style={{ width: 12, height: 12, color: WIN_COLOR, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: WIN_COLOR, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani',sans-serif" }}>NAJLEPSZY NAWYK</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#46c08a", lineHeight: 1.65 }}>{report.best_habit}</p>
                  </motion.div>
                )}
                {report.biggest_mistake_pattern && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{
                      borderRadius: 10, padding: "12px 13px",
                      background: "#2a1519", border: "1px solid #6b2a30",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                      <Flame style={{ width: 12, height: 12, color: LOSS_COLOR, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#f0545c", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani',sans-serif" }}>GŁÓWNY BŁĄD</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#f0545c", lineHeight: 1.65 }}>{report.biggest_mistake_pattern}</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Strengths & Weaknesses */}
            {(report.strengths?.length > 0 || report.weaknesses?.length > 0) && (
              <Card delay={0.12}>
                <SectionTitle icon={Award}>Mocne i słabe strony</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
                      <TrendingUp style={{ width: 11, height: 11, color: WIN_COLOR }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: WIN_COLOR, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani',sans-serif" }}>MOCNE</span>
                    </div>
                    {(report.strengths ?? []).map((s: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                        <CheckCircle2 style={{ width: 11, height: 11, color: WIN_COLOR, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: FG, lineHeight: 1.6 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
                      <TrendingDown style={{ width: 11, height: 11, color: LOSS_COLOR }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: LOSS_COLOR, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani',sans-serif" }}>SŁABE</span>
                    </div>
                    {(report.weaknesses ?? []).map((w: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                        <AlertTriangle style={{ width: 11, height: 11, color: "#e8a93c", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: FG, lineHeight: 1.6 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Performance Radar */}
            {report.performance_radar && (
              <Card delay={0.14}>
                <SectionTitle icon={Activity}>Ocena Wydajności AI</SectionTitle>
                <PerformanceRadar radar={report.performance_radar} />
              </Card>
            )}

            {/* Champion Pool — real data visual + AI analysis */}
            {(stats?.champStats?.length > 0 || report.champion_pool_analysis) && (
              <Card delay={0.16}>
                <SectionTitle icon={BookOpen}>Pool Championów</SectionTitle>
                {stats?.champStats?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <ChampPoolVisual champStats={stats.champStats} />
                  </div>
                )}
                {report.champion_pool_analysis && <Prose text={report.champion_pool_analysis} />}
              </Card>
            )}

            {/* Improvement Priorities */}
            {report.improvement_priorities?.length > 0 && (
              <Card delay={0.18}>
                <SectionTitle icon={Trophy}>Priorytety Poprawy</SectionTitle>
                <ImprovementPriorities priorities={report.improvement_priorities} />
              </Card>
            )}

            {/* Detailed weakness cards */}
            {report.key_weaknesses_detailed?.length > 0 && (
              <Card delay={0.2}>
                <SectionTitle icon={AlertTriangle}>Analiza Błędów</SectionTitle>
                <KeyWeaknessCards weaknesses={report.key_weaknesses_detailed} />
              </Card>
            )}

            {/* Analysis sections in 2-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>

              {report.macro_analysis && (
                <AnalysisProseCard
                  title="Makro — Mapa"
                  icon={Target}
                  text={report.macro_analysis}
                  color="#d2ad62"
                  accent="#262418"
                />
              )}

              {report.micro_analysis && (
                <AnalysisProseCard
                  title="Mikro — Mechanika"
                  icon={Swords}
                  text={report.micro_analysis}
                  color="#e8a93c"
                  accent="#2a2212"
                />
              )}

              {report.lane_phase_analysis && (
                <AnalysisProseCard
                  title="Faza Laningowa"
                  icon={Shield}
                  text={report.lane_phase_analysis}
                  color="#46c08a"
                  accent="#12271f"
                />
              )}

              {report.teamfight_analysis && (
                <AnalysisProseCard
                  title="Teamfighty"
                  icon={Users}
                  text={report.teamfight_analysis}
                  color="#e8a93c"
                  accent="#2a2212"
                />
              )}

              {report.death_analysis && (
                <AnalysisProseCard
                  title="Analiza Zgonów"
                  icon={AlertTriangle}
                  text={report.death_analysis}
                  color="#f0545c"
                  accent="#2a1519"
                />
              )}

              {report.vision_analysis && (
                <AnalysisProseCard
                  title="Vision i Świadomość"
                  icon={Eye}
                  text={report.vision_analysis}
                  color="#9c7bff"
                  accent="#1f1a33"
                />
              )}

              {report.playstyle_description && (
                <AnalysisProseCard
                  title="Styl Gry"
                  icon={Zap}
                  text={report.playstyle_description}
                />
              )}

              {report.mental_game && (
                <div style={{ ...CARD, padding: "13px 14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, paddingBottom: 8, borderBottom: "1px solid #233047" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#1f1a33", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Brain style={{ width: 12, height: 12, color: "#9c7bff" }} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9c7bff", fontFamily: "'Rajdhani',sans-serif" }}>Aspekt Mentalny</span>
                  </div>
                  <Prose text={report.mental_game} />
                  {report.consistency_comment && (
                    <div style={{
                      marginTop: 8, padding: "6px 10px", borderRadius: 7,
                      background: "#262418", border: "1px solid #6b5a35",
                    }}>
                      <span style={{ fontSize: 11, color: PRIMARY, fontStyle: "italic" }}>{report.consistency_comment}</span>
                    </div>
                  )}
                </div>
              )}

              {report.rank_prediction && (
                <div style={{ ...CARD, padding: "13px 14px 12px", borderLeft: `3px solid ${PRIMARY}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, paddingBottom: 8, borderBottom: "1px solid #233047" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#262418", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Trophy style={{ width: 12, height: 12, color: PRIMARY }} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: PRIMARY, fontFamily: "'Rajdhani',sans-serif" }}>Prognoza Rankingowa</span>
                  </div>
                  <Prose text={report.rank_prediction} />
                </div>
              )}

            </div>

            {/* Coaching Tips */}
            {report.coaching_tips?.length > 0 && (
              <Card delay={0.28}>
                <SectionTitle icon={Lightbulb}>Wskazówki Coachingowe</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {report.coaching_tips.map((tip: any, i: number) => {
                    const p = PRIORITY_COLOR[tip.priority] ?? PRIORITY_COLOR.medium;
                    const Icon = CATEGORY_ICON[tip.category] ?? Lightbulb;
                    return (
                      <div key={i} style={{
                        borderRadius: 9, padding: "10px 12px",
                        background: p.bg, border: `1px solid ${p.border}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                            background: p.numBg, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon style={{ width: 10, height: 10, color: "white" }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 12, color: FG, flex: 1, fontFamily: "'Rajdhani',sans-serif" }}>{tip.title}</span>
                          <span style={{
                            fontSize: 8, fontWeight: 700, color: p.text,
                            background: "#121926", borderRadius: 4, padding: "1px 5px", border: `1px solid ${p.border}`,
                            fontFamily: "'Rajdhani',sans-serif",
                          }}>
                            {p.label}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: "#ece6d6", lineHeight: 1.65 }}>{tip.description}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Champion Recommendations */}
            {report.champion_recommendations?.length > 0 && (
              <Card delay={0.32}>
                <SectionTitle icon={Star}>Polecane Championy</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                  {report.champion_recommendations.map((rec: any, i: number) => (
                    <div key={i} style={{
                      padding: "9px 10px", borderRadius: 9,
                      background: "#262418", border: "1px solid #6b5a35",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                        <img
                          src={`https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${rec.champion}_0.jpg`}
                          style={{ width: 34, height: 34, borderRadius: 7, objectFit: "cover", flexShrink: 0, border: "1px solid #6b5a35" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div style={{ fontWeight: 700, fontSize: 12, color: FG, fontFamily: "'Rajdhani',sans-serif" }}>{rec.champion}</div>
                      </div>
                      <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.55, marginBottom: rec.synergy ? 5 : 0 }}>{rec.reason}</div>
                      {rec.synergy && (
                        <div style={{ fontSize: 10, color: PRIMARY, display: "flex", alignItems: "flex-start", gap: 3 }}>
                          <ChevronRight style={{ width: 9, height: 9, marginTop: 1, flexShrink: 0 }} />
                          {rec.synergy}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Motivation quote */}
            {report.motivation_quote && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                style={{
                  padding: "18px 20px",
                  background: "linear-gradient(135deg, #2a2212, white)",
                  border: "1px solid #6b4f22", borderRadius: 12, textAlign: "center",
                }}
              >
                <Sparkles style={{ width: 18, height: 18, color: "#e8a93c", margin: "0 auto 10px" }} />
                <p style={{ fontStyle: "italic", fontSize: 13.5, color: FG, lineHeight: 1.75, margin: "0 0 8px", fontWeight: 600 }}>
                  "{report.motivation_quote}"
                </p>
                <span style={{ fontSize: 10, color: "#e8a93c", fontWeight: 700, fontFamily: "'Rajdhani',sans-serif" }}>— Nexus AI</span>
              </motion.div>
            )}

          </div>
        )}

        {/* Parse error fallback */}
        {report?.error && !loading && (
          <div style={{ ...CARD, padding: 22, textAlign: "center" }}>
            <AlertTriangle style={{ width: 28, height: 28, color: "#f0545c", margin: "0 auto 10px" }} />
            <div style={{ fontWeight: 700, color: FG, marginBottom: 6, fontSize: 14 }}>Błąd generowania raportu</div>
            <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: "0 0 14px" }}>
              AI nie mogło przetworzyć danych. Kliknij poniżej aby spróbować ponownie.
            </p>
            <button onClick={() => generateReport()} style={{
              background: "#262418", border: "1px solid #6b5a35",
              borderRadius: 8, padding: "8px 18px", color: PRIMARY, fontSize: 12,
              fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "'Rajdhani',sans-serif",
            }}>
              <RefreshCw style={{ width: 12, height: 12 }} /> Spróbuj ponownie
            </button>
          </div>
        )}
        <AdBanner slot="7172864968" format="autorelaxed" className="mt-8 mb-4" />
      </div>
    </div>
  );
}

export default function AiAnalysisPage() {
  return (
    <AiErrorBoundary>
      <AiAnalysisInner />
    </AiErrorBoundary>
  );
}
