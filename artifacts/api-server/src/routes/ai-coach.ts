import { Router, type IRouter } from "express";
import { cache } from "../lib/cache";
import { requireUsage } from "../middlewares/auth";
import { shrinkWinRate, sigmoid as logisticFn, stdDev } from "../lib/stats-utils";

import { fastModels, getNvidiaClient, streamChat, stripThinking } from "../lib/nvidia-models";

const router: IRouter = Router();

const TIER_PL: Record<string, string> = {
  IRON: "Żelazo", BRONZE: "Brąz", SILVER: "Srebro", GOLD: "Złoto",
  PLATINUM: "Platyna", EMERALD: "Szmaragd", DIAMOND: "Diament",
  MASTER: "Mistrz", GRANDMASTER: "Arcymistrz", CHALLENGER: "Challenger",
  UNRANKED: "Bez rangi",
};

const TIER_SCORE: Record<string, number> = {
  IRON: 400, BRONZE: 800, SILVER: 1200, GOLD: 1600, PLATINUM: 2000,
  EMERALD: 2400, DIAMOND: 2800, MASTER: 3200, GRANDMASTER: 3500,
  CHALLENGER: 3800, UNRANKED: 1200,
};
const DIV_SCORE: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };

function rankScore(tier: string, division: string, lp: number): number {
  const base = TIER_SCORE[tier] ?? 1200;
  const div = ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier) ? 0 : (DIV_SCORE[division] ?? 0);
  return base + div + Math.min(lp, 100);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function r1(n: number): number { return Math.round(n * 10) / 10; }

/** Wywołuje kolejne modele z listy (najpierw szybki), aż któryś odpowie. Zwraca tekst i nazwę modelu. */
async function callAI(prompt: string, signal?: AbortSignal, maxTokens = 1500): Promise<{ text: string; model: string }> {
  const errors: string[] = [];
  for (const model of fastModels()) {
    try {
      const text = await streamChat(getNvidiaClient(), model, [{ role: "user", content: prompt }], {
        maxTokens,
        temperature: 0.3,
        topP: 0.7,
        signal,
        firstTokenMs: 15_000,
      });
      return { text: stripThinking(text), model };
    } catch (e: any) {
      if (signal?.aborted) throw e;
      errors.push(`${model}: ${String(e?.message ?? e).slice(0, 160)}`);
      console.error("[ai-coach/callAI]", model, e?.message);
    }
  }
  throw new Error(`Żaden model AI nie odpowiedział (${errors.join(" | ")})`);
}

function extractJSON(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no JSON in response");
  return JSON.parse(m[0]);
}

// =========================================================================
// COUNTER-BUILD OPTIMIZER
// POST /api/coach/optimizer
// Body: { myChampion: string, lane: string, allies: string[], enemies: string[] }
// =========================================================================

