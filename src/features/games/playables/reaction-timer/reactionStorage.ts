/**
 * Versioned localStorage for Reaction Timer Pro.
 *
 * Key: `darma.game.reactionTimer.v2`. Official (classic) runs and practice
 * sessions both update lifetime stats; only classic runs are kept in the run
 * history. A light migration seeds the best time from the v1 prototype key.
 *
 * Sprint 4 ADDS fields (practice/attempt/streak/rank/day tracking and
 * achievement timestamps) without bumping the version: `normalize()` fills every
 * new field from defaults or derives it from older data, so any existing v2 blob
 * loads forward without data loss.
 */

import { evaluateAchievements } from "./reactionAchievements";
import { dayKey, isNextDay } from "./reactionScoring";
import { getRank } from "./reactionScoring";
import { getPrecisionRank } from "./precisionScoring";
import { getTargetHunterRank } from "./targetHunterScoring";
import { TOTAL_LEVELS } from "./levelChallengeScoring";
import type { PrecisionResult, PrecisionStats } from "./precisionTypes";
import type { TargetHunterResult, TargetHunterStats } from "./targetHunterTypes";
import type { LevelChallengeResult, LevelChallengeStats } from "./levelChallengeTypes";
import type {
  AchievementContext,
  RankCounts,
  ReactionStorageV2,
  RecentAttempt,
  RunSummary,
  StreakInfo,
} from "./reactionTypes";

export const STORAGE_KEY = "darma.game.reactionTimer.v2";
const LEGACY_KEY = "darma:game:reaction-challenge:v1";
const RESULT_LIMIT = 10;
const RECENT_ATTEMPTS_LIMIT = 20;
const PLAY_DAYS_LIMIT = 60;
const PRECISION_RESULTS_LIMIT = 10;
const TARGET_HUNTER_RUNS_LIMIT = 10;
const LEVEL_CHALLENGE_RUNS_LIMIT = 12;

function emptyRankCounts(): RankCounts {
  return { elite: 0, excellent: 0, good: 0, average: 0, practice: 0 };
}

function emptyStreak(): StreakInfo {
  return { current: 0, longest: 0, lastDay: null };
}

function emptyPrecision(): PrecisionStats {
  return {
    bestAbsDifferenceMs: null,
    bestSignedDifferenceMs: null,
    bestTargetMs: null,
    precisionRuns: 0,
    precisionAttempts: 0,
    recentPrecisionResults: [],
    bestByTargetMs: {},
    lastPrecisionPlayedAt: null,
  };
}

function emptyTargetHunter(): TargetHunterStats {
  return {
    targetHunterRuns: 0,
    bestScore: 0,
    bestAccuracy: 0,
    bestAverageHitMs: null,
    bestSingleHitMs: null,
    longestCombo: 0,
    totalHits: 0,
    totalMisses: 0,
    recentRuns: [],
    lastTargetHunterPlayedAt: null,
  };
}

function emptyLevelChallenge(): LevelChallengeStats {
  return {
    levelChallengeRuns: 0,
    unlockedLevel: 1,
    bestLevelReached: 0,
    completedLevels: [],
    bestLevelChallengeScore: 0,
    bestLevelScoresByLevel: {},
    levelAttemptsByLevel: {},
    levelPassesByLevel: {},
    recentLevelChallengeRuns: [],
    lastLevelChallengePlayedAt: null,
    allLevelsCompletedAt: null,
  };
}

