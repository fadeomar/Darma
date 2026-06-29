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
import { backupCorruptedLocalStorage, canUseLocalStorage, safeReadLocalStorage, safeWriteLocalStorage } from "./reactionEdgeCases";
import { dayKey, isNextDay } from "./reactionScoring";
import { getRank } from "./reactionScoring";
import { getPrecisionRank } from "./precisionScoring";
import { getTargetHunterRank } from "./targetHunterScoring";
import { TOTAL_LEVELS } from "./levelChallengeScoring";
import { getDailyRank } from "./dailyChallengeScoring";
import { LOCAL_BATTLE_CLASSIC_ROUNDS } from "./localBattleScoring";
import {
  applyXpGrant,
  createXpGrant,
  emptyProgressionStats,
  normalizeProgressionStats,
} from "./reactionProgression";
import type { PrecisionResult, PrecisionStats } from "./precisionTypes";
import type { TargetHunterResult, TargetHunterStats } from "./targetHunterTypes";
import type { LevelChallengeResult, LevelChallengeStats } from "./levelChallengeTypes";
import type {
  DailyChallengeDayRecord,
  DailyChallengeResult,
  DailyChallengeStats,
  LocalLeaderboardEntry,
} from "./dailyChallengeTypes";
import type { LocalBattleResult, LocalBattleStats } from "./localBattleTypes";
import type {
  AchievementContext,
  RankCounts,
  ReactionStorageV2,
  ShareActionResult,
  ShareStats,
  ProgressionEventKind,
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
const DAILY_RESULTS_LIMIT = 14;
const LEADERBOARD_LIMIT = 30;
const WEEKLY_ACTIVITY_LIMIT = 7;
const LOCAL_BATTLE_RESULTS_LIMIT = 10;

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

function emptyDaily(): DailyChallengeStats {
  return {
    dailyChallenges: {},
    dailyStreak: 0,
    longestDailyStreak: 0,
    lastDailyCompletionDate: null,
    recentDailyResults: [],
    localLeaderboards: [],
    weeklyActivity: [],
    lastDailyPlayedAt: null,
  };
}

function emptyLocalBattle(): LocalBattleStats {
  return {
    localBattleRuns: 0,
    recentBattles: [],
    lastWinner: null,
    battleWinsByPlayerName: {},
    bestBattleClassicAverage: null,
    bestBattlePrecisionDiff: null,
    bestBattleTargetScore: 0,
    rematchCount: 0,
    lastBattlePlayedAt: null,
    defaultPlayer1Name: "Player 1",
    defaultPlayer2Name: "Player 2",
  };
}

function emptyShare(): ShareStats {
  return {
    shareCount: 0,
    copyCount: 0,
    downloadCount: 0,
    nativeShareCount: 0,
    lastSharedAt: null,
    lastDownloadedAt: null,
    lastSharedMode: null,
    sharedModes: [],
    dailyShareCount: 0,
    battleShareCount: 0,
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
  daily: emptyDaily(),
  localBattle: emptyLocalBattle(),
  share: emptyShare(),
  progression: emptyProgressionStats(),
};

function canUseStorage(): boolean {
  return canUseLocalStorage();
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


function normalizeDailyResult(value: unknown): DailyChallengeResult | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<DailyChallengeResult>;
  const type = r.challengeType === "precision" || r.challengeType === "target-hunt" ? r.challengeType : "classic";
  const dateKey = typeof r.dateKey === "string" && r.dateKey ? r.dateKey : "";
  if (!dateKey) return null;
  const score = typeof r.score === "number" && Number.isFinite(r.score) ? Math.max(0, Math.min(1000, Math.round(r.score))) : 0;
  const rank = getDailyRank(score);
  return {
    id: typeof r.id === "string" && r.id ? r.id : `${Date.now()}-${Math.random()}`,
    dateKey,
    challengeId: typeof r.challengeId === "string" && r.challengeId ? r.challengeId : `daily-${dateKey}`,
    challengeTitle: typeof r.challengeTitle === "string" && r.challengeTitle ? r.challengeTitle : "Daily Challenge",
    challengeType: type,
    score,
    rankId: rank.id,
    objectivePassed: r.objectivePassed === true,
    primaryMetric: typeof r.primaryMetric === "string" ? r.primaryMetric : `${score} pts`,
    secondaryMetric: typeof r.secondaryMetric === "string" ? r.secondaryMetric : "Local daily result",
    detail: typeof r.detail === "string" ? r.detail : rank.note,
    accuracy: clampPct(r.accuracy),
    improvedToday: r.improvedToday === true,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    classic: r.classic ? normalizeResult(r.classic) ?? undefined : undefined,
    precision: r.precision ? normalizePrecisionResult(r.precision) ?? undefined : undefined,
    targetHunter: r.targetHunter ? normalizeTargetHunterResult(r.targetHunter) ?? undefined : undefined,
  };
}

function normalizeDailyDayRecord(value: unknown): DailyChallengeDayRecord | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<DailyChallengeDayRecord>;
  const dateKey = typeof r.dateKey === "string" && r.dateKey ? r.dateKey : "";
  if (!dateKey) return null;
  const bestResult = normalizeDailyResult(r.bestResult);
  const latestResult = normalizeDailyResult(r.latestResult);
  const challengeType = r.challengeType === "precision" || r.challengeType === "target-hunt" ? r.challengeType : "classic";
  return {
    dateKey,
    challengeId: typeof r.challengeId === "string" && r.challengeId ? r.challengeId : bestResult?.challengeId ?? `daily-${dateKey}`,
    challengeType,
    attempts: intOrZero(r.attempts),
    completed: r.completed === true || Boolean(bestResult),
    firstCompletedAt: strOrNull(r.firstCompletedAt),
    bestCompletedAt: strOrNull(r.bestCompletedAt) ?? bestResult?.createdAt ?? null,
    bestResult,
    latestResult,
  };
}

function normalizeLeaderboardEntry(value: unknown): LocalLeaderboardEntry | null {
  if (!value || typeof value !== "object") return null;
  const e = value as Partial<LocalLeaderboardEntry>;
  const mode = e.mode === "classic" || e.mode === "precision" || e.mode === "target-hunter" || e.mode === "level-challenge" ? e.mode : "daily";
  return {
    id: typeof e.id === "string" && e.id ? e.id : `${Date.now()}-${Math.random()}`,
    mode,
    dateKey: typeof e.dateKey === "string" ? e.dateKey : "",
    score: intOrZero(e.score),
    primaryMetric: typeof e.primaryMetric === "string" ? e.primaryMetric : "—",
    secondaryMetric: typeof e.secondaryMetric === "string" ? e.secondaryMetric : "—",
    rankLabel: typeof e.rankLabel === "string" ? e.rankLabel : "Local result",
    createdAt: typeof e.createdAt === "string" ? e.createdAt : new Date().toISOString(),
    displayName: typeof e.displayName === "string" && e.displayName ? e.displayName : "You",
  };
}

function normalizeDaily(value: unknown): DailyChallengeStats {
  if (!value || typeof value !== "object") return emptyDaily();
  const v = value as Partial<DailyChallengeStats>;
  const dailyChallenges: Record<string, DailyChallengeDayRecord> = {};
  if (v.dailyChallenges && typeof v.dailyChallenges === "object") {
    for (const [key, raw] of Object.entries(v.dailyChallenges)) {
      const record = normalizeDailyDayRecord(raw);
      if (record) dailyChallenges[key || record.dateKey] = record;
    }
  }
  const recentDailyResults = Array.isArray(v.recentDailyResults)
    ? v.recentDailyResults.map(normalizeDailyResult).filter((r): r is DailyChallengeResult => Boolean(r)).slice(0, DAILY_RESULTS_LIMIT)
    : [];
  const localLeaderboards = Array.isArray(v.localLeaderboards)
    ? v.localLeaderboards.map(normalizeLeaderboardEntry).filter((e): e is LocalLeaderboardEntry => Boolean(e)).slice(0, LEADERBOARD_LIMIT)
    : [];
  const weeklyActivity = Array.isArray(v.weeklyActivity)
    ? Array.from(new Set(v.weeklyActivity.filter((d): d is string => typeof d === "string" && Boolean(d)))).slice(-WEEKLY_ACTIVITY_LIMIT)
    : [];
  return {
    dailyChallenges,
    dailyStreak: intOrZero(v.dailyStreak),
    longestDailyStreak: intOrZero(v.longestDailyStreak),
    lastDailyCompletionDate: strOrNull(v.lastDailyCompletionDate),
    recentDailyResults,
    localLeaderboards,
    weeklyActivity,
    lastDailyPlayedAt: strOrNull(v.lastDailyPlayedAt),
  };
}


function normalizeLocalBattlePlayerResult(value: unknown): LocalBattleResult["player1Result"] | null {
  if (!value || typeof value !== "object") return null;
  const r = value as LocalBattleResult["player1Result"];
  if (r.kind === "classic") {
    const rounds = Array.isArray(r.rounds)
      ? r.rounds.filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0).map(Math.round).slice(0, LOCAL_BATTLE_CLASSIC_ROUNDS)
      : [];
    const earlyPresses = intOrZero(r.earlyPresses);
    const attempts = rounds.length + earlyPresses;
    return {
      kind: "classic",
      rounds,
      averageMs: typeof r.averageMs === "number" && Number.isFinite(r.averageMs) ? Math.round(r.averageMs) : rounds.length ? Math.round(rounds.reduce((sum, n) => sum + n, 0) / rounds.length) : null,
      bestMs: typeof r.bestMs === "number" && Number.isFinite(r.bestMs) ? Math.round(r.bestMs) : rounds.length ? Math.min(...rounds) : null,
      accuracy: typeof r.accuracy === "number" ? clampPct(r.accuracy) : attempts > 0 ? Math.round((rounds.length / attempts) * 100) : 0,
      earlyPresses,
      validRounds: intOrZero(r.validRounds) || rounds.length,
    };
  }
  if (r.kind === "precision") {
    const targetMs = num(r.targetMs) ?? 5000;
    const elapsedMs = typeof r.elapsedMs === "number" && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0 ? Math.round(r.elapsedMs) : 0;
    const differenceMs = typeof r.differenceMs === "number" && Number.isFinite(r.differenceMs) ? Math.round(r.differenceMs) : elapsedMs - targetMs;
    return { kind: "precision", targetMs, elapsedMs, differenceMs, absDifferenceMs: Math.abs(differenceMs) };
  }
  if (r.kind === "target-hunter") {
    const targetHunter = normalizeTargetHunterResult(r.targetHunter);
    return targetHunter ? { kind: "target-hunter", targetHunter } : null;
  }
  return null;
}

