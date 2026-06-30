/**
 * Chess Mini audio.
 *
 * Sounds are produced with the Web Audio API so they are board-game appropriate
 * (soft wooden piece moves, a stronger capture knock, a subtle check alert, and
 * elegant win/lose/draw chords), normalized in volume, and free of any network or
 * licensing dependency. Matching CC0 `.wav` files are shipped under
 * `public/games/chess-mini/sounds/` and used as a graceful fallback when the Web
 * Audio API is unavailable. No audio plays before a user gesture unlocks playback.
 */

export type ChessSoundEvent = "start" | "move" | "capture" | "check" | "win" | "lose" | "draw" | "end" | "invalid";

const SOUND_FILES: Record<ChessSoundEvent, string> = {
  start: "/games/chess-mini/sounds/chess-start.wav",
  move: "/games/chess-mini/sounds/chess-move.wav",
  capture: "/games/chess-mini/sounds/chess-capture.wav",
  check: "/games/chess-mini/sounds/chess-check.wav",
  win: "/games/chess-mini/sounds/chess-win.wav",
  lose: "/games/chess-mini/sounds/chess-lose.wav",
  draw: "/games/chess-mini/sounds/chess-draw.wav",
  end: "/games/chess-mini/sounds/chess-end.wav",
  invalid: "/games/chess-mini/sounds/chess-invalid.wav",
};

// Normalized so no single cue is jarring relative to the others.
const EVENT_GAIN: Record<ChessSoundEvent, number> = {
  start: 0.5,
  move: 0.42,
  capture: 0.62,
  check: 0.5,
  win: 0.55,
  lose: 0.5,
  draw: 0.48,
  end: 0.48,
  invalid: 0.26,
};

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let supportsWebAudio = true;
const fileCache = new Map<ChessSoundEvent, HTMLAudioElement>();

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
    masterGain.gain.value = 0.9;
    masterGain.connect(context.destination);
    return context;
  } catch {
    supportsWebAudio = false;
    return null;
  }
}

/** Unlock/resume the audio context inside a trusted user gesture (no autoplay). */
export function unlockChessAudio(): void {
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
  gain.gain.exponentialRampToValueAtTime(options.peak, options.startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, options.startAt + options.duration);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(options.startAt);
  osc.stop(options.startAt + options.duration + 0.02);
}

/** A short filtered noise burst — the "wooden" body of a piece hitting the board. */
function scheduleKnock(ctx: AudioContext, destination: AudioNode, startAt: number, peak: number, duration: number, cutoff: number): void {
  const frameCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) {
    // Exponential decay shapes the burst into a percussive knock.
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frameCount, 2.4);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(startAt);
  source.stop(startAt + duration + 0.02);
}

function synthesize(ctx: AudioContext, destination: AudioNode, event: ChessSoundEvent): void {
  const t = ctx.currentTime;

  switch (event) {
    case "move":
      scheduleKnock(ctx, destination, t, 0.6, 0.075, 900);
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.07, frequency: 180, endFrequency: 120, peak: 0.18 });
      break;
    case "capture":
      scheduleKnock(ctx, destination, t, 0.9, 0.11, 1400);
      scheduleKnock(ctx, destination, t + 0.02, 0.5, 0.07, 700);
      scheduleTone(ctx, destination, { type: "triangle", startAt: t, duration: 0.12, frequency: 150, endFrequency: 90, peak: 0.22 });
      break;
    case "check":
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.12, frequency: 660, peak: 0.2 });
      scheduleTone(ctx, destination, { type: "sine", startAt: t + 0.11, duration: 0.16, frequency: 880, peak: 0.2 });
      break;
    case "start":
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.16, frequency: 440, peak: 0.2 });
      scheduleTone(ctx, destination, { type: "sine", startAt: t + 0.12, duration: 0.22, frequency: 660, peak: 0.2 });
      break;
    case "win":
      [523.25, 659.25, 783.99].forEach((freq, index) => {
        scheduleTone(ctx, destination, { type: "triangle", startAt: t + index * 0.13, duration: 0.26, frequency: freq, peak: 0.2 });
      });
      break;
    case "lose":
      [392, 329.63, 261.63].forEach((freq, index) => {
        scheduleTone(ctx, destination, { type: "sine", startAt: t + index * 0.15, duration: 0.3, frequency: freq, peak: 0.18 });
      });
      break;
    case "draw":
    case "end":
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.22, frequency: 523.25, peak: 0.18 });
      scheduleTone(ctx, destination, { type: "sine", startAt: t + 0.16, duration: 0.26, frequency: 493.88, peak: 0.18 });
      break;
    case "invalid":
      scheduleKnock(ctx, destination, t, 0.3, 0.05, 450);
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.05, frequency: 150, peak: 0.12 });
      break;
  }
}

function playFile(event: ChessSoundEvent): void {
  if (typeof window === "undefined") return;
  try {
    let audio = fileCache.get(event);
    if (!audio) {
      audio = new Audio(SOUND_FILES[event]);
      audio.preload = "auto";
      fileCache.set(event, audio);
    }
    audio.currentTime = 0;
    audio.volume = Math.min(1, EVENT_GAIN[event]);
    void audio.play().catch(() => undefined);
  } catch {
    // Browsers may block playback until a trusted gesture unlocks audio — ignore.
  }
}

export function playChessSound(enabled: boolean, event: ChessSoundEvent): void {
  if (!enabled || typeof window === "undefined") return;

  const ctx = getContext();
  if (!ctx || !masterGain) {
    // No Web Audio support — fall back to the shipped CC0 .wav assets.
    playFile(event);
    return;
  }

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }

  try {
    const eventGain = ctx.createGain();
    eventGain.gain.value = EVENT_GAIN[event];
    eventGain.connect(masterGain);
    synthesize(ctx, eventGain, event);
  } catch {
    playFile(event);
  }
}
