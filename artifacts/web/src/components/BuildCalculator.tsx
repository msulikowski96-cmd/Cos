import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Swords, Info, Copy, Check, Zap } from "lucide-react";
import { getDDBase, getDDVersion } from "@/lib/constants";
import {
  calculateBuild,
  CLASS_LABEL,
  getChampProfile,
  type BuildResult,
  type ItemRec,
  type Lane,
} from "@/lib/buildAlgorithm";

interface ChampEntry {
  id: string;
  name: string;
}

// Fallback hardcoded gold costs — overwritten once DDragon data loads
const ITEM_GOLD_FALLBACK: Record<number, number> = {
  3006: 900, 3047: 1100, 3111: 1100, 3158: 950, 3020: 900, 3009: 900,
  3031: 3400, 3085: 2600, 3046: 2900, 3095: 3000, 3094: 2500, 3036: 3000,
  6672: 3200, 3026: 2800, 3139: 2600, 3156: 2500, 3033: 2700,
  6653: 3000, 3135: 3000, 3089: 3600, 4645: 3000, 3285: 3000,
  3157: 2600, 3102: 2600, 3165: 2000, 3123: 2500, 3076: 1000,
  3071: 3100, 3053: 2800, 6632: 2900, 3748: 3400, 6333: 3300,
  3068: 2800, 3083: 3000, 3143: 2900, 4401: 2500, 3742: 2700,
  6617: 2800, 2065: 2300, 3190: 2300, 3504: 2300, 6656: 2600,
  3152: 2800, 3146: 2600, 3065: 2900, 3075: 2700, 3181: 2700,
  3193: 3200, 3001: 2500, 3110: 2700, 6693: 2800, 6694: 3100,
  3100: 3000, 3115: 3000, 4637: 3000, 3153: 3300, 3078: 3300,
  3222: 2300, 3107: 2100, 3109: 2400, 3050: 2200, 4010: 2300,
  3142: 2900, 3147: 3100, 6691: 3200, 3814: 2900, 4005: 2800,
};

// Module-level cache filled from DDragon on first load
let _ddGoldCache: Record<number, number> = {};
let _ddGoldFetched = false;

async function fetchDDragonGold(version: string): Promise<void> {
  if (_ddGoldFetched) return;
  _ddGoldFetched = true;
  try {
    const r = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
    const data = await r.json() as { data: Record<string, { gold: { total: number } }> };
    const map: Record<number, number> = {};
    for (const [id, item] of Object.entries(data.data)) {
      if (item.gold?.total) map[Number(id)] = item.gold.total;
    }
    _ddGoldCache = map;
  } catch {
    // silently fall back to hardcoded values
  }
}

function getGold(id: number): number {
  return _ddGoldCache[id] ?? ITEM_GOLD_FALLBACK[id] ?? 2800;
}

function formatGold(g: number): string {
  return g >= 1000 ? `${(g / 1000).toFixed(1)}k` : `${g}`;
}