function normalizeLocalBattleResult(value: unknown): LocalBattleResult | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<LocalBattleResult>;
  const battleType = r.battleType === "precision" || r.battleType === "target-hunter" ? r.battleType : "classic";
  const player1Result = normalizeLocalBattlePlayerResult(r.player1Result);
  const player2Result = normalizeLocalBattlePlayerResult(r.player2Result);
  if (!player1Result || !player2Result) return null;
  const winner = r.winner === "player1" || r.winner === "player2" || r.winner === "draw" ? r.winner : "draw";
  return {
    id: typeof r.id === "string" && r.id ? r.id : `${Date.now()}-${Math.random()}`,
    battleType,
    player1Name: typeof r.player1Name === "string" && r.player1Name ? r.player1Name : "Player 1",
    player2Name: typeof r.player2Name === "string" && r.player2Name ? r.player2Name : "Player 2",
    player1Result,
    player2Result,
    winner,
    winnerLabel: typeof r.winnerLabel === "string" && r.winnerLabel ? r.winnerLabel : winner === "draw" ? "Draw" : winner === "player1" ? "Player 1" : "Player 2",
    marginLabel: typeof r.marginLabel === "string" && r.marginLabel ? r.marginLabel : "Even match",
    summary: typeof r.summary === "string" && r.summary ? r.summary : "Local battle result",
    primaryMetric: typeof r.primaryMetric === "string" && r.primaryMetric ? r.primaryMetric : "Local Battle",
    secondaryMetric: typeof r.secondaryMetric === "string" && r.secondaryMetric ? r.secondaryMetric : "Local result",
    score: intOrZero(r.score),
    rematch: r.rematch === true,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}

