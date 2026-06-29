/**
 * Pure balancing + scoring helpers for Target Hunter mode.
 *
 * No timing or rendering happens here. The engine captures `performance.now()`
 * for every spawn/hit and feeds the raw counts into `finalizeTargetHunterRun`,
 * which is the single source of truth for the score, rank, and derived metrics.
 *
 * Scoring (kept simple and explainable):
 *   base        = hits * configured hit points
 *   comboBonus  = longestCombo * configured combo bonus
 *   speedBonus  = Σ speedBonusForHit(hitMs)        (faster hits → more)
 *   penalty     = misses * 25
 *   accuracyMul = 0.75 + 0.25 * (accuracy / 100)   (0.75x … 1.0x)
 *   score       = max(0, round((base + comboBonus + speedBonus - penalty) * accuracyMul))
 */

import { reactionBalancing } from "./reactionBalancing";
import { makeId } from "./reactionScoring";
import type { ActiveTarget, TargetHunterRank, TargetHunterRankId, TargetHunterResult } from "./targetHunterTypes";

/** Quick Hunt length. */
export const TARGET_HUNTER_DURATION_MS = reactionBalancing.targetHunter.durationMs;
/** Countdown before the hunt begins (3 → 2 → 1 → Hunt). */
export const TARGET_HUNTER_COUNTDOWN_FROM = reactionBalancing.targetHunter.countdownFrom;
export const TARGET_HUNTER_COUNTDOWN_INTERVAL_MS = reactionBalancing.targetHunter.countdownIntervalMs;
/** Delay before the next target appears after a hit (eased down by combo). */
export const SPAWN_DELAY_MS = reactionBalancing.targetHunter.spawnDelayMs;
export const SPAWN_DELAY_MIN_MS = reactionBalancing.targetHunter.spawnDelayMinMs;
/** First target appears shortly after the countdown ends. */
export const FIRST_SPAWN_DELAY_MS = reactionBalancing.targetHunter.firstSpawnDelayMs;

/** Viewport width under which we treat the arena as "mobile" for sizing. */
const MOBILE_WIDTH = reactionBalancing.targetHunter.mobileWidth;
const TARGET_DIAMETER_DESKTOP = reactionBalancing.targetHunter.targetDiameterDesktop;
const TARGET_DIAMETER_MOBILE = reactionBalancing.targetHunter.targetDiameterMobile;
/** Vertical band reserved at the top so targets never spawn under the controls. */
export const TOP_CONTROLS_RESERVE = reactionBalancing.targetHunter.topControlsReserve;
/** Extra padding kept from every edge (added to the radius). */
const EDGE_PADDING = reactionBalancing.targetHunter.edgePadding;

/** Target radius (CSS px) for the current arena width. Larger on mobile. */
export function targetRadiusForWidth(width: number): number {
  const diameter = width <= MOBILE_WIDTH ? TARGET_DIAMETER_MOBILE : TARGET_DIAMETER_DESKTOP;
  return diameter / 2;
}

/**
 * Pick a random spawn position inside the safe area, biased away from the
 * previous target so the player has to move. Returns null when the arena is too
 * small to place a target safely (caller skips the spawn until the next frame).
 */
export function pickSpawn(
  width: number,
  height: number,
  radius: number,
  previous: ActiveTarget | null,
): { x: number; y: number } | null {
  const minX = radius + EDGE_PADDING;
  const maxX = width - radius - EDGE_PADDING;
  const minY = TOP_CONTROLS_RESERVE + radius;
  const maxY = height - radius - EDGE_PADDING;
  if (maxX <= minX || maxY <= minY) return null;

  const randomPoint = () => ({
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
  });

  if (!previous) return randomPoint();

  // Try a handful of times to land at least ~2.2 radii from the last target.
  const minDistance = radius * reactionBalancing.targetHunter.minPreviousDistanceRadiusMultiplier;
  let candidate = randomPoint();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const dx = candidate.x - previous.x;
    const dy = candidate.y - previous.y;
    if (Math.hypot(dx, dy) >= minDistance) return candidate;
    candidate = randomPoint();
  }
  return candidate; // accept the last try rather than block the spawn
}