export const EMPTY_STORAGE: ReactionStorageV2 = {
  version: 2,
  bestMs: null,
  bestAverageMs: null,
  officialRuns: 0,
  practiceRuns: 0,
  totalAttempts: 0,
  totalValidRounds: 0,
  totalEarlyPresses: 0,
  recentAttempts: [],
  lastResults: [],
  achievements: [],
  achievementsUnlockedAt: {},
  rankCounts: emptyRankCounts(),
  streak: emptyStreak(),
  playDays: [],
  firstPlayedAt: null,
  lastPlayedAt: null,
  precision: emptyPrecision(),
  targetHunter: emptyTargetHunter(),
  levelChallenge: emptyLevelChallenge(),
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function intOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function clampPct(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function normalizeResult(value: unknown): RunSummary | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<RunSummary>;
  return {
    id: typeof r.id === "string" && r.id ? r.id : `${Date.now()}-${Math.random()}`,
    mode: r.mode === "practice" ? "practice" : "classic",
    bestMs: num(r.bestMs),
    averageMs: num(r.averageMs),
    medianMs: num(r.medianMs),
    worstMs: num(r.worstMs),
    consistency: clampPct(r.consistency),
    accuracy: clampPct(r.accuracy),
    validRounds: intOrZero(r.validRounds),
    earlyPresses: intOrZero(r.earlyPresses),
    rounds: Array.isArray(r.rounds)
      ? r.rounds.filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0)
      : [],
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}

function normalizeRankCounts(value: unknown): RankCounts {
  const base = emptyRankCounts();
  if (!value || typeof value !== "object") return base;
  const v = value as Partial<RankCounts>;
  (Object.keys(base) as (keyof RankCounts)[]).forEach((key) => {
    base[key] = intOrZero(v[key]);
  });
  return base;
}

function normalizeStreak(value: unknown): StreakInfo {
  if (!value || typeof value !== "object") return emptyStreak();
  const v = value as Partial<StreakInfo>;
  return {
    current: intOrZero(v.current),
    longest: intOrZero(v.longest),
    lastDay: strOrNull(v.lastDay),
  };
}

function normalizePrecisionResult(value: unknown): PrecisionResult | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<PrecisionResult>;
  const targetMs = num(r.targetMs);
  if (targetMs === null) return null;
  const elapsedMs =
    typeof r.elapsedMs === "number" && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0
      ? Math.round(r.elapsedMs)
      : 0;
  const differenceMs =
    typeof r.differenceMs === "number" && Number.isFinite(r.differenceMs)
      ? Math.round(r.differenceMs)
      : elapsedMs - targetMs;
  const absDifferenceMs = Math.abs(differenceMs);
  return {
    id: typeof r.id === "string" && r.id ? r.id : `${Date.now()}-${Math.random()}`,
    targetMs,
    elapsedMs,
    differenceMs,
    absDifferenceMs,
    rankId: getPrecisionRank(absDifferenceMs).id,
    early: differenceMs < 0,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}

function normalizePrecision(value: unknown): PrecisionStats {
  if (!value || typeof value !== "object") return emptyPrecision();
  const v = value as Partial<PrecisionStats>;

  const recentPrecisionResults = Array.isArray(v.recentPrecisionResults)
    ? v.recentPrecisionResults
        .map(normalizePrecisionResult)
        .filter((r): r is PrecisionResult => Boolean(r))
        .slice(0, PRECISION_RESULTS_LIMIT)
    : [];

  const bestByTargetMs: Record<string, number> = {};
  if (v.bestByTargetMs && typeof v.bestByTargetMs === "object") {
    for (const [key, diff] of Object.entries(v.bestByTargetMs)) {
      const n = num(diff);
      // 0ms (a perfect stop) is a valid best, so accept >= 0 here.
      const value0 = typeof diff === "number" && Number.isFinite(diff) && diff >= 0 ? Math.round(diff) : n;
      if (value0 !== null && /^\d+$/.test(key)) bestByTargetMs[key] = value0;
    }
  }

  const bestAbs =
    typeof v.bestAbsDifferenceMs === "number" && Number.isFinite(v.bestAbsDifferenceMs) && v.bestAbsDifferenceMs >= 0
      ? Math.round(v.bestAbsDifferenceMs)
      : null;
  const bestSigned =
    typeof v.bestSignedDifferenceMs === "number" && Number.isFinite(v.bestSignedDifferenceMs)
      ? Math.round(v.bestSignedDifferenceMs)
      : null;

  return {
    bestAbsDifferenceMs: bestAbs,
    bestSignedDifferenceMs: bestSigned,
    bestTargetMs: num(v.bestTargetMs),
    precisionRuns: intOrZero(v.precisionRuns),
    precisionAttempts: intOrZero(v.precisionAttempts),
    recentPrecisionResults,
    bestByTargetMs,
    lastPrecisionPlayedAt: strOrNull(v.lastPrecisionPlayedAt),
  };
}

function normalizeTargetHunterResult(value: unknown): TargetHunterResult | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<TargetHunterResult>;
  const hits = intOrZero(r.hits);
  const misses = intOrZero(r.misses);
  const attempts = hits + misses;
  const accuracy =
    typeof r.accuracy === "number" && Number.isFinite(r.accuracy)
      ? clampPct(r.accuracy)
      : attempts > 0
        ? Math.round((hits / attempts) * 100)
        : 0;
  const averageHitMs = num(r.averageHitMs);
  return {
    id: typeof r.id === "string" && r.id ? r.id : `${Date.now()}-${Math.random()}`,
    score: intOrZero(r.score),
    hits,
    misses,
    accuracy,
    longestCombo: intOrZero(r.longestCombo),
    averageHitMs,
    bestHitMs: num(r.bestHitMs),
    rankId: getTargetHunterRank(intOrZero(r.score), accuracy, averageHitMs).id,
    durationMs: intOrZero(r.durationMs),
    usedTouch: r.usedTouch === true,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}

function normalizeTargetHunter(value: unknown): TargetHunterStats {
  if (!value || typeof value !== "object") return emptyTargetHunter();
  const v = value as Partial<TargetHunterStats>;
  const recentRuns = Array.isArray(v.recentRuns)
    ? v.recentRuns
        .map(normalizeTargetHunterResult)
        .filter((r): r is TargetHunterResult => Boolean(r))
        .slice(0, TARGET_HUNTER_RUNS_LIMIT)
    : [];
  return {
    targetHunterRuns: intOrZero(v.targetHunterRuns),
    bestScore: intOrZero(v.bestScore),
    bestAccuracy: clampPct(v.bestAccuracy),
    bestAverageHitMs: num(v.bestAverageHitMs),
    bestSingleHitMs: num(v.bestSingleHitMs),
    longestCombo: intOrZero(v.longestCombo),
    totalHits: intOrZero(v.totalHits),
    totalMisses: intOrZero(v.totalMisses),
    recentRuns,
    lastTargetHunterPlayedAt: strOrNull(v.lastTargetHunterPlayedAt),
  };
}

/** A `Record<levelKey, number>` keyed by "1".."6", values coerced to ints >= 0. */
function normalizeLevelNumberMap(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (value && typeof value === "object") {
    for (const [key, raw] of Object.entries(value)) {
      if (!/^[1-6]$/.test(key)) continue;
      const n = typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
      out[key] = n;
    }
  }
  return out;
}

function normalizeLevelResult(value: unknown): LevelChallengeResult | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<LevelChallengeResult>;
  const level = typeof r.level === "number" && r.level >= 1 && r.level <= TOTAL_LEVELS ? Math.floor(r.level) : null;
  if (level === null) return null;
  return {
    id: typeof r.id === "string" && r.id ? r.id : `${Date.now()}-${Math.random()}`,
    level,
    levelIndex: level - 1,
    mechanic:
      r.mechanic === "fade" ||
      r.mechanic === "shrink" ||
      r.mechanic === "move" ||
      r.mechanic === "decoy" ||
      r.mechanic === "elite"
        ? r.mechanic
        : "signal",
    passed: r.passed === true,
    score: intOrZero(r.score),
    hits: intOrZero(r.hits),
    misses: intOrZero(r.misses),
    wrongTargets: intOrZero(r.wrongTargets),
    accuracy: clampPct(r.accuracy),
    averageHitMs: num(r.averageHitMs),
    bestHitMs: num(r.bestHitMs),
    maxCombo: intOrZero(r.maxCombo),
    earlyPresses: intOrZero(r.earlyPresses),
    opportunities: intOrZero(r.opportunities),
    requiredHits: intOrZero(r.requiredHits),
    comebackClear: r.comebackClear === true,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}

function normalizeLevelChallenge(value: unknown): LevelChallengeStats {
  if (!value || typeof value !== "object") return emptyLevelChallenge();
  const v = value as Partial<LevelChallengeStats>;

  const completedLevels = Array.isArray(v.completedLevels)
    ? Array.from(
        new Set(
          v.completedLevels.filter(
            (n): n is number => typeof n === "number" && n >= 1 && n <= TOTAL_LEVELS,
          ),
        ),
      ).sort((a, b) => a - b)
    : [];

  const recentLevelChallengeRuns = Array.isArray(v.recentLevelChallengeRuns)
    ? v.recentLevelChallengeRuns
        .map(normalizeLevelResult)
        .filter((r): r is LevelChallengeResult => Boolean(r))
        .slice(0, LEVEL_CHALLENGE_RUNS_LIMIT)
    : [];

  // Unlocked level is at least 1, and at least one past the highest completed.
  const highestCompleted = completedLevels.length ? Math.max(...completedLevels) : 0;
  const storedUnlocked = intOrZero(v.unlockedLevel);
  const unlockedLevel = Math.min(
    TOTAL_LEVELS,
    Math.max(1, storedUnlocked, Math.min(TOTAL_LEVELS, highestCompleted + 1)),
  );

  return {
    levelChallengeRuns: intOrZero(v.levelChallengeRuns),
    unlockedLevel,
    bestLevelReached: Math.min(TOTAL_LEVELS, Math.max(intOrZero(v.bestLevelReached), highestCompleted)),
    completedLevels,
    bestLevelChallengeScore: intOrZero(v.bestLevelChallengeScore),
    bestLevelScoresByLevel: normalizeLevelNumberMap(v.bestLevelScoresByLevel),
    levelAttemptsByLevel: normalizeLevelNumberMap(v.levelAttemptsByLevel),
    levelPassesByLevel: normalizeLevelNumberMap(v.levelPassesByLevel),
    recentLevelChallengeRuns,
    lastLevelChallengePlayedAt: strOrNull(v.lastLevelChallengePlayedAt),
    allLevelsCompletedAt: strOrNull(v.allLevelsCompletedAt),
  };
}

export function normalize(value: unknown): ReactionStorageV2 {
  if (!value || typeof value !== "object") return { ...EMPTY_STORAGE };
  const v = value as Partial<ReactionStorageV2>;

  const lastResults = Array.isArray(v.lastResults)
    ? v.lastResults.map(normalizeResult).filter((r): r is RunSummary => Boolean(r)).slice(0, RESULT_LIMIT)
    : [];

  const totalValidRounds = intOrZero(v.totalValidRounds);
  const totalEarlyPresses = intOrZero(v.totalEarlyPresses);
  const lastPlayedAt = strOrNull(v.lastPlayedAt);

  const recentAttempts = Array.isArray(v.recentAttempts)
    ? v.recentAttempts
        .map((a): RecentAttempt | null => {
          if (!a || typeof a !== "object") return null;
          const ms = num((a as RecentAttempt).ms);
          if (ms === null) return null;
          return { ms, at: strOrNull((a as RecentAttempt).at) ?? new Date().toISOString() };
        })
        .filter((a): a is RecentAttempt => Boolean(a))
        .slice(-RECENT_ATTEMPTS_LIMIT)
    : [];

  const achievements = Array.isArray(v.achievements)
    ? v.achievements.filter((a): a is string => typeof a === "string")
    : [];

  const achievementsUnlockedAt: Record<string, string> = {};
  if (v.achievementsUnlockedAt && typeof v.achievementsUnlockedAt === "object") {
    for (const [id, at] of Object.entries(v.achievementsUnlockedAt)) {
      if (typeof at === "string" && at) achievementsUnlockedAt[id] = at;
    }
  }

  const playDays = Array.isArray(v.playDays)
    ? Array.from(new Set(v.playDays.filter((d): d is string => typeof d === "string" && Boolean(d)))).slice(-PLAY_DAYS_LIMIT)
    : [];

  return {
    version: 2,
    bestMs: num(v.bestMs),
    bestAverageMs: num(v.bestAverageMs),
    officialRuns: intOrZero(v.officialRuns),
    practiceRuns: intOrZero(v.practiceRuns),
    // Derive a sensible all-time attempt count for blobs written before Sprint 4.
    totalAttempts:
      v.totalAttempts !== undefined ? intOrZero(v.totalAttempts) : totalValidRounds + totalEarlyPresses,
    totalValidRounds,
    totalEarlyPresses,
    recentAttempts,
    lastResults,
    achievements,
    achievementsUnlockedAt,
    rankCounts: normalizeRankCounts(v.rankCounts),
    streak: normalizeStreak(v.streak),
    playDays,
    firstPlayedAt: strOrNull(v.firstPlayedAt) ?? lastPlayedAt,
    lastPlayedAt,
    precision: normalizePrecision(v.precision),
    targetHunter: normalizeTargetHunter(v.targetHunter),
    levelChallenge: normalizeLevelChallenge(v.levelChallenge),
  };
}

function migrateLegacy(): ReactionStorageV2 | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const legacy = JSON.parse(raw) as { bestMs?: unknown; averageMs?: unknown; gamesPlayed?: unknown };
    const bestMs = num(legacy.bestMs);
    if (bestMs === null) return null;
    return {
      ...EMPTY_STORAGE,
      bestMs,
      bestAverageMs: num(legacy.averageMs),
      officialRuns: intOrZero(legacy.gamesPlayed),
    };
  } catch {
    return null;
  }
}

