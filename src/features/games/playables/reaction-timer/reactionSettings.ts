"use client";

/**
 * Shared, versioned game preferences for Darma playables.
 *
 * Key: `darma.game.settings.v1`. Kept SEPARATE from per-game progress
 * (`darma.game.reactionTimer.v2`) so clearing or resetting preferences never
 * wipes a player's stats/achievements, and vice-versa.
 *
 * Logic is React-free so it stays testable; `useReactionSettings` wraps it.
 */

import { useCallback, useEffect, useState } from "react";
import type { SoundProfile } from "./reactionAudio";

export const SETTINGS_KEY = "darma.game.settings.v1";

export type ReactionSettings = {
  soundEnabled: boolean;
  /** 0..1 master volume for procedural cues. */
  volume: number;
  /** Procedural cue character. Balanced is default; soft is calmer; crisp is snappier. */
  soundProfile: SoundProfile;
  hapticsEnabled: boolean;
  /** Reduce non-essential visual effects (on top of system prefers-reduced-motion). */
  reducedEffects: boolean;
  /** Auto-progress to the next round after the round-result overlay. */
  autoAdvance: boolean;
  /** Show coaching/contextual hint text during play. */
  showHints: boolean;
  /** Stronger text/border contrast for readability. */
  highContrastMode: boolean;
  /** Show the "Click / tap · Space / Enter" input affordances. */
  inputHints: boolean;
};

export const DEFAULT_SETTINGS: ReactionSettings = {
  soundEnabled: true,
  volume: 0.7,
  soundProfile: "balanced",
  hapticsEnabled: true,
  reducedEffects: false,
  autoAdvance: true,
  showHints: true,
  highContrastMode: false,
  inputHints: true,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function clamp01(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function soundProfile(value: unknown, fallback: SoundProfile): SoundProfile {
  return value === "soft" || value === "crisp" || value === "balanced" ? value : fallback;
}

/** Merge stored partial settings over defaults — unknown/old keys are ignored, missing keys keep defaults. */
export function normalizeSettings(value: unknown): ReactionSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_SETTINGS };
  const v = value as Partial<ReactionSettings>;
  return {
    soundEnabled: bool(v.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    volume: clamp01(v.volume, DEFAULT_SETTINGS.volume),
    soundProfile: soundProfile(v.soundProfile, DEFAULT_SETTINGS.soundProfile),
    hapticsEnabled: bool(v.hapticsEnabled, DEFAULT_SETTINGS.hapticsEnabled),
    reducedEffects: bool(v.reducedEffects, DEFAULT_SETTINGS.reducedEffects),
    autoAdvance: bool(v.autoAdvance, DEFAULT_SETTINGS.autoAdvance),
    showHints: bool(v.showHints, DEFAULT_SETTINGS.showHints),
    highContrastMode: bool(v.highContrastMode, DEFAULT_SETTINGS.highContrastMode),
    inputHints: bool(v.inputHints, DEFAULT_SETTINGS.inputHints),
  };
}

export function readSettings(): ReactionSettings {
  if (!canUseStorage()) return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings: ReactionSettings): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Preferences are best-effort; the game stays playable if storage is blocked.
  }
}

/**
 * React binding for game settings. Hydrates from storage on mount (SSR-safe
 * defaults first to avoid a hydration mismatch) and persists every change.
 */
export function useReactionSettings() {
  const [settings, setSettings] = useState<ReactionSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(readSettings());
    setHydrated(true);
  }, []);

  const update = useCallback(<K extends keyof ReactionSettings>(key: K, value: ReactionSettings[K]) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      writeSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(() => {
      const next = { ...DEFAULT_SETTINGS };
      writeSettings(next);
      return next;
    });
  }, []);

  return { settings, hydrated, update, reset };
}
