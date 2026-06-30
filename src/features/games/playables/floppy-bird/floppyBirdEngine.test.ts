import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  WORLD,
  createGame,
  flap,
  gapForScore,
  medalForScore,
  rectsOverlap,
  speedForScore,
  update,
} from "./floppyBirdEngine";

describe("Floppy Bird engine", () => {
  it("keeps the difficulty ramp bounded", () => {
    expect(gapForScore(0)).toBe(DEFAULT_CONFIG.gapStart);
    expect(gapForScore(999)).toBe(DEFAULT_CONFIG.gapMin);
    expect(speedForScore(0)).toBe(DEFAULT_CONFIG.speedStart);
    expect(speedForScore(999)).toBe(DEFAULT_CONFIG.speedMax);
  });

  it("scores a pipe only once after the bird passes it", () => {
    const model = createGame(DEFAULT_CONFIG, 1);
    model.pipes.push({
      x: model.bird.x - DEFAULT_CONFIG.pipeWidth - model.bird.width,
      gapY: model.bird.y,
      gap: DEFAULT_CONFIG.gapStart,
      scored: false,
      color: "green",
    });
    const events = update(model, 1 / 60);
    expect(events.scored).toBe(true);
    expect(events.score).toBe(1);
    const again = update(model, 1 / 60);
    expect(again.scored).toBe(false);
    expect(model.score).toBe(1);
  });

  it("detects simple rectangle overlaps", () => {
    expect(rectsOverlap(0, 0, 10, 10, 8, 8, 10, 10)).toBe(true);
    expect(rectsOverlap(0, 0, 10, 10, 20, 20, 10, 10)).toBe(false);
  });

  it("flap applies upward velocity", () => {
    const model = createGame(DEFAULT_CONFIG, 1);
    flap(model);
    expect(model.bird.velocity).toBeLessThan(0);
  });

  it("detects ground collision", () => {
    const model = createGame(DEFAULT_CONFIG, 1);
    model.bird.y = WORLD.height - DEFAULT_CONFIG.groundHeight - model.bird.height / 2 + 1;
    const events = update(model, 1 / 60);
    expect(events.hit).toBe(true);
  });

  it("uses the expected medal tiers", () => {
    expect(medalForScore(9)).toBe("none");
    expect(medalForScore(10)).toBe("bronze");
    expect(medalForScore(20)).toBe("silver");
    expect(medalForScore(30)).toBe("gold");
    expect(medalForScore(40)).toBe("platinum");
  });
});