const SUMM_IMG = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/spell/Summoner${name}.png`;

interface SummonerRec {
  spell1: { name: string; img: string; key: string };
  spell2: { name: string; img: string; key: string };
  note: string;
}

const SUMMS = {
  flash: { name: "Flash", img: SUMM_IMG("Flash"), key: "Flash" },
  ignite: { name: "Zapłon", img: SUMM_IMG("Dot"), key: "Dot" },
  tp: { name: "Teleport", img: SUMM_IMG("Teleport"), key: "Teleport" },
  exhaust: { name: "Wyczerpanie", img: SUMM_IMG("Exhaust"), key: "Exhaust" },
  cleanse: { name: "Oczyszczenie", img: SUMM_IMG("Boost"), key: "Boost" },
  barrier: { name: "Bariera", img: SUMM_IMG("Barrier"), key: "Barrier" },
  smite: { name: "Karanie", img: SUMM_IMG("Smite"), key: "Smite" },
  ghost: { name: "Widmo", img: SUMM_IMG("Haste"), key: "Haste" },
};

function recommendSummoners(lane: Lane, myChampId: string, ta: NonNullable<BuildResult["teamAnalysis"]>): SummonerRec {
  const profile = getChampProfile(myChampId);
  const isJungle = lane === "JUNGLE";
  const isSupport = lane === "SUPPORT" || profile.class === "SUPPORT";
  const isMobile = profile.tags?.includes("mobility");
  const hasManyCC = ta.heavyCC || ta.assassinCount >= 2;

  if (isJungle) {
    return {
      spell1: SUMMS.smite,
      spell2: SUMMS.flash,
      note: "Karanie obowiązkowe dla junglera",
    };
  }
  if (isSupport) {
    if (hasManyCC) return { spell1: SUMMS.flash, spell2: SUMMS.exhaust, note: "Exhaust kluczowy vs assassini i burst" };
    return { spell1: SUMMS.flash, spell2: SUMMS.ignite, note: "Zapłon na presję w laningu" };
  }
  if (hasManyCC && !isMobile) {
    return { spell1: SUMMS.flash, spell2: SUMMS.cleanse, note: "Oczyszczenie vs dużo CC i lockdown" };
  }
  if (ta.assassinCount >= 2 && (profile.class === "MARKSMAN" || profile.class === "MAGE")) {
    return { spell1: SUMMS.flash, spell2: SUMMS.barrier, note: "Bariera ratuje przed oneshot assassina" };
  }
  if (lane === "TOP") {
    return { spell1: SUMMS.flash, spell2: SUMMS.tp, note: "Teleport dla globalnej obecności na mapie" };
  }
  if (ta.healingPresence && (lane === "MID" || profile.class === "MAGE")) {
    return { spell1: SUMMS.flash, spell2: SUMMS.ignite, note: "Zapłon blokuje leczenie w walce" };
  }
  return { spell1: SUMMS.flash, spell2: SUMMS.ignite, note: "Klasyczna kombinacja Flash + Zapłon" };
}

const RUNE_PATH_IMG = (icon: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${icon}.png`;

function SummonerIcon({ spell }: { spell: { name: string; img: string } }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative group flex-shrink-0">
      {!err ? (
        <img
          src={spell.img}
          alt={spell.name}
          className="w-10 h-10 rounded-lg border border-border object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold">
          {spell.name.slice(0, 2)}
        </div>
      )}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] whitespace-nowrap rounded-md px-2 py-1 shadow-xl"
          style={{ background: "hsl(220,20%,10%)", color: "white", border: "1px solid #3a4760" }}>
          {spell.name}
        </div>
      </div>
    </div>
  );
}

function ItemIcon({ item, order, size = 40 }: { item: ItemRec; order?: number; size?: number }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative group flex-shrink-0" style={{ width: size, height: size }}>
      {!err ? (
        <img
          src={`${getDDBase()}/item/${item.id}.png`}
          alt={item.name}
          className="rounded-md object-cover border border-border"
          style={{ width: size, height: size }}
          onError={() => setErr(true)}
        />
      ) : (
        <div className="rounded-md flex items-center justify-center text-[8px] text-muted-foreground bg-muted border border-border text-center leading-tight p-0.5"
          style={{ width: size, height: size }}>
          {item.name.slice(0, 6)}
        </div>
      )}
      {order !== undefined && (
        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black z-10"
          style={{ background: "#d2ad62", color: "white" }}>
          {order}
        </div>
      )}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] rounded-md px-2 py-1.5 shadow-xl"
          style={{ background: "hsl(220,20%,10%)", color: "white", border: "1px solid #3a4760", minWidth: 120, maxWidth: 180 }}>
          <p className="font-bold">{item.name}</p>
          <p className="text-[9px] opacity-60">{formatGold(getGold(item.id))} złota</p>
          {item.reason && <p className="text-[9px] opacity-75 mt-0.5 leading-snug">{item.reason}</p>}
        </div>
      </div>
    </div>
  );
}

function RuneIcon({ imgPath, name, size = 32 }: { imgPath: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative group flex-shrink-0" style={{ width: size, height: size }}>
      {!err ? (
        <img src={imgPath} alt={name} className="object-contain" style={{ width: size, height: size }} onError={() => setErr(true)} />
      ) : (
        <div className="rounded-full flex items-center justify-center text-[8px] text-muted-foreground bg-muted border border-border text-center"
          style={{ width: size, height: size }}>R</div>
      )}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] whitespace-nowrap rounded-md px-2 py-1 shadow-xl"
          style={{ background: "hsl(220,20%,10%)", color: "white", border: "1px solid #3a4760" }}>
          {name}
        </div>
      </div>
    </div>
  );
}

