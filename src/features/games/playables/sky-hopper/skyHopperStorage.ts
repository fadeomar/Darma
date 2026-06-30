/**
 * Sky Hopper — browser persistence.
 *
 * Stores the best score and the mute preference in localStorage under a single
 * versioned key. Every access is guarded so the game keeps working under SSR,
 * private mode, or quota errors.
 */

export const STORAGE_KEY = "darma.game.sky-hopper.v1";

type SkyHopperStorage = {
  version: 1;
  bestScore: number;
  muted: boolean;
};

const EMPTY: SkyHopperStorage = { version: 1, bestScore: 0, muted: false };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read(): SkyHopperStorage {
  if (!canUseStorage()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<SkyHopperStorage>;
    const bestScore =
      typeof parsed?.bestScore === "number" && Number.isFinite(parsed.bestScore) && parsed.bestScore > 0
        ? Math.floor(parsed.bestScore)
        : 0;
    return { version: 1, bestScore, muted: parsed?.muted === true };
  } catch {
    return EMPTY;
  }
}

function write(next: SkyHopperStorage): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort only — never break gameplay over storage failures.
  }
}

export function readBestScore(): number {
  return read().bestScore;
}

/** Persist `score` if it beats the stored best. Returns the resulting best. */
export function commitBestScore(score: number): number {
  const current = read();
  if (score <= current.bestScore) return current.bestScore;
  const bestScore = Math.floor(score);
  write({ ...current, bestScore });
  return bestScore;
}

export function readMuted(): boolean {
  return read().muted;
}

export function writeMuted(muted: boolean): void {
  write({ ...read(), muted });
}
