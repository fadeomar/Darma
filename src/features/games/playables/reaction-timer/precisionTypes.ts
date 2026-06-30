/**
 * Types for the Precision Timer mode of Reaction Timer Pro.
 *
 * Kept free of imports from the rest of the game so it can be referenced by
 * `reactionTypes` (storage + achievement context) without creating an import
 * cycle. Logic lives in `precisionScoring` / `precisionMachine`; React state in
 * `useReactionGame`.
 */

export type PrecisionPhase = "lobby" | "countdown" | "running" | "result";

export type PrecisionRankId = "perfect" | "excellent" | "good" | "close" | "miss";

export type PrecisionRank = {
  id: PrecisionRankId;
  label: string;
  /** Friendly, non-medical coaching line shown with a result. */
  note: string;
  /** Emoji glyph paired with the text label (never color-only). */
  glyph: string;
};

/** One completed precision attempt. */
export type PrecisionResult = {
  id: string;
  /** Target the player aimed for, in ms (e.g. 5000). */
  targetMs: number;
  /** Measured elapsed time, in ms (performance.now based). */
  elapsedMs: number;
  /** Signed: positive = stopped late, negative = stopped early. */
  differenceMs: number;
  /** Absolute distance from target, in ms. */
  absDifferenceMs: number;
  rankId: PrecisionRankId;
  /** True when the player stopped before the target. */
  early: boolean;
  createdAt: string;
};

/**
 * Persisted Precision Timer stats. Nested inside `ReactionStorageV2.precision`
 * so it migrates forward safely (normalize fills missing fields from defaults).
 */
export type PrecisionStats = {
  /** Closest absolute difference ever achieved, in ms. */
  bestAbsDifferenceMs: number | null;
  /** Signed difference of that best attempt. */
  bestSignedDifferenceMs: number | null;
  /** Target of that best attempt, in ms. */
  bestTargetMs: number | null;
  /** Completed precision attempts (a "run" == one stop in v1). */
  precisionRuns: number;
  /** Total stop attempts, all-time (kept distinct from runs for future use). */
  precisionAttempts: number;
  /** Last ~10 precision results, newest first. */
  recentPrecisionResults: PrecisionResult[];
  /** targetMs (as string key) → best absolute difference for that target. */
  bestByTargetMs: Record<string, number>;
  lastPrecisionPlayedAt: string | null;
};
