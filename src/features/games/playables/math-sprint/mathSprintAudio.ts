/**
 * Math Sprint — audio.
 *
 * Short, soft, learning-appropriate cues produced with the Web Audio API (no
 * files, no network, no licensing concerns). Tones are gentle and brief so they
 * never feel childish or annoying during fast practice. Nothing plays before a
 * user gesture unlocks playback, and a mute flag silences everything.
 */

export type MathSprintSound = "correct" | "wrong" | "start" | "finish" | "newbest";

const EVENT_GAIN: Record<MathSprintSound, number> = {
  correct: 0.3,
  wrong: 0.26,
  start: 0.34,
  finish: 0.36,
  newbest: 0.4,
};

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let supportsWebAudio = true;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  if (!supportsWebAudio) return null;

  const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) {
    supportsWebAudio = false;
    return null;
  }
  try {
    context = new Ctor();
    masterGain = context.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(context.destination);
    return context;
  } catch {
    supportsWebAudio = false;
    return null;
  }
}

/** Unlock/resume the audio context inside a trusted user gesture (no autoplay). */
export function unlockMathSprintAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
}

type ToneOptions = {
  type?: OscillatorType;
  startAt: number;
  duration: number;
  frequency: number;
  endFrequency?: number;
  peak: number;
};

function scheduleTone(ctx: AudioContext, destination: AudioNode, options: ToneOptions): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type ?? "sine";
  osc.frequency.setValueAtTime(options.frequency, options.startAt);
  if (options.endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), options.startAt + options.duration);
  }
  gain.gain.setValueAtTime(0.0001, options.startAt);
  gain.gain.exponentialRampToValueAtTime(options.peak, options.startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, options.startAt + options.duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(options.startAt);
  osc.stop(options.startAt + options.duration + 0.02);
}

function synthesize(ctx: AudioContext, destination: AudioNode, sound: MathSprintSound): void {
  const t = ctx.currentTime;
  switch (sound) {
    case "correct":
      // Soft rising two-note "ding".
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.09, frequency: 660, peak: 0.3 });
      scheduleTone(ctx, destination, { type: "sine", startAt: t + 0.07, duration: 0.13, frequency: 880, peak: 0.3 });
      break;
    case "wrong":
      // Gentle low "uh" — not harsh.
      scheduleTone(ctx, destination, { type: "triangle", startAt: t, duration: 0.16, frequency: 200, endFrequency: 150, peak: 0.28 });
      break;
    case "start":
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.12, frequency: 523.25, peak: 0.26 });
      scheduleTone(ctx, destination, { type: "sine", startAt: t + 0.1, duration: 0.16, frequency: 783.99, peak: 0.26 });
      break;
    case "finish":
      [523.25, 659.25, 783.99].forEach((freq, index) => {
        scheduleTone(ctx, destination, { type: "sine", startAt: t + index * 0.12, duration: 0.2, frequency: freq, peak: 0.24 });
      });
      break;
    case "newbest":
      [659.25, 783.99, 987.77, 1318.51].forEach((freq, index) => {
        scheduleTone(ctx, destination, { type: "triangle", startAt: t + index * 0.1, duration: 0.22, frequency: freq, peak: 0.24 });
      });
      break;
  }
}

export function playMathSprintSound(sound: MathSprintSound, muted: boolean): void {
  if (muted || typeof window === "undefined") return;
  const ctx = getContext();
  if (!ctx || !masterGain) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
  try {
    const eventGain = ctx.createGain();
    eventGain.gain.value = EVENT_GAIN[sound];
    eventGain.connect(masterGain);
    synthesize(ctx, eventGain, sound);
  } catch {
    // Ignore audio failures — they must never affect gameplay.
  }
}
