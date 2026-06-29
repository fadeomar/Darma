/**
 * Types for Target Hunter mode of Reaction Timer Pro (Sprint 6).
 *
 * Kept free of imports from the rest of the game so it can be referenced by
 * `reactionTypes` (storage + achievement context) without an import cycle.
 * Logic lives in `targetHunterScoring`; React/canvas state lives in the
 * `TargetHunterStage` engine; persistence in `reactionStorage`.
 */

export type TargetHunterPhase = "lobby" | "playing" | "result";

export type TargetHunterRankId = "elite" | "sharp" | "focused" | "warmup" | "rookie";

export type TargetHunterRank = {
  id: TargetHunterRankId;
  label: string;
  /** Friendly, non-medical coaching line shown with a result. */
  note: string;
  /** Emoji glyph paired with the text label (never colour-only). */
  glyph: string;
};

/** One spawned target while a run is active (canvas coordinates, CSS pixels). */
export type ActiveTarget = {
  x: number;
  y: number;
  /** Radius in CSS pixels. */
  r: number;
  /** performance.now() timestamp when the target became hittable. */
  shownAt: number;
};

/** Live HUD snapshot surfaced from the engine to the HTML overlay. */
export type TargetHunterHud = {
  /** Whole seconds remaining (0-30). */
  secondsLeft: number;
  hits: number;
  misses: number;
  /** 0-100; 0 when no attempts yet. */
  accuracy: number;
  /** Current consecutive-hit streak. */
  combo: number;
  /** Rolling average hit time in ms, or null before the first hit. */
  averageHitMs: number | null;
};

/** One completed Quick Hunt run. */
export type TargetHunterResult = {
  id: string;
  score: number;
  hits: number;
  misses: number;
  /** 0-100; 0 when no attempts. */
  accuracy: number;
  longestCombo: number;
  /** Average hit time in ms, or null when zero hits. */
  averageHitMs: number | null;
  /** Fastest single hit in ms, or null when zero hits. */
  bestHitMs: number | null;
  rankId: TargetHunterRankId;
  /** Run length in ms (always the configured duration for a completed run). */
  durationMs: number;
  /** True when the run was played with touch input (for the Mobile Hunter idea). */
  usedTouch: boolean;
  createdAt: string;
};

/**
 * Persisted Target Hunter stats. Nested inside `ReactionStorageV2.targetHunter`
 * so it migrates forward safely (normalize fills missing fields from defaults).
 */
export type TargetHunterStats = {
  targetHunterRuns: number;
  bestScore: number;
  /** Best accuracy across runs (0-100). */
  bestAccuracy: number;
  /** Lowest run-average hit time, or null. */
  bestAverageHitMs: number | null;
  /** Fastest single hit ever, or null. */
  bestSingleHitMs: number | null;
  longestCombo: number;
  totalHits: number;
  totalMisses: number;
  /** Last ~10 runs, newest first. */
  recentRuns: TargetHunterResult[];
  lastTargetHunterPlayedAt: string | null;
};
