/**
 * Math Sprint — browser persistence.
 *
 * Stores the selected operations, mute preference, and best Sprint score / best
 * streak in localStorage under one versioned key. Every access is guarded, and
 * the component only reads after mount (see the `hydrated` flag in the player),
 * so there is never a server/client hydration mismatch.
 */

import { checkAtLeastOneValue, getDefaultDifficulties } from "./mathSprintEngine";
import { DIFFICULTIES, type DifficultyMap } from "./mathSprintTypes";

export const STORAGE_KEY = "darma.game.math-sprint.v1";

type MathSprintStorage = {
  version: 1;
  difficulties: DifficultyMap;
  muted: boolean;
  bestSprintScore: number;
  bestStreak: number;
};

function emptyState(): MathSprintStorage {
  return {
    version: 1,
    difficulties: getDefaultDifficulties(),
    muted: false,
    bestSprintScore: 0,
    bestStreak: 0,
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Coerce an unknown blob into a valid, fully-populated difficulty map. */
function sanitizeDifficulties(raw: unknown): DifficultyMap {
  const base = getDefaultDifficulties();
  if (!raw || typeof raw !== "object") return base;
  const source = raw as Record<string, unknown>;
  const merged = { ...base };
  for (const key of DIFFICULTIES) {
    if (typeof source[key] === "boolean") merged[key] = source[key] as boolean;
  }
  // Never persist a state with zero operations enabled.
  return checkAtLeastOneValue(merged) ? merged : base;
}

function read(): MathSprintStorage {
  if (!canUseStorage()) return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<MathSprintStorage>;
    return {
      version: 1,
      difficulties: sanitizeDifficulties(parsed.difficulties),
      muted: parsed.muted === true,
      bestSprintScore:
        typeof parsed.bestSprintScore === "number" && Number.isFinite(parsed.bestSprintScore) && parsed.bestSprintScore > 0
          ? Math.floor(parsed.bestSprintScore)
          : 0,
      bestStreak:
        typeof parsed.bestStreak === "number" && Number.isFinite(parsed.bestStreak) && parsed.bestStreak > 0
          ? Math.floor(parsed.bestStreak)
          : 0,
    };
  } catch {
    return emptyState();
  }
}

function write(next: MathSprintStorage): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort only — never break gameplay over storage failures.
  }
}

export function readState(): { difficulties: DifficultyMap; muted: boolean; bestSprintScore: number; bestStreak: number } {
  const state = read();
  return {
    difficulties: state.difficulties,
    muted: state.muted,
    bestSprintScore: state.bestSprintScore,
    bestStreak: state.bestStreak,
  };
}

export function writeDifficulties(difficulties: DifficultyMap): void {
  if (!checkAtLeastOneValue(difficulties)) return;
  write({ ...read(), difficulties });
}

export function writeMuted(muted: boolean): void {
  write({ ...read(), muted });
}

/** Persist a new best Sprint score if it beats the stored one. Returns the resulting best. */
export function commitBestSprintScore(score: number): number {
  const current = read();
  if (score <= current.bestSprintScore) return current.bestSprintScore;
  const bestSprintScore = Math.floor(score);
  write({ ...current, bestSprintScore });
  return bestSprintScore;
}

/** Persist a new best streak if it beats the stored one. Returns the resulting best. */
export function commitBestStreak(streak: number): number {
  const current = read();
  if (streak <= current.bestStreak) return current.bestStreak;
  const bestStreak = Math.floor(streak);
  write({ ...current, bestStreak });
  return bestStreak;
}
