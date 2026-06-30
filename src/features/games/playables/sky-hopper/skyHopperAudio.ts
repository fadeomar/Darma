/**
 * Sky Hopper — audio.
 *
 * Cues are produced with the Web Audio API (soft arcade blips), so they are
 * original, normalized, and free of any network or licensing dependency. Matching
 * CC0 `.wav` files are shipped under `public/games/sky-hopper/sounds/` and used as
 * a graceful fallback when the Web Audio API is unavailable. Nothing plays before a
 * user gesture unlocks playback, and a mute flag silences everything.
 */

export type SkyHopperSound = "flap" | "point" | "hit" | "gameover" | "start" | "medal";

const SOUND_FILES: Record<SkyHopperSound, string> = {
  flap: "/games/sky-hopper/sounds/flap.wav",
  point: "/games/sky-hopper/sounds/point.wav",
  hit: "/games/sky-hopper/sounds/hit.wav",
  gameover: "/games/sky-hopper/sounds/gameover.wav",
  start: "/games/sky-hopper/sounds/start.wav",
  medal: "/games/sky-hopper/sounds/medal.wav",
};

// Normalized so no single cue is jarring relative to the others.
const EVENT_GAIN: Record<SkyHopperSound, number> = {
  flap: 0.32,
  point: 0.42,
  hit: 0.55,
  gameover: 0.5,
  start: 0.4,
  medal: 0.5,
};

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let supportsWebAudio = true;
const fileCache = new Map<SkyHopperSound, HTMLAudioElement>();

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
export function unlockSkyHopperAudio(): void {
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
  gain.gain.exponentialRampToValueAtTime(options.peak, options.startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, options.startAt + options.duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(options.startAt);
  osc.stop(options.startAt + options.duration + 0.02);
}

/** Short filtered-noise burst — the body of a "thud" or a "swoosh". */
function scheduleNoise(ctx: AudioContext, destination: AudioNode, startAt: number, peak: number, duration: number, cutoff: number): void {
  const frameCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frameCount, 2.2);
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

function synthesize(ctx: AudioContext, destination: AudioNode, sound: SkyHopperSound): void {
  const t = ctx.currentTime;
  switch (sound) {
    case "flap":
      scheduleTone(ctx, destination, { type: "triangle", startAt: t, duration: 0.12, frequency: 520, endFrequency: 760, peak: 0.28 });
      scheduleNoise(ctx, destination, t, 0.12, 0.06, 1800);
      break;
    case "point":
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.1, frequency: 880, peak: 0.26 });
      scheduleTone(ctx, destination, { type: "sine", startAt: t + 0.07, duration: 0.14, frequency: 1174.66, peak: 0.26 });
      break;
    case "hit":
      scheduleNoise(ctx, destination, t, 0.7, 0.14, 900);
      scheduleTone(ctx, destination, { type: "square", startAt: t, duration: 0.14, frequency: 180, endFrequency: 80, peak: 0.22 });
      break;
    case "gameover":
      [392, 330, 262, 196].forEach((freq, index) => {
        scheduleTone(ctx, destination, { type: "triangle", startAt: t + index * 0.12, duration: 0.22, frequency: freq, peak: 0.2 });
      });
      break;
    case "start":
      scheduleNoise(ctx, destination, t, 0.18, 0.22, 2600);
      scheduleTone(ctx, destination, { type: "sine", startAt: t, duration: 0.16, frequency: 440, endFrequency: 660, peak: 0.2 });
      break;
    case "medal":
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
        scheduleTone(ctx, destination, { type: "triangle", startAt: t + index * 0.1, duration: 0.24, frequency: freq, peak: 0.2 });
      });
      break;
  }
}

function playFile(sound: SkyHopperSound): void {
  if (typeof window === "undefined") return;
  try {
    let audio = fileCache.get(sound);
    if (!audio) {
      audio = new Audio(SOUND_FILES[sound]);
      audio.preload = "auto";
      fileCache.set(sound, audio);
    }
    audio.currentTime = 0;
    audio.volume = Math.min(1, EVENT_GAIN[sound]);
    void audio.play().catch(() => undefined);
  } catch {
    // Playback may be blocked until a trusted gesture unlocks audio — ignore.
  }
}

export function playSkyHopperSound(sound: SkyHopperSound, muted: boolean): void {
  if (muted || typeof window === "undefined") return;

  const ctx = getContext();
  if (!ctx || !masterGain) {
    playFile(sound);
    return;
  }
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
  try {
    const eventGain = ctx.createGain();
    eventGain.gain.value = EVENT_GAIN[sound];
    eventGain.connect(masterGain);
    synthesize(ctx, eventGain, sound);
  } catch {
    playFile(sound);
  }
}
