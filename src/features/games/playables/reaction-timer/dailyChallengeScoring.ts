import { clampScore, reactionBalancing } from "./reactionBalancing";
import { evaluatePrecision, formatSeconds, formatSignedMs, getPrecisionRank } from "./precisionScoring";
import { formatScore as formatTargetScore } from "./targetHunterScoring";
import { CLASSIC_ROUNDS, consistencyScore, getRank, makeId, median, dayKey } from "./reactionScoring";
import type { RunSummary } from "./reactionTypes";
import type { TargetHunterResult } from "./targetHunterTypes";
import type {
  DailyChallengeDefinition,
  DailyChallengeResult,
  DailyChallengeType,
  DailyRank,
  DailyRankId,
} from "./dailyChallengeTypes";

const DAILY_RANKS: Record<DailyRankId, DailyRank> = {
  elite: { id: "elite", label: "Elite Daily", glyph: "💎", note: "A top-tier daily result." },
  excellent: { id: "excellent", label: "Excellent", glyph: "🚀", note: "Strong focus today." },
  solid: { id: "solid", label: "Solid", glyph: "⚡", note: "A reliable daily run." },
  warmup: { id: "warmup", label: "Warm-up", glyph: "🙂", note: "Good start — replay to improve." },
  retry: { id: "retry", label: "Try Again", glyph: "🌱", note: "Reset and take another shot." },
};


export function getDailyRank(score: number): DailyRank {
  const thresholds = reactionBalancing.daily.rankThresholds;
  if (score >= thresholds.eliteScore) return DAILY_RANKS.elite;
  if (score >= thresholds.excellentScore) return DAILY_RANKS.excellent;
  if (score >= thresholds.solidScore) return DAILY_RANKS.solid;
  if (score >= thresholds.warmupScore) return DAILY_RANKS.warmup;
  return DAILY_RANKS.retry;
}

function hashDateKey(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) / 4294967296);
  };
}

export function todayDateKey(now: Date = new Date()): string {
  return dayKey(now.toISOString());
}

export function getDailyChallenge(dateKey: string = todayDateKey()): DailyChallengeDefinition {
  const seed = hashDateKey(dateKey);
  const rand = seeded(seed);
  const types: DailyChallengeType[] = ["classic", "precision", "target-hunt"];
  const type = types[Math.floor(rand() * types.length)] ?? "classic";
  const difficultyRoll = rand();
  const difficulty: DailyChallengeDefinition["difficulty"] = difficultyRoll > 0.72 ? "hard" : difficultyRoll > 0.38 ? "medium" : "easy";

  if (type === "precision") {
    const precision = reactionBalancing.daily.precision;
    const targetMs = precision.targetMinMs + Math.round((rand() * (precision.targetMaxMs - precision.targetMinMs)) / precision.targetStepMs) * precision.targetStepMs;
    const threshold = precision.thresholdsByDifficulty[difficulty];
    return {
      id: `daily-${dateKey}-precision`,
      dateKey,
      seed,
      type,
      title: "Precision Pulse",
      description: "Stop the timer as close as possible to today’s target.",
      objective: `Stop within ${threshold}ms of ${formatSeconds(targetMs)}.`,
      targetMs,
      precisionThresholdMs: threshold,
      difficulty,
      estimatedDuration: "1 min",
      shareLabel: "Precision Pulse",
    };
  }

  if (type === "target-hunt") {
    const hunt = reactionBalancing.daily.targetHunt;
    const duration = hunt.durationByDifficultyMs[difficulty];
    const goalScore = hunt.scoreGoalByDifficulty[difficulty];
    const goalAccuracy = hunt.accuracyGoalByDifficulty[difficulty];
    return {
      id: `daily-${dateKey}-hunt`,
      dateKey,
      seed,
      type,
      title: "Target Rush",
      description: "Hit today’s targets quickly while keeping your accuracy steady.",
      objective: `Score ${goalScore}+ with at least ${goalAccuracy}% accuracy.`,
      huntDurationMs: duration,
      huntGoalScore: goalScore,
      huntGoalAccuracy: goalAccuracy,
      difficulty,
      estimatedDuration: `${Math.round(duration / 1000)} sec`,
      shareLabel: "Target Rush",
    };
  }

  const targetAverage = reactionBalancing.daily.classic.targetAverageByDifficultyMs[difficulty];
  return {
    id: `daily-${dateKey}-classic`,
    dateKey,
    seed,
    type: "classic",
    title: "Classic Focus",
    description: "Complete five classic reaction rounds and beat today’s target average.",
    objective: `Finish with an average under ${targetAverage}ms.`,
    targetAverageMs: targetAverage,
    difficulty,
    estimatedDuration: "2 min",
    shareLabel: "Classic Focus",
  };
}

