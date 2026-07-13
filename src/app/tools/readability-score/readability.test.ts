import { describe, expect, it } from "vitest";
import { getReadabilityTarget, READABILITY_PRESETS } from "./presets";
import {
  buildMarkdownReport,
  buildReadabilityJson,
  buildSentenceCsv,
  computeReadability,
  countSyllables,
  splitSentences,
} from "./readability";

const generalTarget = getReadabilityTarget("general-web");

describe("readability analysis", () => {
  it("counts common syllable patterns without treating consonant-le as silent", () => {
    expect(countSyllables("reading")).toBe(2);
    expect(countSyllables("baked")).toBe(1);
    expect(countSyllables("table")).toBe(2);
    expect(countSyllables("queue")).toBe(1);
    expect(countSyllables("communication")).toBe(5);
    expect(countSyllables("radio")).toBe(3);
  });

  it("protects common abbreviations and decimal points during sentence splitting", () => {
    const sentences = splitSentences("Meet at 9:00 a.m. and bring version 2.5. Then start the test.");
    expect(sentences).toHaveLength(2);
    expect(sentences[0]).toContain("2.5");
  });

  it("analyzes a short one-sentence sample instead of requiring three sentences", () => {
    const result = computeReadability("Clear instructions help people finish important tasks quickly.", generalTarget);
    expect(result).not.toBeNull();
    expect(result?.sentenceCount).toBe(1);
    expect(result?.confidence).toBe("low");
    expect(result?.checks.find((check) => check.id === "sample-size")?.level).toBe("warning");
  });

  it("flags sentences that exceed the selected audience threshold", () => {
    const text = "This sentence contains many additional words because it keeps adding details that should probably be separated into smaller and clearer steps for readers who need to act quickly without searching for the main instruction.";
    const result = computeReadability(text, getReadabilityTarget("plain-language"));
    expect(result).not.toBeNull();
    expect(result?.longSentenceCount).toBe(1);
    expect(result?.sentences[0]?.issues).toContain("very-long");
  });

  it("detects likely passive constructions as a review heuristic", () => {
    const result = computeReadability("The final report was completed by the review team. Staff shared it today.", generalTarget);
    expect(result).not.toBeNull();
    expect(result?.possiblePassiveSentenceCount).toBeGreaterThanOrEqual(1);
    expect(result?.sentences[0]?.issues).toContain("possible-passive");
  });

  it("produces actionable review checks for the deliberately dense preset", () => {
    const preset = READABILITY_PRESETS.find((item) => item.id === "dense-policy")!;
    const result = computeReadability(preset.text, getReadabilityTarget(preset.targetId));
    expect(result).not.toBeNull();
    expect(result?.checks.some((check) => check.level === "warning" || check.level === "danger")).toBe(true);
    expect(result?.recommendations.length).toBeGreaterThan(0);
  });

  it("exports Markdown, JSON, and sentence CSV reports", () => {
    const result = computeReadability(READABILITY_PRESETS[0]!.text, generalTarget)!;
    const markdown = buildMarkdownReport(result);
    const json = JSON.parse(buildReadabilityJson(result, READABILITY_PRESETS[0]!.text)) as { summary: { wordCount: number } };
    const csv = buildSentenceCsv(result);

    expect(markdown).toContain("# Readability audit");
    expect(json.summary.wordCount).toBe(result.wordCount);
    expect(csv).toContain("sentence,words,complex_words");
    expect(csv.split("\n").length).toBe(result.sentenceCount + 1);
  });
});
