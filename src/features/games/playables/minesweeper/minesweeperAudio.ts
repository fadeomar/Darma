export type MinesweeperSound = "start" | "reveal" | "number" | "flag" | "boom" | "gameover" | "win";

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let supportsWebAudio = true;
let lastRevealAt = 0;

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
    masterGain.gain.value = 0.72;
    masterGain.connect(context.destination);
    return context;
  } catch {
    supportsWebAudio = false;
    return null;
  }
}

export function unlockMinesweeperAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
}

function tone(ctx: AudioContext, destination: AudioNode, frequency: number, start: number, duration: number, gainValue: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function noise(ctx: AudioContext, destination: AudioNode, start: number, duration: number, gainValue: number, cutoff = 800) {
  const frames = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2.4);
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(start);
  source.stop(start + duration + 0.03);
}

function playPattern(sound: MinesweeperSound, ctx: AudioContext, destination: AudioNode) {
  const t = ctx.currentTime;

  switch (sound) {
    case "start":
      tone(ctx, destination, 440, t, 0.09, 0.22, "triangle");
      tone(ctx, destination, 660, t + 0.08, 0.12, 0.2, "triangle");
      break;
    case "reveal":
      noise(ctx, destination, t, 0.045, 0.13, 2400);
      tone(ctx, destination, 520, t, 0.055, 0.08, "triangle");
      break;
    case "number":
      tone(ctx, destination, 740, t, 0.06, 0.14, "sine");
      break;
    case "flag":
      tone(ctx, destination, 330, t, 0.045, 0.13, "square");
      tone(ctx, destination, 495, t + 0.035, 0.065, 0.12, "square");
      break;
    case "boom":
      noise(ctx, destination, t, 0.22, 0.7, 700);
      tone(ctx, destination, 160, t, 0.18, 0.25, "sawtooth");
      break;
    case "gameover":
      [330, 277, 220, 165].forEach((frequency, index) => tone(ctx, destination, frequency, t + index * 0.11, 0.16, 0.18, "triangle"));
      break;
    case "win":
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(ctx, destination, frequency, t + index * 0.085, 0.18, 0.18, "triangle"));
      break;
  }
}

export function playMinesweeperSound(sound: MinesweeperSound, muted: boolean): void {
  if (muted || typeof window === "undefined") return;

  const now = window.performance.now();
  if ((sound === "reveal" || sound === "number") && now - lastRevealAt < 38) return;
  if (sound === "reveal" || sound === "number") lastRevealAt = now;

  const ctx = getContext();
  if (!ctx || !masterGain) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

  try {
    const eventGain = ctx.createGain();
    eventGain.gain.value = 1;
    eventGain.connect(masterGain);
    playPattern(sound, ctx, eventGain);
    window.setTimeout(() => eventGain.disconnect(), 900);
  } catch {
    // Sound must never interrupt gameplay.
  }
}
