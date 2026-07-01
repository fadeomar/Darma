import type { MemoryDifficulty, MemoryStats } from "./memoryCardsTypes";

const STATS_KEY = "darma:memory-cards:v1:stats";

export const DEFAULT_MEMORY_STATS: MemoryStats = {
  gamesStarted: 0,
  gamesCompleted: 0,
  bestMoves: {},
  bestSeconds: {},
  perfectGames: 0,
  totalMatches: 0,
  hintsUsed: 0,
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadMemoryStats(): MemoryStats {
  if (!canUseStorage()) return DEFAULT_MEMORY_STATS;
  try {
    const stored = window.localStorage.getItem(STATS_KEY);
    if (!stored) return DEFAULT_MEMORY_STATS;
    return { ...DEFAULT_MEMORY_STATS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_MEMORY_STATS;
  }
}

export function saveMemoryStats(stats: MemoryStats) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Gameplay continues if storage is blocked.
  }
}

export function clearMemoryStats() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STATS_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function recordMemoryCompletion(stats: MemoryStats, difficulty: MemoryDifficulty, moves: number, seconds: number, mistakes: number, matches: number, hintsUsed: number): MemoryStats {
  const currentMoves = stats.bestMoves[difficulty];
  const currentSeconds = stats.bestSeconds[difficulty];
  return {
    ...stats,
    gamesCompleted: stats.gamesCompleted + 1,
    bestMoves: { ...stats.bestMoves, [difficulty]: currentMoves ? Math.min(currentMoves, moves) : moves },
    bestSeconds: { ...stats.bestSeconds, [difficulty]: currentSeconds ? Math.min(currentSeconds, seconds) : seconds },
    perfectGames: stats.perfectGames + (mistakes === 0 && hintsUsed === 0 ? 1 : 0),
    totalMatches: stats.totalMatches + matches,
    hintsUsed: stats.hintsUsed + hintsUsed,
  };
}
