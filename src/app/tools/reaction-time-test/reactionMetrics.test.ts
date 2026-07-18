import { describe, expect, it } from "vitest";
import {
  REACTION_DELAY_PROFILES,
  calculateReactionStats,
  consistencyLabel,
  createEmptyStats,
  isReactionKey,
  pointerSource,
  randomWaitMs,
  resultInsight,
  scoreLabel,
} from "./reactionMetrics";
import type { ReactionSample } from "./types";

function sample(
  round: number,
  reactionMs: number,
  source: ReactionSample["source"] = "mouse",
  waitMs = 2000,
): ReactionSample {
  return { round, reactionMs, source, waitMs };
}

describe("reaction metrics", () => {
  it("creates an empty result with the configured round count", () => {
    expect(createEmptyStats(5)).toEqual({
      roundsCompleted: 0,
      totalRounds: 5,
      averageReactionMs: 0,
      medianReactionMs: 0,
      bestReactionMs: 0,
      slowestReactionMs: 0,
      spreadReactionMs: 0,
      consistencyScore: 0,
      falseStarts: 0,
      inputMethod: "None",
    });
  });

  it("calculates average, median, best, slowest, and spread", () => {
    const stats = calculateReactionStats(
      [sample(1, 180), sample(2, 220), sample(3, 260), sample(4, 300)],
      4,
      1,
    );

    expect(stats.averageReactionMs).toBe(240);
    expect(stats.medianReactionMs).toBe(240);
    expect(stats.bestReactionMs).toBe(180);
    expect(stats.slowestReactionMs).toBe(300);
    expect(stats.spreadReactionMs).toBe(120);
    expect(stats.falseStarts).toBe(1);
  });

  it("uses the middle value for an odd number of rounds", () => {
    const stats = calculateReactionStats(
      [sample(1, 310), sample(2, 190), sample(3, 240)],
      3,
      0,
    );
    expect(stats.medianReactionMs).toBe(240);
  });

  it("ignores invalid samples rather than producing NaN", () => {
    const stats = calculateReactionStats(
      [
        sample(1, 210),
        sample(2, Number.NaN),
        { ...sample(3, 190), waitMs: Number.POSITIVE_INFINITY },
      ],
      3,
      Number.NaN,
    );
    expect(stats.roundsCompleted).toBe(1);
    expect(stats.averageReactionMs).toBe(210);
    expect(stats.falseStarts).toBe(0);
  });

  it("detects a mixed input path", () => {
    const stats = calculateReactionStats(
      [
        sample(1, 200, "keyboard"),
        sample(2, 210, "touch"),
        sample(3, 220, "mouse"),
      ],
      3,
      0,
    );
    expect(stats.inputMethod).toBe("Mixed");
  });

  it("reports a steady consistency score for tightly grouped rounds", () => {
    const stats = calculateReactionStats(
      [
        sample(1, 200),
        sample(2, 202),
        sample(3, 198),
        sample(4, 201),
        sample(5, 199),
      ],
      5,
      0,
    );
    expect(stats.consistencyScore).toBeGreaterThanOrEqual(95);
    expect(consistencyLabel(stats.consistencyScore)).toBe("Very steady");
  });

  it("keeps random waits inside every profile boundary", () => {
    for (const [profile, config] of Object.entries(REACTION_DELAY_PROFILES)) {
      expect(
        randomWaitMs(profile as keyof typeof REACTION_DELAY_PROFILES, 0),
      ).toBe(config.minMs);
      expect(
        randomWaitMs(profile as keyof typeof REACTION_DELAY_PROFILES, 0.999999),
      ).toBeLessThanOrEqual(config.maxMs);
      expect(
        randomWaitMs(profile as keyof typeof REACTION_DELAY_PROFILES, -5),
      ).toBe(config.minMs);
    }
  });

  it("maps pointer types without treating unknown values as touch", () => {
    expect(pointerSource("touch")).toBe("touch");
    expect(pointerSource("pen")).toBe("pen");
    expect(pointerSource("mouse")).toBe("mouse");
    expect(pointerSource("unknown")).toBe("mouse");
  });

  it("recognizes Space and Enter keyboard activation", () => {
    expect(isReactionKey({ code: "Space", key: " " })).toBe(true);
    expect(isReactionKey({ code: "Enter", key: "Enter" })).toBe(true);
    expect(isReactionKey({ code: "KeyA", key: "a" })).toBe(false);
  });

  it("keeps result labels and insights deterministic", () => {
    expect(scoreLabel(175)).toBe("Elite reflex");
    expect(scoreLabel(220)).toBe("Sharp reaction");
    expect(scoreLabel(290)).toBe("Solid timing");
    expect(scoreLabel(400)).toBe("Warm-up");
    expect(resultInsight(createEmptyStats(5))).toContain("Wait for the signal");
  });
});
