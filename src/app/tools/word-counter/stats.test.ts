import { describe, expect, it } from "vitest";
import {
  buildStatsSummary,
  computeWordStats,
  formatDuration,
  tokenizeWords,
  topWords,
} from "./stats";

describe("computeWordStats", () => {
  it("returns all-zero stats for empty input", () => {
    const stats = computeWordStats("");
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.paragraphs).toBe(0);
    expect(stats.readingTimeSec).toBe(0);
  });

  it("counts words, characters, and characters without spaces", () => {
    const stats = computeWordStats("hello world");
    expect(stats.words).toBe(2);
    expect(stats.characters).toBe(11);
    expect(stats.charactersNoSpaces).toBe(10);
  });

  it("counts contractions and hyphenated words as single words", () => {
    expect(computeWordStats("it's a well-known fact").words).toBe(4);
  });

  it("counts sentences across multiple terminators", () => {
    expect(computeWordStats("One. Two! Three? Four").sentences).toBe(4);
  });

  it("counts paragraphs separated by blank lines", () => {
    expect(computeWordStats("First para.\n\nSecond para.\n\nThird.").paragraphs).toBe(3);
  });

  it("counts unique words case-insensitively", () => {
    expect(computeWordStats("Go go GO stop").uniqueWords).toBe(2);
  });

  it("tracks longest and average word length", () => {
    const stats = computeWordStats("a bb ccc");
    expect(stats.longestWordLength).toBe(3);
    expect(stats.averageWordLength).toBeCloseTo(2);
  });

  it("supports Arabic text", () => {
    const stats = computeWordStats("مرحبا بالعالم");
    expect(stats.words).toBe(2);
  });
});

describe("tokenizeWords", () => {
  it("ignores punctuation and symbols", () => {
    expect(tokenizeWords("hi, there!! (yes)")).toEqual(["hi", "there", "yes"]);
  });
});

describe("topWords", () => {
  it("ranks frequent meaningful words and skips stop words", () => {
    const result = topWords("the cat sat on the mat the cat ran", 2);
    expect(result[0]).toEqual({ word: "cat", count: 2 });
    expect(result.some((r) => r.word === "the")).toBe(false);
  });
});

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(90)).toBe("1m 30s");
  });
});

describe("buildStatsSummary", () => {
  it("includes a words line", () => {
    expect(buildStatsSummary(computeWordStats("one two three"))).toContain("Words: 3");
  });
});
