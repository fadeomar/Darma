import type { SudokuGameState, SudokuStats } from "./sudokuTypes";

const SAVE_KEY = "darma:sudoku-mini:v1:save";
const STATS_KEY = "darma:sudoku-mini:v1:stats";

export function emptySudokuStats(): SudokuStats {
  return { gamesStarted: 0, gamesCompleted: 0, totalMistakes: 0, hintsUsed: 0, bestTimes: {} };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readSudokuSave(): SudokuGameState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SudokuGameState) : null;
  } catch {
    return null;
  }
}

export function writeSudokuSave(state: SudokuGameState) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can be full or disabled; gameplay should continue.
  }
}

export function clearSudokuSave() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SAVE_KEY);
}

export function readSudokuStats(): SudokuStats {
  if (!canUseStorage()) return emptySudokuStats();
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    return raw ? { ...emptySudokuStats(), ...(JSON.parse(raw) as SudokuStats) } : emptySudokuStats();
  } catch {
    return emptySudokuStats();
  }
}

export function writeSudokuStats(stats: SudokuStats) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore storage failures
  }
}

export function recordSudokuStart(stats: SudokuStats): SudokuStats {
  return { ...stats, gamesStarted: stats.gamesStarted + 1 };
}

export function recordSudokuCompletion(stats: SudokuStats, state: SudokuGameState): SudokuStats {
  const key = `${state.puzzle.size}-${state.puzzle.difficulty}` as const;
  const currentBest = stats.bestTimes[key];
  const bestTimes = { ...stats.bestTimes };
  if (!currentBest || state.elapsedSeconds < currentBest) bestTimes[key] = state.elapsedSeconds;
  return {
    ...stats,
    gamesCompleted: stats.gamesCompleted + 1,
    totalMistakes: stats.totalMistakes + state.mistakes,
    hintsUsed: stats.hintsUsed + state.hintsUsed,
    bestTimes,
  };
}