function normalizeLocalBattle(value: unknown): LocalBattleStats {
  if (!value || typeof value !== "object") return emptyLocalBattle();
  const v = value as Partial<LocalBattleStats>;
  const battleWinsByPlayerName: Record<string, number> = {};
  if (v.battleWinsByPlayerName && typeof v.battleWinsByPlayerName === "object") {
    for (const [name, wins] of Object.entries(v.battleWinsByPlayerName)) {
      if (name) battleWinsByPlayerName[name] = intOrZero(wins);
    }
  }
  const recentBattles = Array.isArray(v.recentBattles)
    ? v.recentBattles.map(normalizeLocalBattleResult).filter((r): r is LocalBattleResult => Boolean(r)).slice(0, LOCAL_BATTLE_RESULTS_LIMIT)
    : [];
  return {
    localBattleRuns: intOrZero(v.localBattleRuns),
    recentBattles,
    lastWinner: strOrNull(v.lastWinner),
    battleWinsByPlayerName,
    bestBattleClassicAverage: num(v.bestBattleClassicAverage),
    bestBattlePrecisionDiff: typeof v.bestBattlePrecisionDiff === "number" && Number.isFinite(v.bestBattlePrecisionDiff) && v.bestBattlePrecisionDiff >= 0 ? Math.round(v.bestBattlePrecisionDiff) : null,
    bestBattleTargetScore: intOrZero(v.bestBattleTargetScore),
    rematchCount: intOrZero(v.rematchCount),
    lastBattlePlayedAt: strOrNull(v.lastBattlePlayedAt),
    defaultPlayer1Name: typeof v.defaultPlayer1Name === "string" && v.defaultPlayer1Name ? v.defaultPlayer1Name : "Player 1",
    defaultPlayer2Name: typeof v.defaultPlayer2Name === "string" && v.defaultPlayer2Name ? v.defaultPlayer2Name : "Player 2",
  };
}

