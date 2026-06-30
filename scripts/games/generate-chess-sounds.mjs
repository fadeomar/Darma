// Generates the Chess Mini sound effects as small, normalized, mono 16-bit WAV files.
//
// These assets are 100% original and synthesized from scratch (no third-party audio
// was downloaded or sampled), so they are released into the public domain under CC0.
// They mirror the runtime Web Audio synth in chessSounds.ts and act as a graceful
// fallback for browsers without Web Audio support.
//
// Run with: node scripts/games/generate-chess-sounds.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050; // plenty for short UI cues; keeps files tiny
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "games", "chess-mini", "sounds");

function createTrack(durationSeconds) {
  return new Float32Array(Math.ceil(SAMPLE_RATE * durationSeconds));
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
    let sample;
    if (type === "triangle") {
      sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
    } else {
      sample = Math.sin(phase);
    }
    // Fast attack, exponential decay envelope.
    const attack = Math.min(1, i / (0.008 * SAMPLE_RATE));
    const decay = Math.pow(1 - progress, 2);
    track[index] += sample * peak * attack * decay;
  }
}

function addKnock(track, { start, duration, peak, decayPower = 2.4 }) {
  const startSample = Math.floor(start * SAMPLE_RATE);
  const lengthSamples = Math.floor(duration * SAMPLE_RATE);
  let previous = 0;
  for (let i = 0; i < lengthSamples; i += 1) {
    const index = startSample + i;
    if (index >= track.length) break;
    const progress = i / lengthSamples;
    const noise = Math.random() * 2 - 1;
    // Simple low-pass (one-pole) to give the noise a wooden body rather than a hiss.
    previous = previous * 0.6 + noise * 0.4;
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
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
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
  "chess-move": () => {
    const track = createTrack(0.12);
    addKnock(track, { start: 0, duration: 0.075, peak: 0.6 });
    addTone(track, { start: 0, duration: 0.07, frequency: 180, endFrequency: 120, peak: 0.18 });
    return track;
  },
  "chess-capture": () => {
    const track = createTrack(0.18);
    addKnock(track, { start: 0, duration: 0.11, peak: 0.9, decayPower: 2 });
    addKnock(track, { start: 0.02, duration: 0.07, peak: 0.5 });
    addTone(track, { start: 0, duration: 0.12, frequency: 150, endFrequency: 90, peak: 0.22, type: "triangle" });
    return track;
  },
  "chess-check": () => {
    const track = createTrack(0.32);
    addTone(track, { start: 0, duration: 0.12, frequency: 660, peak: 0.4 });
    addTone(track, { start: 0.11, duration: 0.16, frequency: 880, peak: 0.4 });
    return track;
  },
  "chess-start": () => {
    const track = createTrack(0.4);
    addTone(track, { start: 0, duration: 0.16, frequency: 440, peak: 0.4 });
    addTone(track, { start: 0.12, duration: 0.22, frequency: 660, peak: 0.4 });
    return track;
  },
  "chess-win": () => {
    const track = createTrack(0.55);
    [523.25, 659.25, 783.99].forEach((freq, index) => {
      addTone(track, { start: index * 0.13, duration: 0.26, frequency: freq, peak: 0.4, type: "triangle" });
    });
    return track;
  },
  "chess-lose": () => {
    const track = createTrack(0.6);
    [392, 329.63, 261.63].forEach((freq, index) => {
      addTone(track, { start: index * 0.15, duration: 0.3, frequency: freq, peak: 0.38 });
    });
    return track;
  },
  "chess-draw": () => {
    const track = createTrack(0.46);
    addTone(track, { start: 0, duration: 0.22, frequency: 523.25, peak: 0.36 });
    addTone(track, { start: 0.16, duration: 0.26, frequency: 493.88, peak: 0.36 });
    return track;
  },
  "chess-end": () => {
    const track = createTrack(0.46);
    addTone(track, { start: 0, duration: 0.22, frequency: 523.25, peak: 0.36 });
    addTone(track, { start: 0.16, duration: 0.26, frequency: 493.88, peak: 0.36 });
    return track;
  },
  "chess-invalid": () => {
    const track = createTrack(0.08);
    addKnock(track, { start: 0, duration: 0.05, peak: 0.3, decayPower: 3 });
    addTone(track, { start: 0, duration: 0.05, frequency: 150, peak: 0.12 });
    return track;
  },
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, build] of Object.entries(SOUNDS)) {
  const track = normalize(build());
  const wav = toWav(track);
  writeFileSync(join(OUT_DIR, `${name}.wav`), wav);
  console.log(`wrote ${name}.wav (${wav.length} bytes)`);
}
console.log(`\nDone. ${Object.keys(SOUNDS).length} files written to ${OUT_DIR}`);
