/**
 * High-score persistence for Darma Tetris.
 *
 * Browser-only: a single best score is kept in localStorage under a versioned
 * key. All access is guarded so the game stays playable when storage is
 * unavailable (SSR, private mode, quota errors).
 */

export const STORAGE_KEY = "darma.game.tetris.v1";

type TetrisStorage = {
  version: 1;
  highScore: number;
};

const EMPTY: TetrisStorage = { version: 1, highScore: 0 };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readHighScore(): number {
  if (!canUseStorage()) return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Partial<TetrisStorage>;
    const value = parsed?.highScore;
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

/** Persist `score` if it beats the stored best. Returns the resulting best. */
export function commitHighScore(score: number): number {
  const current = readHighScore();
  if (score <= current) return current;
  if (canUseStorage()) {
    try {
      const next: TetrisStorage = { ...EMPTY, highScore: Math.floor(score) };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Best-effort only — never break gameplay over storage failures.
    }
  }
  return score;
}
