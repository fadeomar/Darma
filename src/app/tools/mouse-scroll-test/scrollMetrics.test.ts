import { describe, expect, it } from "vitest";
import {
  calculateScrollStats,
  createEmptyStats,
  normalizeWheelDelta,
  resultInsight,
  scoreLabel,
  scrollGaps,
  smoothnessLabel,
} from "./scrollMetrics";
import type { ScrollSample } from "./types";

function samples(values: Array<[number, number, number, ScrollSample["source"]]>): ScrollSample[] {
  return values.map(([time, dx, dy, source]) => ({ time, dx, dy, source }));
}

describe("scroll metrics", () => {
  it("creates stable empty stats", () => {
    expect(createEmptyStats()).toEqual({
      totalDistance: 0,
      netVertical: 0,
      netHorizontal: 0,
      eventsCount: 0,
      elapsedSeconds: 0,
      pixelsPerSecond: 0,
      eventsPerSecond: 0,
      bestBurst: 0,
      smoothnessScore: 0,
      direction: "None",
      inputMethod: "None",
    });
  });

  it("calculates distance, speed, and a dominant direction", () => {
    const stats = calculateScrollStats(
      samples([
        [100, 0, 100, "wheel"],
        [200, 0, 150, "wheel"],
        [300, 0, 50, "wheel"],
      ]),
      1000,
    );
    expect(stats.totalDistance).toBe(300);
    expect(stats.pixelsPerSecond).toBe(300);
    expect(stats.direction).toBe("Down");
    expect(stats.inputMethod).toBe("Wheel");
  });

  it("reports mixed direction when secondary movement is substantial", () => {
    const stats = calculateScrollStats(
      samples([
        [100, 0, 100, "wheel"],
        [200, 40, 0, "wheel"],
      ]),
      1000,
    );
    expect(stats.direction).toBe("Mixed");
  });

  it("reports mixed input methods", () => {
    const stats = calculateScrollStats(
      samples([
        [100, 0, 100, "wheel"],
        [200, 0, 100, "touch"],
      ]),
      1000,
    );
    expect(stats.inputMethod).toBe("Mixed");
  });

  it("normalizes pixel, line, and page wheel deltas", () => {
    expect(normalizeWheelDelta({ deltaMode: 0, deltaX: 2, deltaY: 3 }, 900)).toEqual({ dx: 2, dy: 3 });
    expect(normalizeWheelDelta({ deltaMode: 1, deltaX: 2, deltaY: 3 }, 900)).toEqual({ dx: 32, dy: 48 });
    expect(normalizeWheelDelta({ deltaMode: 2, deltaX: 1, deltaY: 2 }, 900)).toEqual({ dx: 900, dy: 1800 });
  });

  it("returns every positive event gap including long pauses", () => {
    const result = scrollGaps(
      samples([
        [100, 0, 10, "wheel"],
        [200, 0, 10, "wheel"],
        [2100, 0, 10, "wheel"],
      ]),
    );
    expect(result).toEqual([100, 1900]);
  });

  it("reduces smoothness when a long pause interrupts an otherwise steady run", () => {
    const steady = calculateScrollStats(
      samples([
        [100, 0, 10, "wheel"],
        [200, 0, 10, "wheel"],
        [300, 0, 10, "wheel"],
        [400, 0, 10, "wheel"],
        [500, 0, 10, "wheel"],
      ]),
      1000,
    );
    const interrupted = calculateScrollStats(
      samples([
        [100, 0, 10, "wheel"],
        [200, 0, 10, "wheel"],
        [300, 0, 10, "wheel"],
        [2200, 0, 10, "wheel"],
        [2300, 0, 10, "wheel"],
      ]),
      2500,
    );
    expect(steady.smoothnessScore).toBe(100);
    expect(interrupted.smoothnessScore).toBeLessThan(steady.smoothnessScore);
  });

  it("calculates the best half-second burst", () => {
    const stats = calculateScrollStats(
      samples([
        [100, 0, 100, "wheel"],
        [200, 0, 100, "wheel"],
        [700, 0, 50, "wheel"],
      ]),
      1000,
    );
    expect(stats.bestBurst).toBe(400);
  });

  it("returns stable score and smoothness labels", () => {
    expect(scoreLabel(6000)).toBe("Wheel sprinter");
    expect(scoreLabel(0)).toBe("No scroll yet");
    expect(smoothnessLabel(90)).toBe("Very smooth");
    expect(smoothnessLabel(0)).toBe("No rhythm yet");
  });

  it("returns useful result guidance", () => {
    expect(resultInsight(createEmptyStats())).toContain("Start a sprint");
    expect(
      resultInsight({
        ...createEmptyStats(),
        eventsCount: 20,
        pixelsPerSecond: 6000,
        smoothnessScore: 80,
        inputMethod: "Wheel",
      }),
    ).toContain("Strong sprint");
  });
});
