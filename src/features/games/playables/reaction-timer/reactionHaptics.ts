"use client";

/**
 * Optional mobile haptics via `navigator.vibrate`. Sprint 18 keeps the patterns
 * intentionally short and rate-limited so fast target modes do not feel noisy.
 * Like audio, the returned function has a stable identity and fails silently on
 * platforms without the Vibration API (notably iOS Safari).
 */

import { useCallback, useEffect, useRef } from "react";

export type HapticCue =
  | "signal"
  | "tooEarly"
  | "achievement"
  | "victory"
  | "tap"
  | "hit"
  | "miss"
  | "pass"
  | "fail"
  | "share";

const PATTERNS: Record<HapticCue, number | number[]> = {
  signal: 18,
  tooEarly: [24, 36, 24],
  achievement: [12, 28, 12, 28, 38],
  victory: [34, 52, 34, 52, 62],
  tap: 8,
  hit: 10,
  miss: [18, 28, 18],
  pass: [24, 42, 42],
  fail: [24, 42, 24],
  share: 12,
};

const COOLDOWN_MS: Partial<Record<HapticCue, number>> = {
  tap: 35,
  hit: 45,
  miss: 95,
  tooEarly: 160,
  achievement: 420,
  victory: 520,
};

export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function useReactionHaptics(enabled: boolean) {
  const enabledRef = useRef(enabled);
  const lastRef = useRef<Partial<Record<HapticCue, number>>>({});

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  return useCallback((cue: HapticCue) => {
    if (!enabledRef.current) return;
    if (!hapticsSupported()) return;
    const now = performance.now();
    const last = lastRef.current[cue] ?? 0;
    if (now - last < (COOLDOWN_MS[cue] ?? 0)) return;
    lastRef.current[cue] = now;
    try {
      navigator.vibrate(PATTERNS[cue]);
    } catch {
      // Vibration is a non-essential enhancement.
    }
  }, []);
}

export type Vibrate = ReturnType<typeof useReactionHaptics>;
