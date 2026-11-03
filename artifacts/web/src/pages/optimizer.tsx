import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, X, Sparkles, Zap, Shield, Sword, Target, Loader2, Trophy } from "lucide-react";
import { getDDBase } from "@/lib/constants";
import { usePageTitle } from "@/lib/usePageTitle";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

type ChampEntry = { id: string; name: string };

const LANES = [
  { id: "TOP", label: "Top", icon: "🛡" },
  { id: "JUNGLE", label: "Jungla", icon: "🌲" },
  { id: "MID", label: "Mid", icon: "✨" },
  { id: "BOTTOM", label: "ADC", icon: "🏹" },
  { id: "SUPPORT", label: "Support", icon: "💖" },
];

type OptimizerResponse = {
  myChampion: string;
  lane: string;
  summary: string;
  summoners: { primary: string; secondary: string; reason: string };
  runes: {
    primary_path: string;
    primary_keystone: string;
    primary_runes: string[];
    secondary_path: string;
    secondary_runes: string[];
    shards: string[];
    reason: string;
  };
  build: {
    boots: string;
    boots_reason: string;
    core_items: { name: string; reason: string }[];
    situational_items: { name: string; reason: string }[];
  };
  matchup_tips: string[];
  spike_timing: string;
  win_condition: string;
};

function ChampPicker({
  champions,
  selected,
  onSelect,
  onClose,
  title,
}: {
  champions: ChampEntry[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  title: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return champions;
    return champions.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [champions, query]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-xl"
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="font-bold text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{title}</div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj championa..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded outline-none focus:border-primary text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {selected && (
            <button
              onClick={() => { onSelect(null); onClose(); }}
              className="mb-2 text-xs text-destructive hover:underline"
            >× Wyczyść wybór</button>
          )}
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 gap-1.5">
            {filtered.map((c) => (
              <button key={c.id}
                onClick={() => { onSelect(c.id); onClose(); }}
                className="flex flex-col items-center gap-1 p-1 rounded hover:bg-muted transition-colors"
                style={selected === c.id ? { background: "#262418", outline: "2px solid #d2ad62" } : {}}
              >
                <img src={`${getDDBase()}/champion/${c.id}.png`} alt={c.name}
                  className="w-12 h-12 rounded"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.opacity = "0.3"; }} />
                <span className="text-[10px] truncate w-full text-center" title={c.name}>{c.name}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-12 text-sm">Brak wyników</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ChampSlot({
  champion, label, champions, onClick, size = 64,
}: {
  champion: string | null;
  label: string;
  champions: ChampEntry[];
  onClick: () => void;
  size?: number;
}) {
  const champ = champions.find((c) => c.id === champion);
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div
        className="rounded-lg border-2 transition-all flex items-center justify-center overflow-hidden"
        style={{
          width: size, height: size,
          borderColor: champion ? "#d2ad62" : "#233047",
          background: champion ? "transparent" : "#172031",
          boxShadow: champion ? "0 0 0 2px #6b5a35" : "none",
        }}
      >
        {champ ? (
          <img src={`${getDDBase()}/champion/${champ.id}.png`} alt={champ.name} className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.opacity = "0.3"; }} />
        ) : (
          <span className="text-3xl text-muted-foreground/40 group-hover:text-muted-foreground">+</span>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}>{label}</span>
    </button>
  );
}

const RUNE_PATH_COLOR: Record<string, string> = {
  Precision: "#C8AA6E",
  Domination: "#CA3E3F",
  Sorcery: "#9AAEFF",
  Resolve: "#4D8B7C",
  Inspiration: "#49AAB9",
};

