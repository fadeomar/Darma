"use client";

/**
 * Optional mobile haptics via `navigator.vibrate`. Subtle, one-shot patterns
 * tied to game feedback moments — never looped. Like audio, the returned
 * function has a STABLE identity (reads `enabled` from a ref) so it can be
 * referenced from timing effects without disturbing the reaction clock.
 *
 * Fails silently on platforms without the Vibration API (e.g. iOS Safari).
 */

import { useCallback, useEffect, useRef } from "react";

export type HapticCue = "signal" | "tooEarly" | "achievement" | "victory" | "tap";

const PATTERNS: Record<HapticCue, number | number[]> = {
  signal: 20,
  tooEarly: [30, 40, 30],
  achievement: [15, 30, 15, 30, 40],
  victory: [40, 60, 40, 60, 80],
  tap: 10,
};

export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function useReactionHaptics(enabled: boolean) {
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  return useCallback((cue: HapticCue) => {
    if (!enabledRef.current) return;
    if (!hapticsSupported()) return;
    try {
      navigator.vibrate(PATTERNS[cue]);
    } catch {
      // Vibration is a non-essential enhancement.
    }
  }, []);
}

export type Vibrate = ReturnType<typeof useReactionHaptics>;
