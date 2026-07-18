/**
 * Neon Core Defense — browser persistence.
 *
 * Stores the whole `ProgressState` (from `neonCoreProgression.ts`) under one
 * versioned key. Every access is guarded so the game keeps working under SSR,
 * private mode, or quota errors — storage is a nicety here, never a dependency of
 * gameplay. Parsing is corruption-safe: any malformed payload falls back to a clean
 * default rather than throwing.
 *
 * Writes happen only on meaningful events — run completion, a claim, a purchase, an
 * equip, an import, or a reset — never on an animation frame.
 *
 * Schema history, all migrated forward on read rather than discarded:
 *   v1 — best score only.
 *   v2 — added best wave and best combo.
 *   v3 — added per-weapon shot counts and power-up tallies.
 *   v4 — full progression: XP, level-derived, currency, lifetime stats,
 *        achievements, missions, daily challenges, unlocks, and loadout.
 *   v5 — added the game settings block (audio, motion, particles, haptics).
 */

import { POWER_UP_ORDER, WEAPON_ORDER } from "./neonCoreEngine";
import {
  defaultProgress,
  emptyLifetime,
  PROGRESS_VERSION,
  sanitizeProgress,
  type ProgressState,
} from "./neonCoreProgression";

export const STORAGE_KEY = "darma.game.neon-core-defense.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function toTally<K extends string>(raw: unknown, keys: readonly K[]): Record<K, number> {
  const source = (raw ?? {}) as Partial<Record<K, unknown>>;
  const out = {} as Record<K, number>;
  for (const key of keys) out[key] = toCount(source[key]);
  return out;
}

/**
 * Fold a pre-v4 payload (bests + tallies, no progression) into a fresh v4 state, so
 * a returning player keeps their high scores and lifetime counts as they cross into
 * the progression era.
 */
function migrateLegacy(raw: Record<string, unknown>, today: Date): ProgressState {
  const base = defaultProgress(today);
  const lifetime = emptyLifetime();
  lifetime.bestScore = toCount(raw.bestScore);
  lifetime.bestWave = toCount(raw.bestWave);
  lifetime.bestCombo = toCount(raw.bestCombo);
  lifetime.weaponShots = toTally(raw.weaponUsage, WEAPON_ORDER);
  lifetime.powerUpsByKind = toTally(raw.powerUps, POWER_UP_ORDER);
  lifetime.totalPowerUps = toCount(raw.powerUpsCollected);
  return { ...base, lifetime };
}

/** Whether a parsed payload looks like a genuine v4 progression object. */
function isV4(raw: Record<string, unknown>): boolean {
  return raw.version === PROGRESS_VERSION || (typeof raw.xp === "number" && typeof raw.lifetime === "object");
}

/**
 * Read and normalise the stored progress. `today` drives the daily-challenge reset,
 * so a stored day that isn't today comes back with fresh daily challenges.
 */
export function readProgress(today = new Date()): ProgressState {
  if (!canUseStorage()) return defaultProgress(today);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress(today);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return defaultProgress(today);
    const obj = parsed as Record<string, unknown>;
    if (isV4(obj)) return sanitizeProgress(obj, today);
    // v1–v3 payloads: no version 4 marker, but bests/tallies to preserve.
    return sanitizeProgress(migrateLegacy(obj, today), today);
  } catch {
    return defaultProgress(today);
  }
}

/** Persist the progress state. Best-effort; failures never surface to gameplay. */
export function writeProgress(state: ProgressState): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/serialisation failures.
  }
}

/** Serialise progress to a shareable JSON string for the export control. */
export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Parse and sanitise an imported JSON string. Returns null (rather than throwing or
 * writing) if the text isn't usable, so the caller can surface a friendly error.
 */
export function importProgress(json: string, today = new Date()): ProgressState | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const state = isV4(obj) ? sanitizeProgress(obj, today) : sanitizeProgress(migrateLegacy(obj, today), today);
    writeProgress(state);
    return state;
  } catch {
    return null;
  }
}

/** Wipe stored progress and return a clean default (persisted). */
export function resetProgress(today = new Date()): ProgressState {
  const fresh = defaultProgress(today);
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Fall through — writing the fresh default below still normalises state.
    }
  }
  writeProgress(fresh);
  return fresh;
}
