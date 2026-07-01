import type { SnakePreferences, SnakeStats } from "./snakeTypes";

const STATS_KEY = "darma:snake-pro:v1:stats";
const PREFS_KEY = "darma:snake-pro:v1:prefs";

export const DEFAULT_SNAKE_STATS: SnakeStats = {
  highScore: 0,
  bestApples: 0,
  gamesPlayed: 0,
  totalApples: 0,
};

// Hidden grid is the professional-arena default; players opt back into the classic grid look.
export const DEFAULT_SNAKE_PREFERENCES: SnakePreferences = {
  showGrid: false,
  soundEnabled: true,
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

export function loadSnakePreferences(): SnakePreferences {
  if (!canUseStorage()) return DEFAULT_SNAKE_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_SNAKE_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_SNAKE_PREFERENCES;
  } catch {
    return DEFAULT_SNAKE_PREFERENCES;
  }
}

export function saveSnakePreferences(prefs: SnakePreferences): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore private-mode write errors.
  }
}