/** Mild difficulty: the spawn gap shrinks slightly as the combo grows. */
export function spawnDelayForCombo(combo: number): number {
  const eased = SPAWN_DELAY_MS - combo * reactionBalancing.targetHunter.spawnComboStepMs;
  return Math.max(SPAWN_DELAY_MIN_MS, eased);
}

/** Per-hit speed bonus: ~100 for a 300ms hit, fading to 0 by ~900ms. */
export function speedBonusForHit(hitTimeMs: number): number {
  const scoring = reactionBalancing.targetHunter.scoring;
  return Math.max(0, Math.min(scoring.speedBonusCap, Math.round((scoring.speedBonusBaseMs - hitTimeMs) / scoring.speedBonusDivisor)));
}

const RANKS: Record<TargetHunterRankId, TargetHunterRank> = {
  elite: { id: "elite", label: "Elite Hunter", note: "Ruthless speed and accuracy.", glyph: "💎" },
  sharp: { id: "sharp", label: "Sharp Shooter", note: "Fast hands and a steady aim.", glyph: "🎯" },
  focused: { id: "focused", label: "Focused", note: "Locked in — keep building those combos.", glyph: "⚡" },
  warmup: { id: "warmup", label: "Warm-up", note: "Good start. Slow down to aim, then speed up.", glyph: "🙂" },
  rookie: { id: "rookie", label: "Keep practicing", note: "Settle into a rhythm and trust your eyes.", glyph: "🌱" },
};

export function getTargetHunterRank(
  score: number,
  accuracy: number,
  averageHitMs: number | null,
): TargetHunterRank {
  const thresholds = reactionBalancing.targetHunter.rankThresholds;
  const fast = averageHitMs !== null && averageHitMs <= thresholds.eliteAverageHitMs;
  if (score >= thresholds.eliteScore && accuracy >= thresholds.eliteAccuracy && fast) return RANKS.elite;
  if (score >= thresholds.sharpScore && accuracy >= thresholds.sharpAccuracy) return RANKS.sharp;
  if (score >= thresholds.focusedScore) return RANKS.focused;
  if (score >= thresholds.warmupScore) return RANKS.warmup;
  return RANKS.rookie;
}

/** Build the final result from the raw run counters. */
export function finalizeTargetHunterRun(input: {
  hits: number;
  misses: number;
  hitTimesMs: number[];
  longestCombo: number;
  durationMs: number;
  usedTouch: boolean;
}): TargetHunterResult {
  const { hits, misses, hitTimesMs, longestCombo, durationMs, usedTouch } = input;
  const attempts = hits + misses;
  const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
  const averageHitMs = hits > 0 ? Math.round(hitTimesMs.reduce((s, t) => s + t, 0) / hits) : null;
  const bestHitMs = hits > 0 ? Math.min(...hitTimesMs) : null;

  const scoring = reactionBalancing.targetHunter.scoring;
  const base = hits * scoring.hitPoints;
  const comboBonus = longestCombo * scoring.comboBonus;
  const speedBonus = hitTimesMs.reduce((s, t) => s + speedBonusForHit(t), 0);
  const penalty = misses * scoring.missPenalty;
  const accuracyMul = scoring.accuracyBaseMultiplier + scoring.accuracyMultiplierRange * (accuracy / 100);
  const score = Math.max(0, Math.round((base + comboBonus + speedBonus - penalty) * accuracyMul));

  return {
    id: makeId(),
    score,
    hits,
    misses,
    accuracy,
    longestCombo,
    averageHitMs,
    bestHitMs,
    rankId: getTargetHunterRank(score, accuracy, averageHitMs).id,
    durationMs,
    usedTouch,
    createdAt: new Date().toISOString(),
  };
}

/** "430 ms" or "—". */
export function formatHitMs(ms: number | null | undefined): string {
  return typeof ms === "number" && Number.isFinite(ms) ? `${ms} ms` : "—";
}

/** Score with thousands separators, e.g. 2450 → "2,450". */
export function formatScore(score: number): string {
  return score.toLocaleString();
}

/** Shareable one-liner for a Target Hunter run. */
export function buildTargetHunterShareText(result: TargetHunterResult): string {
  return `I scored ${formatScore(result.score)} in Target Hunter on Darma Reaction Timer Pro — ${
    result.accuracy
  }% accuracy and a ${result.longestCombo}-hit combo. Can you beat it?`;
}
