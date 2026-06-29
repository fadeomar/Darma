"use client";

/**
 * Procedural WebAudio cues for Reaction Timer Pro. No assets, no dependencies —
 * short oscillator/gain/filter blips synthesized on demand.
 *
 * Design notes:
 *  - The returned `play` callback has a STABLE identity (empty-dep useCallback)
 *    and reads `enabled`/`volume` through refs. This matters because the game
 *    loop lists `play` in a timing effect's deps; a changing identity would
 *    reschedule the random-wait timer and disturb reaction timing. Audio must
 *    never touch the clock.
 *  - The AudioContext is created lazily inside `play`, i.e. only after a user
 *    interaction (Start), and resumed if suspended. Nothing autoplays.
 *  - Everything fails silently when Web Audio is unavailable or blocked.
 */

import { useCallback, useEffect, useRef } from "react";

export type SoundCue =
  | "ui.click"
  | "ui.hover"
  | "countdown.tick"
  | "wait.softPulse"
  | "signal.go"
  | "result.success"
  | "result.average"
  | "result.bad"
  | "tooEarly.error"
  | "achievement.unlock"
  | "final.victory"
  | "pause"
  | "resume";

/** A single scheduled note. Offsets/durations are in seconds, relative to play. */
type Note = {
  /** Start offset from the cue's start, in seconds. */
  at?: number;
  frequency: number;
  /** Optional glide target reached at the end of the note. */
  frequencyEnd?: number;
  type?: OscillatorType;
  duration: number;
  /** Peak gain BEFORE the master volume multiplier. Keep tasteful (~0.02-0.09). */
  gain: number;
  /** Optional low-pass to round off harsh edges (Hz). */
  lowpass?: number;
};

const CUES: Record<SoundCue, Note[]> = {
  "ui.click": [{ frequency: 460, type: "triangle", duration: 0.05, gain: 0.035, lowpass: 2200 }],
  "ui.hover": [{ frequency: 660, type: "sine", duration: 0.04, gain: 0.02 }],
  "countdown.tick": [{ frequency: 430, type: "sine", duration: 0.1, gain: 0.05 }],
  // Optional, very subtle low pulse — available but intentionally not spammed by the loop.
  "wait.softPulse": [{ frequency: 196, type: "sine", duration: 0.16, gain: 0.014 }],
  "signal.go": [{ frequency: 540, frequencyEnd: 860, type: "triangle", duration: 0.17, gain: 0.085 }],
  "result.success": [
    { frequency: 540, type: "triangle", duration: 0.12, gain: 0.07 },
    { at: 0.11, frequency: 760, type: "triangle", duration: 0.16, gain: 0.07 },
  ],
  "result.average": [{ frequency: 480, type: "sine", duration: 0.18, gain: 0.06 }],
  // Friendly, not harsh: a gentle downward sine, low-passed.
  "result.bad": [{ frequency: 300, frequencyEnd: 232, type: "sine", duration: 0.24, gain: 0.06, lowpass: 900 }],
  // Soft buzz, low-passed so it never turns into a piercing sawtooth.
  "tooEarly.error": [
    { frequency: 196, type: "sawtooth", duration: 0.12, gain: 0.06, lowpass: 760 },
    { at: 0.13, frequency: 164, type: "sawtooth", duration: 0.16, gain: 0.06, lowpass: 700 },
  ],
  "achievement.unlock": [
    { frequency: 523.25, type: "triangle", duration: 0.12, gain: 0.06 },
    { at: 0.1, frequency: 659.25, type: "triangle", duration: 0.12, gain: 0.06 },
    { at: 0.2, frequency: 783.99, type: "triangle", duration: 0.2, gain: 0.065 },
  ],
  "final.victory": [
    { frequency: 523.25, type: "triangle", duration: 0.14, gain: 0.06 },
    { at: 0.12, frequency: 659.25, type: "triangle", duration: 0.14, gain: 0.06 },
    { at: 0.24, frequency: 783.99, type: "triangle", duration: 0.14, gain: 0.06 },
    { at: 0.36, frequency: 1046.5, type: "triangle", duration: 0.28, gain: 0.07 },
  ],
  pause: [{ frequency: 460, frequencyEnd: 340, type: "sine", duration: 0.16, gain: 0.05 }],
  resume: [{ frequency: 340, frequencyEnd: 480, type: "sine", duration: 0.16, gain: 0.05 }],
};

type Ctor = typeof AudioContext;

export function useReactionAudio(enabled: boolean, volume: number) {
  const contextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      contextRef.current?.close().catch(() => {});
      contextRef.current = null;
    };
  }, []);

  // Stable identity — never re-created. Reads live enabled/volume from refs.
  return useCallback((cue: SoundCue) => {
    if (typeof window === "undefined") return;
    if (!enabledRef.current) return;
    const masterVolume = Math.max(0, Math.min(1, volumeRef.current));
    if (masterVolume <= 0) return;

    try {
      const Ctx: Ctor | undefined =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: Ctor }).webkitAudioContext;
      if (!Ctx) return;

      const context = contextRef.current ?? new Ctx();
      contextRef.current = context;
      if (context.state === "suspended") context.resume().catch(() => {});

      const start = context.currentTime;
      for (const note of CUES[cue]) {
        const noteStart = start + (note.at ?? 0);
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = note.type ?? "sine";
        oscillator.frequency.setValueAtTime(note.frequency, noteStart);
        if (note.frequencyEnd && note.frequencyEnd > 0) {
          oscillator.frequency.exponentialRampToValueAtTime(note.frequencyEnd, noteStart + note.duration);
        }

        const peak = Math.max(0.0001, note.gain * masterVolume);
        gainNode.gain.setValueAtTime(0.0001, noteStart);
        gainNode.gain.exponentialRampToValueAtTime(peak, noteStart + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration);

        let tail: AudioNode = gainNode;
        if (note.lowpass) {
          const filter = context.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(note.lowpass, noteStart);
          gainNode.connect(filter);
          tail = filter;
        }

        oscillator.connect(gainNode);
        tail.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + note.duration + 0.03);
      }
    } catch {
      // Audio is a non-essential enhancement — never let it break the game.
    }
  }, []);
}

export type PlayCue = ReturnType<typeof useReactionAudio>;