function normalizeShare(value: unknown): ShareStats {
  if (!value || typeof value !== "object") return emptyShare();
  const v = value as Partial<ShareStats>;
  const validModes = new Set(["classic", "precision", "target-hunter", "level-challenge", "daily", "local-battle"]);
  const sharedModes = Array.isArray(v.sharedModes)
    ? Array.from(new Set(v.sharedModes.filter((m): m is ShareStats["sharedModes"][number] => typeof m === "string" && validModes.has(m))))
    : [];
  const lastMode = typeof v.lastSharedMode === "string" && validModes.has(v.lastSharedMode)
    ? v.lastSharedMode as ShareStats["lastSharedMode"]
    : null;
  return {
    shareCount: intOrZero(v.shareCount),
    copyCount: intOrZero(v.copyCount),
    downloadCount: intOrZero(v.downloadCount),
    nativeShareCount: intOrZero(v.nativeShareCount),
    lastSharedAt: strOrNull(v.lastSharedAt),
    lastDownloadedAt: strOrNull(v.lastDownloadedAt),
    lastSharedMode: lastMode,
    sharedModes,
    dailyShareCount: intOrZero(v.dailyShareCount),
    battleShareCount: intOrZero(v.battleShareCount),
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
    daily: normalizeDaily(v.daily),
    localBattle: normalizeLocalBattle(v.localBattle),
    share: normalizeShare(v.share),
    progression: normalizeProgressionStats(v.progression),
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
  const raw = safeReadLocalStorage(STORAGE_KEY);
  if (raw) {
    try {
      return normalize(JSON.parse(raw));
    } catch {
      backupCorruptedLocalStorage(STORAGE_KEY, raw);
      return { ...EMPTY_STORAGE };
    }
  }

  const migrated = migrateLegacy();
  if (migrated) {
    writeStorage(migrated);
    return migrated;
  }
  return { ...EMPTY_STORAGE };
}

export function writeStorage(stats: ReactionStorageV2): void {
  safeWriteLocalStorage(STORAGE_KEY, JSON.stringify(stats));
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

function applyProgressionGrant(
  next: ReactionStorageV2,
  kind: ProgressionEventKind,
  at: string,
  detail?: string,
  bonus = 0,
): ReactionStorageV2 {
  return {
    ...next,
    progression: applyXpGrant(next.progression, createXpGrant(kind, at, detail, bonus)),
  };
}

/** Re-evaluate achievements, stamp unlock timestamps, and award XP for newly-unlocked ids. */
function applyAchievements(next: ReactionStorageV2, ctx: AchievementContext, at: string): ReactionStorageV2 {
  const before = new Set(next.achievements);
  const unlocked = evaluateAchievements(ctx);
  const unlockedAt = { ...next.achievementsUnlockedAt };
  let awarded = next;
  for (const id of unlocked) {
    if (!before.has(id) && !unlockedAt[id]) {
      unlockedAt[id] = at;
      awarded = applyProgressionGrant(awarded, "achievement", at, id);
    }
  }
  return { ...awarded, achievements: unlocked, achievementsUnlockedAt: unlockedAt };
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

  next = applyProgressionGrant(
    next,
    "classic-run",
    run.createdAt,
    run.averageMs !== null ? `Avg ${run.averageMs} ms` : "Classic run",
    run.earlyPresses === 0 ? 20 : 0,
  );

  next = applyAchievements(
    next,
    { stats: next, latest: run, previousBestMs, previousBestAverageMs, previousRun, precision: null, targetHunter: null, levelChallenge: null, dailyChallenge: null, localBattle: null, shareAction: null },
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
  next = applyProgressionGrant(
    next,
    "precision-run",
    result.createdAt,
    `±${result.absDifferenceMs} ms`,
    result.absDifferenceMs <= 75 ? 30 : 0,
  );

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
      dailyChallenge: null,
      localBattle: null,
      shareAction: null,
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
  next = applyProgressionGrant(
    next,
    "target-hunter-run",
    result.createdAt,
    `${result.score} pts · ${result.accuracy}%`,
    result.accuracy >= 90 ? 30 : 0,
  );

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
      dailyChallenge: null,
      localBattle: null,
      shareAction: null,
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
  next = applyProgressionGrant(
    next,
    "level-challenge-run",
    result.createdAt,
    `Level ${result.level} ${result.passed ? "passed" : "attempt"}`,
    result.passed ? 60 : 0,
  );

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
      dailyChallenge: null,
      localBattle: null,
      shareAction: null,
    },
    result.createdAt,
  );
  return next;
}


function updateDailyStreak(daily: DailyChallengeStats, date: string): Pick<DailyChallengeStats, "dailyStreak" | "longestDailyStreak" | "lastDailyCompletionDate"> {
  if (!date) {
    return {
      dailyStreak: daily.dailyStreak,
      longestDailyStreak: daily.longestDailyStreak,
      lastDailyCompletionDate: daily.lastDailyCompletionDate,
    };
  }
  if (daily.lastDailyCompletionDate === date) {
    return {
      dailyStreak: daily.dailyStreak,
      longestDailyStreak: daily.longestDailyStreak,
      lastDailyCompletionDate: daily.lastDailyCompletionDate,
    };
  }
  const nextStreak = daily.lastDailyCompletionDate && isNextDay(daily.lastDailyCompletionDate, date)
    ? daily.dailyStreak + 1
    : 1;
  return {
    dailyStreak: nextStreak,
    longestDailyStreak: Math.max(daily.longestDailyStreak, nextStreak),
    lastDailyCompletionDate: date,
  };
}

function updateWeeklyActivity(days: string[], date: string): string[] {
  if (!date) return days.slice(-WEEKLY_ACTIVITY_LIMIT);
  return Array.from(new Set([...days, date])).slice(-WEEKLY_ACTIVITY_LIMIT);
}

/** Fold a completed Daily Challenge into local-only daily stats and leaderboard. */
export function mergeDailyChallenge(current: ReactionStorageV2, result: DailyChallengeResult): ReactionStorageV2 {
  const daily = current.daily;
  const previousRecord = daily.dailyChallenges[result.dateKey];
  const previousBest = previousRecord?.bestResult ?? null;
  const improvedToday = previousBest === null || result.score > previousBest.score;
  const stampedResult: DailyChallengeResult = { ...result, improvedToday };

  const record: DailyChallengeDayRecord = {
    dateKey: result.dateKey,
    challengeId: result.challengeId,
    challengeType: result.challengeType,
    attempts: (previousRecord?.attempts ?? 0) + 1,
    completed: true,
    firstCompletedAt: previousRecord?.firstCompletedAt ?? result.createdAt,
    bestCompletedAt: improvedToday ? result.createdAt : previousRecord?.bestCompletedAt ?? previousBest?.createdAt ?? null,
    bestResult: improvedToday ? stampedResult : previousBest,
    latestResult: stampedResult,
  };

  const streakUpdate = previousRecord?.completed ? {
    dailyStreak: daily.dailyStreak,
    longestDailyStreak: daily.longestDailyStreak,
    lastDailyCompletionDate: daily.lastDailyCompletionDate,
  } : updateDailyStreak(daily, result.dateKey);

  const entry: LocalLeaderboardEntry = {
    id: result.id,
    mode: "daily",
    dateKey: result.dateKey,
    score: result.score,
    primaryMetric: result.primaryMetric,
    secondaryMetric: result.secondaryMetric,
    rankLabel: getDailyRank(result.score).label,
    createdAt: result.createdAt,
    displayName: "You",
  };

  const nextDaily: DailyChallengeStats = {
    ...daily,
    ...streakUpdate,
    dailyChallenges: { ...daily.dailyChallenges, [result.dateKey]: record },
    recentDailyResults: [stampedResult, ...daily.recentDailyResults].slice(0, DAILY_RESULTS_LIMIT),
    localLeaderboards: [entry, ...daily.localLeaderboards]
      .sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, LEADERBOARD_LIMIT),
    weeklyActivity: updateWeeklyActivity(daily.weeklyActivity, result.dateKey),
    lastDailyPlayedAt: result.createdAt,
  };

  const { streak, playDays } = applyDay(current.streak, current.playDays, result.createdAt);
  let next: ReactionStorageV2 = {
    ...current,
    daily: nextDaily,
    streak,
    playDays,
    firstPlayedAt: current.firstPlayedAt ?? result.createdAt,
    lastPlayedAt: result.createdAt,
  };
  next = applyProgressionGrant(
    next,
    "daily-challenge",
    result.createdAt,
    `${result.challengeTitle} · ${result.score} pts`,
    result.objectivePassed ? 50 : 0,
  );

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
      levelChallenge: null,
      dailyChallenge: stampedResult,
      localBattle: null,
      shareAction: null,
    },
    result.createdAt,
  );
  return next;
}


