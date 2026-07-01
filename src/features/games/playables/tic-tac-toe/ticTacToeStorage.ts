import type { TicMark, TicStats } from "./ticTacToeTypes";

const STATS_KEY = "darma:tic-tac-toe-pro:v1:stats";

export const DEFAULT_TIC_STATS: TicStats = {
  xWins: 0,
  oWins: 0,
  draws: 0,
  gamesPlayed: 0,
  currentStreak: 0,
  bestStreak: 0,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadTicStats(): TicStats {
  if (!canUseStorage()) return DEFAULT_TIC_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_TIC_STATS, ...JSON.parse(raw) } : DEFAULT_TIC_STATS;
  } catch {
    return DEFAULT_TIC_STATS;
  }
}

export function saveTicStats(stats: TicStats): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore private-mode write errors.
  }
}

export function recordTicGame(stats: TicStats, winner: TicMark | "draw"): TicStats {
  const nextStreak = winner === "X" ? stats.currentStreak + 1 : 0;
  return {
    xWins: stats.xWins + (winner === "X" ? 1 : 0),
    oWins: stats.oWins + (winner === "O" ? 1 : 0),
    draws: stats.draws + (winner === "draw" ? 1 : 0),
    gamesPlayed: stats.gamesPlayed + 1,
    currentStreak: nextStreak,
    bestStreak: Math.max(stats.bestStreak, nextStreak),
  };
}
