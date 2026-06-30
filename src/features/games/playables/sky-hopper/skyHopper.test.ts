import { describe, expect, it } from "vitest";
import {
  circleRectOverlap,
  createGame,
  DEFAULT_CONFIG,
  flap,
  gapForScore,
  medalForScore,
  resetGame,
  speedForScore,
  update,
  WORLD,
} from "./skyHopperEngine";

describe("Sky Hopper engine — collision", () => {
  it("detects a circle overlapping a rectangle", () => {
    expect(circleRectOverlap(50, 50, 10, 55, 40, 20, 40)).toBe(true);
  });

  it("reports no overlap when the circle is clear of the rectangle", () => {
    expect(circleRectOverlap(50, 50, 10, 80, 80, 20, 20)).toBe(false);
  });

  it("treats a touch just outside the radius as clear (closest-point test)", () => {
    // Circle centre at x=0, rect starts at x=11; nearest edge is 11 away > r=10.
    expect(circleRectOverlap(0, 0, 10, 11, -20, 10, 40)).toBe(false);
    expect(circleRectOverlap(0, 0, 10, 9, -20, 10, 40)).toBe(true);
  });
});

describe("Sky Hopper engine — difficulty ramp", () => {
  it("shrinks the gap as the score rises but never below the floor", () => {
    expect(gapForScore(0)).toBe(DEFAULT_CONFIG.gapStart);
    expect(gapForScore(5)).toBeLessThan(gapForScore(0));
    expect(gapForScore(1000)).toBe(DEFAULT_CONFIG.gapMin);
    expect(gapForScore(1000)).toBeGreaterThanOrEqual(DEFAULT_CONFIG.gapMin);
  });

  it("raises the speed as the score rises but never above the cap", () => {
    expect(speedForScore(0)).toBe(DEFAULT_CONFIG.speedStart);
    expect(speedForScore(5)).toBeGreaterThan(speedForScore(0));
    expect(speedForScore(1000)).toBe(DEFAULT_CONFIG.speedMax);
    expect(speedForScore(1000)).toBeLessThanOrEqual(DEFAULT_CONFIG.speedMax);
  });

  it("keeps the gap large enough to fit the bird at the hardest setting", () => {
    expect(DEFAULT_CONFIG.gapMin).toBeGreaterThan(DEFAULT_CONFIG.birdRadius * 3);
  });
});

describe("Sky Hopper engine — medals", () => {
  it("awards medals on the classic tiers", () => {
    expect(medalForScore(0)).toBe("none");
    expect(medalForScore(9)).toBe("none");
    expect(medalForScore(10)).toBe("bronze");
    expect(medalForScore(20)).toBe("silver");
    expect(medalForScore(30)).toBe("gold");
    expect(medalForScore(40)).toBe("platinum");
    expect(medalForScore(99)).toBe("platinum");
  });
});

describe("Sky Hopper engine — scoring & state", () => {
  it("scores exactly once as the bird passes an obstacle", () => {
    const model = createGame(DEFAULT_CONFIG, 12345);
    // Place a single pipe just to the right of the bird, about to scroll past it.
    model.pipes = [{ x: model.bird.x - DEFAULT_CONFIG.pipeWidth + 1, gapTop: 0, gap: WORLD.height, scored: false }];
    let totalScored = 0;
    for (let i = 0; i < 30; i += 1) {
      const events = update(model, 1 / 60);
      if (events.scored) totalScored += 1;
    }
    expect(totalScored).toBe(1);
    expect(model.score).toBe(1);
  });

  it("flaps upward (negative velocity) and gravity overcomes the impulse in flight", () => {
    const model = createGame(DEFAULT_CONFIG, 1);
    flap(model);
    const velocityAfterFlap = model.bird.velocity;
    expect(velocityAfterFlap).toBeLessThan(0);
    const startY = model.bird.y;
    update(model, 1 / 60);
    expect(model.bird.y).toBeLessThan(startY); // moved up on the first frame after a flap
    // ~0.3s later (still airborne, well above the ground) gravity has pulled velocity positive.
    for (let i = 0; i < 18; i += 1) update(model, 1 / 60);
    expect(model.bird.velocity).toBeGreaterThan(velocityAfterFlap);
    expect(model.bird.velocity).toBeGreaterThan(0);
  });

  it("ends the game when the bird hits the ground", () => {
    const model = createGame(DEFAULT_CONFIG, 7);
    model.bird.velocity = 800;
    let hit = false;
    for (let i = 0; i < 120 && !hit; i += 1) {
      hit = update(model, 1 / 60).hit;
    }
    expect(hit).toBe(true);
    expect(model.bird.y + model.bird.radius).toBeLessThanOrEqual(WORLD.height - DEFAULT_CONFIG.groundHeight + 0.001);
  });

  it("is frame-rate independent: one big step ≈ several small steps", () => {
    const a = createGame(DEFAULT_CONFIG, 99);
    const b = createGame(DEFAULT_CONFIG, 99);
    // Advance `a` in small steps and `b` in fewer larger steps over the same total time.
    for (let i = 0; i < 10; i += 1) update(a, 1 / 60);
    for (let i = 0; i < 5; i += 1) update(b, 1 / 30);
    // Semi-implicit Euler leaves a small step-size discretization gap; the point is
    // that elapsed *time* (not frame count) drives the motion, so this stays tiny.
    expect(Math.abs(a.bird.y - b.bird.y)).toBeLessThan(3);
  });

  it("resets all run state", () => {
    const model = createGame(DEFAULT_CONFIG, 3);
    for (let i = 0; i < 200; i += 1) update(model, 1 / 60);
    resetGame(model, 3);
    expect(model.score).toBe(0);
    expect(model.pipes).toHaveLength(0);
    expect(model.bird.velocity).toBe(0);
    expect(model.distance).toBe(0);
  });
});
