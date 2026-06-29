"use client";

/**
 * Sprint 18 sound design pass for Reaction Timer Pro.
 *
 * The game still uses procedural WebAudio only: no assets, no network, no heavy
 * dependencies. Cues are intentionally short and softly limited so rapid target
 * gameplay never becomes harsh or spammy. Timing-sensitive gameplay continues to
 * use performance.now(); audio is feedback only and never drives the clock.
 */

import { useCallback, useEffect, useRef } from "react";

export type SoundProfile = "balanced" | "soft" | "crisp";

export type SoundCue =
  | "ui.click"
  | "ui.hover"
  | "countdown.tick"
  | "wait.softPulse"
  | "signal.go"
  | "precision.start"
  | "precision.stop"
  | "precision.perfect"
  | "precision.miss"
  | "target.spawn"
  | "target.hit"
  | "target.miss"
  | "combo.up"
  | "level.start"
  | "level.pass"
  | "level.fail"
  | "decoy.wrong"
  | "challenge.complete"
  | "daily.complete"
  | "battle.win"
  | "share.copy"
  | "share.download"
  | "result.success"
  | "result.average"
  | "result.bad"
  | "tooEarly.error"
  | "achievement.unlock"
  | "final.victory"
  | "pause"
  | "resume";

/** A single scheduled oscillator note. Offsets/durations are seconds. */
type Note = {
  at?: number;
  frequency: number;
  frequencyEnd?: number;
  type?: OscillatorType;
  duration: number;
  /** Peak gain before master/profile multipliers. Keep low: 0.01–0.09. */
  gain: number;
  lowpass?: number;
  highpass?: number;
};

type CueDefinition = {
  notes: Note[];
  /** Prevents repeating a cue too quickly in target-heavy modes. */
  cooldownMs?: number;
};

function cue(notes: Note[], cooldownMs = 24): CueDefinition {
  return { notes, cooldownMs };
}