export function readStorage(): ReactionStorageV2 {
  if (!canUseStorage()) return { ...EMPTY_STORAGE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
    const migrated = migrateLegacy();
    if (migrated) {
      writeStorage(migrated);
      return migrated;
    }
    return { ...EMPTY_STORAGE };
  } catch {
    return { ...EMPTY_STORAGE };
  }
}

export function writeStorage(stats: ReactionStorageV2): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Game stays playable even when storage is blocked or full.
  }
}

function pickMin(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

/** Fold a played day into streak + distinct-day tracking. */
function applyDay(streak: StreakInfo, playDays: string[], at: string): { streak: StreakInfo; playDays: string[] } {
  const day = dayKey(at);
  if (!day) return { streak, playDays };

  const nextDays = playDays.includes(day) ? playDays : [...playDays, day].slice(-PLAY_DAYS_LIMIT);

  let nextStreak: StreakInfo;
  if (streak.lastDay === day) {
    nextStreak = streak; // already counted today
  } else if (streak.lastDay && isNextDay(streak.lastDay, day)) {
    const current = streak.current + 1;
    nextStreak = { current, longest: Math.max(streak.longest, current), lastDay: day };
  } else {
    nextStreak = { current: 1, longest: Math.max(streak.longest, 1), lastDay: day };
  }

  return { streak: nextStreak, playDays: nextDays };
}

/** Re-evaluate achievements and stamp unlock timestamps for newly-unlocked ids. */
function applyAchievements(next: ReactionStorageV2, ctx: AchievementContext, at: string): ReactionStorageV2 {
  const before = new Set(next.achievements);
  const unlocked = evaluateAchievements(ctx);
  const unlockedAt = { ...next.achievementsUnlockedAt };
  for (const id of unlocked) {
    if (!before.has(id) && !unlockedAt[id]) unlockedAt[id] = at;
  }
  return { ...next, achievements: unlocked, achievementsUnlockedAt: unlockedAt };
}

/** Fold a finished classic run into persisted stats and unlock achievements. */
export function mergeRun(current: ReactionStorageV2, run: RunSummary): ReactionStorageV2 {
  const previousBestMs = current.bestMs;
  const previousBestAverageMs = current.bestAverageMs;
  const previousRun = current.lastResults[0] ?? null;

  const rankCounts = { ...current.rankCounts };
  const rankId = getRank(run.bestMs).id;
  rankCounts[rankId] = (rankCounts[rankId] ?? 0) + 1;

  const recentAttempts = [
    ...current.recentAttempts,
    ...run.rounds.map((ms) => ({ ms, at: run.createdAt })),
  ].slice(-RECENT_ATTEMPTS_LIMIT);

  const { streak, playDays } = applyDay(current.streak, current.playDays, run.createdAt);

  let next: ReactionStorageV2 = {
    ...current,
    bestMs: pickMin(current.bestMs, run.bestMs),
    bestAverageMs: pickMin(current.bestAverageMs, run.averageMs),
    officialRuns: current.officialRuns + 1,
    totalAttempts: current.totalAttempts + run.validRounds + run.earlyPresses,
    totalValidRounds: current.totalValidRounds + run.validRounds,
    totalEarlyPresses: current.totalEarlyPresses + run.earlyPresses,
    recentAttempts,
    lastResults: [run, ...current.lastResults].slice(0, RESULT_LIMIT),
    rankCounts,
    streak,
    playDays,
    firstPlayedAt: current.firstPlayedAt ?? run.createdAt,
    lastPlayedAt: run.createdAt,
  };

  next = applyAchievements(
    next,
    { stats: next, latest: run, previousBestMs, previousBestAverageMs, previousRun, precision: null, targetHunter: null, levelChallenge: null },
    run.createdAt,
  );
  return next;
}

function pickMinNonNegative(a: number | null, b: number): number | null {
  if (a === null) return b;
  return Math.min(a, b);
}

/**
 * Fold a finished precision attempt into persisted stats and unlock precision
 * achievements. Reaction stats are untouched; only the `precision` slice and the
 * shared achievement set change.
 */
export function mergePrecision(current: ReactionStorageV2, result: PrecisionResult): ReactionStorageV2 {
  const p = current.precision;
  const improvesBest = p.bestAbsDifferenceMs === null || result.absDifferenceMs < p.bestAbsDifferenceMs;

  const targetKey = String(result.targetMs);
  const previousForTarget = p.bestByTargetMs[targetKey];
  const bestByTargetMs = { ...p.bestByTargetMs };
  if (previousForTarget === undefined || result.absDifferenceMs < previousForTarget) {
    bestByTargetMs[targetKey] = result.absDifferenceMs;
  }

  const nextPrecision: PrecisionStats = {
    bestAbsDifferenceMs: pickMinNonNegative(p.bestAbsDifferenceMs, result.absDifferenceMs),
    bestSignedDifferenceMs: improvesBest ? result.differenceMs : p.bestSignedDifferenceMs,
    bestTargetMs: improvesBest ? result.targetMs : p.bestTargetMs,
    precisionRuns: p.precisionRuns + 1,
    precisionAttempts: p.precisionAttempts + 1,
    recentPrecisionResults: [result, ...p.recentPrecisionResults].slice(0, PRECISION_RESULTS_LIMIT),
    bestByTargetMs,
    lastPrecisionPlayedAt: result.createdAt,
  };

  const { streak, playDays } = applyDay(current.streak, current.playDays, result.createdAt);

  let next: ReactionStorageV2 = {
    ...current,
    precision: nextPrecision,
    streak,
    playDays,
    firstPlayedAt: current.firstPlayedAt ?? result.createdAt,
    lastPlayedAt: result.createdAt,
  };

  next = applyAchievements(
    next,
    {
      stats: next,
      latest: null,
      previousBestMs: current.bestMs,
      previousBestAverageMs: current.bestAverageMs,
      previousRun: current.lastResults[0] ?? null,
      precision: result,
      targetHunter: null,
      levelChallenge: null,
    },
    result.createdAt,
  );
  return next;
}

/**
 * Fold a finished Target Hunter run into persisted stats and unlock Target
 * Hunter achievements. Reaction + precision stats are untouched; only the
 * `targetHunter` slice and the shared achievement set change.
 */
export function mergeTargetHunter(current: ReactionStorageV2, result: TargetHunterResult): ReactionStorageV2 {
  const t = current.targetHunter;

  const nextTargetHunter: TargetHunterStats = {
    targetHunterRuns: t.targetHunterRuns + 1,
    bestScore: Math.max(t.bestScore, result.score),
    bestAccuracy: Math.max(t.bestAccuracy, result.accuracy),
    bestAverageHitMs:
      result.averageHitMs === null ? t.bestAverageHitMs : pickMinNonNegative(t.bestAverageHitMs, result.averageHitMs),
    bestSingleHitMs:
      result.bestHitMs === null ? t.bestSingleHitMs : pickMinNonNegative(t.bestSingleHitMs, result.bestHitMs),
    longestCombo: Math.max(t.longestCombo, result.longestCombo),
    totalHits: t.totalHits + result.hits,
    totalMisses: t.totalMisses + result.misses,
    recentRuns: [result, ...t.recentRuns].slice(0, TARGET_HUNTER_RUNS_LIMIT),
    lastTargetHunterPlayedAt: result.createdAt,
  };

  const { streak, playDays } = applyDay(current.streak, current.playDays, result.createdAt);

  let next: ReactionStorageV2 = {
    ...current,
    targetHunter: nextTargetHunter,
    streak,
    playDays,
    firstPlayedAt: current.firstPlayedAt ?? result.createdAt,
    lastPlayedAt: result.createdAt,
  };

  next = applyAchievements(
    next,
    {
      stats: next,
      latest: null,
      previousBestMs: current.bestMs,
      previousBestAverageMs: current.bestAverageMs,
      previousRun: current.lastResults[0] ?? null,
      precision: null,
      targetHunter: result,
      levelChallenge: null,
    },
    result.createdAt,
  );
  return next;
}

function bumpLevelMap(map: Record<string, number>, level: number): Record<string, number> {
  const key = String(level);
  return { ...map, [key]: (map[key] ?? 0) + 1 };
}

/**
 * Fold a finished Level Challenge attempt into persisted stats and unlock Level
 * Challenge achievements. Passing a level unlocks the next; replays update the
 * per-level best score. Other modes' stats are untouched.
 */
export function mergeLevelChallenge(current: ReactionStorageV2, result: LevelChallengeResult): ReactionStorageV2 {
  const lc = current.levelChallenge;
  const levelKey = String(result.level);

  const levelAttemptsByLevel = bumpLevelMap(lc.levelAttemptsByLevel, result.level);
  let levelPassesByLevel = lc.levelPassesByLevel;
  let completedLevels = lc.completedLevels;
  let unlockedLevel = lc.unlockedLevel;
  let bestLevelReached = lc.bestLevelReached;

  if (result.passed) {
    levelPassesByLevel = bumpLevelMap(lc.levelPassesByLevel, result.level);
    if (!completedLevels.includes(result.level)) {
      completedLevels = [...completedLevels, result.level].sort((a, b) => a - b);
    }
    unlockedLevel = Math.min(TOTAL_LEVELS, Math.max(unlockedLevel, result.level + 1));
    bestLevelReached = Math.max(bestLevelReached, result.level);
  }

  const prevBestForLevel = lc.bestLevelScoresByLevel[levelKey] ?? 0;
  const bestLevelScoresByLevel =
    result.score > prevBestForLevel
      ? { ...lc.bestLevelScoresByLevel, [levelKey]: result.score }
      : lc.bestLevelScoresByLevel;

  const allCompleted = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).every((l) =>
    completedLevels.includes(l),
  );

  const nextLevelChallenge: LevelChallengeStats = {
    levelChallengeRuns: lc.levelChallengeRuns + 1,
    unlockedLevel,
    bestLevelReached,
    completedLevels,
    bestLevelChallengeScore: Math.max(lc.bestLevelChallengeScore, result.score),
    bestLevelScoresByLevel,
    levelAttemptsByLevel,
    levelPassesByLevel,
    recentLevelChallengeRuns: [result, ...lc.recentLevelChallengeRuns].slice(0, LEVEL_CHALLENGE_RUNS_LIMIT),
    lastLevelChallengePlayedAt: result.createdAt,
    allLevelsCompletedAt: lc.allLevelsCompletedAt ?? (allCompleted ? result.createdAt : null),
  };

  const { streak, playDays } = applyDay(current.streak, current.playDays, result.createdAt);

  let next: ReactionStorageV2 = {
    ...current,
    levelChallenge: nextLevelChallenge,
    streak,
    playDays,
    firstPlayedAt: current.firstPlayedAt ?? result.createdAt,
    lastPlayedAt: result.createdAt,
  };

  next = applyAchievements(
    next,
    {
      stats: next,
      latest: null,
      previousBestMs: current.bestMs,
      previousBestAverageMs: current.bestAverageMs,
      previousRun: current.lastResults[0] ?? null,
      precision: null,
      targetHunter: null,
      levelChallenge: result,
    },
    result.createdAt,
  );
  return next;
}

/** Reset only the Level Challenge progress slice (keeps every other stat). */
export function resetLevelChallenge(current: ReactionStorageV2): ReactionStorageV2 {
  return { ...current, levelChallenge: emptyLevelChallenge() };
}

/**
 * Record the start of a practice session: bumps the practice counter and day
 * tracking, then re-evaluates achievements (unlocks "Practice Starter" and can
 * contribute to "Daily Return"). Practice never writes to the run history.
 */
export function recordPractice(current: ReactionStorageV2, at: string = new Date().toISOString()): ReactionStorageV2 {
  const { streak, playDays } = applyDay(current.streak, current.playDays, at);
  let next: ReactionStorageV2 = {
    ...current,
    practiceRuns: current.practiceRuns + 1,
    streak,
    playDays,
    firstPlayedAt: current.firstPlayedAt ?? at,
    lastPlayedAt: at,
  };
  next = applyAchievements(
    next,
    { stats: next, latest: null, previousBestMs: current.bestMs, previousBestAverageMs: current.bestAverageMs, previousRun: current.lastResults[0] ?? null, precision: null, targetHunter: null, levelChallenge: null },
    at,
  );
  return next;
}
