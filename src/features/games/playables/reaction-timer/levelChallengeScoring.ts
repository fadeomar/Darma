/**
 * Level definitions + pure scoring helpers for Level Challenge mode.
 *
 * No timing or rendering happens here. The engine captures `performance.now()`
 * for every spawn/hit and feeds the raw counts into `finalizeLevelResult`, which
 * is the single source of truth for the score, rank, and pass/fail decision.
 *
 * Scoring (kept simple and explainable):
 *   base       = hits * 100
 *   comboBonus = maxCombo * 20
 *   speedBonus = avg-hit derived (faster → more), 0 when no hits
 *   penalty    = misses * 25 + wrongTargets * 50
 *   levelMul   = 1 + levelIndex * 0.15
 *   score      = max(0, round((base + comboBonus + speedBonus - penalty) * levelMul))
 */

import { makeId } from "./reactionScoring";
import type {
  LevelChallengeRank,
  LevelChallengeRankId,
  LevelChallengeResult,
  LevelDef,
} from "./levelChallengeTypes";

export const TOTAL_LEVELS = 6;
export const LEVEL_COUNTDOWN_FROM = 3;
export const LEVEL_COUNTDOWN_INTERVAL_MS = 650;
/** Pause between resolving one opportunity and spawning the next. */
export const NEXT_SPAWN_DELAY_MS = 240;
/** Vertical band reserved at the top so targets never spawn under the controls. */
export const TOP_CONTROLS_RESERVE = 72;
export const EDGE_PADDING = 14;
/** Arena width under which targets/decoys grow for touch. */
export const MOBILE_WIDTH = 560;
const MOBILE_SCALE = 1.28;

/** The six levels, in order. Tuned to be fair first-time and harder later. */
export const LEVELS: LevelDef[] = [
  {
    index: 0,
    level: 1,
    id: "l1-signal",
    title: "Classic Signal",
    mechanic: "signal",
    objective: "Wait for GO, then react. Land 2 of 3 — or average under 500ms.",
    tip: "Watch the centre and react to the change. Don't anticipate.",
    opportunities: 3,
    requiredHits: 2,
    targetLifetimeMs: 0,
    baseRadius: 0,
    signalAttempts: 3,
    signalPassAvgMs: 500,
    signalMinValid: 2,
  },
  {
    index: 1,
    level: 2,
    id: "l2-fade",
    title: "Fade Target",
    mechanic: "fade",
    objective: "Hit the target before it fades. Catch 6 of 10.",
    tip: "Targets dissolve fast — strike as soon as you see one.",
    opportunities: 10,
    requiredHits: 6,
    targetLifetimeMs: 1200,
    baseRadius: 34,
    fade: true,
  },
  {
    index: 2,
    level: 3,
    id: "l3-shrink",
    title: "Shrink Target",
    mechanic: "shrink",
    objective: "Hit the target before it shrinks away. Catch 6 of 10.",
    tip: "Bigger is easier — go early while the target is large.",
    opportunities: 10,
    requiredHits: 6,
    targetLifetimeMs: 1300,
    baseRadius: 45,
    shrink: true,
    shrinkToRadius: 14,
  },
  {
    index: 3,
    level: 4,
    id: "l4-move",
    title: "Moving Target",
    mechanic: "move",
    objective: "Track and tap the moving target. Catch 5 of 10.",
    tip: "Lead the target slightly — tap where it's heading.",
    opportunities: 10,
    requiredHits: 5,
    targetLifetimeMs: 1900,
    baseRadius: 34,
    moveSpeed: 120,
  },
  {
    index: 4,
    level: 5,
    id: "l5-decoy",
    title: "Decoy Challenge",
    mechanic: "decoy",
    objective: "Hit only the ringed crosshair target. 6 of 10, under 4 wrong.",
    tip: "The correct target has a bright ring + crosshair. Decoys are slashed squares.",
    opportunities: 10,
    requiredHits: 6,
    maxWrong: 3,
    targetLifetimeMs: 2600,
    baseRadius: 32,
    decoys: 3,
  },
  {
    index: 5,
    level: 6,
    id: "l6-elite",
    title: "Elite Reflex",
    mechanic: "elite",
    objective: "Fade + movement + decoys, smaller targets. Hit 7 of 12.",
    tip: "Stay calm. Find the crosshair target first, then commit.",
    opportunities: 12,
    requiredHits: 7,
    maxWrong: 4,
    targetLifetimeMs: 1700,
    baseRadius: 28,
    fade: true,
    moveSpeed: 70,
    decoys: 2,
  },
];

export function getLevelDef(level: number): LevelDef {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0];
}

/** Scale a radius up on narrow (touch) arenas. */
export function scaleRadiusForWidth(radius: number, width: number): number {
  return width <= MOBILE_WIDTH ? Math.round(radius * MOBILE_SCALE) : radius;
}