function ChampionPickerModal({
  allChampions, selected, onSelect, onClose, title,
}: {
  allChampions: ChampEntry[];
  selected: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  title: string;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const filtered = allChampions.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#121926", border: "1px solid #233047", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, color: "#ece6d6" }}>{title}</p>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj bohatera..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
              style={{ background: "#172031", border: "1px solid #233047" }} />
          </div>
        </div>
        <div className="overflow-y-auto p-3" style={{ maxHeight: "55vh" }}>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
            {filtered.map((champ) => (
              <button key={champ.id} onClick={() => { onSelect(champ.id); onClose(); }}
                className="flex flex-col items-center gap-1 p-1 rounded-lg transition-all hover:bg-muted group"
                style={selected === champ.id ? { background: "#262418", outline: "2px solid #d2ad62" } : {}}>
                <img src={`${getDDBase()}/champion/${champ.id}.png`} alt={champ.name}
                  className="w-10 h-10 rounded-lg border border-border group-hover:border-primary/30 transition-colors object-cover"
                  onError={(e) => { e.currentTarget.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"; }} />
                <span className="text-[8px] text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors truncate w-full">{champ.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-7 py-8 text-center text-sm text-muted-foreground">Nie znaleziono bohatera "{query}"</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ChampSlot({ label, championId, allChampions, onSelect, small }: {
  label: string; championId: string | null; allChampions: ChampEntry[];
  onSelect: (id: string) => void; small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const champ = allChampions.find((c) => c.id === championId);
  const sz = small ? 40 : 52;

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <button onClick={() => setOpen(true)}
          className="relative rounded-xl overflow-hidden border-2 transition-all hover:scale-105 flex-shrink-0"
          style={{
            width: sz, height: sz,
            borderColor: championId ? "#d2ad62" : "#233047",
            background: championId ? "transparent" : "#172031",
            boxShadow: championId ? "0 0 0 2px #6b5a35" : "none",
          }}>
          {champ ? (
            <img src={`${getDDBase()}/champion/${champ.id}.png`} alt={champ.name} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground/40 text-lg">+</span>
            </div>
          )}
          {champ && (
            <button onClick={(e) => { e.stopPropagation(); onSelect(""); }}
              className="absolute top-0 right-0 w-4 h-4 rounded-bl-md flex items-center justify-center transition-colors hover:bg-red-400"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          )}
        </button>
        <span className="text-[8px] text-muted-foreground text-center leading-tight" style={{ maxWidth: sz }}>
          {champ ? champ.name : label}
        </span>
      </div>
      <AnimatePresence>
        {open && (
          <ChampionPickerModal allChampions={allChampions} selected={championId} onSelect={onSelect}
            onClose={() => setOpen(false)} title={label} />
        )}
      </AnimatePresence>
    </>
  );
}

function ThreatDot({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className="w-2 h-2 rounded-sm transition-all duration-300"
          style={{ background: i < value ? color : "#233047" }} />
      ))}
    </div>
  );
}

function CopyBuildButton({ result, allChampions, myChampId }: {
  result: BuildResult; allChampions: ChampEntry[]; myChampId: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const champName = allChampions.find(c => c.id === myChampId)?.name ?? myChampId;
    const lines = [
      `🗡 Build Nexus Draft — ${champName}`,
      ``,
      `👟 Buty: ${result.boots.name}`,
      ``,
      `⚔ Build główny:`,
      ...result.coreItems.map((item, i) => `  ${i + 1}. ${item.name}${item.reason ? ` — ${item.reason}` : ""}`),
      ``,
      `🛡 Sytuacyjne:`,
      ...result.situationalItems.slice(0, 3).map(item => `  • ${item.name}`),
      ``,
      `✦ Runy: ${result.runes.keystone.name} (${result.runes.primaryPath.name})`,
      ``,
      `📊 nexus-sight.com.pl`,
    ].join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
      style={{
        background: copied ? "#12271f" : "#172031",
        color: copied ? "#46c08a" : "#a8b0bf",
        border: `1px solid ${copied ? "#2a5c45" : "#233047"}`,
      }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Skopiowano!" : "Kopiuj build"}
    </button>
  );
}

function BuildResultPanel({ result, myChampId, allChampions, lane }: {
  result: BuildResult; myChampId: string; allChampions: ChampEntry[]; lane: Lane;
}) {
  const ta = result.teamAnalysis;
  const summs = recommendSummoners(lane, myChampId, ta);

  const totalCoreGold = result.coreItems.reduce((acc, i) => acc + getGold(i.id), 0) + getGold(result.boots.id);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mt-3">

      {/* Header with copy button */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.18em] font-bold flex items-center gap-1"
          style={{ color: "#d2ad62", fontFamily: "'Rajdhani',sans-serif" }}>
          <Zap className="w-3 h-3" /> Optymalny build
        </p>
        <CopyBuildButton result={result} allChampions={allChampions} myChampId={myChampId} />
      </div>

      {/* Core build + boots in one card */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: "#121926", border: "1px solid #233047" }}>

        {/* Boots */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-2 text-muted-foreground">👟 Buty</p>
          <div className="flex items-center gap-2.5">
            <ItemIcon item={result.boots} size={40} />
            <div>
              <p className="text-sm font-bold text-foreground/90">{result.boots.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatGold(getGold(result.boots.id))} złota</p>
            </div>
          </div>
        </div>

        {/* Core items with order numbers */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-2 text-muted-foreground">⚔ Kolejność buildu</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {result.coreItems.map((item, i) => (
              <ItemIcon key={i} item={item} size={40} order={i + 1} />
            ))}
          </div>
          <div className="space-y-1">
            {result.coreItems.filter(i => i.reason).map((item, i) => (
              <p key={i} className="text-[10px] text-muted-foreground flex gap-1.5 leading-relaxed">
                <span className="flex-shrink-0 font-black text-primary/70">{i + 1}.</span>
                <span><span className="font-semibold text-foreground/80">{item.name}</span> — {item.reason}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Total gold */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Łączny koszt core buildu</span>
          <span className="text-sm font-black" style={{ color: "#e8a93c", fontFamily: "'Barlow Condensed',sans-serif" }}>
            💰 {totalCoreGold.toLocaleString("pl-PL")} złota
          </span>
        </div>
      </div>

      {/* Situational items */}
      {result.situationalItems.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "#172031", border: "1px solid #233047" }}>
          <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-2 text-muted-foreground">🛡 Sytuacyjne</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {result.situationalItems.map((item, i) => (
              <div key={i} className="relative">
                <ItemIcon item={item} size={36} />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-bold flex items-center justify-center"
                  style={{ background: "#3a4760", color: "white" }}>?</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {result.situationalItems.filter(i => i.reason).slice(0, 3).map((item, i) => (
              <p key={i} className="text-[10px] text-muted-foreground flex gap-1.5">
                <span className="flex-shrink-0 text-yellow-500/70">→</span>
                <span><span className="font-medium text-foreground/80">{item.name}:</span> {item.reason}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Summoner spells */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "linear-gradient(135deg, #2a2212, white)", border: "1px solid #2a2212" }}>
        <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground">✦ Czarownicy</p>
        <div className="flex items-center gap-3">
          <SummonerIcon spell={summs.spell1} />
          <SummonerIcon spell={summs.spell2} />
          <div>
            <p className="text-xs font-bold text-foreground/90">{summs.spell1.name} + {summs.spell2.name}</p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{summs.note}</p>
          </div>
        </div>
      </div>

      {/* Runes */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: "linear-gradient(135deg, #172031, white)", border: "1px solid #233047" }}>
        <p className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: "hsl(240,60%,45%)", fontFamily: "'Rajdhani',sans-serif" }}>
          ✦ Runy
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src={RUNE_PATH_IMG(result.runes.primaryPath.icon)} alt={result.runes.primaryPath.name}
                className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <p className="text-[10px] font-bold text-foreground/80">{result.runes.primaryPath.name}</p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <RuneIcon imgPath={result.runes.keystone.imgPath} name={result.runes.keystone.name} size={38} />
                <div>
                  <p className="text-[11px] font-bold text-foreground/90">{result.runes.keystone.name}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight max-w-[110px]">{result.runes.keystone.description}</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {result.runes.primaryRunes.map((r, i) => <RuneIcon key={i} imgPath={r.imgPath} name={r.name} size={24} />)}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src={RUNE_PATH_IMG(result.runes.secondaryPath.icon)} alt={result.runes.secondaryPath.name}
                className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <p className="text-[10px] font-bold text-foreground/80">{result.runes.secondaryPath.name}</p>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {result.runes.secondaryRunes.map((r, i) => <RuneIcon key={i} imgPath={r.imgPath} name={r.name} size={28} />)}
            </div>
            <div className="mt-3">
              <p className="text-[9px] text-muted-foreground mb-1">Fragmenty:</p>
              <div className="space-y-1">
                {result.runes.shards.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full"
                      style={{ background: i === 0 ? "#e8a93c" : i === 1 ? "#e8a93c" : "#d2ad62" }} />
                    <span className="text-[9px] text-foreground/70">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team analysis */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#172031", border: "1px solid #233047" }}>
        <p className="text-[9px] uppercase tracking-[0.15em] font-bold flex items-center gap-1 text-muted-foreground">
          <Info className="w-3 h-3" /> Analiza składu wroga
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {([
            { label: "Zagrożenie AP", value: ta.apThreat, color: "#9c7bff" },
            { label: "Zagrożenie AD", value: ta.adThreat, color: "#e8a93c" },
            { label: "Tanki", value: ta.tankCount, color: "#d2ad62" },
            { label: "Squishie", value: ta.squishyCount, color: "#f0545c" },
          ] as const).map(({ label, value, color }) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[9px] font-bold" style={{ color }}>{Math.round(value)}/5</span>
              </div>
              <ThreatDot value={Math.round(value)} color={color} />
            </div>
          ))}
        </div>
        {(ta.healingPresence || ta.heavyCC || ta.engageHeavy || ta.assassinCount >= 1 || ta.percentHPThreat || ta.splitPushThreat || ta.shieldPresence) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ta.healingPresence && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#12271f", color: "#46c08a", border: "1px solid #2a5c45" }}>⚕ Leczenie</span>}
            {ta.heavyCC && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "hsl(220,60%,92%)", color: "hsl(220,70%,40%)", border: "1px solid hsl(220,50%,78%)" }}>❄ Dużo CC</span>}
            {ta.engageHeavy && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#2a1519", color: "#f0545c", border: "1px solid #6b2a30" }}>⚡ Engage</span>}
            {ta.assassinCount >= 1 && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#2a1519", color: "#f0545c", border: "1px solid #6b2a30" }}>🗡 Assassini</span>}
            {ta.percentHPThreat && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "hsl(20,80%,92%)", color: "hsl(20,75%,35%)", border: "1px solid hsl(20,65%,75%)" }}>🩸 % HP dmg</span>}
            {ta.splitPushThreat && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "hsl(120,40%,92%)", color: "hsl(120,50%,30%)", border: "1px solid hsl(120,40%,75%)" }}>🌲 Split push</span>}
            {ta.shieldPresence && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#2a2212", color: "#e8a93c", border: "1px solid #6b4f22" }}>🛡 Tarcze</span>}
          </div>
        )}
      </div>

      {/* Reasoning */}
      <div className="rounded-xl p-4 space-y-1.5" style={{ background: "#172031", border: "1px solid #233047" }}>
        <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-2 text-muted-foreground">💡 Uzasadnienie</p>
        {result.reasoning.map((r, i) => (
          <p key={i} className="text-[10px] text-foreground/70 flex gap-2 leading-relaxed">
            <span className="flex-shrink-0 mt-0.5 text-primary/40">›</span>
            {r}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

const LANES: { id: Lane; label: string; icon: string }[] = [
  { id: "AUTO", label: "Auto", icon: "⚡" },
  { id: "TOP", label: "Top", icon: "🗡" },
  { id: "JUNGLE", label: "Jungle", icon: "🌲" },
  { id: "MID", label: "Mid", icon: "⚔" },
  { id: "ADC", label: "ADC", icon: "🏹" },
  { id: "SUPPORT", label: "Support", icon: "🛡" },
];

export default function BuildCalculator() {
  const [allChampions, setAllChampions] = useState<ChampEntry[]>([]);
  const [myChamp, setMyChamp] = useState<string | null>(null);
  const [lane, setLane] = useState<Lane>("AUTO");
  const [enemies, setEnemies] = useState<(string | null)[]>([null, null, null, null, null]);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [champLoading, setChampLoading] = useState(true);

  useEffect(() => {
    const version = getDDVersion();
    // Fetch champion list and item gold data in parallel
    fetchDDragonGold(version);
    fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
      .then((r) => r.json())
      .then((data) => {
        const champs: ChampEntry[] = Object.values(data.data as Record<string, { id: string; name: string }>)
          .map((c) => ({ id: c.id, name: c.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAllChampions(champs);
      })
      .catch(() => {})
      .finally(() => setChampLoading(false));
  }, []);

  // Auto-calculate whenever champion, enemies, or lane changes
  useEffect(() => {
    if (!myChamp) { setResult(null); return; }
    const validEnemies = enemies.filter(Boolean) as string[];
    if (validEnemies.length === 0) { setResult(null); return; }
    const res = calculateBuild(myChamp, validEnemies, lane);
    setResult(res);
  }, [myChamp, enemies, lane]);

  const setEnemy = (index: number, id: string) => {
    setEnemies((prev) => {
      const next = [...prev];
      next[index] = id || null;
      return next;
    });
  };

  const handleReset = () => {
    setMyChamp(null);
    setLane("AUTO");
    setEnemies([null, null, null, null, null]);
    setResult(null);
  };

  const myProfile = myChamp ? getChampProfile(myChamp) : null;
  const filledEnemies = enemies.filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 space-y-5" style={{ background: "#121926", border: "1px solid #233047", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

        {/* My champion */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-3 flex items-center gap-1"
            style={{ color: "#d2ad62", fontFamily: "'Rajdhani',sans-serif" }}>
            <Swords className="w-3 h-3" /> Twój bohater
          </p>
          <div className="flex items-center gap-4">
            <ChampSlot label="Wybierz bohatera" championId={myChamp} allChampions={allChampions}
              onSelect={(id) => setMyChamp(id || null)} />
            {myChamp && myProfile ? (
              <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-1.5">
                <p className="text-sm font-bold text-foreground/90">{allChampions.find(c => c.id === myChamp)?.name ?? myChamp}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: "#262418", color: "#d2ad62", border: "1px solid #6b5a35" }}>
                    {CLASS_LABEL[myProfile.class]}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: myProfile.damageType === "AP" ? "#1f1a33" : myProfile.damageType === "AD" ? "#2a2212" : "#262418", color: myProfile.damageType === "AP" ? "#9c7bff" : myProfile.damageType === "AD" ? "#e8a93c" : "#d2ad62", border: "1px solid #233047" }}>
                    {myProfile.damageType}
                  </span>
                  {myProfile.isRanged && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: "hsl(120,40%,92%)", color: "hsl(120,50%,30%)", border: "1px solid #3a4760" }}>
                      Zasięgowy
                    </span>
                  )}
                </div>
              </motion.div>
            ) : !champLoading && (
              <div className="text-[11px] text-muted-foreground">
                Wybierz swojego bohatera, aby zobaczyć optymalny build
              </div>
            )}
          </div>
        </div>

        {/* Lane */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-2"
            style={{ color: "#d2ad62", fontFamily: "'Rajdhani',sans-serif" }}>
            Rola / Linia
          </p>
          <div className="flex gap-1 flex-wrap">
            {LANES.map((l) => (
              <button key={l.id} onClick={() => setLane(l.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: lane === l.id ? "#262418" : "#172031",
                  color: lane === l.id ? "#d2ad62" : "#8d97aa",
                  border: `1px solid ${lane === l.id ? "#6b5a35" : "#233047"}`,
                }}>
                <span>{l.icon}</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif" }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Enemies */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-3 flex items-center justify-between"
            style={{ color: "#d2ad62", fontFamily: "'Rajdhani',sans-serif" }}>
            <span>Drużyna przeciwnika ({filledEnemies}/5)</span>
            {(myChamp || filledEnemies > 0) && (
              <button onClick={handleReset}
                className="text-[9px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 lowercase font-normal">
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </p>
          <div className="flex gap-2 justify-start flex-wrap">
            {(["Top", "Jungle", "Mid", "ADC", "Support"] as const).map((lane, i) => (
              <ChampSlot key={i} label={lane} championId={enemies[i]}
                allChampions={allChampions} onSelect={(id) => setEnemy(i, id)} small />
            ))}
          </div>
          {myChamp && filledEnemies === 0 && (
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Dodaj przynajmniej jednego przeciwnika, aby zobaczyć build
            </p>
          )}
        </div>
      </div>

      {/* Auto-calculated result */}
      <AnimatePresence mode="wait">
        {result && (
          <BuildResultPanel key={`${myChamp}-${enemies.join("-")}-${lane}`}
            result={result} myChampId={myChamp!} allChampions={allChampions} lane={lane} />
        )}
      </AnimatePresence>
    </div>
  );
}
