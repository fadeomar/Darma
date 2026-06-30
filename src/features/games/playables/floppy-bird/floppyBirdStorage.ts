export const STORAGE_KEY = "darma.game.floppy-bird.v1";
type FloppyBirdStorage = {
  version: 1;
  bestScore: number;
  muted: boolean;
};

const EMPTY: FloppyBirdStorage = { version: 1, bestScore: 0, muted: false };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalize(raw: string | null): FloppyBirdStorage {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<FloppyBirdStorage>;
    const bestScore = typeof parsed.bestScore === "number" && Number.isFinite(parsed.bestScore) && parsed.bestScore > 0
      ? Math.floor(parsed.bestScore)
      : 0;
    return { version: 1, bestScore, muted: parsed.muted === true };
  } catch {
    return EMPTY;
  }
}

function read(): FloppyBirdStorage {
  if (!canUseStorage()) return EMPTY;
  return normalize(window.localStorage.getItem(STORAGE_KEY));
}

function write(next: FloppyBirdStorage): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Browser storage is best-effort only.
  }
}

export function readBestScore(): number {
  return read().bestScore;
}

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
