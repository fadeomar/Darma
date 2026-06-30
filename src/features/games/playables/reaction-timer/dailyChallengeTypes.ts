import type { PrecisionResult } from "./precisionTypes";
import type { TargetHunterResult } from "./targetHunterTypes";
import type { RunSummary } from "./reactionTypes";

export type DailyChallengeType = "classic" | "precision" | "target-hunt";

export type DailyRankId = "elite" | "excellent" | "solid" | "warmup" | "retry";

export type DailyRank = {
  id: DailyRankId;
  label: string;
  glyph: string;
  note: string;
};

export type DailyChallengeDefinition = {
  id: string;
  dateKey: string;
  seed: number;
  type: DailyChallengeType;
  title: string;
  description: string;
  objective: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedDuration: string;
  shareLabel: string;
  targetAverageMs?: number;
  targetMs?: number;
  precisionThresholdMs?: number;
  huntDurationMs?: number;
  huntGoalScore?: number;
  huntGoalAccuracy?: number;
};

export type DailyChallengeResult = {
  id: string;
  dateKey: string;
  challengeId: string;
  challengeTitle: string;
  challengeType: DailyChallengeType;
  score: number;
  rankId: DailyRankId;
  objectivePassed: boolean;
  primaryMetric: string;
  secondaryMetric: string;
  detail: string;
  accuracy: number;
  improvedToday: boolean;
  createdAt: string;
  classic?: RunSummary;
  precision?: PrecisionResult;
  targetHunter?: TargetHunterResult;
};

export type DailyChallengeDayRecord = {
  dateKey: string;
  challengeId: string;
  challengeType: DailyChallengeType;
  attempts: number;
  completed: boolean;
  firstCompletedAt: string | null;
  bestCompletedAt: string | null;
  bestResult: DailyChallengeResult | null;
  latestResult: DailyChallengeResult | null;
};

export type LocalLeaderboardEntry = {
  id: string;
  mode: "daily" | "classic" | "precision" | "target-hunter" | "level-challenge";
  dateKey: string;
  score: number;
  primaryMetric: string;
  secondaryMetric: string;
  rankLabel: string;
  createdAt: string;
  displayName: string;
};

export type DailyChallengeStats = {
  dailyChallenges: Record<string, DailyChallengeDayRecord>;
  dailyStreak: number;
  longestDailyStreak: number;
  lastDailyCompletionDate: string | null;
  recentDailyResults: DailyChallengeResult[];
  localLeaderboards: LocalLeaderboardEntry[];
  weeklyActivity: string[];
  lastDailyPlayedAt: string | null;
};