const RANKS: Record<LevelChallengeRankId, LevelChallengeRank> = {
  elite: { id: "elite", label: "Elite Clear", note: "Flawless focus and speed.", glyph: "💎" },
  sharp: { id: "sharp", label: "Sharp Focus", note: "Fast and accurate — well played.", glyph: "🎯" },
  solid: { id: "solid", label: "Solid Run", note: "Cleared it. Push for a cleaner run next time.", glyph: "⚡" },
  warmup: { id: "warmup", label: "Warm-up", note: "You passed — now sharpen the details.", glyph: "🙂" },
  fail: { id: "fail", label: "Try Again", note: "So close. Reset your rhythm and retry.", glyph: "🌱" },
};

export function getLevelChallengeRank(passed: boolean, score: number, accuracy: number): LevelChallengeRank {
  if (!passed) return RANKS.fail;
  if (score >= 1500 && accuracy >= 85) return RANKS.elite;
  if (score >= 950 && accuracy >= 70) return RANKS.sharp;
  if (score >= 450) return RANKS.solid;
  return RANKS.warmup;
}

/** Decide whether a level's objective was met from its raw counts. */
export function didPassLevel(
  def: LevelDef,
  input: { hits: number; validReactions: number; averageHitMs: number | null; wrongTargets: number },
): boolean {
  if (def.mechanic === "signal") {
    const avgOk =
      input.averageHitMs !== null && def.signalPassAvgMs !== undefined && input.averageHitMs < def.signalPassAvgMs;
    const validOk = input.validReactions >= (def.signalMinValid ?? 2);
    return avgOk || validOk;
  }
  const hitsOk = input.hits >= def.requiredHits;
  const wrongOk = def.maxWrong === undefined || input.wrongTargets <= def.maxWrong;
  return hitsOk && wrongOk;
}

/** Build the final result for one level attempt from its raw counters. */
export function finalizeLevelResult(input: {
  def: LevelDef;
  hits: number;
  misses: number;
  wrongTargets: number;
  hitTimesMs: number[];
  maxCombo: number;
  earlyPresses: number;
  comebackClear: boolean;
}): LevelChallengeResult {
  const { def, hits, misses, wrongTargets, hitTimesMs, maxCombo, earlyPresses, comebackClear } = input;
  const attempts = hits + misses + wrongTargets;
  const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
  const averageHitMs = hits > 0 ? Math.round(hitTimesMs.reduce((s, t) => s + t, 0) / hits) : null;
  const bestHitMs = hits > 0 ? Math.min(...hitTimesMs) : null;

  // For the signal level, "valid reactions" == hits (non-early presses that landed).
  const passed = didPassLevel(def, { hits, validReactions: hits, averageHitMs, wrongTargets });

  const base = hits * 100;
  const comboBonus = maxCombo * 20;
  const speedBonus = averageHitMs !== null ? Math.max(0, Math.min(160, Math.round((900 - averageHitMs) / 4))) : 0;
  const penalty = misses * 25 + wrongTargets * 50;
  const levelMul = 1 + def.index * 0.15;
  const score = Math.max(0, Math.round((base + comboBonus + speedBonus - penalty) * levelMul));

  return {
    id: makeId(),
    level: def.level,
    levelIndex: def.index,
    mechanic: def.mechanic,
    passed,
    score,
    hits,
    misses,
    wrongTargets,
    accuracy,
    averageHitMs,
    bestHitMs,
    maxCombo,
    earlyPresses,
    opportunities: def.opportunities,
    requiredHits: def.requiredHits,
    comebackClear: comebackClear && passed,
    createdAt: new Date().toISOString(),
  };
}

/** Overall rank for the full 6-level challenge, based on best score sum. */
export function getChallengeRank(totalScore: number): LevelChallengeRank {
  if (totalScore >= 9000) return RANKS.elite;
  if (totalScore >= 6000) return RANKS.sharp;
  if (totalScore >= 3000) return RANKS.solid;
  return RANKS.warmup;
}

export function formatLevelMs(ms: number | null | undefined): string {
  return typeof ms === "number" && Number.isFinite(ms) ? `${ms} ms` : "—";
}

export function formatLevelScore(score: number): string {
  return score.toLocaleString();
}

/** Shareable one-liner for a level result. */
export function buildLevelChallengeShareText(result: LevelChallengeResult): string {
  const def = getLevelDef(result.level);
  if (result.passed) {
    return `I cleared Level ${result.level}: ${def.title} on Darma Reaction Timer Pro — ${result.accuracy}% accuracy, score ${formatLevelScore(
      result.score,
    )}. Can you beat it?`;
  }
  return `I'm tackling Level ${result.level}: ${def.title} on Darma Reaction Timer Pro. Think you can clear it?`;
}
