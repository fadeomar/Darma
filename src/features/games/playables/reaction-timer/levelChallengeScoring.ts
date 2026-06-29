/**
 * Level definitions + pure scoring helpers for Level Challenge mode.
 *
 * No timing or rendering happens here. The engine captures `performance.now()`
 * for every spawn/hit and feeds the raw counts into `finalizeLevelResult`, which
 * is the single source of truth for the score, rank, and pass/fail decision.
 *
 * Scoring (kept simple and explainable):
 *   base       = hits * configured hit points
 *   comboBonus = maxCombo * configured combo bonus
 *   speedBonus = avg-hit derived (faster → more), 0 when no hits
 *   penalty    = configured miss + wrong-target penalties
 *   levelMul   = configured multiplier per level index
 *   score      = max(0, round((base + comboBonus + speedBonus - penalty) * levelMul))
 */

import { reactionBalancing } from "./reactionBalancing";
import { makeId } from "./reactionScoring";
import type {
  LevelChallengeRank,
  LevelChallengeRankId,
  LevelChallengeResult,
  LevelDef,
} from "./levelChallengeTypes";

export const TOTAL_LEVELS = reactionBalancing.levelChallenge.totalLevels;
export const LEVEL_COUNTDOWN_FROM = reactionBalancing.levelChallenge.countdownFrom;
export const LEVEL_COUNTDOWN_INTERVAL_MS = reactionBalancing.levelChallenge.countdownIntervalMs;
/** Pause between resolving one opportunity and spawning the next. */
export const NEXT_SPAWN_DELAY_MS = reactionBalancing.levelChallenge.nextSpawnDelayMs;
export const SIGNAL_MIN_WAIT_MS = reactionBalancing.levelChallenge.signalWaitMinMs;
export const SIGNAL_MAX_WAIT_MS = reactionBalancing.levelChallenge.signalWaitMaxMs;
/** Vertical band reserved at the top so targets never spawn under the controls. */
export const TOP_CONTROLS_RESERVE = reactionBalancing.levelChallenge.topControlsReserve;
export const EDGE_PADDING = reactionBalancing.levelChallenge.edgePadding;
/** Arena width under which targets/decoys grow for touch. */
export const MOBILE_WIDTH = reactionBalancing.levelChallenge.mobileWidth;
const MOBILE_SCALE = reactionBalancing.levelChallenge.mobileScale;

/** The six levels, in order. Tuned centrally in `reactionBalancing`. */
export const LEVELS: LevelDef[] = reactionBalancing.levelChallenge.levels.map((level) => ({ ...level })) as LevelDef[];

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
  const thresholds = reactionBalancing.levelChallenge.ranks;
  if (score >= thresholds.eliteScore && accuracy >= thresholds.eliteAccuracy) return RANKS.elite;
  if (score >= thresholds.sharpScore && accuracy >= thresholds.sharpAccuracy) return RANKS.sharp;
  if (score >= thresholds.solidScore) return RANKS.solid;
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

  const scoring = reactionBalancing.levelChallenge.scoring;
  const base = hits * scoring.hitPoints;
  const comboBonus = maxCombo * scoring.comboBonus;
  const speedBonus = averageHitMs !== null
    ? Math.max(0, Math.min(scoring.speedBonusCap, Math.round((scoring.speedBonusBaseMs - averageHitMs) / scoring.speedBonusDivisor)))
    : 0;
  const penalty = misses * scoring.missPenalty + wrongTargets * scoring.wrongTargetPenalty;
  const levelMul = 1 + def.index * scoring.levelMultiplierStep;
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
