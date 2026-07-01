import { describe, expect, it } from "vitest";
import { calculateTypingMetrics, clampTypingInput, getTypingCoachLine, isTypingRoundFinished, selectTypingPrompt } from "./typingSpeedEngine";

const settings = { mode: "quick" as const, duration: 60 as const, difficulty: "normal" as const };

describe("typingSpeedEngine", () => {
  it("clamps input to prompt length", () => {
    expect(clampTypingInput("abcdef", "abc")).toBe("abc");
  });

  it("calculates WPM, raw WPM, accuracy, and mistakes", () => {
    const metrics = calculateTypingMetrics("hello world", "hello worlx", 60_000);
    expect(metrics.typedChars).toBe(10);
    expect(metrics.correctChars).toBe(9);
    expect(metrics.incorrectChars).toBe(1);
    expect(metrics.accuracy).toBe(90);
    expect(metrics.rawWpm).toBe(2);
    expect(metrics.wpm).toBe(2);
    expect(metrics.mostMissed[0]).toMatchObject({ expected: "l", typed: "x", count: 1 });
  });

  it("selects a prompt from requested difficulty", () => {
    const prompt = selectTypingPrompt(settings, 1);
    expect(prompt.difficulty).toBe("normal");
  });

  it("finishes timed rounds when the duration is reached", () => {
    const metrics = calculateTypingMetrics("hello", "he", 61_000);
    expect(isTypingRoundFinished(settings, metrics)).toBe(true);
  });

  it("keeps practice mode open unless prompt is complete", () => {
    const metrics = calculateTypingMetrics("hello", "he", 120_000);
    expect(isTypingRoundFinished({ ...settings, mode: "practice" }, metrics)).toBe(false);
  });

  it("returns accuracy coaching for accuracy mode", () => {
    const metrics = calculateTypingMetrics("abcdef", "abzzzz", 20_000);
    expect(getTypingCoachLine({ ...settings, mode: "accuracy" }, metrics)).toContain("accuracy");
  });
});