const CUES: Record<SoundCue, CueDefinition> = {
  "ui.click": cue([{ frequency: 480, type: "triangle", duration: 0.045, gain: 0.03, lowpass: 2400 }], 35),
  "ui.hover": cue([{ frequency: 720, type: "sine", duration: 0.035, gain: 0.014 }], 90),
  "countdown.tick": cue([{ frequency: 430, type: "sine", duration: 0.095, gain: 0.043, lowpass: 1700 }], 220),
  "wait.softPulse": cue([{ frequency: 190, type: "sine", duration: 0.14, gain: 0.01, lowpass: 600 }], 520),
  "signal.go": cue([{ frequency: 520, frequencyEnd: 880, type: "triangle", duration: 0.17, gain: 0.074, lowpass: 2600 }], 160),

  "precision.start": cue([{ frequency: 360, frequencyEnd: 540, type: "sine", duration: 0.16, gain: 0.048 }], 160),
  "precision.stop": cue([{ frequency: 540, type: "triangle", duration: 0.09, gain: 0.045, lowpass: 1800 }], 90),
  "precision.perfect": cue(
    [
      { frequency: 523.25, type: "triangle", duration: 0.11, gain: 0.054, lowpass: 2600 },
      { at: 0.09, frequency: 659.25, type: "triangle", duration: 0.11, gain: 0.052, lowpass: 2600 },
      { at: 0.18, frequency: 880, type: "sine", duration: 0.2, gain: 0.052, lowpass: 3000 },
    ],
    240,
  ),
  "precision.miss": cue([{ frequency: 270, frequencyEnd: 220, type: "sine", duration: 0.2, gain: 0.044, lowpass: 750 }], 180),

  "target.spawn": cue([{ frequency: 620, type: "sine", duration: 0.035, gain: 0.012, lowpass: 1600 }], 110),
  "target.hit": cue([{ frequency: 720, frequencyEnd: 1040, type: "triangle", duration: 0.075, gain: 0.05, lowpass: 2800 }], 55),
  "target.miss": cue([{ frequency: 210, frequencyEnd: 176, type: "sine", duration: 0.12, gain: 0.038, lowpass: 650 }], 90),
  "combo.up": cue(
    [
      { frequency: 760, type: "sine", duration: 0.055, gain: 0.034 },
      { at: 0.045, frequency: 960, type: "sine", duration: 0.08, gain: 0.034 },
    ],
    260,
  ),

  "level.start": cue([{ frequency: 392, frequencyEnd: 587.33, type: "triangle", duration: 0.18, gain: 0.05, lowpass: 2200 }], 180),
  "level.pass": cue(
    [
      { frequency: 523.25, type: "triangle", duration: 0.11, gain: 0.052 },
      { at: 0.1, frequency: 659.25, type: "triangle", duration: 0.12, gain: 0.052 },
      { at: 0.2, frequency: 783.99, type: "triangle", duration: 0.18, gain: 0.056 },
    ],
    320,
  ),
  "level.fail": cue([{ frequency: 300, frequencyEnd: 232, type: "sine", duration: 0.24, gain: 0.045, lowpass: 800 }], 260),
  "decoy.wrong": cue(
    [
      { frequency: 210, type: "sawtooth", duration: 0.08, gain: 0.035, lowpass: 650 },
      { at: 0.08, frequency: 174, type: "sawtooth", duration: 0.1, gain: 0.034, lowpass: 620 },
    ],
    160,
  ),
  "challenge.complete": cue(
    [
      { frequency: 392, type: "triangle", duration: 0.12, gain: 0.046 },
      { at: 0.1, frequency: 523.25, type: "triangle", duration: 0.13, gain: 0.05 },
      { at: 0.22, frequency: 659.25, type: "triangle", duration: 0.13, gain: 0.052 },
      { at: 0.34, frequency: 783.99, type: "triangle", duration: 0.28, gain: 0.052 },
    ],
    480,
  ),
  "daily.complete": cue(
    [
      { frequency: 440, type: "triangle", duration: 0.1, gain: 0.045 },
      { at: 0.1, frequency: 660, type: "triangle", duration: 0.18, gain: 0.052 },
    ],
    320,
  ),
  "battle.win": cue(
    [
      { frequency: 392, type: "triangle", duration: 0.1, gain: 0.046 },
      { at: 0.08, frequency: 587.33, type: "triangle", duration: 0.12, gain: 0.05 },
      { at: 0.2, frequency: 783.99, type: "triangle", duration: 0.2, gain: 0.054 },
    ],
    360,
  ),

  "share.copy": cue([{ frequency: 660, frequencyEnd: 880, type: "sine", duration: 0.11, gain: 0.036 }], 160),
  "share.download": cue(
    [
      { frequency: 520, type: "triangle", duration: 0.08, gain: 0.038 },
      { at: 0.08, frequency: 740, type: "triangle", duration: 0.12, gain: 0.04 },
    ],
    220,
  ),

  "result.success": cue(
    [
      { frequency: 540, type: "triangle", duration: 0.11, gain: 0.056, lowpass: 2600 },
      { at: 0.1, frequency: 760, type: "triangle", duration: 0.15, gain: 0.056, lowpass: 2600 },
    ],
    180,
  ),
  "result.average": cue([{ frequency: 480, type: "sine", duration: 0.16, gain: 0.046, lowpass: 1600 }], 160),
  "result.bad": cue([{ frequency: 300, frequencyEnd: 232, type: "sine", duration: 0.22, gain: 0.044, lowpass: 820 }], 180),
  "tooEarly.error": cue(
    [
      { frequency: 196, type: "sawtooth", duration: 0.1, gain: 0.043, lowpass: 720 },
      { at: 0.11, frequency: 164, type: "sawtooth", duration: 0.13, gain: 0.042, lowpass: 680 },
    ],
    220,
  ),
  "achievement.unlock": cue(
    [
      { frequency: 523.25, type: "triangle", duration: 0.11, gain: 0.05 },
      { at: 0.095, frequency: 659.25, type: "triangle", duration: 0.11, gain: 0.05 },
      { at: 0.19, frequency: 783.99, type: "triangle", duration: 0.18, gain: 0.054 },
    ],
    380,
  ),
  "final.victory": cue(
    [
      { frequency: 523.25, type: "triangle", duration: 0.12, gain: 0.048 },
      { at: 0.11, frequency: 659.25, type: "triangle", duration: 0.12, gain: 0.05 },
      { at: 0.22, frequency: 783.99, type: "triangle", duration: 0.13, gain: 0.052 },
      { at: 0.34, frequency: 1046.5, type: "triangle", duration: 0.22, gain: 0.052 },
    ],
    520,
  ),
  pause: cue([{ frequency: 460, frequencyEnd: 340, type: "sine", duration: 0.15, gain: 0.04 }], 180),
  resume: cue([{ frequency: 340, frequencyEnd: 480, type: "sine", duration: 0.15, gain: 0.04 }], 180),
};