/** Fold a finished Local Battle into local-only two-player stats. */
export function mergeLocalBattle(current: ReactionStorageV2, result: LocalBattleResult): ReactionStorageV2 {
  const b = current.localBattle;
  const wins = { ...b.battleWinsByPlayerName };
  if (result.winner !== "draw") {
    wins[result.winnerLabel] = (wins[result.winnerLabel] ?? 0) + 1;
  }

  let bestBattleClassicAverage = b.bestBattleClassicAverage;
  if (result.battleType === "classic") {
    const p1 = result.player1Result.kind === "classic" ? result.player1Result.averageMs : null;
    const p2 = result.player2Result.kind === "classic" ? result.player2Result.averageMs : null;
    const bestThisBattle = pickMin(p1, p2);
    bestBattleClassicAverage = bestThisBattle === null ? b.bestBattleClassicAverage : pickMinNonNegative(b.bestBattleClassicAverage, bestThisBattle);
  }

  let bestBattlePrecisionDiff = b.bestBattlePrecisionDiff;
  if (result.battleType === "precision" && result.player1Result.kind === "precision" && result.player2Result.kind === "precision") {
    bestBattlePrecisionDiff = pickMinNonNegative(
      b.bestBattlePrecisionDiff,
      Math.min(result.player1Result.absDifferenceMs, result.player2Result.absDifferenceMs),
    );
  }

  let bestBattleTargetScore = b.bestBattleTargetScore;
  if (result.battleType === "target-hunter" && result.player1Result.kind === "target-hunter" && result.player2Result.kind === "target-hunter") {
    bestBattleTargetScore = Math.max(
      b.bestBattleTargetScore,
      result.player1Result.targetHunter.score,
      result.player2Result.targetHunter.score,
    );
  }

  const nextLocalBattle: LocalBattleStats = {
    localBattleRuns: b.localBattleRuns + 1,
    recentBattles: [result, ...b.recentBattles].slice(0, LOCAL_BATTLE_RESULTS_LIMIT),
    lastWinner: result.winner === "draw" ? "Draw" : result.winnerLabel,
    battleWinsByPlayerName: wins,
    bestBattleClassicAverage,
    bestBattlePrecisionDiff,
    bestBattleTargetScore,
    rematchCount: b.rematchCount + (result.rematch ? 1 : 0),
    lastBattlePlayedAt: result.createdAt,
    defaultPlayer1Name: result.player1Name,
    defaultPlayer2Name: result.player2Name,
  };

  const { streak, playDays } = applyDay(current.streak, current.playDays, result.createdAt);
  let next: ReactionStorageV2 = {
    ...current,
    localBattle: nextLocalBattle,
    streak,
    playDays,
    firstPlayedAt: current.firstPlayedAt ?? result.createdAt,
    lastPlayedAt: result.createdAt,
  };
  next = applyProgressionGrant(
    next,
    "local-battle",
    result.createdAt,
    result.winner === "draw" ? "Draw" : `${result.winnerLabel} won`,
    result.winner === "draw" ? 0 : 40,
  );

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
      levelChallenge: null,
      dailyChallenge: null,
      localBattle: result,
      shareAction: null,
    },
    result.createdAt,
  );
  return next;
}


