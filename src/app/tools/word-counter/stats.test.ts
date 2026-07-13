import { describe, expect, it } from "vitest";
import { getWordCounterGoal } from "./presets";
import {
  buildKeywordCsv,
  buildMarkdownReport,
  computeGoalProgress,
  computeWordStats,
  formatDuration,
  splitParagraphs,
  splitSentences,
  tokenizeWords,
  topPhrases,
  topWords,
} from "./stats";

const options = {
  readingWpm: 200,
  speakingWpm: 130,
  includeStopWords: false,
  goal: getWordCounterGoal("assignment-500"),
};

describe("tokenizeWords", () => {
  it("counts contractions, hyphenated words, Arabic, and numbers", () => {
    expect(tokenizeWords("It's well-known: مرحبا 2026")).toEqual(["It's", "well-known", "مرحبا", "2026"]);
  });
});

describe("splitSentences", () => {
  it("splits common terminators", () => {
    expect(splitSentences("One. Two! Three? أربعة؟ Five…")).toHaveLength(5);
  });

  it("does not split decimal numbers", () => {
    expect(splitSentences("Version 2.5 is ready. Ship it.")).toEqual(["Version 2.5 is ready.", "Ship it."]);
  });

  it("does not split common abbreviations", () => {
    expect(splitSentences("Dr. Smith arrived at 9 a.m. He started work.")).toEqual(["Dr. Smith arrived at 9 a.m.", "He started work."]);
  });

  it("preserves a final sentence without punctuation", () => {
    expect(splitSentences("First sentence. Final sentence")).toEqual(["First sentence.", "Final sentence"]);
  });
});

describe("paragraph parsing", () => {
  it("splits paragraphs on blank lines only", () => {
    expect(splitParagraphs("One line\ncontinues.\n\nSecond paragraph.")).toHaveLength(2);
  });
});

describe("frequency analysis", () => {
  it("filters stop words and calculates density", () => {
    const result = topWords("the cat and the cat sleeps", false, 3);
    expect(result[0]).toMatchObject({ word: "cat", count: 2 });
    expect(result.some((item) => item.word === "the")).toBe(false);
    expect(result[0]!.density).toBeCloseTo(33.33, 1);
  });

  it("finds repeated two-word phrases", () => {
    expect(topPhrases("project plan project plan project plan", true)[0]).toMatchObject({ phrase: "project plan", count: 3 });
  });

  it("does not create phrases across removed stop words", () => {
    expect(topPhrases("project and plan project and plan", false).some((item) => item.phrase === "project plan")).toBe(false);
  });
});

describe("goal progress", () => {
  it("reports values below, within, and above a range", () => {
    const goal = getWordCounterGoal("assignment-500");
    expect(computeGoalProgress(goal, 100).status).toBe("below");
    expect(computeGoalProgress(goal, 500).status).toBe("within");
    expect(computeGoalProgress(goal, 600).status).toBe("above");
  });
});

describe("computeWordStats", () => {
  it("returns zero-safe values for empty text", () => {
    const stats = computeWordStats("", options);
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.readingTimeSec).toBe(0);
  });

  it("computes core structure and timing", () => {
    const stats = computeWordStats("Hello world.\n\nHello again!", options);
    expect(stats.words).toBe(4);
    expect(stats.sentences).toBe(2);
    expect(stats.paragraphs).toBe(2);
    expect(stats.uniqueWords).toBe(3);
    expect(stats.readingTimeSec).toBe(1);
    expect(stats.speakingTimeSec).toBe(2);
  });

  it("flags very long sentences", () => {
    const sentence = Array.from({ length: 45 }, (_, index) => `word${index}`).join(" ") + ".";
    const stats = computeWordStats(sentence, options);
    expect(stats.sentenceAnalysis[0]!.flags).toContain("very-long");
    expect(stats.checks.some((check) => check.id === "sentence-length" && check.level === "danger")).toBe(true);
  });

  it("flags likely keyword stuffing", () => {
    const stats = computeWordStats("tool tool tool tool tool makes writing easier for teams", options);
    expect(stats.checks.some((check) => check.id === "keyword-density" && check.level !== "success")).toBe(true);
  });

  it("uses custom reading and speaking rates", () => {
    const text = Array.from({ length: 200 }, () => "word").join(" ");
    const stats = computeWordStats(text, { ...options, readingWpm: 100, speakingWpm: 200 });
    expect(stats.readingTimeSec).toBe(120);
    expect(stats.speakingTimeSec).toBe(60);
  });

  it("flags an invalid custom goal range", () => {
    const stats = computeWordStats("A short draft.", {
      ...options,
      goal: { id: "custom", label: "Custom target", description: "", metric: "words", min: 100, max: 10 },
    });
    expect(stats.checks.some((check) => check.id === "goal-range" && check.level === "danger")).toBe(true);
  });
});

describe("exports", () => {
  it("builds markdown and CSV reports", () => {
    const stats = computeWordStats("alpha beta alpha.", options);
    expect(buildMarkdownReport(stats, options.goal)).toContain("# Word Counter Audit");
    expect(buildKeywordCsv(stats)).toContain("alpha,2");
  });

  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0 sec");
    expect(formatDuration(75)).toBe("1 min 15 sec");
  });
});