router.post("/optimizer", requireUsage("optimizer"), async (req, res) => {
  const { myChampion, lane, allies = [], enemies = [] } = req.body ?? {};

  if (!myChampion || typeof myChampion !== "string") {
    res.status(400).json({ error: "bad_request", message: "myChampion is required" });
    return;
  }
  if (!Array.isArray(enemies) || enemies.length === 0) {
    res.status(400).json({ error: "bad_request", message: "at least one enemy required" });
    return;
  }

  const enemyList = enemies.filter(Boolean).join(", ");
  const allyList = allies.filter(Boolean).join(", ") || "brak danych";
  const laneStr = (lane ?? "MID").toUpperCase();

  const cacheKey = `optimizer:${myChampion}:${laneStr}:${enemyList}:${allyList}`.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180_000);
  const onClose = () => {
    if (req.socket?.destroyed && !res.headersSent) controller.abort();
  };
  res.on("close", onClose);

  const prompt = `Jesteś coachem League of Legends. Generuj rekomendację runy + sumony + buildu w formacie JSON, po polsku.

KONTEKST:
- Mój bohater: ${myChampion}
- Linia: ${laneStr}
- Sojusznicy: ${allyList}
- Wrogowie: ${enemyList}

WAŻNE:
1. Bierz pod uwagę KONKRETNYCH wrogów — np. jeśli wróg ma dużo CC, rekomenduj Mercurial/QSS; przeciw poke → Maw/Edge of Night; przeciw assassinom → Zhonya/GA.
2. Item names MUSZĄ być prawdziwymi przedmiotami z LoL patcha 14.X (np. "Liandry's Anguish", "Eclipse", "Trinity Force", "Rabadon's Deathcap", "Stormsurge", "Sundered Sky", "Hubris", "Voltaic Cyclosword").
3. Runes: główna ścieżka (Precision/Domination/Sorcery/Resolve/Inspiration) + 4 runy + sub-ścieżka + 2 runy + 3 fragmenty.
4. Summoners: Flash + jeden z (Ignite/Teleport/Heal/Exhaust/Cleanse/Smite/Barrier/Ghost).
5. Build: 6 itemów w kolejności kupowania + buty.
6. Każdy item/runa MUSI mieć short reason (po polsku, max 80 znaków).

TYLKO JSON:
{
  "myChampion": "${myChampion}",
  "lane": "${laneStr}",
  "summary": "1-2 zdania: kim jesteś w tym matchupie (carry/peel/split etc), kluczowe zagrożenia",
  "summoners": {
    "primary": "Flash",
    "secondary": "Ignite",
    "reason": "dlaczego ten zestaw vs ten team"
  },
  "runes": {
    "primary_path": "Precision",
    "primary_keystone": "Conqueror",
    "primary_runes": ["Triumph", "Legend: Tenacity", "Last Stand"],
    "secondary_path": "Resolve",
    "secondary_runes": ["Second Wind", "Unflinching"],
    "shards": ["Adaptive Force", "Adaptive Force", "Health Scaling"],
    "reason": "dlaczego ten setup vs ten team"
  },
  "build": {
    "boots": "Plated Steelcaps",
    "boots_reason": "vs 4 AD na wrogu",
    "core_items": [
      {"name":"Eclipse","reason":"early burst i shield vs poke"},
      {"name":"Sundered Sky","reason":"sustain vs assassinów"},
      {"name":"Death's Dance","reason":"reduce burst od ${enemies[0] ?? "wroga"}"}
    ],
    "situational_items": [
      {"name":"Maw of Malmortius","reason":"vs 2 AP na wrogu"},
      {"name":"Guardian Angel","reason":"vs dive comp"}
    ]
  },
  "matchup_tips": [
    "tip 1 z konkretną odniesieniem do wroga (max 100 znaków)",
    "tip 2",
    "tip 3"
  ],
  "spike_timing": "kiedy jesteś najsilniejszy (np. po 2 itemach, level 11)",
  "win_condition": "1 zdanie: jak wygrać tego matchupa"
}`;

  try {
    const t0 = Date.now();
    const { text, model } = await callAI(prompt, controller.signal, 1500);
    console.log(`[ai-coach/optimizer] ${myChampion} vs [${enemyList}] in ${Date.now() - t0}ms (${model})`);
    const parsed = extractJSON(text);
    const result = { ...parsed, model, generatedAt: Date.now() };
    cache.set(cacheKey, result, 3600); // cache 1h
    res.json(result);
  } catch (err: any) {
    if (res.headersSent) return;
    const isTimeout = timedOut || err?.message?.includes("timeout") || err?.name === "AbortError";
    res.status(isTimeout ? 408 : 500).json({
      error: isTimeout ? "timeout" : "ai_error",
      message: err?.message ?? "Unknown error",
    });
  } finally {
    clearTimeout(timeout);
    res.off("close", onClose);
  }
});

// =========================================================================
// LIVE GAME AI INSIGHTS — Win Prediction + Win Conditions + Threats
// POST /api/coach/live-insights
// Body: {
//   gameId, mySide ("blue"|"red"), gameMode,
//   participants: [{teamId, championName, summonerName, rankedTier, rankedDivision, rankedLP, rankedWins, rankedLosses}],
// }
// =========================================================================

