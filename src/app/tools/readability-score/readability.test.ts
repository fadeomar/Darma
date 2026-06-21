import { describe, expect, it } from "vitest";
import { computeReadability, countSyllables } from "./readability";

describe("computeReadability", () => {
  it("returns null for fewer than three sentences", () => {
    expect(computeReadability("One short sentence. Another one." )).toBeNull();
  });

  it("calculates a simple three-sentence sample", () => {
    const result = computeReadability("The cat sat. The dog ran. The sun set.");
    expect(result).not.toBeNull();
    expect(result!.wordCount).toBe(9);
    expect(result!.averageWordsPerSentence).toBe(3);
    expect(result!.fleschReadingEase).toBe(100);
  });

  it("counts vowel groups and silent endings", () => {
    expect(countSyllables("reading")).toBe(2);
    expect(countSyllables("baked")).toBe(1);
    expect(countSyllables("table")).toBe(1);
  });

  it("excludes capitalized complex words from Fog complex words", () => {
    const result = computeReadability("Beautiful ideas matter. America welcomes everyone. Communication takes practice.");
    expect(result).not.toBeNull();
    expect(result!.complexWordCount).toBeGreaterThanOrEqual(1);
  });
});
