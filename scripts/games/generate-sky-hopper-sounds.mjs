// Generates the Sky Hopper sound effects as small, normalized, mono 16-bit WAV files.
//
// These assets are 100% original and synthesized from scratch (no third-party audio
// was downloaded or sampled), so they are released into the public domain under CC0.
// They mirror the runtime Web Audio synth in skyHopperAudio.ts and act as a graceful
// fallback for browsers without Web Audio support.
//
// Run with: node scripts/games/generate-sky-hopper-sounds.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "games", "sky-hopper", "sounds");

function createTrack(seconds) {
  return new Float32Array(Math.ceil(SAMPLE_RATE * seconds));
}

function addTone(track, { start, duration, frequency, endFrequency = frequency, peak, type = "sine" }) {
  const startSample = Math.floor(start * SAMPLE_RATE);
  const lengthSamples = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < lengthSamples; i += 1) {
    const index = startSample + i;
    if (index >= track.length) break;
    const progress = i / lengthSamples;
    const freq = frequency + (endFrequency - frequency) * progress;
    const phase = (2 * Math.PI * freq * i) / SAMPLE_RATE;
    const sample = type === "triangle" ? (2 / Math.PI) * Math.asin(Math.sin(phase)) : type === "square" ? Math.sign(Math.sin(phase)) : Math.sin(phase);
    const attack = Math.min(1, i / (0.01 * SAMPLE_RATE));
    const decay = Math.pow(1 - progress, 2);
    track[index] += sample * peak * attack * decay;
  }
}

function addNoise(track, { start, duration, peak, decayPower = 2.2, lowpass = 0.5 }) {
  const startSample = Math.floor(start * SAMPLE_RATE);
  const lengthSamples = Math.floor(duration * SAMPLE_RATE);
  let previous = 0;
  for (let i = 0; i < lengthSamples; i += 1) {
    const index = startSample + i;
    if (index >= track.length) break;
    const progress = i / lengthSamples;
    const noise = Math.random() * 2 - 1;
    previous = previous * (1 - lowpass) + noise * lowpass;
    track[index] += previous * peak * Math.pow(1 - progress, decayPower);
  }
}

function normalize(track, target = 0.9) {
  let max = 0;
  for (const sample of track) max = Math.max(max, Math.abs(sample));
  if (max === 0) return track;
  const factor = Math.min(1, target / max);
  for (let i = 0; i < track.length; i += 1) track[i] *= factor;
  return track;
}

function toWav(track) {
  const numSamples = track.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i += 1) {
    const clamped = Math.max(-1, Math.min(1, track[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

const SOUNDS = {
  flap: () => {
    const t = createTrack(0.14);
    addTone(t, { type: "triangle", start: 0, duration: 0.12, frequency: 520, endFrequency: 760, peak: 0.6 });
    addNoise(t, { start: 0, duration: 0.06, peak: 0.25, lowpass: 0.2 });
    return t;
  },
  point: () => {
    const t = createTrack(0.24);
    addTone(t, { start: 0, duration: 0.1, frequency: 880, peak: 0.5 });
    addTone(t, { start: 0.07, duration: 0.14, frequency: 1174.66, peak: 0.5 });
    return t;
  },
  hit: () => {
    const t = createTrack(0.2);
    addNoise(t, { start: 0, duration: 0.14, peak: 0.9, decayPower: 1.8, lowpass: 0.35 });
    addTone(t, { type: "square", start: 0, duration: 0.14, frequency: 180, endFrequency: 80, peak: 0.3 });
    return t;
  },
  gameover: () => {
    const t = createTrack(0.6);
    [392, 330, 262, 196].forEach((freq, index) => {
      addTone(t, { type: "triangle", start: index * 0.12, duration: 0.22, frequency: freq, peak: 0.42 });
    });
    return t;
  },
  start: () => {
    const t = createTrack(0.26);
    addNoise(t, { start: 0, duration: 0.22, peak: 0.3, decayPower: 1.6, lowpass: 0.12 });
    addTone(t, { start: 0, duration: 0.16, frequency: 440, endFrequency: 660, peak: 0.4 });
    return t;
  },
  medal: () => {
    const t = createTrack(0.5);
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      addTone(t, { type: "triangle", start: index * 0.1, duration: 0.24, frequency: freq, peak: 0.42 });
    });
    return t;
  },
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, build] of Object.entries(SOUNDS)) {
  const wav = toWav(normalize(build()));
  writeFileSync(join(OUT_DIR, `${name}.wav`), wav);
  console.log(`wrote ${name}.wav (${wav.length} bytes)`);
}
console.log(`\nDone. ${Object.keys(SOUNDS).length} files written to ${OUT_DIR}`);