router.post("/live-insights", requireUsage("optimizer"), async (req, res) => {
  const { gameId, mySide, gameMode, participants } = req.body ?? {};

  if (!gameId || !Array.isArray(participants) || participants.length === 0) {
    res.status(400).json({ error: "bad_request", message: "gameId and participants required" });
    return;
  }
  const side = mySide === "red" ? "red" : "blue";

  const cacheKey = `live-insights:${gameId}:${side}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  // === DETERMINISTIC WIN PREDICTION (rank + winrate based) ===
  const blue = participants.filter((p: any) => p.teamId === 100);
  const red = participants.filter((p: any) => p.teamId === 200);
  if (blue.length === 0 || red.length === 0) {
    res.status(400).json({ error: "bad_request", message: "missing team participants" });
    return;
  }

  // Multi-feature team model with Bayesian shrinkage. Key improvements over
  // the previous naive average:
  //  1. Player WR is SHRUNK toward 50% based on sample size (n=10 player ≠ n=400 player).
  //  2. Rank variance is penalised (5-man Emerald beats Diamond+Iron smurf duo).
  //  3. Experience is log-scaled (diminishing returns; 500 vs 50 games matters,
  //     1500 vs 1000 barely does).
  //  4. The logistic is calibrated (temperature) so probabilities stay honest
  //     — no more 85% calls on Iron matches where noise dominates.
  const teamScore = (team: any[]) => {
    const ranks = team.map((p: any) => rankScore(p.rankedTier ?? "UNRANKED", p.rankedDivision ?? "", p.rankedLP ?? 0));
    const avgRank = ranks.reduce((s, n) => s + n, 0) / ranks.length;
    const rankVariance = stdDev(ranks); // high = mismatched team

    // Shrunk WRs — a 6-2 player (75% WR, n=8) shouldn't be weighted like a 300-200 player.
    const shrunkWRs = team.map((p: any) => {
      const games = (p.rankedWins ?? 0) + (p.rankedLosses ?? 0);
      return shrinkWinRate(p.rankedWins ?? 0, games, 0.5, 30) * 100;
    });
    const avgShrunkWR = shrunkWRs.reduce((s, n) => s + n, 0) / shrunkWRs.length;

    const totalGames = team.reduce((s: number, p: any) => s + ((p.rankedWins ?? 0) + (p.rankedLosses ?? 0)), 0);
    const avgExp = totalGames / team.length;
    // log1p scales smoothly so extra games matter less after ~300.
    const expSignal = Math.log1p(avgExp) - Math.log1p(100); // centered around "100 games"

    return { avgRank, avgShrunkWR, avgExp, rankVariance, expSignal, teamSize: team.length };
  };

  const blueScore = teamScore(blue);
  const redScore = teamScore(red);

  // Logistic-regression-style feature contributions, each in ~standardised units.
  // Coefficients tuned by LoL match-prediction literature (rank accounts for most of signal).
  const rankDiff = (blueScore.avgRank - redScore.avgRank) / 400; // 1 tier = 400pts
  const wrDiff = (blueScore.avgShrunkWR - redScore.avgShrunkWR) / 8;
  const expDiff = blueScore.expSignal - redScore.expSignal;
  const varPenalty = (blueScore.rankVariance - redScore.rankVariance) / 800; // stacked vs mismatched

  // Raw logit then temperature-scaled to reduce over-confidence on noisy inputs.
  const rawLogit = rankDiff * 1.55 + wrDiff * 0.85 + expDiff * 0.35 - varPenalty * 0.45;

  // Confidence downgrade when samples are thin (low WR certainty across the lobby).
  const lobbyConfidence = Math.min(1, (blueScore.avgExp + redScore.avgExp) / 200);
  const temperature = 1 / (0.55 + 0.45 * lobbyConfidence); // 1.0 when experienced lobby, ~1.8 when fresh
  const calibratedLogit = rawLogit / temperature;

  const blueWinProb = logisticFn(calibratedLogit);
  // Clamp to [18, 82] — beyond this, the model is over-confident given the inherent variance of LoL.
  const blueP = Math.round(Math.max(18, Math.min(82, blueWinProb * 100)));
  const redP = 100 - blueP;
  const myProb = side === "blue" ? blueP : redP;

  const myTeam = side === "blue" ? blue : red;
  const enemyTeam = side === "blue" ? red : blue;
  const teamComp = (team: any[]) =>
    team.map((p: any) => `${p.championName} (${TIER_PL[p.rankedTier] ?? "Bez rangi"} ${p.rankedDivision ?? ""}, WR: ${
      ((p.rankedWins ?? 0) + (p.rankedLosses ?? 0)) >= 10
        ? Math.round((p.rankedWins / (p.rankedWins + p.rankedLosses)) * 100) + "%"
        : "n/d"
    })`).join(", ");

  const prompt = `Jesteś coachem League of Legends. Analiza meczu live, po polsku, zwięźle. Tylko JSON.

DRUŻYNA MOJA (${side === "blue" ? "Niebiescy" : "Czerwoni"}): ${teamComp(myTeam)}
DRUŻYNA WROGA (${side === "blue" ? "Czerwoni" : "Niebiescy"}): ${teamComp(enemyTeam)}
TRYB: ${gameMode ?? "CLASSIC"}
PREDYKCJA SYSTEMOWA: Moja drużyna ma ${myProb}% szans na wygraną (na podstawie rang i winrate).

ZASADY:
1. Win conditions = konkretne, taktyczne (np. "wygraj early game na top przed 14 min", "uniknij teamfightów do 25 min").
2. Threats = TYP zagrożenia z championa wroga (np. "Zed - dive na carry po 6 lvl", "Malphite ulti = 5-man wombo").
3. Power spikes = WHEN moja drużyna jest najsilniejsza (np. "drugi item u midlanera, 25 min").
4. Mowa codzienna, bez ogólników typu "graj dobrze".
5. Wszystko po POLSKU.

JSON:
{
  "team_archetype": "1-2 słowa: np. Skalujący poke, Engage burst, Pick comp, Splitpush",
  "enemy_archetype": "1-2 słowa: archetyp wrogów",
  "game_plan": "2-3 zdania: główny plan na mecz",
  "win_conditions": [
    "win condition 1 (max 90 znaków, konkretny)",
    "win condition 2",
    "win condition 3"
  ],
  "threats": [
    {"champion": "nazwa wroga", "threat": "co robi groźnego", "counter": "jak temu zapobiec"},
    {"champion": "nazwa wroga", "threat": "...", "counter": "..."},
    {"champion": "nazwa wroga", "threat": "...", "counter": "..."}
  ],
  "power_spikes": {
    "early": "co robić przed 15 min (1 zdanie)",
    "mid": "co robić 15-25 min (1 zdanie)",
    "late": "co robić po 25 min (1 zdanie)"
  },
  "key_objective": "który obiekt jest kluczowy (Drake/Herald/Baron/Wieże) i dlaczego",
  "mvp_pick": "który gracz w mojej drużynie jest kluczowy i czemu"
}`;

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180_000);
  const onClose = () => {
    if (req.socket?.destroyed && !res.headersSent) controller.abort();
  };
  res.on("close", onClose);

  try {
    const t0 = Date.now();
    const { text, model } = await callAI(prompt, controller.signal, 1200);
    console.log(`[ai-coach/live-insights] gameId=${gameId} in ${Date.now() - t0}ms (${model})`);
    const insights = extractJSON(text);

    // Confidence depends on BOTH the prediction margin AND how much evidence we had.
    // A 30-point edge on a lobby with 10 games per player is weaker than a 10-point
    // edge on a lobby with 500 games per player.
    const marginConf = Math.abs(blueP - 50);
    const evidenceConf = lobbyConfidence; // 0..1
    const combinedConf = marginConf * (0.5 + 0.5 * evidenceConf);
    const confidence = combinedConf > 15 ? "high" : combinedConf > 6 ? "medium" : "low";

    const result = {
      prediction: {
        blue_win_pct: blueP,
        red_win_pct: redP,
        my_win_pct: myProb,
        my_side: side,
        confidence,
        breakdown: {
          blue: {
            avg_rank_score: Math.round(blueScore.avgRank),
            avg_wr: r1(blueScore.avgShrunkWR),
            avg_games: Math.round(blueScore.avgExp),
            rank_variance: Math.round(blueScore.rankVariance),
          },
          red: {
            avg_rank_score: Math.round(redScore.avgRank),
            avg_wr: r1(redScore.avgShrunkWR),
            avg_games: Math.round(redScore.avgExp),
            rank_variance: Math.round(redScore.rankVariance),
          },
          model: {
            rank_contribution: r1(rankDiff * 1.55),
            wr_contribution: r1(wrDiff * 0.85),
            exp_contribution: r1(expDiff * 0.35),
            variance_penalty: r1(-varPenalty * 0.45),
            temperature: r1(temperature),
          },
        },
      },
      ai: insights,
      model,
      generatedAt: Date.now(),
    };
    cache.set(cacheKey, result, 600); // cache 10 min
    res.json(result);
  } catch (err: any) {
    if (res.headersSent) return;
    const isTimeout = timedOut || err?.message?.includes("timeout") || err?.name === "AbortError";
    res.status(isTimeout ? 408 : 500).json({
      error: isTimeout ? "timeout" : "ai_error",
      message: err?.message ?? "Unknown error",
    });
  } finally {
    clearTimeout(timeout);
    res.off("close", onClose);
  }
});

export default router;
