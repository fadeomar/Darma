import { describe, expect, it } from "vitest";
import {
  calculateSpacebarStats,
  consistencyLabel,
  createEmptyStats,
  isSpacebarEvent,
  modeLabel,
  pointerSource,
  resultInsight,
  scoreLabel,
  spacebarGaps,
} from "./spacebarMetrics";
import type { SpacebarSample } from "./types";

function samples(
  times: number[],
  source: SpacebarSample["source"] = "keyboard",
) {
  return times.map((time) => ({ time, source }));
}

describe("spacebar metrics", () => {
  it("calculates PPS, gaps, burst, and ignored repeats", () => {
    const stats = calculateSpacebarStats(
      samples([100, 300, 500, 700, 900]),
      1000,
      2,
    );
    expect(stats).toMatchObject({
      totalPresses: 5,
      pressesPerSecond: 5,
      averageGapMs: 200,
      fastestGapMs: 200,
      bestBurst: 5,
      ignoredRepeats: 2,
      inputMethod: "Keyboard",
    });
  });

  it("counts the strongest rolling one-second burst", () => {
    expect(
      calculateSpacebarStats(samples([0, 100, 200, 900, 1000, 1300]), 2000)
        .bestBurst,
    ).toBe(5);
  });

  it("includes long pauses in average and consistency calculations", () => {
    const values = samples([0, 100, 200, 6200, 6300]);
    expect(spacebarGaps(values)).toEqual([100, 100, 6000, 100]);
    const stats = calculateSpacebarStats(values, 7000);
    expect(stats.averageGapMs).toBe(1575);
    expect(stats.consistencyScore).toBeLessThan(20);
  });

  it("sorts valid samples and ignores invalid timestamps", () => {
    expect(
      spacebarGaps([
        { time: 300, source: "keyboard" },
        { time: Number.NaN, source: "keyboard" },
        { time: 100, source: "keyboard" },
        { time: -1, source: "keyboard" },
      ]),
    ).toEqual([200]);
  });

  it("detects mixed keyboard and fallback inputs", () => {
    const stats = calculateSpacebarStats(
      [
        { time: 100, source: "keyboard" },
        { time: 200, source: "touch" },
      ],
      1000,
    );
    expect(stats.inputMethod).toBe("Mixed");
  });

  it("maps pointer fallbacks defensively", () => {
    expect(pointerSource("touch")).toBe("touch");
    expect(pointerSource("mouse")).toBe("mouse");
    expect(pointerSource("pen")).toBe("mouse");
  });

  it("recognizes browser spacebar key variants", () => {
    expect(isSpacebarEvent({ code: "Space", key: "" } as KeyboardEvent)).toBe(
      true,
    );
    expect(isSpacebarEvent({ code: "", key: " " } as KeyboardEvent)).toBe(true);
    expect(isSpacebarEvent({ code: "", key: "Enter" } as KeyboardEvent)).toBe(
      false,
    );
  });

  it("returns stable empty statistics", () => {
    expect(createEmptyStats()).toEqual({
      totalPresses: 0,
      elapsedSeconds: 0,
      pressesPerSecond: 0,
      bestBurst: 0,
      averageGapMs: 0,
      fastestGapMs: 0,
      consistencyScore: 0,
      ignoredRepeats: 0,
      inputMethod: "None",
    });
  });

  it("formats mode, score, and consistency labels", () => {
    expect(modeLabel(10)).toBe("10s");
    expect(modeLabel("manual")).toBe("Manual");
    expect(scoreLabel(12)).toBe("Keyboard legend");
    expect(scoreLabel(7)).toBe("Steady rhythm");
    expect(consistencyLabel(90)).toBe("Very steady");
  });

  it("avoids division-by-zero and provides a touch insight", () => {
    const zero = calculateSpacebarStats(samples([0]), 0);
    expect(Number.isFinite(zero.pressesPerSecond)).toBe(true);
    expect(zero.pressesPerSecond).toBe(100);
    expect(
      resultInsight(calculateSpacebarStats(samples([100, 400], "touch"), 1000)),
    ).toContain("Touch fallback");
  });
});
