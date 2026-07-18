/**
 * Neon Core Defense — audio & haptics.
 *
 * A single self-contained Web Audio engine: no assets, no dependency, SSR-safe
 * (nothing touches `window` until a method runs on the client). All cues are
 * synthesized, so they are original and licence-free.
 *
 * The graph is `master → { musicGain, sfxGain } → destination`, which is what lets
 * music and sound effects carry independent volume and mute. Browser autoplay
 * policy is respected: the context starts suspended and only resumes inside
 * `unlock()`, called from a trusted gesture.
 *
 * Lifecycle guarantees the caller relies on:
 *   - `startMusic()` is idempotent — a second call never layers a second loop.
 *   - `suspend()`/`resume()` freeze and restore the context (pause, hidden tab)
 *     and pause the music scheduler so notes never pile up while inaudible.
 *   - `teardown()` stops everything and closes the context on unmount, leaving no
 *     timer or oscillator running.
 */

export type SfxId =
  | "shoot"
  | "hit"
  | "kill"
  | "coreDamage"
  | "powerUp"
  | "upgrade"
  | "wave"
  | "achievement"
  | "gameOver";

export type AudioSettings = {
  music: boolean;
  sfx: boolean;
  /** 0–1. */
  musicVolume: number;
  /** 0–1. */
  sfxVolume: number;
};

/** Per-cue relative gain, so no single effect is jarring against the others. */
const SFX_GAIN: Record<SfxId, number> = {
  shoot: 0.16,
  hit: 0.22,
  kill: 0.3,
  coreDamage: 0.5,
  powerUp: 0.34,
  upgrade: 0.36,
  wave: 0.34,
  achievement: 0.42,
  gameOver: 0.42,
};

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

export type NeonAudio = {
  unlock: () => void;
  applySettings: (settings: AudioSettings) => void;
  playSfx: (id: SfxId) => void;
  startMusic: () => void;
  stopMusic: () => void;
  suspend: () => void;
  resume: () => void;
  teardown: () => void;
};

function createEngine(): NeonAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let sfxGain: GainNode | null = null;
  let reverb: ConvolverNode | null = null;

  let settings: AudioSettings = { music: true, sfx: true, musicVolume: 0.5, sfxVolume: 0.7 };

  // "should be playing" intent, independent of whether the context is currently
  // running — so resume() knows whether to restart the scheduler.
  let musicWanted = false;
  let musicTimer: ReturnType<typeof setTimeout> | null = null;
  let suspended = false;

  const ensure = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (ctx) return ctx;
    const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.connect(master);

      sfxGain = ctx.createGain();
      sfxGain.connect(master);

      reverb = ctx.createConvolver();
      reverb.buffer = createReverbImpulse(ctx);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.55;
      reverb.connect(reverbGain);
      reverbGain.connect(musicGain);

      applyGains();
      return ctx;
    } catch {
      ctx = null;
      return null;
    }
  };

  const applyGains = () => {
    if (!musicGain || !sfxGain) return;
    musicGain.gain.value = settings.music ? clamp01(settings.musicVolume) : 0;
    sfxGain.gain.value = settings.sfx ? clamp01(settings.sfxVolume) : 0;
  };

  /* Music: sparse major-pentatonic phrases on a bell envelope through reverb.
     One scheduler timer at a time — the `musicTimer` guard makes startMusic()
     idempotent so loops never overlap. */
  const MELODY = [261.63, 329.63, 392.0, 440.0, 523.25, 587.33];
  const BASS = [98.0, 130.81];

  const playNote = (context: AudioContext, freq: number, when: number, duration: number, level: number) => {
    if (!musicGain || !reverb) return;
    const osc = context.createOscillator();
    const env = context.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 4;
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(level, when + 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(env);
    env.connect(musicGain);
    env.connect(reverb);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  };

  const scheduleMusic = () => {
    if (!musicWanted || suspended) return;
    const context = ensure();
    if (!context || context.state !== "running") {
      musicTimer = setTimeout(scheduleMusic, 1500);
      return;
    }
    const now = context.currentTime + 0.03;
    playNote(context, MELODY[Math.floor(Math.random() * MELODY.length)], now, 3.0, 0.05);
    if (Math.random() < 0.4) playNote(context, MELODY[Math.floor(Math.random() * MELODY.length)], now + 0.3, 2.6, 0.03);
    if (Math.random() < 0.25) playNote(context, BASS[Math.floor(Math.random() * BASS.length)], now, 3.8, 0.04);
    musicTimer = setTimeout(scheduleMusic, 1900 + Math.random() * 1600);
  };

  const clearMusicTimer = () => {
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  };

  return {
    unlock() {
      const context = ensure();
      if (context && context.state === "suspended") void context.resume().catch(() => undefined);
      suspended = false;
    },

    applySettings(next) {
      settings = next;
      applyGains();
      // React to the music toggle: start or stop the loop to match intent.
      if (next.music && !musicWanted) this.startMusic();
      else if (!next.music && musicWanted) this.stopMusic();
    },

    playSfx(id) {
      if (!settings.sfx || typeof window === "undefined") return;
      const context = ensure();
      if (!context || !sfxGain) return;
      if (context.state === "suspended") void context.resume().catch(() => undefined);
      if (context.state !== "running") return;
      try {
        const cue = context.createGain();
        cue.gain.value = SFX_GAIN[id];
        cue.connect(sfxGain);
        synthSfx(context, cue, id);
      } catch {
        // Ignore transient audio failures — they must never affect gameplay.
      }
    },

    startMusic() {
      musicWanted = true;
      if (musicTimer || suspended) return; // already scheduling, or frozen
      scheduleMusic();
    },

    stopMusic() {
      musicWanted = false;
      clearMusicTimer();
    },

    suspend() {
      suspended = true;
      clearMusicTimer();
      const context = ctx;
      if (context && context.state === "running") void context.suspend().catch(() => undefined);
    },

    resume() {
      suspended = false;
      const context = ensure();
      if (context && context.state === "suspended") void context.resume().catch(() => undefined);
      if (musicWanted && !musicTimer) scheduleMusic();
    },

    teardown() {
      musicWanted = false;
      clearMusicTimer();
      const context = ctx;
      ctx = null;
      master = null;
      musicGain = null;
      sfxGain = null;
      reverb = null;
      if (context) {
        try {
          void context.close();
        } catch {
          // Already closing.
        }
      }
    },
  };
}

