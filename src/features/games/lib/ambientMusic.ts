// Generative calm ambient music for game backgrounds.
//
// Instead of a sustained two-oscillator drone (which reads as a harsh "machine"
// tone), this plays sparse, soft notes drawn from a major-pentatonic scale — so
// every note is consonant and the result always sounds pleasant. Each note has a
// slow bell / music-box envelope and is fed through a synthesized reverb, giving
// long natural tails that blend into gentle, relaxing music.
//
// Shared by multiple games. SSR-safe: nothing touches `window` until `start()`
// is called (the host passes in an `ensure` that lazily creates the context).

export type AmbientMusic = {
  start: () => void;
  stop: () => void;
};

type EnsureContext = () => AudioContext | null;

// C major pentatonic across two octaves — warm and relaxing, no dissonant steps.
const MELODY = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
// Low roots for the occasional grounding note (C3, G3 — a consonant fifth).
const BASS = [130.81, 196.0];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Decaying-noise impulse response → a soft, spacious reverb without any asset.
function createReverbImpulse(ctx: AudioContext, seconds = 2.8, decay = 2.4) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export function createAmbientMusic(ensure: EnsureContext): AmbientMusic {
  let master: GainNode | null = null;
  let reverb: ConvolverNode | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  // One soft note: sine fundamental + quiet octave for warmth, slow attack and
  // long release, sent both dry (to master) and wet (to reverb).
  const playNote = (ctx: AudioContext, freq: number, when: number, duration: number, level: number) => {
    if (!master || !reverb) return;
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    const env = ctx.createGain();

    osc.type = "sine";
    harmonic.type = "triangle";
    osc.frequency.value = freq;
    harmonic.frequency.value = freq * 2;
    osc.detune.value = (Math.random() - 0.5) * 5;
    harmonicGain.gain.value = 0.16;

    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(level, when + 0.4); // gentle swell in
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration); // long fade out

    osc.connect(env);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(env);
    env.connect(master);
    env.connect(reverb);

    osc.start(when);
    harmonic.start(when);
    osc.stop(when + duration + 0.05);
    harmonic.stop(when + duration + 0.05);
  };

  const scheduleNext = () => {
    if (!running) return;
    const ctx = ensure();
    if (!ctx || !master) {
      timer = setTimeout(scheduleNext, 2000);
      return;
    }
    const now = ctx.currentTime + 0.02;

    // Lead note.
    playNote(ctx, pick(MELODY), now, 3.2, 0.06);

    // Sometimes a soft companion note a beat later (a gentle two-note phrase).
    if (Math.random() < 0.4) {
      playNote(ctx, pick(MELODY), now + 0.28, 3.0, 0.035);
    }

    // Occasional low root to ground the harmony.
    if (Math.random() < 0.22) {
      playNote(ctx, pick(BASS), now, 4.2, 0.045);
    }

    // Relaxed pacing: a new phrase every ~2–3.8s.
    timer = setTimeout(scheduleNext, 2000 + Math.random() * 1800);
  };

  return {
    start() {
      const ctx = ensure();
      if (!ctx || running) return;
      running = true;

      master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 1.4); // soft fade-in
      master.connect(ctx.destination);

      reverb = ctx.createConvolver();
      reverb.buffer = createReverbImpulse(ctx);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.7;
      reverb.connect(reverbGain);
      reverbGain.connect(master);

      scheduleNext();
    },
    stop() {
      running = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const ctx = ensure();
      const m = master;
      const r = reverb;
      master = null;
      reverb = null;
      if (!ctx || !m) return;
      const t = ctx.currentTime;
      m.gain.cancelScheduledValues(t);
      m.gain.setValueAtTime(Math.max(0.0001, m.gain.value), t);
      m.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); // graceful fade-out
      setTimeout(() => {
        try {
          m.disconnect();
          r?.disconnect();
        } catch {
          /* already torn down */
        }
      }, 900);
    },
  };
}
