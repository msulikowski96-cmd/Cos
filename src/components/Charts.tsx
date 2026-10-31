import { useEffect, useRef, useState } from "react";
import { RADAR_KEYS, RADAR_LABEL, type PowerWindow, type TeamAnalysis } from "../lib/analysis";

// ───────────── Krzywa siły w czasie ─────────────

const PAD = { l: 14, r: 14, t: 26, b: 28 };

/** Szerokość kontenera w pikselach — wykres rysujemy 1:1, żeby tekst miał stały rozmiar. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function PowerCurve({ blue, red, windows }: { blue: number[]; red: number[]; windows: PowerWindow[] }) {
  const [box, W] = useWidth<HTMLDivElement>(600);
  const H = W < 500 ? 200 : 250;
  const n = blue.length - 1;
  const all = [...blue, ...red];
  // Stała skala (siła 0–3), żeby drobne różnice nie wyglądały na przepaść.
  const lo = Math.min(1, Math.min(...all) - 0.2);
  const hi = 3;
  const x = (m: number) => PAD.l + (m / n) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b);
  const line = (arr: number[]) => arr.map((v, m) => `${m ? "L" : "M"}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join("");

  const phases = [
    { from: 0, to: 14, label: "Wczesna gra" },
    { from: 14, to: 25, label: "Środek" },
    { from: 25, to: n, label: "Końcówka" },
  ];

  return (
    <div ref={box} className="min-w-0">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label="Krzywa siły obu drużyn w czasie gry">
        {phases.map((p, i) => (
          <g key={p.label}>
            <rect x={x(p.from)} y={PAD.t} width={x(p.to) - x(p.from)} height={H - PAD.t - PAD.b} style={{ fill: i % 2 ? "var(--panel-2)" : "transparent" }} opacity={0.6} />
            <text x={(x(p.from) + x(p.to)) / 2} y={PAD.t - 9} textAnchor="middle" className="font-label" style={{ fill: "var(--muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>
              {(W < 420 ? p.label.split(" ")[0] : p.label).toUpperCase()}
            </text>
          </g>
        ))}

        {/* Pole przewagi między krzywymi */}
        {blue.slice(0, -1).map((_, m) => {
          const lead = blue[m] + blue[m + 1] - red[m] - red[m + 1];
          if (Math.abs(lead) < 0.02) return null;
          const pts = `${x(m)},${y(blue[m])} ${x(m + 1)},${y(blue[m + 1])} ${x(m + 1)},${y(red[m + 1])} ${x(m)},${y(red[m])}`;
          return <polygon key={m} points={pts} style={{ fill: lead > 0 ? "var(--blue)" : "var(--red)" }} opacity={0.16} />;
        })}

        {(W < 420 ? [0, 20, 40] : [0, 10, 20, 30, 40]).filter((m) => m <= n).map((m) => (
          <g key={m}>
            <line x1={x(m)} x2={x(m)} y1={PAD.t} y2={H - PAD.b} style={{ stroke: "var(--line)" }} strokeDasharray="2 4" />
            <text x={x(m)} y={H - 9} textAnchor={m === 0 ? "start" : m === n ? "end" : "middle"} className="num" style={{ fill: "var(--muted)", fontSize: 12 }}>
              {m} min
            </text>
          </g>
        ))}

        <path d={line(red)} fill="none" style={{ stroke: "var(--red)" }} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <path d={line(blue)} fill="none" style={{ stroke: "var(--blue)" }} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(n)} cy={y(red[n])} r={4.5} style={{ fill: "var(--red)", stroke: "var(--ink)" }} strokeWidth={2} />
        <circle cx={x(n)} cy={y(blue[n])} r={4.5} style={{ fill: "var(--blue)", stroke: "var(--ink)" }} strokeWidth={2} />
      </svg>
      <div className="mt-2 flex flex-wrap gap-2">
        {windows.length === 0 && <span className="text-sm text-muted">Siła obu składów rośnie równo przez całą grę.</span>}
        {windows.map((w, i) => (
          <span
            key={i}
            className="rounded-full border px-2.5 py-1 font-label text-xs font-bold num"
            style={{
              color: w.side === "blue" ? "var(--blue)" : "var(--red)",
              borderColor: w.side === "blue" ? "var(--blue)" : "var(--red)",
              background: w.side === "blue" ? "var(--blue-soft)" : "var(--red-soft)",
            }}
          >
            Okno {w.side === "blue" ? "niebieskich" : "czerwonych"}: {w.from}–{w.to}
            {w.to >= n ? "+" : ""} min
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────────── Radar profilu składu ─────────────

export function Radar({ blue, red }: { blue: TeamAnalysis; red: TeamAnalysis }) {
  const R = 92;
  const k = RADAR_KEYS.length;
  const ang = (i: number) => -Math.PI / 2 + (i / k) * Math.PI * 2;
  const pt = (i: number, v: number) => [Math.cos(ang(i)) * (R * v) / 100, Math.sin(ang(i)) * (R * v) / 100] as const;
  const poly = (t: TeamAnalysis) => RADAR_KEYS.map((key, i) => pt(i, t.radar[key]).join(",")).join(" ");

  return (
    <svg viewBox="-160 -125 320 250" className="mx-auto block w-full max-w-[420px]" role="img" aria-label="Profil cech obu składów">
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={RADAR_KEYS.map((_, i) => pt(i, r).join(",")).join(" ")} style={{ fill: "none", stroke: "var(--line)" }} strokeWidth={r === 75 ? 1.4 : 1} />
      ))}
      {RADAR_KEYS.map((_, i) => {
        const [px, py] = pt(i, 100);
        return <line key={i} x1={0} y1={0} x2={px} y2={py} style={{ stroke: "var(--line)" }} />;
      })}
      {red.count > 0 && <polygon points={poly(red)} style={{ fill: "var(--red)", stroke: "var(--red)" }} fillOpacity={0.18} strokeWidth={2} strokeLinejoin="round" />}
      {blue.count > 0 && <polygon points={poly(blue)} style={{ fill: "var(--blue)", stroke: "var(--blue)" }} fillOpacity={0.18} strokeWidth={2} strokeLinejoin="round" />}
      {RADAR_KEYS.map((key, i) => {
        const [px, py] = pt(i, 122);
        const anchor = Math.abs(px) < 8 ? "middle" : px > 0 ? "start" : "end";
        return (
          <text key={key} x={px} y={py + 4} textAnchor={anchor} className="font-label" style={{ fill: "var(--text)", fontSize: 12.5, fontWeight: 700 }}>
            {RADAR_LABEL[key]}
          </text>
        );
      })}
    </svg>
  );
}

// ───────────── Pasek AD / AP ─────────────

export function DamageBar({ team, color, label }: { team: TeamAnalysis; color: string; label: string }) {
  const ad = Math.round(team.damage.ad * 100);
  const ap = 100 - ad;
  const lopsided = team.count >= 3 && Math.min(ad, ap) < 12;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-label text-sm font-bold" style={{ color }}>
          {label}
        </span>
        {lopsided && <span className="font-label text-xs font-bold uppercase tracking-wider text-bad">jednostronne</span>}
      </div>
      <div className="flex h-7 overflow-hidden rounded-md border border-line font-label text-xs font-bold num">
        <div className="flex items-center justify-start bg-[var(--ad)] px-2 text-ink" style={{ width: `${ad}%` }}>
          {ad >= 14 && `AD ${ad}%`}
        </div>
        <div className="flex items-center justify-end bg-[var(--ap)] px-2 text-ink" style={{ width: `${ap}%` }}>
          {ap >= 14 && `AP ${ap}%`}
        </div>
      </div>
    </div>
  );
}
