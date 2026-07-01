import type { TypingHistoryEntry, TypingStats } from "./typingSpeedTypes";

const STORAGE_KEY = "darma:typing-speed:v1:stats";
const MAX_HISTORY = 20;

export const DEFAULT_TYPING_STATS: TypingStats = {
  bestWpm: 0,
  bestAccuracy: 0,
  testsCompleted: 0,
  history: [],
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadTypingStats(): TypingStats {
  if (!canUseStorage()) return DEFAULT_TYPING_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TYPING_STATS;
    const parsed = JSON.parse(raw) as TypingStats;
    return { ...DEFAULT_TYPING_STATS, ...parsed, history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY) : [] };
  } catch {
    return DEFAULT_TYPING_STATS;
  }
}

export function saveTypingStats(stats: TypingStats) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stats, history: stats.history.slice(0, MAX_HISTORY) }));
}

export function addTypingHistoryEntry(stats: TypingStats, entry: TypingHistoryEntry): TypingStats {
  const history = [entry, ...stats.history].slice(0, MAX_HISTORY);
  return {
    bestWpm: Math.max(stats.bestWpm, entry.wpm),
    bestAccuracy: Math.max(stats.bestAccuracy, entry.accuracy),
    testsCompleted: stats.testsCompleted + 1,
    history,
  };
}

export function clearTypingStats() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