const PROFILE_GAIN: Record<SoundProfile, number> = {
  balanced: 1,
  soft: 0.62,
  crisp: 1.08,
};

const PROFILE_DURATION: Record<SoundProfile, number> = {
  balanced: 1,
  soft: 1.12,
  crisp: 0.82,
};

type Ctor = typeof AudioContext;

function safeProfile(value: SoundProfile | undefined): SoundProfile {
  return value === "soft" || value === "crisp" || value === "balanced" ? value : "balanced";
}

export function useReactionAudio(enabled: boolean, volume: number, profile: SoundProfile = "balanced") {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  const profileRef = useRef<SoundProfile>(safeProfile(profile));
  const lastPlayedRef = useRef<Partial<Record<SoundCue, number>>>({});

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    profileRef.current = safeProfile(profile);
  }, [profile]);

  useEffect(() => {
    return () => {
      contextRef.current?.close().catch(() => {});
      contextRef.current = null;
      masterRef.current = null;
      limiterRef.current = null;
    };
  }, []);

  const ensureGraph = useCallback(() => {
    const Ctx: Ctor | undefined =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!Ctx) return null;

    const context = contextRef.current ?? new Ctx();
    contextRef.current = context;

    if (!masterRef.current || !limiterRef.current) {
      const master = context.createGain();
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-20, context.currentTime);
      limiter.knee.setValueAtTime(18, context.currentTime);
      limiter.ratio.setValueAtTime(6, context.currentTime);
      limiter.attack.setValueAtTime(0.003, context.currentTime);
      limiter.release.setValueAtTime(0.12, context.currentTime);
      master.connect(limiter);
      limiter.connect(context.destination);
      masterRef.current = master;
      limiterRef.current = limiter;
    }

    const master = masterRef.current;
    if (!master) return null;
    return { context, master };
  }, []);

  // Stable identity — never re-created. Reads live enabled/volume/profile from refs.
  return useCallback(
    (cueName: SoundCue) => {
      if (typeof window === "undefined") return;
      if (!enabledRef.current) return;

      const cueDef = CUES[cueName];
      if (!cueDef) return;

      const nowMs = performance.now();
      const lastPlayed = lastPlayedRef.current[cueName] ?? 0;
      if (nowMs - lastPlayed < (cueDef.cooldownMs ?? 0)) return;
      lastPlayedRef.current[cueName] = nowMs;

      const masterVolume = Math.max(0, Math.min(1, volumeRef.current));
      if (masterVolume <= 0) return;

      try {
        const graph = ensureGraph();
        if (!graph) return;
        const { context, master } = graph;
        if (context.state === "suspended") context.resume().catch(() => {});

        const profileValue = profileRef.current;
        const profileGain = PROFILE_GAIN[profileValue];
        const durationScale = PROFILE_DURATION[profileValue];
        const start = context.currentTime;

        for (const note of cueDef.notes) {
          const duration = Math.max(0.018, note.duration * durationScale);
          const noteStart = start + (note.at ?? 0);
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.type = note.type ?? "sine";
          oscillator.frequency.setValueAtTime(note.frequency, noteStart);
          if (note.frequencyEnd && note.frequencyEnd > 0) {
            oscillator.frequency.exponentialRampToValueAtTime(note.frequencyEnd, noteStart + duration);
          }

          const peak = Math.max(0.0001, note.gain * masterVolume * profileGain);
          gainNode.gain.setValueAtTime(0.0001, noteStart);
          gainNode.gain.exponentialRampToValueAtTime(peak, noteStart + 0.012);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

          let tail: AudioNode = gainNode;
          if (note.lowpass || note.highpass) {
            const filter = context.createBiquadFilter();
            filter.type = note.highpass ? "highpass" : "lowpass";
            filter.frequency.setValueAtTime(note.highpass ?? note.lowpass ?? 1200, noteStart);
            gainNode.connect(filter);
            tail = filter;
          }

          oscillator.connect(gainNode);
          tail.connect(master);
          oscillator.start(noteStart);
          oscillator.stop(noteStart + duration + 0.035);
        }
      } catch {
        // Audio is a non-essential enhancement — never let it break the game.
      }
    },
    [ensureGraph],
  );
}

export type PlayCue = ReturnType<typeof useReactionAudio>;
