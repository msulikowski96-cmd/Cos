import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Clock, Sword, Shield, Eye, Coins, Brain, TrendingUp, TrendingDown, AlertTriangle, Check, Star, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { getDDBase } from "@/lib/constants";
import { usePageTitle } from "@/lib/usePageTitle";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
const FALLBACK_ICON = `${BASE_URL}/images/fallback-champion.png`;

const PERK_ICONS: Record<number, string> = {
  8000: "Precision", 8100: "Domination", 8200: "Sorcery",
  8300: "Inspiration", 8400: "Resolve",
};

function ItemSlot({ id }: { id: number }) {
  const dd = getDDBase();
  if (!id) return <div className="w-7 h-7 rounded bg-muted/50 border border-border/40 flex-shrink-0" />;
  return (
    <img
      src={`${dd}/item/${id}.png`}
      alt=""
      className="w-7 h-7 rounded border border-border/60 flex-shrink-0"
      onError={(e) => { e.currentTarget.style.opacity = "0"; }}
    />
  );
}

function DamageBar({ value, max, win }: { value: number; max: number; win: boolean }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: win ? "#d2ad62" : "#f0545c" }}
        />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground w-8 text-right flex-shrink-0">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </span>
    </div>
  );
}

function ParticipantRow({ p, selfPuuid, maxDmg }: { p: any; selfPuuid?: string; maxDmg: number }) {
  const dd = getDDBase();
  const isSelf = p.puuid === selfPuuid;
  const kda = p.deaths === 0 ? "Perf" : ((p.kills + p.assists) / p.deaths).toFixed(1);

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${isSelf ? (p.win ? "bg-win/10 border border-win/20" : "bg-loss/10 border border-loss/20") : "hover:bg-muted/30"}`}>
      <div className="relative flex-shrink-0">
        <img
          src={`${dd}/champion/${p.championName}.png`}
          alt={p.championName}
          className="w-8 h-8 rounded-lg border border-border"
          onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }}
        />
      </div>
      <div className="w-28 min-w-0 flex-shrink-0">
        <p className={`text-xs font-semibold truncate ${isSelf ? "text-primary" : "text-foreground/90"}`}>
          {p.summonerName}
        </p>
        <p className="text-[9px] text-muted-foreground truncate">{p.championName}</p>
      </div>
      <div className="flex-shrink-0 w-20 text-center">
        <span className="text-xs font-mono font-semibold">
          {p.kills}<span className="text-muted-foreground/40">/</span>
          <span className="text-loss">{p.deaths}</span>
          <span className="text-muted-foreground/40">/</span>{p.assists}
        </span>
        <p className="text-[9px] text-muted-foreground">{kda} KDA</p>
      </div>
      <div className="hidden sm:flex flex-shrink-0 w-14 text-right flex-col">
        <span className="text-xs font-mono">{p.cs}</span>
        <span className="text-[9px] text-muted-foreground">{p.csPerMin}/min</span>
      </div>
      <div className="hidden md:block flex-1 min-w-[80px]">
        <DamageBar value={p.totalDamageDealt} max={maxDmg} win={p.win} />
      </div>
      <div className="hidden sm:flex flex-shrink-0 w-14 text-right flex-col">
        <span className="text-xs font-mono">{(p.goldEarned / 1000).toFixed(1)}k</span>
        <span className="text-[9px] text-muted-foreground">złoto</span>
      </div>
      <div className="hidden lg:flex flex-shrink-0 w-10 text-right flex-col">
        <span className="text-xs font-mono">{p.visionScore}</span>
        <span className="text-[9px] text-muted-foreground">wzrok</span>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {p.items.map((id: number, i: number) => <ItemSlot key={i} id={id} />)}
      </div>
      {(p.pentaKills > 0 || p.quadraKills > 0 || p.tripleKills > 0) && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0"
          style={{ background: p.pentaKills > 0 ? "#e8a93c" : p.quadraKills > 0 ? "#e8a93c" : "#d2ad62" }}>
          {p.pentaKills > 0 ? "PENTA" : p.quadraKills > 0 ? "QUADRA" : "TRIPLE"}
        </span>
      )}
    </div>
  );
}

function TeamSection({ participants, team, maxDmg, selfPuuid, label, color }: { participants: any[]; team: any; maxDmg: number; selfPuuid?: string; label: string; color: string }) {
  const kills = participants.reduce((s: number, p: any) => s + p.kills, 0);
  const deaths = participants.reduce((s: number, p: any) => s + p.deaths, 0);
  const assists = participants.reduce((s: number, p: any) => s + p.assists, 0);

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center gap-3 mb-2 pb-2 border-b border-border/30">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
        <span className={`text-xs font-bold ${team?.win ? "text-win" : "text-loss"}`}>{team?.win ? "WYGRANA" : "PRZEGRANA"}</span>
        <span className="text-xs font-mono text-muted-foreground ml-auto">{kills}/{deaths}/{assists}</span>
        {team?.objectives && (
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>🐉 {team.objectives.dragon}</span>
            <span>🔴 {team.objectives.baron}</span>
            <span>🗼 {team.objectives.tower}</span>
          </div>
        )}
      </div>
      <div className="hidden md:flex items-center gap-2 px-2 pb-1.5 mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/50">
        <div className="w-8 flex-shrink-0" />
        <div className="w-28 flex-shrink-0">Gracz</div>
        <div className="w-20 text-center flex-shrink-0">KDA</div>
        <div className="w-14 text-right flex-shrink-0">CS</div>
        <div className="flex-1 min-w-[80px]">Obrażenia</div>
        <div className="w-14 text-right flex-shrink-0">Złoto</div>
        <div className="w-10 text-right flex-shrink-0">Wzrok</div>
        <div className="flex-shrink-0">Przedmioty</div>
      </div>
      <div className="space-y-0.5">
        {participants.map((p: any, i: number) => (
          <ParticipantRow key={i} p={p} selfPuuid={selfPuuid} maxDmg={maxDmg} />
        ))}
      </div>
    </div>
  );
}

// ─── Match Analysis Algorithm ────────────────────────────────────────────────

type Insight = { text: string; type: "positive" | "negative" | "neutral" };

function computePlayerScore(p: any): number {
  const sup  = p.teamPosition === "UTILITY";
  const jung = p.teamPosition === "JUNGLE";
  const kda  = p.deaths === 0 ? (p.kills + p.assists) * 1.3 : (p.kills + p.assists) / p.deaths;
  const kp   = typeof p.killParticipation === "number" ? p.killParticipation : 0;

  // KDA: 0-30 pts (log scale so high KDA still gives points)
  const kdaScore = Math.min(30, (kda / (kda + 1.5)) * 38);

  // Kill participation: 0-18 pts
  const kpScore = Math.min(18, (kp / 100) * 20);

  // CS per minute: 0-18 pts (0 for support)
  let csScore = 0;
  if (!sup) {
    const target = jung ? 5.5 : 7.5;
    csScore = Math.min(18, (p.csPerMin / target) * 18);
  } else {
    csScore = 9;
  }

  // Vision: 0-14 pts (role-weighted)
  const visionTarget = sup ? 55 : 20;
  const visionScore  = Math.min(14, (p.visionScore / visionTarget) * 14);

  // Control wards: 0-5 pts
  const cwScore = Math.min(5, (p.controlWardsPlaced ?? 0) * 1.2);

  // Death penalty: up to -15 pts (linear above 2 deaths)
  const deathPenalty = Math.min(15, Math.max(0, (p.deaths - 2) * 2.8));

  // Win bonus: 7 pts
  const winBonus = p.win ? 7 : 0;

  // Multikill bonus: 0-4 pts
  const multikillBonus = Math.min(4,
    (p.pentaKills ?? 0) * 4 + (p.quadraKills ?? 0) * 3 +
    (p.tripleKills ?? 0) * 2 + (p.doubleKills ?? 0) * 0.5
  );

  const raw = kdaScore + kpScore + csScore + visionScore + cwScore - deathPenalty + winBonus + multikillBonus;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

function scoreToGrade(score: number): { grade: string; color: string; arc: string } {
  if (score >= 90) return { grade: "S+", color: "#f59e0b", arc: "#f59e0b" };
  if (score >= 80) return { grade: "S",  color: "#f59e0b", arc: "#f59e0b" };
  if (score >= 70) return { grade: "A",  color: "#10b981", arc: "#10b981" };
  if (score >= 58) return { grade: "B",  color: "#38bdf8", arc: "#38bdf8" };
  if (score >= 45) return { grade: "C",  color: "#94a3b8", arc: "#94a3b8" };
  if (score >= 30) return { grade: "D",  color: "#6b2a30", arc: "#6b2a30" };
  return                { grade: "F",  color: "#ef4444", arc: "#ef4444" };
}

function ScoreRing({ score }: { score: number }) {
  const { grade, color } = scoreToGrade(score);
  const r = 18;
  const cx = 24, cy = 24;
  const circumference = 2 * Math.PI * r;
  const pct = score / 100;
  const dash = circumference * pct;
  const gap = circumference - dash;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="relative w-12 h-12">
        <svg width="48" height="48" className="rotate-[-90deg]" viewBox="0 0 48 48">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#233047" strokeWidth="4" />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth="4"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.4s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color }}>
          {grade}
        </span>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground leading-none mb-0.5">Wynik</p>
        <p className="text-xl font-black leading-none" style={{ color }}>{score}</p>
      </div>
    </div>
  );
}

// ─── Context helpers ──────────────────────────────────────────────────────────
function avg(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function fmt1(n: number): string { return n.toFixed(1); }
function fmtK(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

function analyzePlayer(p: any, teamPlayers: any[], allPlayers: any[]): Insight[] {
  const ins: Insight[] = [];
  const {
    kills, deaths, assists, csPerMin, killParticipation,
    totalDamageDealt, damageTaken, damageSelfMitigated,
    visionScore, wardsPlaced, wardsKilled, controlWardsPlaced,
    timeCCingOthers, totalHeal, totalHealsOnTeammates,
    objectivesStolen, turretKills, largestKillingSpree, bountyLevel,
    goldEarned, goldPerMin, dmgPerGold,
    firstBloodKill, pentaKills, quadraKills, tripleKills, doubleKills,
    win, kda, teamPosition,
  } = p;

  const sup  = teamPosition === "UTILITY";
  const jung = teamPosition === "JUNGLE";
  const top  = teamPosition === "TOP";

  // ── Game-wide context ──────────────────────────────────────────────────────
  const gameDmgAvg    = avg(allPlayers.map((x: any) => x.totalDamageDealt));
  const gameGpmAvg    = avg(allPlayers.map((x: any) => x.goldPerMin));
  const gameVisionAvg = avg(allPlayers.map((x: any) => x.visionScore));
  const teamDmgAvg    = avg(teamPlayers.map((x: any) => x.totalDamageDealt));
  const teamDmgTotal  = teamPlayers.reduce((s: number, x: any) => s + x.totalDamageDealt, 0);
  const dmgShareOfTeam = teamDmgTotal > 0 ? (totalDamageDealt / teamDmgTotal) * 100 : 0;

  // ─── Highlights ───────────────────────────────────────────────────────────
  if (pentaKills > 0)   ins.push({ type: "positive", text: `PENTA KILL! Kompletne zdominowanie teamfightu — absolutne wyróżnienie meczu.` });
  else if (quadraKills > 0) ins.push({ type: "positive", text: `Quadra Kill — eliminacja 4 przeciwników w jednej sekwencji walk.` });
  else if (tripleKills > 0) ins.push({ type: "positive", text: `Triple Kill — skuteczna dominacja w teamfighcie.` });
  else if (doubleKills >= 3) ins.push({ type: "positive", text: `${doubleKills}× Double Kill — wielokrotna efektywność w walkach 1v2.` });

  if (firstBloodKill) ins.push({ type: "positive", text: "First Blood — agresywny start lany, psychologiczna i złotna przewaga od pierwszych minut." });

  if (largestKillingSpree >= 8) ins.push({ type: "positive", text: `Killing spree x${largestKillingSpree} — przez długi czas gracz był nieuchwytny i stanowił zagrożenie dla całej mapy.` });
  else if (largestKillingSpree >= 5) ins.push({ type: "positive", text: `Killing spree x${largestKillingSpree} — ciągła efektywność bez śmierci.` });

  if (objectivesStolen > 0) ins.push({ type: "positive", text: `${objectivesStolen} skradzion${objectivesStolen === 1 ? "y" : "e"} obiektyw${objectivesStolen === 1 ? "" : "y"} — ryzykowny play, który zmienił bieg gry.` });

  if (turretKills >= 3) ins.push({ type: "positive", text: `${turretKills} zniszczone wieże — gracz aktywnie konwertował przewagę na obiektywy strukturalne.` });
  else if (turretKills >= 2 && (top || jung)) ins.push({ type: "positive", text: `${turretKills} wieże — dobra presja na struktury mapy.` });

  // ─── Deaths ───────────────────────────────────────────────────────────────
  const avgGameDeaths = avg(allPlayers.map((x: any) => x.deaths));
  if (deaths >= 12) ins.push({ type: "negative", text: `Krytyczna liczba śmierci (${deaths}) — gracz spędził ogromną część gry poza mapą, przekazując ${deaths} bounty killerowi. Priorytet: pozycjonowanie i ocena ryzyka.` });
  else if (deaths >= 8) ins.push({ type: "negative", text: `Bardzo wysoka liczba śmierci (${deaths}, średnia meczu: ${fmt1(avgGameDeaths)}) — każda śmierć to darmowe złoto i czas dla przeciwników.` });
  else if (deaths >= 6) ins.push({ type: "negative", text: `Podwyższona liczba śmierci (${deaths} vs śr. meczu ${fmt1(avgGameDeaths)}) — warto ograniczyć ryzykowne single-walki.` });
  else if (deaths === 0) ins.push({ type: "positive", text: `Bezbłędna gra — zero śmierci. Doskonałe pozycjonowanie przez cały mecz.` });
  else if (deaths === 1) ins.push({ type: "positive", text: `Tylko 1 śmierć — wyjątkowa przeżywalność (śr. meczu: ${fmt1(avgGameDeaths)}).` });

  // ─── CS / Farmienie ───────────────────────────────────────────────────────
  if (!sup) {
    const normTarget  = jung ? 5.5 : 7.5;
    const goodTarget  = jung ? 6.5 : 8.5;
    const eliteTarget = jung ? 7.5 : 9.5;
    const badTarget   = jung ? 3.5 : 5.0;
    const veryBad     = jung ? 2.5 : 3.5;
    const roleLabel   = jung ? "junglerów" : "linerów";

    if (csPerMin >= eliteTarget) ins.push({ type: "positive", text: `Elitarne farmienie (${csPerMin} CS/min) — najwyższy próg wśród ${roleLabel} — gracz generował złoto bardzo efektywnie.` });
    else if (csPerMin >= goodTarget) ins.push({ type: "positive", text: `Dobre farmienie (${csPerMin} CS/min) — powyżej normy ${fmt1(normTarget)} dla tej roli.` });
    else if (csPerMin < veryBad) ins.push({ type: "negative", text: `Bardzo słabe farmienie (${csPerMin} CS/min vs norma ${fmt1(normTarget)}) — stracono ok. ${Math.round((normTarget - csPerMin) * 20 * (1/60) * 30 * 20)} złota wartości w CS.` });
    else if (csPerMin < badTarget) ins.push({ type: "negative", text: `Farmienie poniżej normy (${csPerMin} CS/min, norma ${fmt1(normTarget)}) — regularne last-hity to najszybszy sposób wzrostu siły postaci.` });
  }

  // ─── Wizja i wardy ────────────────────────────────────────────────────────
  if (sup) {
    if (visionScore >= 70) ins.push({ type: "positive", text: `Wzorowa kontrola wzroku (${visionScore}) — support dominował wizją, znacznie powyżej średniej meczu (${fmt1(gameVisionAvg)}).` });
    else if (visionScore >= 45) ins.push({ type: "positive", text: `Dobry wynik wizji dla supporta (${visionScore}).` });
    else if (visionScore < 18) ins.push({ type: "negative", text: `Niski wynik wizji dla supporta (${visionScore} vs śr. ${fmt1(gameVisionAvg)}) — support powinien dominować wizją mapy.` });
    else if (visionScore < 30) ins.push({ type: "negative", text: `Wynik wizji poniżej oczekiwań (${visionScore}) — więcej wardów i sweepowania po walkach.` });

    if (controlWardsPlaced === 0) ins.push({ type: "negative", text: `Brak control wardów (pink wardów) — kosztują 75g każdy i eliminują ukryte wardy przeciwnika. Niezbędne jako support.` });
    else if (controlWardsPlaced >= 5) ins.push({ type: "positive", text: `${controlWardsPlaced} control wardów — aktywne eliminowanie wzroku przeciwnika i ochrona własnych miejsc.` });
    else if (controlWardsPlaced <= 2) ins.push({ type: "negative", text: `Tylko ${controlWardsPlaced} control ward${controlWardsPlaced === 1 ? "" : "y"} — przy minimum 1 co rotację, ta wartość powinna być wyższa.` });

    if (timeCCingOthers >= 60) ins.push({ type: "positive", text: `${fmt1(timeCCingOthers / 60)} minut CC nałożonego na przeciwników — support aktywnie ograniczał ruchy wrogów.` });
    else if (timeCCingOthers < 10 && timeCCingOthers >= 0) ins.push({ type: "negative", text: `Bardzo mało CC (${fmt1(timeCCingOthers)}s) — postać miała potencjał kontroli tłumu, który nie był wykorzystany.` });

    if (totalHealsOnTeammates >= 8000) ins.push({ type: "positive", text: `Wyleczono ${fmtK(totalHealsOnTeammates)} HP sojuszników — healing support znacząco przedłużał życie drużyny w walkach.` });
  } else {
    if (visionScore >= 35) ins.push({ type: "positive", text: `Wyróżniający wynik wizji (${visionScore} vs śr. meczu ${fmt1(gameVisionAvg)}) — gracz aktywnie mapował informacje dla drużyny.` });
    else if (visionScore < 5) ins.push({ type: "negative", text: `Brak wardów (wynik wzroku: ${visionScore}) — bez wizji każdy ruch po mapie to zgadywanie pozycji przeciwników.` });
    else if (visionScore < gameVisionAvg * 0.5) ins.push({ type: "negative", text: `Niski wynik wizji (${visionScore} vs śr. meczu ${fmt1(gameVisionAvg)}) — nawet 2-3 wardy na rotację zwiększają bezpieczeństwo i udział w walkach.` });

    if (controlWardsPlaced === 0) ins.push({ type: "negative", text: `Zero control wardów (pink wardów) — kosztują 75g i eliminują wszelką ukrytą wizję przeciwnika w kluczowych miejscach.` });

    if (wardsKilled >= 5) ins.push({ type: "positive", text: `${wardsKilled} wardów przeciwnika zniszczonych — aktywne sweepowanie mapy.` });
  }

  // ─── Kill Participation ───────────────────────────────────────────────────
  const kpNum = typeof killParticipation === "number" ? killParticipation : 0;
  if (kpNum >= 85) ins.push({ type: "positive", text: `Wyjątkowy udział w walkach (${fmt1(kpNum)}%) — gracz był obecny przy niemal każdym zabójstwie drużyny.` });
  else if (kpNum >= 70) ins.push({ type: "positive", text: `Wysoki udział w walkach drużyny (${fmt1(kpNum)}%) — aktywna obecność na mapie.` });
  else if (!sup && kpNum < 35 && deaths < 5) ins.push({ type: "negative", text: `Bardzo niski KP (${fmt1(kpNum)}%) — gracz spędził zbyt wiele czasu w izolacji, tracąc wpływ na wynik walk.` });
  else if (!sup && kpNum < 50 && deaths >= 5) ins.push({ type: "negative", text: `Niski KP (${fmt1(kpNum)}%) przy ${deaths} śmierciach — postać nie miała znaczącego wpływu na przebieg gry.` });

  // ─── Damage ───────────────────────────────────────────────────────────────
  const dmgK = fmtK(totalDamageDealt);
  const gameDmgAvgK = fmtK(gameDmgAvg);

  if (!sup) {
    const dmgRatio = gameDmgAvg > 0 ? totalDamageDealt / gameDmgAvg : 1;
    if (dmgRatio >= 1.6) ins.push({ type: "positive", text: `Wiodący damage dealer — ${dmgK} obrażeń (${Math.round((dmgRatio - 1) * 100)}% powyżej średniej meczu ${gameDmgAvgK}).` });
    else if (dmgRatio >= 1.25) ins.push({ type: "positive", text: `Solidna siła ognia — ${dmgK} obrażeń, powyżej średniej meczu (${gameDmgAvgK}).` });
    else if (dmgRatio < 0.5 && deaths < 5) ins.push({ type: "negative", text: `Bardzo niskie obrażenia (${dmgK} vs średnia meczu ${gameDmgAvgK}) — postać nie wnosiła realnej siły do walk drużynowych.` });
    else if (dmgRatio < 0.65 && deaths >= 5) ins.push({ type: "negative", text: `Niskie obrażenia (${dmgK}) w połączeniu z ${deaths} śmierciami — postać nie miała wpływu na mecz.` });

    // Damage efficiency (dmg per gold)
    const avgDmgPerGold = avg(allPlayers.filter((x: any) => x.teamPosition !== "UTILITY").map((x: any) => x.dmgPerGold));
    if (avgDmgPerGold > 0) {
      if (dmgPerGold >= avgDmgPerGold * 1.4) ins.push({ type: "positive", text: `Wysoka efektywność złota (${fmt1(dmgPerGold)} DMG/G vs śr. ${fmt1(avgDmgPerGold)}) — postać robiła więcej za każde zarobione złoto.` });
      else if (dmgPerGold < avgDmgPerGold * 0.6 && totalDamageDealt < gameDmgAvg) ins.push({ type: "negative", text: `Niska efektywność złota (${fmt1(dmgPerGold)} DMG/G vs śr. ${fmt1(avgDmgPerGold)}) — zarobione złoto nie przekładało się na wpływ w walkach.` });
    }
  }

  // ─── Dla tanków / initiatorów ─────────────────────────────────────────────
  if (top || jung) {
    const tankThresh = 25000;
    if (damageTaken >= tankThresh && deaths <= 5) {
      ins.push({ type: "positive", text: `Wyjątkowy tank (${fmtK(damageTaken)} absorb.) — gracz przyjął ogień na siebie, chroniąc sojuszników w walkach.` });
    }
    if (damageSelfMitigated >= 15000) {
      ins.push({ type: "positive", text: `${fmtK(damageSelfMitigated)} obrażeń zmitigowanych — skuteczne korzystanie z tarcz i redukcji obrażeń.` });
    }
  }

  // ─── Gold per minute ──────────────────────────────────────────────────────
  if (!sup) {
    const gpmDiff = goldPerMin - gameGpmAvg;
    if (gpmDiff >= 100) ins.push({ type: "positive", text: `Świetne tempo zarobku złota (${goldPerMin} G/min vs śr. meczu ${Math.round(gameGpmAvg)}) — stały nacisk na farmienie i walki.` });
    else if (gpmDiff <= -120 && !jung) ins.push({ type: "negative", text: `Niskie tempo złota (${goldPerMin} G/min vs śr. ${Math.round(gameGpmAvg)}) — stracono znaczną część potencjalnej przewagi ekonomicznej.` });
  }

  // ─── KDA ──────────────────────────────────────────────────────────────────
  const kdaNum = typeof kda === "number" ? kda : 0;
  if (deaths > 0 && kdaNum >= 8) ins.push({ type: "positive", text: `Znakomite KDA (${kdaNum}) — eliminacje i asysty przy minimalnych stratach własnych.` });
  else if (deaths > 0 && kdaNum < 0.8 && deaths >= 6) ins.push({ type: "negative", text: `Negatywne KDA (${kdaNum}) — liczba zabójstw i asyst (${kills + assists}) nie rekompensuje ${deaths} śmierci.` });

  return ins;
}

function computeMVP(participants: any[]): any {
  return [...participants].sort((a, b) => {
    const score = (p: any) =>
      (p.kills * 3.5 + p.assists * 1.5 - p.deaths * 2.5)
      + (p.damageShare / 4)
      + (p.visionScore / 4)
      + (p.objectivesStolen ?? 0) * 5
      + (p.turretKills ?? 0) * 2
      + (p.largestKillingSpree ?? 0) * 1.5;
    return score(b) - score(a);
  })[0];
}

function computeWeakLink(participants: any[]): any {
  return [...participants].sort((a, b) => {
    const score = (p: any) =>
      (p.kills + p.assists) - p.deaths * 3
      + p.csPerMin * 0.5
      + (p.killParticipation ?? 0) / 10;
    return score(a) - score(b);
  })[0];
}

function generateGameInsights(participants: any[], teams: any[], duration: number): string[] {
  const ins: string[] = [];
  const team1 = participants.filter((p: any) => p.teamId === 100);
  const team2 = participants.filter((p: any) => p.teamId === 200);
  const t1 = teams.find((t: any) => t.teamId === 100);
  const t2 = teams.find((t: any) => t.teamId === 200);
  const durationMin = duration / 60;

  // Duration context
  if (durationMin < 20) ins.push(`Błyskawiczny mecz (${Math.round(durationMin)}min) — jedna drużyna zdominowała early game i nie dała rywalom wrócić do gry.`);
  else if (durationMin < 27) ins.push(`Szybkie rozstrzygnięcie (${Math.round(durationMin)}min) — przewaga z early/mid game skutecznie skonwertowana.`);
  else if (durationMin > 42) ins.push(`Bardzo długi mecz (${Math.round(durationMin)}min) — wyrównana gra; skalowanie i late game obiektywy zadecydowały.`);
  else if (durationMin > 33) ins.push(`Długi mecz (${Math.round(durationMin)}min) — żadna drużyna nie przełamała early game, rozstrzygnięcie w late game.`);

  // Kill dominance
  const t1Kills = team1.reduce((s: number, p: any) => s + p.kills, 0);
  const t2Kills = team2.reduce((s: number, p: any) => s + p.kills, 0);
  const totalKills = t1Kills + t2Kills;
  const killRatio = Math.max(t1Kills, t2Kills) / Math.max(Math.min(t1Kills, t2Kills), 1);
  if (killRatio >= 3) {
    const dom = t1Kills > t2Kills ? "Niebieska" : "Czerwona";
    ins.push(`Drużyna ${dom} zmiażdżyła kill-by-kill (${Math.max(t1Kills, t2Kills)}:${Math.min(t1Kills, t2Kills)}) — całkowita dominacja walki.`);
  } else if (killRatio >= 2) {
    const dom = t1Kills > t2Kills ? "Niebieska" : "Czerwona";
    ins.push(`Drużyna ${dom} wyraźnie wygrała walki (${Math.max(t1Kills, t2Kills)}:${Math.min(t1Kills, t2Kills)} zabójstw).`);
  }

  // Gold difference
  const t1Gold = team1.reduce((s: number, p: any) => s + p.goldEarned, 0);
  const t2Gold = team2.reduce((s: number, p: any) => s + p.goldEarned, 0);
  const goldDiff = Math.abs(t1Gold - t2Gold);
  if (goldDiff >= 12000) {
    const richTeam = t1Gold > t2Gold ? "Niebieska" : "Czerwona";
    ins.push(`Drużyna ${richTeam} zakończyła grę z przewagą ${fmtK(goldDiff)} złota — ogromna dysproporcja ekonomiczna.`);
  }

  // Objectives
  if (t1 && t2) {
    const winT = t1.win ? t1 : t2;
    const loseT = t1.win ? t2 : t1;
    const dragonDiff = (winT.objectives?.dragon ?? 0) - (loseT.objectives?.dragon ?? 0);
    const baronDiff  = (winT.objectives?.baron ?? 0) - (loseT.objectives?.baron ?? 0);
    const towerDiff  = (winT.objectives?.tower ?? 0) - (loseT.objectives?.tower ?? 0);
    if (baronDiff >= 2) ins.push(`Wygrywająca drużyna wzięła ${winT.objectives?.baron} Baron${winT.objectives?.baron > 1 ? "ów" : "a"} (rywal: ${loseT.objectives?.baron}) — kluczowa kontrola late-game.`);
    else if (baronDiff === 1 && durationMin > 30) ins.push(`Baron zadecydował o wyniku — wygrywająca drużyna sięgnęła po Barona jako kluczowy buff.`);
    if (dragonDiff >= 3) ins.push(`Dominacja smoków: ${winT.objectives?.dragon} vs ${loseT.objectives?.dragon} — permanentne buffy statystyczne przez cały mecz.`);
    if (towerDiff >= 5) ins.push(`Miażdżąca przewaga wieżowa (${winT.objectives?.tower} vs ${loseT.objectives?.tower}) — pełna kontrola strukturalna mapy.`);
  }

  // Stolen objectives
  const stolenTotal = participants.reduce((s: number, p: any) => s + (p.objectivesStolen ?? 0), 0);
  if (stolenTotal >= 2) ins.push(`W tym meczu skradziono łącznie ${stolenTotal} obiektywy — dramatyczne zwroty akcji przy smoku/baronie.`);

  // Chaos indicator
  const highDeathCount = participants.filter((p: any) => p.deaths >= 7).length;
  if (highDeathCount >= 3) ins.push(`${highDeathCount} graczy zginęło 7+ razy — bardzo chaotyczny, otwarty styl gry z licznymi błędami pozycjonowania.`);
  else if (totalKills >= 50) ins.push(`${totalKills} łącznych zabójstw — wyjątkowo agresywny mecz z ciągłymi teamfightami na całej mapie.`);

  // Perfect survivors
  const zeroDeath = participants.filter((p: any) => p.deaths === 0);
  if (zeroDeath.length >= 2) ins.push(`${zeroDeath.map((p: any) => p.summonerName).join(" i ")} zakończyli mecz bez ani jednej śmierci.`);
  else if (zeroDeath.length === 1) ins.push(`${zeroDeath[0].summonerName} (${zeroDeath[0].championName}) bezbłędnie — zero śmierci przez cały mecz.`);

  // Vision war
  const t1Vision = team1.reduce((s: number, p: any) => s + p.visionScore, 0);
  const t2Vision = team2.reduce((s: number, p: any) => s + p.visionScore, 0);
  const visionDiff = Math.abs(t1Vision - t2Vision);
  if (visionDiff >= 40) {
    const betterVision = t1Vision > t2Vision ? "Niebieska" : "Czerwona";
    ins.push(`Drużyna ${betterVision} wygrała "wojnę wizji" (${Math.max(t1Vision, t2Vision)} vs ${Math.min(t1Vision, t2Vision)}) — przewaga informacyjna na mapie.`);
  }

  return ins;
}

function PlayerInsightCard({ p, team, allParticipants }: { p: any; team: any[]; allParticipants: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const dd = getDDBase();
  const insights = analyzePlayer(p, team, allParticipants);
  const positives = insights.filter(i => i.type === "positive");
  const negatives = insights.filter(i => i.type === "negative");
  const neutrals = insights.filter(i => i.type === "neutral");

  const perfScore = computePlayerScore(p);
  const borderStyle = perfScore >= 70 ? "border-green-200/60" : perfScore <= 35 ? "border-red-200/60" : "border-border/60";

  return (
    <div className={`rounded-xl border ${borderStyle} bg-card overflow-hidden shadow-sm`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors"
      >
        {/* Score ring */}
        <ScoreRing score={perfScore} />

        {/* Champion icon + name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src={`${dd}/champion/${p.championName}.png`} alt={p.championName}
            className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
            onError={(e) => { e.currentTarget.src = `${BASE_URL}/images/fallback-champion.png`; }} />
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground truncate block">{p.summonerName}</span>
            <span className="text-[9px] text-muted-foreground">{p.championName} · {p.kills}/{p.deaths}/{p.assists}</span>
          </div>
        </div>

        {/* Insight counts + chevron */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {positives.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-600 bg-green-50 rounded px-1 py-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> {positives.length}
            </span>
          )}
          {negatives.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-50 rounded px-1 py-0.5">
              <TrendingDown className="w-2.5 h-2.5" /> {negatives.length}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 ml-1" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5 border-t border-border/20 pt-2.5">
              {positives.map((ins, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{ins.text}</p>
                </div>
              ))}
              {negatives.map((ins, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{ins.text}</p>
                </div>
              ))}
              {neutrals.map((ins, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Brain className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{ins.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchAnalysisSection({ participants, teams, duration }: { participants: any[]; teams: any[]; duration: number }) {
  const team1 = participants.filter((p: any) => p.teamId === 100);
  const team2 = participants.filter((p: any) => p.teamId === 200);
  const mvp = computeMVP(participants);
  const weakLink = computeWeakLink(participants);
  const gameInsights = generateGameInsights(participants, teams, duration);
  const dd = getDDBase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-6 space-y-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
          Analiza meczu
        </h2>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Game-level insights */}
      {gameInsights.length > 0 && (
        <div className="glass-panel p-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2.5">Kluczowe wnioski</p>
          <div className="space-y-2">
            {gameInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-xs text-foreground/80 leading-relaxed">{ins}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MVP and weak link */}
      <div className="grid grid-cols-2 gap-3">
        {mvp && (
          <div className="glass-panel p-3 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img src={`${dd}/champion/${mvp.championName}.png`} alt={mvp.championName}
                className="w-10 h-10 rounded-lg border border-border"
                onError={(e) => { e.currentTarget.src = `${BASE_URL}/images/fallback-champion.png`; }} />
              <Star className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider font-bold text-yellow-500">MVP meczu</p>
              <p className="text-xs font-bold text-foreground truncate">{mvp.summonerName}</p>
              <p className="text-[10px] text-muted-foreground">{mvp.kills}/{mvp.deaths}/{mvp.assists} · {mvp.championName}</p>
            </div>
          </div>
        )}
        {weakLink && weakLink !== mvp && (
          <div className="glass-panel p-3 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img src={`${dd}/champion/${weakLink.championName}.png`} alt={weakLink.championName}
                className="w-10 h-10 rounded-lg border border-border grayscale opacity-70"
                onError={(e) => { e.currentTarget.src = `${BASE_URL}/images/fallback-champion.png`; }} />
              <AlertTriangle className="absolute -top-1 -right-1 w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider font-bold text-red-400">Słabe ogniwo</p>
              <p className="text-xs font-bold text-foreground truncate">{weakLink.summonerName}</p>
              <p className="text-[10px] text-muted-foreground">{weakLink.kills}/{weakLink.deaths}/{weakLink.assists} · {weakLink.championName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Per-player breakdown */}
      <div className="glass-panel p-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Analiza graczów — kliknij, żeby rozwinąć</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest px-1 mb-1">Drużyna Niebieska</p>
            {team1.map((p: any, i: number) => (
              <PlayerInsightCard key={i} p={p} team={team1} allParticipants={participants} />
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest px-1 mb-1">Drużyna Czerwona</p>
            {team2.map((p: any, i: number) => (
              <PlayerInsightCard key={i} p={p} team={team2} allParticipants={participants} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export default function MatchPage() {
  const params = useParams();
  const region = params.region as string;
  const gameName = decodeURIComponent(params.gameName || "");
  const tagLine = decodeURIComponent(params.tagLine || "");
  const matchId = params.matchId as string;

  usePageTitle(`Mecz ${matchId} — ${gameName}#${tagLine}`);
  const selfPuuid = params.selfPuuid as string | undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ["match", matchId, region],
    queryFn: async () => {
      const r = await fetch(`${BASE_URL}/api/match/${matchId}?region=${region}`);
      if (!r.ok) throw new Error("Błąd pobierania danych meczu");
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const backUrl = `/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href={backUrl} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" /> Powrót do profilu
      </Link>
      <LoadingSpinner text="Wczytywanie szczegółów meczu..." />
    </div>
  );

  if (error || !data) return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center">
      <Link href={backUrl} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" /> Powrót
      </Link>
      <p className="text-muted-foreground">Nie można załadować danych meczu.</p>
    </div>
  );

  const participants: any[] = data.participants ?? [];
  const team1 = participants.filter((p: any) => p.teamId === 100);
  const team2 = participants.filter((p: any) => p.teamId === 200);
  const team1Data = data.teams?.find((t: any) => t.teamId === 100);
  const team2Data = data.teams?.find((t: any) => t.teamId === 200);
  const maxDmg = Math.max(...participants.map((p: any) => p.totalDamageDealt ?? 0), 1);

  const dur = `${Math.floor(data.gameDuration / 60)}m ${data.gameDuration % 60}s`;
  const timeAgo = data.gameEndTimestamp
    ? formatDistanceToNow(new Date(data.gameEndTimestamp), { addSuffix: true, locale: pl })
    : "";

  const modeLabel: Record<string, string> = {
    CLASSIC: "Summoner's Rift", ARAM: "ARAM", URF: "URF", CHERRY: "Arena",
  };

  const winTeamId = participants.find((p: any) => p.win)?.teamId;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href={backUrl} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {gameName}#{tagLine}
        </Link>

        {/* Match header */}
        <div className="glass-panel p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold" style={{ fontFamily: "'Rajdhani',sans-serif" }}>
                {modeLabel[data.gameMode] ?? data.gameMode}
              </p>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                Szczegóły meczu
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {dur}</span>
              <span className="text-[11px]">{timeAgo}</span>
            </div>
          </div>

          {/* Bans */}
          {(team1Data?.bans?.length > 0 || team2Data?.bans?.length > 0) && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Bany</p>
              <div className="flex flex-wrap gap-1">
                {[...(team1Data?.bans ?? []), ...(team2Data?.bans ?? [])].map((b: any, i: number) => {
                  if (!b.championId || b.championId === -1) return null;
                  return (
                    <div key={i} className="relative">
                      <img
                        src={`${getDDBase()}/champion/${b.championName}.png`}
                        alt={b.championName}
                        className="w-6 h-6 rounded border border-border opacity-50 grayscale"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-500 rotate-45 rounded" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-4">
          <TeamSection
            participants={team1}
            team={team1Data}
            maxDmg={maxDmg}
            selfPuuid={selfPuuid}
            label="Drużyna Niebieska"
            color="hsl(220,90%,55%)"
          />
          <TeamSection
            participants={team2}
            team={team2Data}
            maxDmg={maxDmg}
            selfPuuid={selfPuuid}
            label="Drużyna Czerwona"
            color="#f0545c"
          />
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { icon: Sword, label: "Zabójstwa", v1: team1.reduce((s: number, p: any) => s + p.kills, 0), v2: team2.reduce((s: number, p: any) => s + p.kills, 0) },
            { icon: Shield, label: "Złoto", v1: Math.round(team1.reduce((s: number, p: any) => s + p.goldEarned, 0) / 1000) + "k", v2: Math.round(team2.reduce((s: number, p: any) => s + p.goldEarned, 0) / 1000) + "k" },
            { icon: Eye, label: "Wzrok", v1: team1.reduce((s: number, p: any) => s + p.visionScore, 0), v2: team2.reduce((s: number, p: any) => s + p.visionScore, 0) },
            { icon: Coins, label: "CS", v1: team1.reduce((s: number, p: any) => s + p.cs, 0), v2: team2.reduce((s: number, p: any) => s + p.cs, 0) },
          ].map(({ icon: Icon, label, v1, v2 }) => (
            <div key={label} className="glass-panel p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1.5">
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className={`text-sm font-bold ${winTeamId === 100 ? "text-primary" : "text-foreground"}`}>{v1}</span>
                <span className="text-muted-foreground/30 text-xs">–</span>
                <span className={`text-sm font-bold ${winTeamId === 200 ? "text-primary" : "text-foreground"}`}>{v2}</span>
              </div>
              <div className="flex gap-0.5 mt-1.5 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-400/60 rounded-full" style={{ width: `${typeof v1 === "number" && typeof v2 === "number" ? Math.round(v1 / Math.max(v1 + v2, 1) * 100) : 50}%` }} />
                <div className="bg-red-400/60 flex-1 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Analysis */}
        <MatchAnalysisSection
          participants={participants}
          teams={data.teams ?? []}
          duration={data.gameDuration}
        />
      </motion.div>
    </div>
  );
}
