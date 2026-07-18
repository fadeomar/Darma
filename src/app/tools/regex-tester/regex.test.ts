import { describe, expect, it } from "vitest";
import {
  assessRegexRisk,
  buildHighlightSegments,
  buildJavaScriptSnippet,
  buildProductionChecks,
  buildRegex,
  buildTypeScriptSnippet,
  calculateCoverage,
  findMatches,
  getPatternStats,
  normalizeFlags,
  replaceMatches,
} from "./regex";

describe("regex core helpers", () => {
  it("normalizes supported flags in canonical order", () => {
    expect(normalizeFlags("migigx")).toBe("gim");
  });

  it("reports duplicate and unsupported flags", () => {
    expect(buildRegex("a", "gg")).toMatchObject({ ok: false });
    expect(buildRegex("a", "x")).toMatchObject({ ok: false });
  });

  it("reports invalid pattern syntax", () => {
    expect(buildRegex("(", "g")).toMatchObject({ ok: false });
  });

  it("finds global matches with line and column evidence", () => {
    const matches = findMatches("foo", "g", "foo\nbar foo");
    expect(matches).toHaveLength(2);
    expect(matches[1]).toMatchObject({ index: 8, line: 2, column: 5 });
  });

  it("stops after the first match without g", () => {
    expect(findMatches("a", "", "aaa")).toHaveLength(1);
  });

  it("handles zero-length global matches without looping forever", () => {
    const matches = findMatches("(?=a)", "g", "aa");
    expect(matches.map((match) => match.index)).toEqual([0, 1]);
  });

  it("captures numbered and named groups", () => {
    const [match] = findMatches("(?<name>[A-Z][a-z]+) (#\\d+)", "g", "Alpha #123");
    expect(match.captures).toEqual([
      { index: 1, value: "Alpha" },
      { index: 2, value: "#123" },
    ]);
    expect(match.namedGroups).toEqual([{ name: "name", value: "Alpha" }]);
  });

  it("previews replacements using native JavaScript behavior", () => {
    expect(replaceMatches("(\\w+), (\\w+)", "g", "Doe, Jane", "$2 $1")).toBe("Jane Doe");
  });

  it("counts capture groups while ignoring non-capturing groups and character classes", () => {
    expect(getPatternStats("(?:x)(?<named>y)(z)[(]")).toEqual({ captureGroups: 2, namedGroups: ["named"] });
  });

  it("flags common nested-quantifier risk", () => {
    const risk = assessRegexRisk("(a+)+$");
    expect(risk.level).not.toBe("low");
    expect(risk.reasons.length).toBeGreaterThan(0);
  });

  it("builds non-overlapping highlight segments", () => {
    const matches = findMatches("foo", "g", "a foo b");
    expect(buildHighlightSegments("a foo b", matches).map((segment) => [segment.text, segment.highlighted])).toEqual([
      ["a ", false],
      ["foo", true],
      [" b", false],
    ]);
  });

  it("calculates matched-character coverage", () => {
    const matches = findMatches("ab", "g", "ab--ab");
    expect(calculateCoverage(matches, 6)).toBeCloseTo(66.666, 2);
  });

  it("warns about unknown replacement groups", () => {
    const built = buildRegex("(a)", "g");
    if (!(built instanceof RegExp)) throw new Error("Expected valid regex");
    const checks = buildProductionChecks({
      pattern: "(a)",
      flags: "g",
      text: "a",
      replacement: "$2",
      built,
      matches: findMatches("(a)", "g", "a"),
      risk: assessRegexRisk("(a)"),
    });
    expect(checks).toContainEqual(expect.objectContaining({ id: "replacement-groups", severity: "warning" }));
  });

  it("generates JavaScript and TypeScript snippets", () => {
    expect(buildJavaScriptSnippet("a", "g", "b")).toContain('new RegExp("a", "g")');
    expect(buildTypeScriptSnippet("a", "g", "b")).toContain("export function transformInput(input: string)");
  });
});
