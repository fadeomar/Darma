import type { FloppyBirdConfig, FloppyBirdModel, Medal, PipePair, StepEvents } from "./floppyBirdTypes";

export const WORLD = { width: 288, height: 512 } as const;

export const DEFAULT_CONFIG: FloppyBirdConfig = {
  gravity: 930,
  flapVelocity: 305,
  birdX: 86,
  birdWidth: 34,
  birdHeight: 24,
  pipeWidth: 52,
  pipeSpacing: 156,
  gapStart: 106,
  gapMin: 88,
  gapStep: 0.55,
  speedStart: 118,
  speedMax: 172,
  speedStep: 0.9,
  groundHeight: 112,
  edgeMargin: 36,
};

export const MAX_STEP_SECONDS = 1 / 30;

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

export function gapForScore(score: number, config: FloppyBirdConfig = DEFAULT_CONFIG): number {
  return Math.max(config.gapMin, config.gapStart - score * config.gapStep);
}

export function speedForScore(score: number, config: FloppyBirdConfig = DEFAULT_CONFIG): number {
  return Math.min(config.speedMax, config.speedStart + score * config.speedStep);
}

export function medalForScore(score: number): Medal {
  if (score >= 40) return "platinum";
  if (score >= 30) return "gold";
  if (score >= 20) return "silver";
  if (score >= 10) return "bronze";
  return "none";
}

export function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function spawnPipe(model: FloppyBirdModel, x: number): PipePair {
  const gap = gapForScore(model.score, model.config);
  const groundY = WORLD.height - model.config.groundHeight;
  const minGapY = model.config.edgeMargin + gap / 2;
  const maxGapY = groundY - model.config.edgeMargin - gap / 2;
  const gapY = minGapY + model.rng() * Math.max(0, maxGapY - minGapY);
  return { x, gapY, gap, scored: false, color: model.pipeColor };
}

export function createGame(config: FloppyBirdConfig = DEFAULT_CONFIG, seed = Date.now()): FloppyBirdModel {
  const pipeColor = seed % 2 === 0 ? "green" : "red";
  return {
    bird: {
      x: config.birdX,
      y: WORLD.height * 0.42,
      width: config.birdWidth,
      height: config.birdHeight,
      velocity: 0,
      wingTimer: 0,
    },
    pipes: [],
    score: 0,
    distance: 0,
    config,
    rng: createRng(seed),
    pipeColor,
  };
}

export function resetGame(model: FloppyBirdModel, seed = Date.now()): void {
  model.bird.x = model.config.birdX;
  model.bird.y = WORLD.height * 0.42;
  model.bird.velocity = 0;
  model.bird.wingTimer = 0;
  model.pipes = [];
  model.score = 0;
  model.distance = 0;
  model.rng = createRng(seed);
  model.pipeColor = seed % 2 === 0 ? "green" : "red";
}

export function flap(model: FloppyBirdModel): void {
  const { bird } = model;
  if (bird.y - bird.height / 2 <= 0) {
    bird.velocity = 0;
    return;
  }
  bird.velocity = -model.config.flapVelocity;
  bird.wingTimer = 0.18;
}

export function idleStep(model: FloppyBirdModel, dt: number, elapsed: number): void {
  model.bird.y = WORLD.height * 0.42 + Math.sin(elapsed * 3.2) * 7;
  model.bird.wingTimer = Math.max(0, model.bird.wingTimer - dt);
  model.distance += speedForScore(0, model.config) * dt * 0.35;
}

export function update(model: FloppyBirdModel, dt: number): StepEvents {
  const step = Math.min(dt, MAX_STEP_SECONDS);
  const events: StepEvents = { scored: false, hit: false, score: model.score };
  const { bird, config } = model;
  const speed = speedForScore(model.score, config);
  const groundY = WORLD.height - config.groundHeight;

  bird.velocity += config.gravity * step;
  bird.y += bird.velocity * step;
  bird.wingTimer = Math.max(0, bird.wingTimer - step);
  model.distance += speed * step;

  const lastPipe = model.pipes[model.pipes.length - 1];
  if (!lastPipe || lastPipe.x <= WORLD.width - config.pipeSpacing) {
    model.pipes.push(spawnPipe(model, WORLD.width + config.pipeWidth));
  }

  const birdBox = {
    x: bird.x - bird.width * 0.36,
    y: bird.y - bird.height * 0.36,
    w: bird.width * 0.72,
    h: bird.height * 0.72,
  };

  for (const pipe of model.pipes) {
    pipe.x -= speed * step;
    const gapTop = pipe.gapY - pipe.gap / 2;
    const gapBottom = pipe.gapY + pipe.gap / 2;

    if (!pipe.scored && pipe.x + config.pipeWidth < bird.x - bird.width / 2) {
      pipe.scored = true;
      model.score += 1;
      events.scored = true;
      events.score = model.score;
    }

    if (
      rectsOverlap(birdBox.x, birdBox.y, birdBox.w, birdBox.h, pipe.x, 0, config.pipeWidth, gapTop) ||
      rectsOverlap(birdBox.x, birdBox.y, birdBox.w, birdBox.h, pipe.x, gapBottom, config.pipeWidth, groundY - gapBottom)
    ) {
      events.hit = true;
    }
  }

  while (model.pipes.length > 0 && model.pipes[0].x + config.pipeWidth < -4) {
    model.pipes.shift();
  }

  if (bird.y + bird.height / 2 >= groundY) {
    bird.y = groundY - bird.height / 2;
    bird.velocity = 0;
    events.hit = true;
  }

  if (bird.y - bird.height / 2 <= 0) {
    bird.y = bird.height / 2;
    if (bird.velocity < 0) bird.velocity = 0;
  }

  return events;
}
