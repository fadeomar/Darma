/**
 * Shared types for Reaction Timer Pro.
 *
 * Logic (machine, scoring, achievements, storage) is kept free of React so it
 * stays testable and the rendering components can be small and focused.
 */

import type { PrecisionResult, PrecisionStats } from "./precisionTypes";
import type { TargetHunterResult, TargetHunterStats } from "./targetHunterTypes";
import type { LevelChallengeResult, LevelChallengeStats } from "./levelChallengeTypes";
import type { DailyChallengeResult, DailyChallengeStats } from "./dailyChallengeTypes";
import type { LocalBattleResult, LocalBattleStats } from "./localBattleTypes";
import type { ShareActionKind, ShareResultMode } from "./reactionShareCard";

export type ReactionPhase =
  | "idle"
  | "countdown"
  | "waiting"
  | "signal"
  | "too-early"
  | "round-result"
  | "final-summary"
  | "paused";

export type GameMode = "classic" | "practice";

export type RankId = "elite" | "excellent" | "good" | "average" | "practice";

export type Rank = {
  id: RankId;
  label: string;
  /** Short, encouraging note shown with a result. */
  note: string;
  /** Emoji glyph used for the badge (paired with text, never color-only). */
  glyph: string;
};

/** A single recorded attempt within a run. */
export type ReactionAttempt = {
  /** 1-based valid-round index this attempt belongs to. */
  round: number;
  /** Reaction time in ms for a valid press, or null for an early press. */
  reactionMs: number | null;
  tooEarly: boolean;
  at: string;
};

/** A single valid reaction kept for the rolling last-attempts mini-chart. */
export type RecentAttempt = {
  ms: number;
  at: string;
};

/** Summary of one completed classic (or finished practice) run. */
export type RunSummary = {
  id: string;
  mode: GameMode;
  bestMs: number | null;
  averageMs: number | null;
  medianMs: number | null;
  worstMs: number | null;
  /** 0-100 friendly consistency score (100 = every round identical). */
  consistency: number;
  /** valid / (valid + early) as a 0-100 percentage. */
  accuracy: number;
  validRounds: number;
  earlyPresses: number;
  /** Ordered valid reaction times for this run (drives the rolling chart). */
  rounds: number[];
  createdAt: string;
};

/** Best/longest day streak, tracked across official + practice play. */
export type StreakInfo = {
  current: number;
  longest: number;
  /** Day (YYYY-MM-DD) of the most recent play, or null. */
  lastDay: string | null;
};

/** Per-rank tally of best-round results across official runs. */
export type RankCounts = Record<RankId, number>;

/**
 * Versioned persisted progress (localStorage, key `darma.game.reactionTimer.v2`).
 *
 * The version stays at 2: Sprint 4 only ADDS fields, and `normalize()` fills any
 * missing field from defaults (or derives it from older data), so existing v2
 * blobs load forward without a destructive migration.
 */
export type ReactionStorageV2 = {
  version: 2;
  bestMs: number | null;
  bestAverageMs: number | null;
  officialRuns: number;
  practiceRuns: number;
  /** valid + early presses, all-time. */
  totalAttempts: number;
  /** valid reactions, all-time (a.k.a. validAttempts). */
  totalValidRounds: number;
  totalEarlyPresses: number;
  /** Last ~20 valid reactions, oldest → newest. */
  recentAttempts: RecentAttempt[];
  /** Last 10 official run summaries, newest first. */
  lastResults: RunSummary[];
  achievements: string[];
  /** Achievement id → ISO timestamp it was first unlocked. */
  achievementsUnlockedAt: Record<string, string>;
  rankCounts: RankCounts;
  streak: StreakInfo;
  /** Distinct days played (YYYY-MM-DD), capped to the most recent ~60. */
  playDays: string[];
  firstPlayedAt: string | null;
  lastPlayedAt: string | null;
  /** Precision Timer mode stats (Sprint 5). Added without a version bump. */
  precision: PrecisionStats;
  /** Target Hunter mode stats (Sprint 6). Added without a version bump. */
  targetHunter: TargetHunterStats;
  /** Level Challenge mode stats (Sprint 7). Added without a version bump. */
  levelChallenge: LevelChallengeStats;
  /** Daily Challenge + local leaderboard stats (Sprint 8). Added without a version bump. */
  daily: DailyChallengeStats;
  /** Local Battle two-player stats (Sprint 9). Added without a version bump. */
  localBattle: LocalBattleStats;
  /** Shareable result card stats (Sprint 11). Added without a version bump. */
  share: ShareStats;
};

export type ShareStats = {
  shareCount: number;
  copyCount: number;
  downloadCount: number;
  nativeShareCount: number;
  lastSharedAt: string | null;
  lastDownloadedAt: string | null;
  lastSharedMode: ShareResultMode | null;
  sharedModes: ShareResultMode[];
  dailyShareCount: number;
  battleShareCount: number;
};

export type ShareActionResult = {
  action: ShareActionKind;
  mode: ShareResultMode;
  at: string;
};

export type AchievementRarity = "common" | "uncommon" | "rare" | "epic";

/** Everything an achievement rule may inspect, evaluated AFTER a merge. */
export type AchievementContext = {
  /** Persisted stats after the run/practice has been folded in. */
  stats: ReactionStorageV2;
  /** The run that just finished, or null for a practice-only evaluation. */
  latest: RunSummary | null;
  /** Personal best time BEFORE this run was merged. */
  previousBestMs: number | null;
  /** Personal best average BEFORE this run was merged. */
  previousBestAverageMs: number | null;
  /** The previous run's summary (before this one), or null. */
  previousRun: RunSummary | null;
  /**
   * The precision attempt that just finished, or null for a reaction-mode
   * evaluation. Precision achievements key off this; reaction achievements
   * ignore it (and vice-versa), so one shared engine serves both modes.
   */
  precision: PrecisionResult | null;
  /**
   * The Target Hunter run that just finished, or null for other evaluations.
   * Target Hunter achievements key off this; other achievements ignore it.
   */
  targetHunter: TargetHunterResult | null;
  /**
   * The Level Challenge attempt that just finished, or null for other
   * evaluations. Level Challenge achievements key off this; others ignore it.
   */
  levelChallenge: LevelChallengeResult | null;
  /** The Daily Challenge result that just finished, or null for other evaluations. */
  dailyChallenge: DailyChallengeResult | null;
  /** The Local Battle result that just finished, or null for other evaluations. */
  localBattle: LocalBattleResult | null;
  /** The share/download/copy action that just succeeded, or null for other evaluations. */
  shareAction: ShareActionResult | null;
};

export type Achievement = {
  id: string;
  glyph: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  isUnlocked: (ctx: AchievementContext) => boolean;
  /** Optional progress for progress-style cards (e.g. "3 / 5 runs"). */
  progress?: (stats: ReactionStorageV2) => { current: number; target: number };
};

/** Derived analysis of a finished run, used by the final summary. */
export type RunAnalysis = {
  best: number | null;
  average: number | null;
  median: number | null;
  worst: number | null;
  accuracy: number;
  earlyPresses: number;
  consistency: number;
  rank: Rank;
  cleanRun: boolean;
  personalBest: boolean;
  personalBestAverage: boolean;
  /** ms shaved off the previous best (positive = faster). null if no prior best. */
  improvementVsBestMs: number | null;
  /** ms improvement vs the previous run's average (positive = faster). */
  improvementVsAverageMs: number | null;
};
