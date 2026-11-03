import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertTriangle, Trophy, Target, Zap, Crown } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

type LiveInsightsResponse = {
  prediction: {
    blue_win_pct: number;
    red_win_pct: number;
    my_win_pct: number;
    my_side: "blue" | "red";
    confidence: "low" | "medium" | "high";
    breakdown: {
      blue: { avg_rank_score: number; avg_wr: number; avg_games: number };
      red: { avg_rank_score: number; avg_wr: number; avg_games: number };
    };
  };
  ai: {
    team_archetype: string;
    enemy_archetype: string;
    game_plan: string;
    win_conditions: string[];
    threats: { champion: string; threat: string; counter: string }[];
    power_spikes: { early: string; mid: string; late: string };
    key_objective: string;
    mvp_pick: string;
  };
  model?: string;
  generatedAt: number;
};

export default function LiveAICoach({
  gameId,
  mySide,
  gameMode,
  participants,
}: {
  gameId: number;
  mySide: "blue" | "red";
  gameMode: string;
  participants: any[];
}) {
  const [data, setData] = useState<LiveInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/coach/live-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, mySide, gameMode, participants }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Błąd ${res.status}`);
      }
      const json = (await res.json()) as LiveInsightsResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  if (!data && !loading && !error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5 p-4 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-base font-black uppercase tracking-wider text-primary"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            AI Coach
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3 max-w-md mx-auto">
          Predykcja wyniku + plan gry + wskazówki, jak wygrać ten konkretny mecz. Generuje analizę AI dla obu drużyn.
        </p>
        <button onClick={generate}
          className="search-btn inline-flex items-center gap-2 px-5 py-2"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <Sparkles className="w-4 h-4" />
          WYGENERUJ ANALIZĘ
        </button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">AI analizuje mecz...</p>
        <p className="text-[10px] text-muted-foreground/60">Może zająć 10-30 sekund</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 text-destructive font-bold mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Błąd generowania analizy</span>
        </div>
        <p className="text-xs text-destructive/80 mb-2">{error}</p>
        <button onClick={generate} className="text-xs font-bold text-primary hover:underline">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { prediction, ai } = data;
  const isMyBlue = mySide === "blue";
  const myColor = isMyBlue ? "#2563EB" : "#DC2626";
  const enemyColor = isMyBlue ? "#DC2626" : "#2563EB";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
      {/* Win prediction bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-primary"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Predykcja wyniku
            </h3>
          </div>
          <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded"
            style={{
              background: prediction.confidence === "high" ? "#12271f" : prediction.confidence === "medium" ? "#2a2212" : "#233047",
              color: prediction.confidence === "high" ? "#46c08a" : prediction.confidence === "medium" ? "#e8a93c" : "#a8b0bf",
            }}>
            Pewność: {prediction.confidence === "high" ? "wysoka" : prediction.confidence === "medium" ? "średnia" : "niska"}
          </span>
        </div>

        {/* Probability bar */}
        <div className="relative h-9 rounded-md overflow-hidden border border-border flex">
          <div className="flex items-center justify-start pl-3 text-white font-black text-base"
            style={{ width: `${prediction.blue_win_pct}%`, background: "linear-gradient(90deg, hsl(220,80%,40%), hsl(220,80%,55%))", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {prediction.blue_win_pct}%
          </div>
          <div className="flex items-center justify-end pr-3 text-white font-black text-base"
            style={{ width: `${prediction.red_win_pct}%`, background: "linear-gradient(90deg, #f0545c, #f0545c)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {prediction.red_win_pct}%
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] uppercase tracking-widest font-bold"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <span style={{ color: "#2563EB" }}>NIEBIESCY (avg WR {prediction.breakdown.blue.avg_wr}%)</span>
          <span style={{ color: "#DC2626" }}>(avg WR {prediction.breakdown.red.avg_wr}%) CZERWONI</span>
        </div>

        <div className="mt-3 pt-3 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">Twoje szanse: </span>
          <span className="text-2xl font-black tabular-nums" style={{ color: myColor, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {prediction.my_win_pct}%
          </span>
        </div>
      </div>

      {/* Game plan */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4" style={{ color: myColor }} />
          <h3 className="text-sm font-black uppercase tracking-wider"
            style={{ color: myColor, fontFamily: "'Barlow Condensed', sans-serif" }}>
            Plan na mecz
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
            style={{ background: `${myColor}15`, color: myColor, border: `1px solid ${myColor}40`, fontFamily: "'Rajdhani', sans-serif" }}>
            TY: {ai.team_archetype}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
            style={{ background: `${enemyColor}15`, color: enemyColor, border: `1px solid ${enemyColor}40`, fontFamily: "'Rajdhani', sans-serif" }}>
            WRÓG: {ai.enemy_archetype}
          </span>
        </div>
        <p className="text-sm leading-relaxed">{ai.game_plan}</p>
      </div>

      {/* Win conditions */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-black uppercase tracking-wider text-amber-600"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Twoje Win Conditions
          </h3>
        </div>
        <ul className="space-y-2">
          {ai.win_conditions.map((wc, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">
                {i + 1}
              </span>
              <span className="leading-snug">{wc}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Threats */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-black uppercase tracking-wider text-destructive"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Zagrożenia
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ai.threats.map((t, i) => (
            <div key={i} className="border border-border rounded p-2.5 bg-background">
              <div className="text-xs font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {t.champion}
              </div>
              <div className="text-[11px] text-destructive/80 mb-1.5 leading-snug">⚠ {t.threat}</div>
              <div className="text-[11px] text-primary leading-snug">→ {t.counter}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Power spikes */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-black uppercase tracking-wider text-purple-600"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Faza gry
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PhaseCard label="Wczesna (0-15')" text={ai.power_spikes.early} color="#46c08a" />
          <PhaseCard label="Środkowa (15-25')" text={ai.power_spikes.mid} color="#e8a93c" />
          <PhaseCard label="Późna (25'+)" text={ai.power_spikes.late} color="#9c7bff" />
        </div>
      </div>

      {/* Key objective + MVP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-black uppercase tracking-wider text-primary"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Kluczowy cel
            </h4>
          </div>
          <p className="text-sm">{ai.key_objective}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-600"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              MVP drużyny
            </h4>
          </div>
          <p className="text-sm">{ai.mvp_pick}</p>
        </div>
      </div>

      <p className="text-[9px] text-center text-muted-foreground/60 italic">
        Analiza AI{data.model ? ` · ${data.model.split("/").pop()}` : ""} · wygenerowano {new Date(data.generatedAt).toLocaleTimeString("pl-PL")}
      </p>
    </motion.div>
  );
}

function PhaseCard({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: color }}>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1"
        style={{ color, fontFamily: "'Rajdhani', sans-serif" }}>
        {label}
      </div>
      <p className="text-xs leading-snug">{text}</p>
    </div>
  );
}
