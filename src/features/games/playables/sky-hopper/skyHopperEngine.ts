/**
 * Sky Hopper — engine.
 *
 * A clean-room reimplementation of the classic "flap through the gaps" loop
 * (ready → playing → game over, gravity, flap impulse, obstacle spawning,
 * collision, score on pass). Ported notes vs. the vanilla original:
 *
 *  - The original advanced physics per frame (`speed += gravity`) assuming 60 fps.
 *    Here everything is integrated with real delta time (units/second) so speed is
 *    consistent across devices and refresh rates.
 *  - Obstacles spawn by horizontal spacing rather than a frame counter, so the
 *    cadence is independent of frame rate.
 *  - Collision uses circle-vs-rounded-rect instead of the original axis-aligned box.
 *  - A difficulty ramp shrinks the gap and raises speed with the score (bounded).
 *
 * The pure helpers (`circleRectOverlap`, `gapForScore`, `speedForScore`,
 * `medalForScore`) are exported for unit testing.
 */

import type { Medal, Pipe, SkyHopperConfig, SkyHopperModel, StepEvents } from "./skyHopperTypes";

/** Fixed logical play-field. The canvas renders this scaled to fit, at any DPI. */
export const WORLD = { width: 360, height: 640 } as const;

export const DEFAULT_CONFIG: SkyHopperConfig = {
  gravity: 1500,
  flapVelocity: 430,
  birdX: 96,
  birdRadius: 15,
  pipeWidth: 62,
  pipeSpacing: 210,
  gapStart: 180,
  gapMin: 124,
  gapStep: 1.6,
  speedStart: 138,
  speedMax: 232,
  speedStep: 1.7,
  groundHeight: 96,
  edgeMargin: 36,
};

/** Maximum delta time applied in a single step — prevents tunnelling after a stall/tab-switch. */
export const MAX_STEP_SECONDS = 1 / 30;

/**
 * Small deterministic PRNG (mulberry32). Seeded so tests are reproducible; the live
 * game seeds it from the clock for variety.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Passable gap height for a given score (shrinks with progress, clamped). */
export function gapForScore(score: number, config: SkyHopperConfig = DEFAULT_CONFIG): number {
  return Math.max(config.gapMin, config.gapStart - score * config.gapStep);
}

/** Horizontal scroll speed for a given score (rises with progress, clamped). */
export function speedForScore(score: number, config: SkyHopperConfig = DEFAULT_CONFIG): number {
  return Math.min(config.speedMax, config.speedStart + score * config.speedStep);
}

/** Award medals on the same tiers as the original game. */
export function medalForScore(score: number): Medal {
  if (score >= 40) return "platinum";
  if (score >= 30) return "gold";
  if (score >= 20) return "silver";
  if (score >= 10) return "bronze";
  return "none";
}

/** Circle vs. axis-aligned rectangle overlap (closest-point test). */
export function circleRectOverlap(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function spawnPipe(model: SkyHopperModel, x: number): Pipe {
  const gap = gapForScore(model.score, model.config);
  const minTop = model.config.edgeMargin;
  const maxTop = WORLD.height - model.config.groundHeight - model.config.edgeMargin - gap;
  const gapTop = minTop + model.rng() * Math.max(0, maxTop - minTop);
  return { x, gapTop, gap, scored: false };
}

/** Build a fresh run. The bird hovers at the ready position with no pipes yet. */
export function createGame(config: SkyHopperConfig = DEFAULT_CONFIG, seed = Date.now()): SkyHopperModel {
  return {
    bird: {
      x: config.birdX,
      y: WORLD.height * 0.42,
      radius: config.birdRadius,
      velocity: 0,
      wing: 0,
    },
    pipes: [],
    score: 0,
    distance: 0,
    config,
    rng: createRng(seed),
  };
}

/** Reset an existing model in place (used by "play again"). */
export function resetGame(model: SkyHopperModel, seed = Date.now()): void {
  model.bird.x = model.config.birdX;
  model.bird.y = WORLD.height * 0.42;
  model.bird.velocity = 0;
  model.bird.wing = 0;
  model.pipes = [];
  model.score = 0;
  model.distance = 0;
  model.rng = createRng(seed);
}

/** Apply an upward flap impulse. Capped near the ceiling so the bird can't fly off-screen. */
export function flap(model: SkyHopperModel): void {
  if (model.bird.y - model.bird.radius <= 0) {
    model.bird.velocity = 0;
    return;
  }
  model.bird.velocity = -model.config.flapVelocity;
  model.bird.wing = 0.18;
}

/** Gentle bob while on the ready screen (no gravity, no collisions). */
export function idleStep(model: SkyHopperModel, dt: number, elapsed: number): void {
  model.bird.y = WORLD.height * 0.42 + Math.sin(elapsed * 3) * 8;
  model.bird.wing = Math.max(0, model.bird.wing - dt);
}

/**
 * Advance the simulation by `dt` seconds while playing. Mutates the model and
 * returns the discrete events (scored / hit) so the caller can play audio and
 * update React state only when something actually happens — never per frame.
 */
export function update(model: SkyHopperModel, dt: number): StepEvents {
  const step = Math.min(dt, MAX_STEP_SECONDS);
  const events: StepEvents = { scored: false, hit: false, score: model.score };
  const { config, bird } = model;
  const speed = speedForScore(model.score, config);

  // Bird physics (semi-implicit Euler).
  bird.velocity += config.gravity * step;
  bird.y += bird.velocity * step;
  bird.wing = Math.max(0, bird.wing - step);
  model.distance += speed * step;

  // Spawn obstacles by horizontal spacing so cadence is frame-rate independent.
  const lastPipe = model.pipes[model.pipes.length - 1];
  if (!lastPipe || lastPipe.x <= WORLD.width - config.pipeSpacing) {
    model.pipes.push(spawnPipe(model, WORLD.width));
  }

  const groundY = WORLD.height - config.groundHeight;

  // Move pipes, score, and detect collisions.
  for (const pipe of model.pipes) {
    pipe.x -= speed * step;

    if (!pipe.scored && pipe.x + config.pipeWidth < bird.x) {
      pipe.scored = true;
      model.score += 1;
      events.scored = true;
      events.score = model.score;
    }

    if (
      circleRectOverlap(bird.x, bird.y, bird.radius, pipe.x, 0, config.pipeWidth, pipe.gapTop) ||
      circleRectOverlap(
        bird.x,
        bird.y,
        bird.radius,
        pipe.x,
        pipe.gapTop + pipe.gap,
        config.pipeWidth,
        WORLD.height,
      )
    ) {
      events.hit = true;
    }
  }

  // Drop pipes that have fully scrolled off the left edge.
  while (model.pipes.length > 0 && model.pipes[0].x + config.pipeWidth < -8) {
    model.pipes.shift();
  }

  // Ground / ceiling.
  if (bird.y + bird.radius >= groundY) {
    bird.y = groundY - bird.radius;
    bird.velocity = 0;
    events.hit = true;
  }
  if (bird.y - bird.radius <= 0) {
    bird.y = bird.radius;
    if (bird.velocity < 0) bird.velocity = 0;
  }

  return events;
}
