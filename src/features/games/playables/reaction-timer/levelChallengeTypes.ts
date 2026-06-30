/**
 * Types for Level Challenge mode of Reaction Timer Pro (Sprint 7).
 *
 * Kept free of imports from the rest of the game so it can be referenced by
 * `reactionTypes` (storage + achievement context) without an import cycle.
 * Level definitions + scoring live in `levelChallengeScoring`; canvas/React
 * state in `LevelChallengeStage` / `LevelChallengeView`; persistence in
 * `reactionStorage`.
 */

export type LevelMechanic = "signal" | "fade" | "shrink" | "move" | "decoy" | "elite";

export type LevelChallengeRankId = "elite" | "sharp" | "solid" | "warmup" | "fail";

export type LevelChallengeRank = {
  id: LevelChallengeRankId;
  label: string;
  note: string;
  glyph: string;
};

/** Static description of one of the six levels. */
export type LevelDef = {
  /** 0-based position used for the score multiplier. */
  index: number;
  /** 1-based level number shown to the player. */
  level: number;
  id: string;
  title: string;
  mechanic: LevelMechanic;
  /** One-line objective shown on the intro + lobby card. */
  objective: string;
  /** Short coaching tip. */
  tip: string;

  // --- Target-engine params (ignored by the signal level) ---
  /** Number of target opportunities / decoy rounds. */
  opportunities: number;
  /** Hits required to pass. */
  requiredHits: number;
  /** Decoy levels only: max wrong-target hits still allowed to pass. */
  maxWrong?: number;
  /** Time a target stays hittable before it expires (counts as a miss), in ms. */
  targetLifetimeMs: number;
  /** Base target radius (desktop, CSS px). */
  baseRadius: number;
  /** Fade the target out over its lifetime. */
  fade?: boolean;
  /** Shrink from `baseRadius` to `shrinkToRadius` over the lifetime. */
  shrink?: boolean;
  shrinkToRadius?: number;
  /** Target drifts with this speed (CSS px per second). */
  moveSpeed?: number;
  /** Number of decoy targets shown alongside the correct one. */
  decoys?: number;

  // --- Signal-engine params (level 1 only) ---
  signalAttempts?: number;
  /** Pass if average reaction is under this (ms)… */
  signalPassAvgMs?: number;
  /** …OR at least this many valid reactions land. */
  signalMinValid?: number;
};

/** Live HUD snapshot surfaced from the engine to the HTML overlay. */
export type LevelChallengeHud = {
  level: number;
  /** Opportunities (or attempts) remaining. */
  left: number;
  total: number;
  hits: number;
  misses: number;
  wrongTargets: number;
  /** 0-100; 0 before any attempt. */
  accuracy: number;
  combo: number;
  /** Hits required to pass (goal progress = hits / required). */
  required: number;
};

/** One completed level attempt. */
export type LevelChallengeResult = {
  id: string;
  level: number;
  levelIndex: number;
  mechanic: LevelMechanic;
  passed: boolean;
  score: number;
  hits: number;
  misses: number;
  wrongTargets: number;
  accuracy: number;
  averageHitMs: number | null;
  bestHitMs: number | null;
  maxCombo: number;
  /** Early presses (signal level) — also used for "Perfect Start". */
  earlyPresses: number;
  opportunities: number;
  requiredHits: number;
  /** True when this pass followed a failure of the same level in the session. */
  comebackClear: boolean;
  createdAt: string;
};

/**
 * Persisted Level Challenge stats. Nested inside
 * `ReactionStorageV2.levelChallenge` so it migrates forward safely (normalize
 * fills missing fields from defaults).
 */
export type LevelChallengeStats = {
  levelChallengeRuns: number;
  /** Highest level the player may start (1-6). Level 1 unlocked by default. */
  unlockedLevel: number;
  /** Highest level number ever passed (0 if none). */
  bestLevelReached: number;
  /** Distinct level numbers passed at least once. */
  completedLevels: number[];
  /** Best single-level score achieved. */
  bestLevelChallengeScore: number;
  /** level (string key) → best score for that level. */
  bestLevelScoresByLevel: Record<string, number>;
  /** level (string key) → attempts. */
  levelAttemptsByLevel: Record<string, number>;
  /** level (string key) → passes. */
  levelPassesByLevel: Record<string, number>;
  /** Last ~10 level results, newest first. */
  recentLevelChallengeRuns: LevelChallengeResult[];
  lastLevelChallengePlayedAt: string | null;
  /** ISO timestamp when all six levels were first completed, or null. */
  allLevelsCompletedAt: string | null;
};
