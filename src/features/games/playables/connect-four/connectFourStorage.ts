import type { ConnectFourStats } from "./connectFourTypes";

const STATS_KEY = "darma:connect-four:v1:stats";

export const DEFAULT_CONNECT_FOUR_STATS: ConnectFourStats = {
  gamesStarted: 0,
  gamesCompleted: 0,
  redWins: 0,
  yellowWins: 0,
  computerWins: 0,
  draws: 0,
  bestWinMoves: null,
  hintsUsed: 0,
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadConnectFourStats(): ConnectFourStats {
  if (!canUseStorage()) return DEFAULT_CONNECT_FOUR_STATS;
  try {
    const stored = window.localStorage.getItem(STATS_KEY);
    if (!stored) return DEFAULT_CONNECT_FOUR_STATS;
    return { ...DEFAULT_CONNECT_FOUR_STATS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_CONNECT_FOUR_STATS;
  }
}

export function saveConnectFourStats(stats: ConnectFourStats) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Storage can fail in private windows; gameplay should continue.
  }
}

export function clearConnectFourStats() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STATS_KEY);
  } catch {
    // Ignore storage failures.
  }
}
