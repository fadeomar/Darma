/**
 * Pure scoring + ranking + analysis helpers for Reaction Timer Pro.
 *
 * Ranking thresholds (classic reaction):
 *   < 180ms  Elite
 *   180-230  Excellent
 *   230-300  Good
 *   300-400  Average
 *   > 400    Keep practicing
 */

import type {
  GameMode,
  Rank,
  ReactionAttempt,
  ReactionStorageV2,
  RunAnalysis,
  RunSummary,
} from "./reactionTypes";

export const CLASSIC_ROUNDS = 5;
export const MIN_WAIT_MS = 1500;
export const MAX_WAIT_MS = 5000;

/**
 * Friendly, non-medical disclaimer shown beside the stats. Kept here so every
 * surface uses the exact same wording.
 */
export const ACCURACY_NOTE =
  "This browser game is for practice and fun. Results can vary by device, screen refresh rate, input method, and browser.";

export function getRank(ms: number | null): Rank {
  if (ms === null) {
    return { id: "practice", label: "No score yet", note: "Finish a valid round to earn a rank.", glyph: "🎯" };
  }
  if (ms < 180) {
    return { id: "elite", label: "Elite", note: "Lightning reflexes — that is world-class fast.", glyph: "💎" };
  }
  if (ms < 230) {
    return { id: "excellent", label: "Excellent", note: "Sharp and quick. Keep it consistent.", glyph: "🚀" };
  }
  if (ms < 300) {
    return { id: "good", label: "Good", note: "Solid reaction. A few rounds will sharpen it.", glyph: "⚡" };
  }
  if (ms < 400) {
    return { id: "average", label: "Average", note: "Right around typical human reaction time.", glyph: "🙂" };
  }
  return { id: "practice", label: "Keep practicing", note: "Stay calm and watch for the signal.", glyph: "🌱" };
}

/** A short coaching tip tuned to the latest reaction time. */
export function getTip(ms: number | null, tooEarly: boolean): string {
  if (tooEarly) return "You jumped before the signal. Relax your hand and watch, don't anticipate.";
  if (ms === null) return "Wait calmly — the signal can take up to 5 seconds.";
  if (ms < 200) return "Incredible. Consistency is the next challenge — can you repeat it?";
  if (ms < 280) return "Great speed. Avoid tensing up between rounds to stay loose.";
  if (ms < 360) return "Good. Try focusing on the centre of the arena and react to motion.";
  return "Typical reaction time is ~250ms. Less coffee jitter, more steady focus.";
}

export function randomWaitMs(): number {
  return Math.round(MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS));
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

/**
 * Friendly 0-100 consistency score. Based on the spread (worst − best) relative
 * to the average: a tight cluster scores high, a wide scatter scores low. Kept
 * deliberately simple rather than a strict standard deviation.
 */
export function consistencyScore(values: number[]): number {
  if (values.length < 2) return values.length === 1 ? 100 : 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (avg <= 0) return 100;
  const spread = Math.max(...values) - Math.min(...values);
  const ratio = spread / avg; // 0 = identical rounds
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 100)));
}

