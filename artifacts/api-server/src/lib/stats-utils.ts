/**
 * Shared statistical utilities used across analysis and prediction code.
 *
 * Focus areas:
 *  - Bayesian shrinkage for small-sample rates (champion WR, player WR)
 *  - Wilson score confidence interval for proportions
 *  - Exponentially-weighted moving average (EWMA) for trend/form detection
 *  - Percentile-based grading and z-score normalization
 *  - Role-aware benchmarks for LoL stats (CS/min, KP, damage share, vision)
 */

export type Role = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | "";

// --- Basic math -------------------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Exponentially weighted moving average with weight on most recent sample. */
export function ewma(values: number[], alpha = 0.25): number {
  if (values.length === 0) return 0;
  // `values[0]` is assumed to be the MOST RECENT match (matches history API order).
  // We iterate from oldest -> newest so latest samples dominate.
  const reversed = [...values].reverse();
  let s = reversed[0];
  for (let i = 1; i < reversed.length; i++) {
    s = alpha * reversed[i] + (1 - alpha) * s;
  }
  return s;
}

// --- Bayesian shrinkage / Wilson --------------------------------------------

/**
 * Shrink an observed win rate toward a prior (default: 50%).
 * Works as Beta-Binomial posterior mean:
 *   posterior = (wins + priorWR * priorGames) / (games + priorGames)
 * - Small n → pulled strongly toward prior.
 * - Large n → essentially the empirical WR.
 */
export function shrinkWinRate(
  wins: number,
  games: number,
  priorWR = 0.5,
  priorGames = 12
): number {
  if (games <= 0) return priorWR;
  return (wins + priorWR * priorGames) / (games + priorGames);
}

/**
 * Wilson score lower bound of a proportion at a given confidence (default 95%).
 * Useful for "true WR is at least X%" style statements and for ranking champs
 * that have different sample sizes.
 */
export function wilsonLowerBound(
  wins: number,
  games: number,
  z = 1.96
): number {
  if (games <= 0) return 0;
  const p = wins / games;
  const denom = 1 + (z * z) / games;
  const centre = p + (z * z) / (2 * games);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * games)) / games);
  return (centre - margin) / denom;
}

// --- Role-aware benchmarks --------------------------------------------------

/**
 * Per-role target values for common metrics. Used to normalize scores so that
 * a 6.5 CS/min Support isn't scored against a 10 CS/min ADC benchmark, and an
 * ADC with 8k damage isn't penalized against a midlaner burst mage benchmark.
 *
 * Numbers are "what a 'good' Emerald player roughly hits per game". They act
 * as the denominator in a 0..100 score; values above the target saturate.
 */
export interface RoleBenchmarks {
  csPerMin: number;
  damagePerMin: number;
  damageShare: number; // percent (0-100)
  killParticipation: number; // percent
  visionPerMin: number;
  goldPerMin: number;
  wardScore: number; // wardsPlaced + 1.5*wardsKilled + 2*controlWards
}

const BENCHMARKS: Record<Role, RoleBenchmarks> = {
  TOP: {
    csPerMin: 7.8, damagePerMin: 700, damageShare: 25, killParticipation: 55,
    visionPerMin: 0.9, goldPerMin: 400, wardScore: 10,
  },
  JUNGLE: {
    csPerMin: 5.5, damagePerMin: 650, damageShare: 22, killParticipation: 70,
    visionPerMin: 1.1, goldPerMin: 380, wardScore: 14,
  },
  MIDDLE: {
    csPerMin: 8.2, damagePerMin: 900, damageShare: 28, killParticipation: 65,
    visionPerMin: 1.0, goldPerMin: 430, wardScore: 11,
  },
  BOTTOM: {
    csPerMin: 8.8, damagePerMin: 1100, damageShare: 30, killParticipation: 60,
    visionPerMin: 0.9, goldPerMin: 450, wardScore: 9,
  },
  UTILITY: {
    // Support: CS isn't meaningful; damage share is much lower; vision is king.
    csPerMin: 1.8, damagePerMin: 350, damageShare: 10, killParticipation: 70,
    visionPerMin: 2.2, goldPerMin: 280, wardScore: 22,
  },
  "": {
    csPerMin: 7.0, damagePerMin: 800, damageShare: 22, killParticipation: 60,
    visionPerMin: 1.1, goldPerMin: 400, wardScore: 12,
  },
};

export function benchmarksForRole(role: string | undefined | null): RoleBenchmarks {
  const r = (role ?? "") as Role;
  return BENCHMARKS[r] ?? BENCHMARKS[""];
}

/**
 * Score a value against a role-specific target using a saturating curve.
 *   ratio = value / target
 * returns 0..100 where:
 *   ratio = 0   → 0
 *   ratio = 1   → 80  (meeting the target = "A")
 *   ratio ≥ 1.3 → ~100 (elite, above target)
 *
 * We use sqrt scaling so marginal returns diminish above target, which matches
 * how KDA/CS/damage actually correlate with win rate in LoL.
 */
export function scoreVsBenchmark(value: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = value / target;
  if (ratio <= 0) return 0;
  // 80 * sqrt(ratio) gives 80 at ratio=1, ~91 at ratio=1.3, ~100 at ratio=1.5625
  return clamp(80 * Math.sqrt(ratio), 0, 100);
}

// --- Percentile / z-score grading ------------------------------------------

/**
 * Convert a 0..100 score into a letter grade using a smoother set of breakpoints
 * than the legacy hard-coded ones. Matches competitive ranked distributions:
 *  top ~5%   → S+
 *  top ~15%  → S
 *  top ~30%  → A
 *  top ~55%  → B
 *  top ~80%  → C
 *  top ~95%  → D
 *  else       → F
 */
export function gradeFromScore(score: number): string {
  if (score >= 88) return "S+";
  if (score >= 78) return "S";
  if (score >= 68) return "A";
  if (score >= 55) return "B";
  if (score >= 42) return "C";
  if (score >= 28) return "D";
  return "F";
}

/**
 * Two-sample significance test for a proportion difference (recent vs baseline).
 * Returns a z-score; |z| >= 1.96 ≈ 95% confidence the difference is real.
 */
export function proportionZ(
  winsA: number, nA: number,
  winsB: number, nB: number
): number {
  if (nA <= 0 || nB <= 0) return 0;
  const pA = winsA / nA;
  const pB = winsB / nB;
  const pPool = (winsA + winsB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  if (se === 0) return 0;
  return (pA - pB) / se;
}