/* ------------------------------------------------------------------------- */
/* SFX synthesis                                                              */
/* ------------------------------------------------------------------------- */

type ToneOptions = {
  type?: OscillatorType;
  startAt: number;
  duration: number;
  frequency: number;
  endFrequency?: number;
  peak: number;
};

function tone(ctx: AudioContext, destination: AudioNode, o: ToneOptions): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.frequency, o.startAt);
  if (o.endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.endFrequency), o.startAt + o.duration);
  gain.gain.setValueAtTime(0.0001, o.startAt);
  gain.gain.exponentialRampToValueAtTime(o.peak, o.startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, o.startAt + o.duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(o.startAt);
  osc.stop(o.startAt + o.duration + 0.02);
}

function noise(ctx: AudioContext, destination: AudioNode, startAt: number, peak: number, duration: number, cutoff: number): void {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2.2);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  src.start(startAt);
  src.stop(startAt + duration + 0.02);
}

function synthSfx(ctx: AudioContext, out: AudioNode, id: SfxId): void {
  const t = ctx.currentTime;
  switch (id) {
    case "shoot":
      tone(ctx, out, { type: "square", startAt: t, duration: 0.08, frequency: 640, endFrequency: 900, peak: 0.5 });
      break;
    case "hit":
      noise(ctx, out, t, 0.5, 0.05, 2600);
      tone(ctx, out, { type: "triangle", startAt: t, duration: 0.06, frequency: 420, endFrequency: 300, peak: 0.3 });
      break;
    case "kill":
      noise(ctx, out, t, 0.5, 0.12, 1400);
      tone(ctx, out, { type: "square", startAt: t, duration: 0.14, frequency: 220, endFrequency: 90, peak: 0.4 });
      break;
    case "coreDamage":
      noise(ctx, out, t, 0.8, 0.2, 700);
      tone(ctx, out, { type: "sawtooth", startAt: t, duration: 0.24, frequency: 150, endFrequency: 60, peak: 0.4 });
      break;
    case "powerUp":
      [523.25, 659.25, 783.99].forEach((f, i) => tone(ctx, out, { type: "sine", startAt: t + i * 0.06, duration: 0.16, frequency: f, peak: 0.5 }));
      break;
    case "upgrade":
      [392, 523.25, 659.25, 880].forEach((f, i) => tone(ctx, out, { type: "triangle", startAt: t + i * 0.07, duration: 0.2, frequency: f, peak: 0.45 }));
      break;
    case "wave":
      tone(ctx, out, { type: "sawtooth", startAt: t, duration: 0.3, frequency: 180, endFrequency: 420, peak: 0.4 });
      tone(ctx, out, { type: "sine", startAt: t + 0.06, duration: 0.28, frequency: 440, peak: 0.3 });
      break;
    case "achievement":
      [659.25, 830.61, 987.77, 1318.51].forEach((f, i) => tone(ctx, out, { type: "triangle", startAt: t + i * 0.09, duration: 0.24, frequency: f, peak: 0.4 }));
      break;
    case "gameOver":
      [392, 330, 262, 196].forEach((f, i) => tone(ctx, out, { type: "triangle", startAt: t + i * 0.13, duration: 0.26, frequency: f, peak: 0.4 }));
      break;
    default:
      break;
  }
}

function createReverbImpulse(ctx: AudioContext, seconds = 2.2, decay = 2.6): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/* ------------------------------------------------------------------------- */
/* Singleton + haptics                                                        */
/* ------------------------------------------------------------------------- */

let engine: NeonAudio | null = null;

/** The process-wide audio engine. One graph is shared across mounts. */
export function getNeonAudio(): NeonAudio {
  if (!engine) engine = createEngine();
  return engine;
}

let lastVibrate = 0;

/**
 * Fire a haptic pulse, guarded three ways so it can't spam: the setting must be on,
 * the device must support `navigator.vibrate`, and pulses are throttled to at most
 * one every 60 ms.
 */
export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastVibrate < 60) return;
  lastVibrate = now;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if called outside a user gesture — ignore.
  }
}
