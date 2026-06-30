import type { MinesweeperDifficultyId } from "./minesweeperTypes";

const STORAGE_KEY = "darma:minesweeper:v1";

export type MinesweeperBest = {
  bestScore: number;
  bestTime: number | null;
  wins: number;
  played: number;
};

export type MinesweeperStoredState = {
  muted: boolean;
  bestByDifficulty: Record<MinesweeperDifficultyId, MinesweeperBest>;
};

const EMPTY_BEST: MinesweeperBest = {
  bestScore: 0,
  bestTime: null,
  wins: 0,
  played: 0,
};

const DEFAULT_STATE: MinesweeperStoredState = {
  muted: false,
  bestByDifficulty: {
    easy: { ...EMPTY_BEST },
    classic: { ...EMPTY_BEST },
    expert: { ...EMPTY_BEST },
  },
};

function normalize(raw: Partial<MinesweeperStoredState> | null): MinesweeperStoredState {
  return {
    muted: Boolean(raw?.muted),
    bestByDifficulty: {
      easy: { ...EMPTY_BEST, ...(raw?.bestByDifficulty?.easy ?? {}) },
      classic: { ...EMPTY_BEST, ...(raw?.bestByDifficulty?.classic ?? {}) },
      expert: { ...EMPTY_BEST, ...(raw?.bestByDifficulty?.expert ?? {}) },
    },
  };
}

export function readMinesweeperState(): MinesweeperStoredState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return normalize(JSON.parse(raw) as Partial<MinesweeperStoredState>);
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: MinesweeperStoredState): MinesweeperStoredState {
  if (typeof window === "undefined") return state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked; keep gameplay working.
  }
  return state;
}

export function writeMinesweeperMuted(muted: boolean): MinesweeperStoredState {
  const state = readMinesweeperState();
  state.muted = muted;
  return writeState(state);
}

export function commitMinesweeperResult(options: {
  difficulty: MinesweeperDifficultyId;
  won: boolean;
  score: number;
  elapsed: number;
}): MinesweeperStoredState {
  const state = readMinesweeperState();
  const previous = state.bestByDifficulty[options.difficulty] ?? { ...EMPTY_BEST };

  state.bestByDifficulty[options.difficulty] = {
    bestScore: Math.max(previous.bestScore, options.score),
    bestTime: options.won && (previous.bestTime === null || options.elapsed < previous.bestTime) ? options.elapsed : previous.bestTime,
    wins: previous.wins + (options.won ? 1 : 0),
    played: previous.played + 1,
  };

  return writeState(state);
}
