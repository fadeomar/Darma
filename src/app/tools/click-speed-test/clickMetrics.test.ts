import { describe, expect, it } from "vitest";
import {
  calculateClickStats,
  clickGaps,
  consistencyLabel,
  createEmptyStats,
  modeLabel,
  pointerSource,
  resultInsight,
  scoreLabel,
} from "./clickMetrics";
import type { ClickSample } from "./types";

function samples(times: number[], source: ClickSample["source"] = "mouse") {
  return times.map((time) => ({ time, source }));
}

describe("click metrics", () => {
  it("calculates CPS and timing gaps", () => {
    const stats = calculateClickStats(samples([100, 300, 500, 700, 900]), 1000);
    expect(stats.totalClicks).toBe(5);
    expect(stats.clicksPerSecond).toBe(5);
    expect(stats.averageGapMs).toBe(200);
    expect(stats.fastestGapMs).toBe(200);
    expect(stats.bestBurst).toBe(5);
    expect(stats.inputMethod).toBe("Mouse");
  });

  it("counts the strongest sliding one-second burst", () => {
    const stats = calculateClickStats(
      samples([0, 100, 200, 900, 1000, 1300]),
      2000,
    );
    expect(stats.bestBurst).toBe(5);
  });

  it("includes long pauses in average and consistency calculations", () => {
    const values = samples([0, 100, 200, 6200, 6300]);
    expect(clickGaps(values)).toEqual([100, 100, 6000, 100]);
    const stats = calculateClickStats(values, 7000);
    expect(stats.averageGapMs).toBe(1575);
    expect(stats.consistencyScore).toBeLessThan(20);
  });

  it("sorts valid samples and ignores invalid timestamps", () => {
    const result = clickGaps([
      { time: 300, source: "mouse" },
      { time: Number.NaN, source: "mouse" },
      { time: 100, source: "mouse" },
      { time: -1, source: "mouse" },
    ]);
    expect(result).toEqual([200]);
  });

  it("detects mixed pointer methods", () => {
    const stats = calculateClickStats(
      [
        { time: 100, source: "mouse" },
        { time: 200, source: "touch" },
      ],
      1000,
    );
    expect(stats.inputMethod).toBe("Mixed");
  });

  it("maps pointer types defensively", () => {
    expect(pointerSource("touch")).toBe("touch");
    expect(pointerSource("pen")).toBe("pen");
    expect(pointerSource("unknown")).toBe("mouse");
  });

  it("returns stable empty statistics", () => {
    expect(createEmptyStats()).toEqual({
      totalClicks: 0,
      elapsedSeconds: 0,
      clicksPerSecond: 0,
      bestBurst: 0,
      averageGapMs: 0,
      fastestGapMs: 0,
      consistencyScore: 0,
      inputMethod: "None",
    });
  });

  it("formats mode and score labels", () => {
    expect(modeLabel(10)).toBe("10s");
    expect(modeLabel("manual")).toBe("Manual");
    expect(scoreLabel(12)).toBe("Elite clicker");
    expect(scoreLabel(7)).toBe("Solid pace");
    expect(consistencyLabel(90)).toBe("Very steady");
  });

  it("provides a touch-specific insight", () => {
    const stats = calculateClickStats(samples([100, 400], "touch"), 1000);
    expect(resultInsight(stats)).toContain("Touch input");
  });

  it("avoids division-by-zero output", () => {
    const stats = calculateClickStats(samples([0]), 0);
    expect(Number.isFinite(stats.clicksPerSecond)).toBe(true);
    expect(stats.clicksPerSecond).toBe(100);
  });
});
