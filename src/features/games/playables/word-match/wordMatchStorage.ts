import type { WordMatchRound, WordMatchStats } from "./wordMatchTypes";

const STORAGE_KEY = "darma:word-match:v1:stats";

export const DEFAULT_WORD_MATCH_STATS: WordMatchStats = {
  roundsCompleted: 0,
  bestScore: 0,
  bestStreak: 0,
  perfectRounds: 0,
  hintsUsed: 0,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadWordMatchStats(): WordMatchStats {
  if (!canUseStorage()) return DEFAULT_WORD_MATCH_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORD_MATCH_STATS;
    return { ...DEFAULT_WORD_MATCH_STATS, ...(JSON.parse(raw) as WordMatchStats) };
  } catch {
    return DEFAULT_WORD_MATCH_STATS;
  }
}

export function saveWordMatchStats(stats: WordMatchStats) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function updateWordMatchStats(stats: WordMatchStats, round: WordMatchRound): WordMatchStats {
  return {
    roundsCompleted: stats.roundsCompleted + 1,
    bestScore: Math.max(stats.bestScore, round.score),
    bestStreak: Math.max(stats.bestStreak, round.bestStreak),
    perfectRounds: stats.perfectRounds + (round.mistakes === 0 ? 1 : 0),
    hintsUsed: stats.hintsUsed + round.hintsUsed,
  };
}

export function clearWordMatchStats() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