/** Record a successful share/copy/download action and unlock Sprint 11 share achievements. */
export function mergeShareAction(current: ReactionStorageV2, action: ShareActionResult): ReactionStorageV2 {
  const share = current.share;
  const sharedModes = share.sharedModes.includes(action.mode) ? share.sharedModes : [...share.sharedModes, action.mode];
  const nextShare: ShareStats = {
    shareCount: share.shareCount + 1,
    copyCount: share.copyCount + (action.action === "copy" ? 1 : 0),
    downloadCount: share.downloadCount + (action.action === "download" ? 1 : 0),
    nativeShareCount: share.nativeShareCount + (action.action === "native-share" ? 1 : 0),
    lastSharedAt: action.at,
    lastDownloadedAt: action.action === "download" ? action.at : share.lastDownloadedAt,
    lastSharedMode: action.mode,
    sharedModes,
    dailyShareCount: share.dailyShareCount + (action.mode === "daily" ? 1 : 0),
    battleShareCount: share.battleShareCount + (action.mode === "local-battle" ? 1 : 0),
  };

  let next: ReactionStorageV2 = { ...current, share: nextShare };
  next = applyProgressionGrant(next, "share", action.at, `${action.action} · ${action.mode}`);
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
      levelChallenge: null,
      dailyChallenge: null,
      localBattle: null,
      shareAction: action,
    },
    action.at,
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
  next = applyProgressionGrant(next, "practice-run", at, "Practice mode");
  next = applyAchievements(
    next,
    { stats: next, latest: null, previousBestMs: current.bestMs, previousBestAverageMs: current.bestAverageMs, previousRun: current.lastResults[0] ?? null, precision: null, targetHunter: null, levelChallenge: null, dailyChallenge: null, localBattle: null, shareAction: null },
    at,
  );
  return next;
}
