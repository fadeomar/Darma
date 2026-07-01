import type { SnakeStats } from "./snakeTypes";

const STATS_KEY = "darma:snake-pro:v1:stats";

export const DEFAULT_SNAKE_STATS: SnakeStats = {
  highScore: 0,
  bestApples: 0,
  gamesPlayed: 0,
  totalApples: 0,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSnakeStats(): SnakeStats {
  if (!canUseStorage()) return DEFAULT_SNAKE_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_SNAKE_STATS, ...JSON.parse(raw) } : DEFAULT_SNAKE_STATS;
  } catch {
    return DEFAULT_SNAKE_STATS;
  }
}

export function saveSnakeStats(stats: SnakeStats): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore private-mode write errors.
  }
}

export function recordSnakeGame(stats: SnakeStats, score: number, apples: number): SnakeStats {
  return {
    highScore: Math.max(stats.highScore, score),
    bestApples: Math.max(stats.bestApples, apples),
    gamesPlayed: stats.gamesPlayed + 1,
    totalApples: stats.totalApples + apples,
  };
}