export function summarizeDailyClassic(times: number[], earlyPresses: number[]): RunSummary {
  const createdAt = new Date().toISOString();
  const rounds = times.slice(0, CLASSIC_ROUNDS);
  const total = rounds.length + earlyPresses.length;
  return {
    id: makeId(),
    mode: "classic",
    bestMs: rounds.length ? Math.min(...rounds) : null,
    averageMs: rounds.length ? Math.round(rounds.reduce((s, t) => s + t, 0) / rounds.length) : null,
    medianMs: median(rounds),
    worstMs: rounds.length ? Math.max(...rounds) : null,
    consistency: consistencyScore(rounds),
    accuracy: total > 0 ? Math.round((rounds.length / total) * 100) : 0,
    validRounds: rounds.length,
    earlyPresses: earlyPresses.length,
    rounds,
    createdAt,
  };
}

export function buildDailyClassicResult(def: DailyChallengeDefinition, run: RunSummary): DailyChallengeResult {
  const target = def.targetAverageMs ?? 350;
  const avg = run.averageMs ?? 999;
  const speedScore = Math.max(0, 720 - Math.max(0, avg - target) * 3 + Math.max(0, target - avg) * 2);
  const cleanBonus = run.earlyPresses === 0 ? 120 : Math.max(0, 80 - run.earlyPresses * 35);
  const accuracyBonus = run.accuracy * 1.4;
  const score = clampScore(speedScore + cleanBonus + accuracyBonus);
  const rank = getDailyRank(score);
  const reactionRank = getRank(run.bestMs);
  return {
    id: makeId(),
    dateKey: def.dateKey,
    challengeId: def.id,
    challengeTitle: def.title,
    challengeType: "classic",
    score,
    rankId: rank.id,
    objectivePassed: run.averageMs !== null && run.averageMs <= target,
    primaryMetric: run.averageMs !== null ? `${run.averageMs}ms avg` : "No valid average",
    secondaryMetric: `Best ${run.bestMs ?? "—"}ms · ${run.accuracy}% accuracy`,
    detail: `${reactionRank.label} best round · ${run.earlyPresses} early press${run.earlyPresses === 1 ? "" : "es"}`,
    accuracy: run.accuracy,
    improvedToday: false,
    createdAt: run.createdAt,
    classic: run,
  };
}

export function buildDailyPrecisionResult(def: DailyChallengeDefinition, elapsedMs: number): DailyChallengeResult {
  const target = def.targetMs ?? 5000;
  const result = evaluatePrecision(target, elapsedMs);
  const threshold = def.precisionThresholdMs ?? 120;
  const base = 1000 - result.absDifferenceMs * 4;
  const thresholdBonus = result.absDifferenceMs <= threshold ? 120 : 0;
  const score = clampScore(base + thresholdBonus);
  const rank = getDailyRank(score);
  const precisionRank = getPrecisionRank(result.absDifferenceMs);
  return {
    id: makeId(),
    dateKey: def.dateKey,
    challengeId: def.id,
    challengeTitle: def.title,
    challengeType: "precision",
    score,
    rankId: rank.id,
    objectivePassed: result.absDifferenceMs <= threshold,
    primaryMetric: formatSignedMs(result.differenceMs),
    secondaryMetric: `Target ${formatSeconds(target)} · Stop ${formatSeconds(result.elapsedMs)}`,
    detail: `${precisionRank.label} precision · threshold ±${threshold}ms`,
    accuracy: result.absDifferenceMs <= 20 ? 100 : Math.max(0, Math.round(100 - (result.absDifferenceMs / Math.max(threshold, 1)) * 45)),
    improvedToday: false,
    createdAt: result.createdAt,
    precision: result,
  };
}

export function buildDailyTargetHuntResult(def: DailyChallengeDefinition, run: TargetHunterResult): DailyChallengeResult {
  const goalScore = def.huntGoalScore ?? 1000;
  const goalAccuracy = def.huntGoalAccuracy ?? 65;
  const score = clampScore((run.score / Math.max(goalScore, 1)) * 680 + run.accuracy * 2.2 + run.longestCombo * 8);
  const rank = getDailyRank(score);
  return {
    id: makeId(),
    dateKey: def.dateKey,
    challengeId: def.id,
    challengeTitle: def.title,
    challengeType: "target-hunt",
    score,
    rankId: rank.id,
    objectivePassed: run.score >= goalScore && run.accuracy >= goalAccuracy,
    primaryMetric: `${formatTargetScore(run.score)} pts`,
    secondaryMetric: `${run.accuracy}% accuracy · combo ${run.longestCombo}`,
    detail: `${run.hits} hits · ${run.misses} misses · avg ${run.averageHitMs ?? "—"}ms`,
    accuracy: run.accuracy,
    improvedToday: false,
    createdAt: run.createdAt,
    targetHunter: run,
  };
}

export function buildDailyShareText(result: DailyChallengeResult, streak: number): string {
  const rank = getDailyRank(result.score).label;
  return `I scored ${result.score} on today’s Darma Reaction Timer Pro Daily Challenge — ${result.challengeTitle}. Rank: ${rank}. Streak: ${streak} day${streak === 1 ? "" : "s"}. Can you beat it?`;
}

export function formatDailyType(type: DailyChallengeType): string {
  if (type === "target-hunt") return "Target Hunt Daily";
  if (type === "precision") return "Precision Daily";
  return "Classic Daily";
}