export function summarizeRun(attempts: ReactionAttempt[], mode: GameMode): RunSummary {
  const valid = attempts.filter((a) => !a.tooEarly && a.reactionMs !== null);
  const times = valid.map((a) => a.reactionMs as number);
  const earlyPresses = attempts.filter((a) => a.tooEarly).length;
  const total = valid.length + earlyPresses;

  return {
    id: makeId(),
    mode,
    bestMs: times.length ? Math.min(...times) : null,
    averageMs: times.length ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : null,
    medianMs: median(times),
    worstMs: times.length ? Math.max(...times) : null,
    consistency: consistencyScore(times),
    accuracy: total > 0 ? Math.round((valid.length / total) * 100) : 0,
    validRounds: valid.length,
    earlyPresses,
    rounds: times,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Compare a finished run against the records that existed BEFORE it was saved.
 * `previousBestMs` / `previousBestAverageMs` are the pre-merge personal bests;
 * `previousRun` is the immediately preceding run (for average improvement).
 */
export function analyzeRun(
  run: RunSummary,
  previousBestMs: number | null,
  previousBestAverageMs: number | null,
  previousRun: RunSummary | null,
): RunAnalysis {
  const personalBest =
    run.bestMs !== null && (previousBestMs === null || run.bestMs < previousBestMs);
  const personalBestAverage =
    run.averageMs !== null && (previousBestAverageMs === null || run.averageMs < previousBestAverageMs);

  const improvementVsBestMs =
    run.bestMs !== null && previousBestMs !== null ? previousBestMs - run.bestMs : null;
  const improvementVsAverageMs =
    run.averageMs !== null && previousRun?.averageMs != null
      ? previousRun.averageMs - run.averageMs
      : null;

  return {
    best: run.bestMs,
    average: run.averageMs,
    median: run.medianMs,
    worst: run.worstMs,
    accuracy: run.accuracy,
    earlyPresses: run.earlyPresses,
    consistency: run.consistency,
    rank: getRank(run.bestMs),
    cleanRun: run.earlyPresses === 0,
    personalBest,
    personalBestAverage,
    improvementVsBestMs,
    improvementVsAverageMs,
  };
}

/**
 * 1-2 short, friendly lifetime insight lines derived from persisted stats.
 * Purely encouraging coaching — never makes medical or absolute claims.
 */
export function buildLifetimeInsights(stats: ReactionStorageV2): string[] {
  const insights: string[] = [];
  const latest = stats.lastResults[0] ?? null;

  // Fastest-vs-average gap, computed from the rolling recent attempts.
  if (stats.bestMs !== null && stats.recentAttempts.length >= 3) {
    const times = stats.recentAttempts.map((a) => a.ms);
    const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
    const gap = avg - stats.bestMs;
    if (gap >= 20) {
      insights.push(`Your fastest reaction is ${gap} ms better than your recent average.`);
    }
  }

  const attempts = stats.totalValidRounds + stats.totalEarlyPresses;
  const earlyRatio = attempts > 0 ? stats.totalEarlyPresses / attempts : 0;
  if (earlyRatio >= 0.2) {
    insights.push("You press early fairly often — try waiting for the signal instead of predicting it.");
  } else if (latest && latest.earlyPresses === 0) {
    insights.push("Clean focus lately — no early taps in your last run.");
  }

  if (latest && latest.consistency >= 85) {
    insights.push("Your consistency is strong — rounds are tightly clustered.");
  }

  if (stats.streak.current >= 2) {
    insights.push(`You're on a ${stats.streak.current}-day streak. Nice rhythm!`);
  }

  return insights.slice(0, 2);
}

export function formatMs(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value} ms` : "—";
}

/** Signed delta vs personal best, e.g. "-12 ms" (faster) or "+8 ms" (slower). */
export function formatDelta(current: number | null, best: number | null): string | null {
  if (current === null || best === null) return null;
  const delta = current - best;
  if (delta === 0) return "ties your best";
  return delta < 0 ? `${delta} ms vs best` : `+${delta} ms vs best`;
}

/**
 * Shareable one-liner, e.g.
 * "I scored 224ms on Darma Reaction Timer Pro — Rank: Excellent. Can you beat me?"
 */
export function buildShareText(run: RunSummary): string {
  const rank = getRank(run.bestMs).label;
  const best = run.bestMs !== null ? `${run.bestMs}ms` : "a run";
  const avg = run.averageMs !== null ? ` (avg ${run.averageMs}ms)` : "";
  return `I scored ${best}${avg} on Darma Reaction Timer Pro — Rank: ${rank}. Can you beat me?`;
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Day key (YYYY-MM-DD) for an ISO timestamp, in the player's local time. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** True when `day` is exactly one calendar day after `previousDay` (both YYYY-MM-DD). */
export function isNextDay(previousDay: string, day: string): boolean {
  if (!previousDay || !day) return false;
  const prev = new Date(`${previousDay}T00:00:00`);
  const next = new Date(`${day}T00:00:00`);
  if (Number.isNaN(prev.getTime()) || Number.isNaN(next.getTime())) return false;
  const diff = next.getTime() - prev.getTime();
  return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 1.5;
}