export default function OptimizerPage() {
  usePageTitle("Optymalizator Build & Run | Nexus Draft");

  const [champions, setChampions] = useState<ChampEntry[]>([]);
  const [myChamp, setMyChamp] = useState<string | null>(null);
  const [enemies, setEnemies] = useState<(string | null)[]>([null, null, null, null, null]);
  const [allies, setAllies] = useState<(string | null)[]>([null, null, null, null]);
  const [lane, setLane] = useState<string>("MID");

  const [pickerOpen, setPickerOpen] = useState<{ slot: "my" | "enemy" | "ally"; index: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)
      .then((r) => r.json())
      .then((versions: string[]) => {
        const v = versions[0];
        return fetch(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`);
      })
      .then((r) => r.json())
      .then((d: any) => {
        const list: ChampEntry[] = Object.values(d.data).map((c: any) => ({ id: c.id, name: c.name }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setChampions(list);
      })
      .catch(() => {});
  }, []);

  const enemyCount = enemies.filter(Boolean).length;
  const canGenerate = !!myChamp && enemyCount > 0 && !loading;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const myChampName = champions.find((c) => c.id === myChamp)?.name ?? myChamp;
      const enemyNames = enemies.filter(Boolean).map((id) => champions.find((c) => c.id === id)?.name ?? id);
      const allyNames = allies.filter(Boolean).map((id) => champions.find((c) => c.id === id)?.name ?? id);

      const res = await fetch(`${BASE_URL}/api/coach/optimizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myChampion: myChampName, lane, allies: allyNames, enemies: enemyNames }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Błąd ${res.status}`);
      }
      const data = (await res.json()) as OptimizerResponse;
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      setError(e?.message ?? "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMyChamp(null);
    setEnemies([null, null, null, null, null]);
    setAllies([null, null, null, null]);
    setResult(null);
    setError(null);
  }

  const currentSelected =
    pickerOpen?.slot === "my" ? myChamp
    : pickerOpen?.slot === "enemy" ? enemies[pickerOpen.index]
    : pickerOpen?.slot === "ally" ? allies[pickerOpen.index]
    : null;

  function handlePickerSelect(id: string | null) {
    if (!pickerOpen) return;
    if (pickerOpen.slot === "my") setMyChamp(id);
    else if (pickerOpen.slot === "enemy") {
      setEnemies((arr) => arr.map((v, i) => (i === pickerOpen.index ? id : v)));
    } else if (pickerOpen.slot === "ally") {
      setAllies((arr) => arr.map((v, i) => (i === pickerOpen.index ? id : v)));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Strona główna
          </Link>
          <div className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            AI Coach
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            <Sparkles className="w-8 h-8 inline-block mr-2 text-primary" />
            Optymalizator Build & Runy
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Wybierz swojego bohatera + skład wroga. AI wygeneruje runy, sumony i pełny build dopasowany do tego konkretnego matchupa.
          </p>
        </div>

        {/* Picker section */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 shadow-sm">
          {/* My champion + Lane */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6 pb-6 border-b border-border">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Twój bohater
              </span>
              <ChampSlot champion={myChamp} label="Wybierz" champions={champions}
                onClick={() => setPickerOpen({ slot: "my", index: 0 })} size={96} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Linia
              </span>
              <div className="flex gap-1 flex-wrap justify-center">
                {LANES.map((l) => (
                  <button key={l.id} onClick={() => setLane(l.id)}
                    className="px-3 py-2 rounded text-xs font-bold uppercase tracking-wide transition-colors border"
                    style={{
                      background: lane === l.id ? "#d2ad62" : "transparent",
                      color: lane === l.id ? "white" : "#a8b0bf",
                      borderColor: lane === l.id ? "#d2ad62" : "#233047",
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >
                    <span className="mr-1">{l.icon}</span>{l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enemies */}
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-destructive mb-3 text-center"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Wrogowie ({enemyCount}/5) — wybierz przynajmniej jednego
            </div>
            <div className="flex justify-center gap-3 flex-wrap">
              {enemies.map((c, i) => (
                <ChampSlot key={i} champion={c} label={`Wróg ${i + 1}`} champions={champions}
                  onClick={() => setPickerOpen({ slot: "enemy", index: i })} />
              ))}
            </div>
          </div>

          {/* Allies (optional) */}
          <div className="mb-2">
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3 text-center"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Sojusznicy (opcjonalne)
            </div>
            <div className="flex justify-center gap-3 flex-wrap">
              {allies.map((c, i) => (
                <ChampSlot key={i} champion={c} label={`Ally ${i + 1}`} champions={champions}
                  onClick={() => setPickerOpen({ slot: "ally", index: i })} size={56} />
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-8">
          <button onClick={handleGenerate} disabled={!canGenerate}
            className="search-btn px-8 py-3 inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? "Generuję..." : "Wygeneruj Build"}
          </button>
          <button onClick={reset} disabled={loading}
            className="px-6 py-3 border border-border rounded text-sm font-bold uppercase tracking-wide hover:bg-muted disabled:opacity-40"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            Wyczyść
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded mb-6 text-sm">
            <div className="font-bold mb-1">Błąd generowania</div>
            <div>{error}</div>
          </div>
        )}

        {/* Result */}
        <div ref={resultRef}>
          {result && <OptimizerResult result={result} champions={champions} myChampId={myChamp} />}
        </div>

        {!result && !loading && (
          <div className="text-center text-muted-foreground text-sm py-8 px-4 max-w-xl mx-auto">
            <p className="mb-2">💡 <strong>Wskazówka:</strong> AI bierze pod uwagę KONKRETNYCH wrogów</p>
            <p className="text-xs">Im więcej wrogów wybierzesz, tym lepsza rekomendacja. Sojusznicy są opcjonalni, ale poprawiają wybór runy/sumonów (np. heal vs heal).</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <ChampPicker
            champions={champions}
            selected={currentSelected}
            onSelect={handlePickerSelect}
            onClose={() => setPickerOpen(null)}
            title={
              pickerOpen.slot === "my" ? "Wybierz swojego bohatera"
              : pickerOpen.slot === "enemy" ? `Wybierz wroga ${pickerOpen.index + 1}`
              : `Wybierz sojusznika ${pickerOpen.index + 1}`
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OptimizerResult({ result, champions, myChampId }: { result: OptimizerResponse; champions: ChampEntry[]; myChampId: string | null }) {
  const myChamp = champions.find((c) => c.id === myChampId);
  const pathColor = RUNE_PATH_COLOR[result.runes.primary_path] ?? "#888";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header summary */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          {myChamp && (
            <img src={`${getDDBase()}/champion/${myChamp.id}.png`} alt={myChamp.name}
              className="w-16 h-16 rounded border-2" style={{ borderColor: "#d2ad62" }} />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {result.myChampion} <span className="text-sm font-normal text-muted-foreground">— {result.lane}</span>
            </h2>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge color="#d2ad62" icon="⚡">Spike: {result.spike_timing}</Badge>
          <Badge color="#46c08a" icon="🏆">Win: {result.win_condition}</Badge>
        </div>
      </div>

      {/* Summoners + Runes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Summoners */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader icon={<Zap className="w-5 h-5" />} title="Sumony" color="#d2ad62" />
          <div className="flex items-center gap-3 mb-3">
            <SummonerBadge name={result.summoners.primary} />
            <span className="text-2xl text-muted-foreground/40">+</span>
            <SummonerBadge name={result.summoners.secondary} />
          </div>
          <p className="text-xs text-muted-foreground italic">{result.summoners.reason}</p>
        </div>

        {/* Runes */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader icon={<Shield className="w-5 h-5" />} title="Runy" color={pathColor} />
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Główna: <span style={{ color: pathColor }}>{result.runes.primary_path}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <RunePill name={result.runes.primary_keystone} highlight color={pathColor} />
                {result.runes.primary_runes.map((r, i) => <RunePill key={i} name={r} color={pathColor} />)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Drugorzędna: <span style={{ color: RUNE_PATH_COLOR[result.runes.secondary_path] ?? "#666" }}>{result.runes.secondary_path}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.runes.secondary_runes.map((r, i) => <RunePill key={i} name={r} color={RUNE_PATH_COLOR[result.runes.secondary_path] ?? "#666"} />)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Fragmenty
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.runes.shards.map((r, i) => <RunePill key={i} name={r} small />)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic pt-1 border-t border-border">{result.runes.reason}</p>
          </div>
        </div>
      </div>

      {/* Build */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <SectionHeader icon={<Sword className="w-5 h-5" />} title="Build" color="#e8a93c" />

        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Buty</div>
          <ItemCard name={result.build.boots} reason={result.build.boots_reason} />
        </div>

        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            Core (kolejność kupowania)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {result.build.core_items.map((item, i) => (
              <div key={i} className="relative">
                <ItemCard name={item.name} reason={item.reason} />
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {result.build.situational_items?.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Sytuacyjne (zamień zależnie od gry)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.build.situational_items.map((item, i) => (
                <ItemCard key={i} name={item.name} reason={item.reason} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Matchup tips */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <SectionHeader icon={<Target className="w-5 h-5" />} title="Wskazówki na matchup" color="#9c7bff" />
        <ul className="space-y-2">
          {result.matchup_tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="text-primary font-bold">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
      <span style={{ color }}>{icon}</span>
      <h3 className="text-lg font-black uppercase tracking-wide" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {title}
      </h3>
    </div>
  );
}

function Badge({ color, icon, children }: { color: string; icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded"
      style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
      <span>{icon}</span>{children}
    </span>
  );
}

function SummonerBadge({ name }: { name: string }) {
  // Map common summoner names to ddragon spell file names
  const SUMM_MAP: Record<string, string> = {
    Flash: "SummonerFlash", Ignite: "SummonerDot", Teleport: "SummonerTeleport",
    Heal: "SummonerHeal", Exhaust: "SummonerExhaust", Cleanse: "SummonerBoost",
    Smite: "SummonerSmite", Barrier: "SummonerBarrier", Ghost: "SummonerHaste",
    Clarity: "SummonerMana",
  };
  const file = SUMM_MAP[name] ?? "SummonerFlash";
  return (
    <div className="flex flex-col items-center gap-1">
      <img src={`${getDDBase()}/spell/${file}.png`} alt={name}
        className="w-12 h-12 rounded border border-border"
        onError={(e) => { e.currentTarget.style.opacity = "0.3"; }} />
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{name}</span>
    </div>
  );
}

function RunePill({ name, highlight, small, color }: { name: string; highlight?: boolean; small?: boolean; color?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 ${small ? "py-0.5 text-[10px]" : "py-1 text-xs"} rounded font-medium`}
      style={{
        background: highlight ? `${color ?? "#d2ad62"}20` : "#172031",
        color: highlight ? color : "#a8b0bf",
        border: highlight ? `1px solid ${color ?? "#d2ad62"}50` : "1px solid #233047",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      {highlight && <span className="mr-1">★</span>}{name}
    </span>
  );
}

function ItemCard({ name, reason }: { name: string; reason: string }) {
  return (
    <div className="border border-border rounded p-2.5 bg-background hover:border-primary/50 transition-colors">
      <div className="text-sm font-bold mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{name}</div>
      <div className="text-xs text-muted-foreground leading-snug">{reason}</div>
    </div>
  );
}
