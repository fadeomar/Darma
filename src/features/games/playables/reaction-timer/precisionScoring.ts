/**
 * Pure scoring + ranking helpers for Precision Timer mode.
 *
 * Ranking is based on the ABSOLUTE difference from the target:
 *   <= 20ms   Perfect
 *   <= 75ms   Excellent
 *   <= configured good threshold  Good
 *   <= configured close threshold Close
 *   > 250ms   Miss
 *
 * No timing happens here — `usePrecisionGame` captures `performance.now()` and
 * passes the raw elapsed/target to `evaluatePrecision`.
 */

import { reactionBalancing } from "./reactionBalancing";
import { makeId } from "./reactionScoring";
import type { PrecisionRank, PrecisionRankId, PrecisionResult } from "./precisionTypes";

export const DEFAULT_PRECISION_TARGET_MS = reactionBalancing.precision.defaultTargetMs;
/** Fixed presets offered in the lobby (plus a seeded "Random"). */
export const PRECISION_TARGET_PRESETS = reactionBalancing.precision.presets;
const RANDOM_MIN_MS = reactionBalancing.precision.randomMinMs;
const RANDOM_MAX_MS = reactionBalancing.precision.randomMaxMs;
const RANDOM_STEP_MS = reactionBalancing.precision.randomStepMs;

/** A clean random target rounded to the nearest 250ms, e.g. 4250 → "4.250s". */
export function randomPrecisionTargetMs(): number {
  const span = RANDOM_MAX_MS - RANDOM_MIN_MS;
  const raw = RANDOM_MIN_MS + Math.random() * span;
  return Math.round(raw / RANDOM_STEP_MS) * RANDOM_STEP_MS;
}

export function isPresetTarget(targetMs: number): boolean {
  return (PRECISION_TARGET_PRESETS as readonly number[]).includes(targetMs);
}

const RANKS: Record<PrecisionRankId, PrecisionRank> = {
  perfect: { id: "perfect", label: "Perfect", note: "Almost machine-level timing.", glyph: "💎" },
  excellent: { id: "excellent", label: "Excellent", note: "That was impressively close.", glyph: "🚀" },
  good: { id: "good", label: "Good", note: "Solid timing. Try to shave off a few milliseconds.", glyph: "⚡" },
  close: { id: "close", label: "Close", note: "Close, but you drifted from the target.", glyph: "🙂" },
  miss: { id: "miss", label: "Miss", note: "Reset your rhythm and try again.", glyph: "🌱" },
};

export function getPrecisionRank(absDifferenceMs: number): PrecisionRank {
  const thresholds = reactionBalancing.precision.rankThresholds;
  if (absDifferenceMs <= thresholds.perfectMs) return RANKS.perfect;
  if (absDifferenceMs <= thresholds.excellentMs) return RANKS.excellent;
  if (absDifferenceMs <= thresholds.goodMs) return RANKS.good;
  if (absDifferenceMs <= thresholds.closeMs) return RANKS.close;
  return RANKS.miss;
}

/** Build a full result from a target and a measured elapsed time. */
export function evaluatePrecision(targetMs: number, elapsedMs: number): PrecisionResult {
  const safeElapsed = Math.max(0, Math.round(elapsedMs));
  const differenceMs = safeElapsed - targetMs;
  const absDifferenceMs = Math.abs(differenceMs);
  return {
    id: makeId(),
    targetMs,
    elapsedMs: safeElapsed,
    differenceMs,
    absDifferenceMs,
    rankId: getPrecisionRank(absDifferenceMs).id,
    early: differenceMs < 0,
    createdAt: new Date().toISOString(),
  };
}

/** Seconds with three decimals, e.g. 5000 → "5.000s", 4250 → "4.250s". */
export function formatSeconds(ms: number | null | undefined): string {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
  return `${(ms / 1000).toFixed(3)}s`;
}

/** Signed millisecond delta, e.g. "+34 ms" (late), "-28 ms" (early), "±0 ms". */
export function formatSignedMs(differenceMs: number | null | undefined): string {
  if (typeof differenceMs !== "number" || !Number.isFinite(differenceMs)) return "—";
  if (differenceMs === 0) return "±0 ms";
  return differenceMs > 0 ? `+${differenceMs} ms` : `${differenceMs} ms`;
}

/** Coaching tip tuned to how the player missed (early vs late). */
export function getPrecisionTip(result: PrecisionResult): string {
  const rank = getPrecisionRank(result.absDifferenceMs);
  if (rank.id === "perfect") return "Incredible control — can you repeat it?";
  if (result.early) return "You stopped early. Relax and let the timer reach the mark.";
  return "You stopped late. Try counting slightly ahead of the target.";
}

/** Shareable one-liner for a precision result. */
export function buildPrecisionShareText(result: PrecisionResult): string {
  const rank = getPrecisionRank(result.absDifferenceMs).label;
  return `I stopped ${formatSignedMs(result.differenceMs)} from a ${formatSeconds(
    result.targetMs,
  )} target in Darma Precision Timer — Rank: ${rank}. Can you get closer?`;
}
