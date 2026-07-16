import { describe, expect, it } from "vitest";
import {
  analyzeRegexStudio,
  buildRegexJavaScriptModule,
  buildRegexMarkdownReport,
  buildRegexMatchesCsv,
  buildRegexProject,
  buildRegexProjectJson,
  buildRegexTypeScriptModule,
  normalizeRegexProject,
  parseRegexProjectJson,
  REGEX_PROJECT_TOOL,
  REGEX_PROJECT_VERSION,
  shouldBlockRegexExecution,
  type RegexStudioState,
} from "./studio";
import { assessRegexRisk } from "./regex";

const state: RegexStudioState = {
  pattern: "(?<word>foo)",
  flags: "g",
  text: "foo and foo",
  replacement: "$<word>-ok",
};

describe("regex studio project and audit", () => {
  it("builds a versioned reopenable project", () => {
    const project = buildRegexProject(state, new Date("2026-07-14T12:00:00.000Z"));
    expect(project).toEqual({
      tool: REGEX_PROJECT_TOOL,
      version: REGEX_PROJECT_VERSION,
      savedAt: "2026-07-14T12:00:00.000Z",
      ...state,
    });
  });

  it("round-trips project JSON", () => {
    expect(parseRegexProjectJson(buildRegexProjectJson(state))).toMatchObject(state);
  });

  it("rejects empty, malformed, wrong-tool, and wrong-version projects", () => {
    expect(() => parseRegexProjectJson(" ")).toThrow("empty");
    expect(() => parseRegexProjectJson("{")) .toThrow("valid JSON");
    expect(() => normalizeRegexProject({ ...buildRegexProject(state), tool: "other" })).toThrow("Expected tool");
    expect(() => normalizeRegexProject({ ...buildRegexProject(state), version: 99 })).toThrow("Unsupported project version");
  });

  it("rejects invalid and duplicate flags", () => {
    expect(() => normalizeRegexProject({ ...buildRegexProject(state), flags: "gx" })).toThrow("Unsupported");
    expect(() => normalizeRegexProject({ ...buildRegexProject(state), flags: "gg" })).toThrow("duplicates");
  });

  it("removes null characters from imported text fields", () => {
    const project = normalizeRegexProject({ ...buildRegexProject(state), text: "a\0b", replacement: "x\0y" });
    expect(project.text).toBe("ab");
    expect(project.replacement).toBe("xy");
  });

  it("blocks every high-risk pattern and long medium-risk samples", () => {
    expect(shouldBlockRegexExecution({ level: "high", reasons: ["x"], blocksLongInput: true }, 1)).toBe(true);
    expect(shouldBlockRegexExecution({ level: "medium", reasons: ["x"], blocksLongInput: true }, 129)).toBe(true);
    expect(shouldBlockRegexExecution({ level: "medium", reasons: ["x"], blocksLongInput: true }, 128)).toBe(false);
    expect(shouldBlockRegexExecution({ level: "low", reasons: [], blocksLongInput: false }, 500)).toBe(false);
  });

  it("does not execute a guarded risky expression", () => {
    const result = analyzeRegexStudio({ pattern: "(a+)+$", flags: "", text: "a".repeat(200), replacement: "x" });
    expect(result.executionBlocked).toBe(true);
    expect(result.matches).toEqual([]);
    expect(result.checks).toContainEqual(expect.objectContaining({ id: "execution-guard", severity: "danger" }));
  });

  it("computes result metrics and readiness", () => {
    const result = analyzeRegexStudio(state);
    expect(result.metrics).toMatchObject({
      valid: true,
      matches: 2,
      captureGroups: 1,
      namedGroups: 1,
      inputCharacters: 11,
      riskLevel: "low",
      executionBlocked: false,
    });
    expect(result.metrics.readinessScore).toBeGreaterThan(0);
  });

  it("adds a no-match warning for valid patterns", () => {
    const result = analyzeRegexStudio({ ...state, text: "bar" });
    expect(result.checks).toContainEqual(expect.objectContaining({ id: "sample-match", severity: "warning" }));
  });

  it("detects secret-like sample content", () => {
    const result = analyzeRegexStudio({ ...state, text: "api_key=super-secret-value" });
    expect(result.checks).toContainEqual(expect.objectContaining({ id: "sample-privacy", severity: "danger" }));
  });

  it("builds a production Markdown report", () => {
    const report = buildRegexMarkdownReport(state);
    expect(report).toContain("# Regex production report");
    expect(report).toContain("## Production checks");
    expect(report).toContain("foo and foo");
  });

  it("builds spreadsheet-safe match CSV", () => {
    const csv = buildRegexMatchesCsv({ pattern: "[=+@-]\\w+", flags: "g", text: "=SUM +cmd @user -danger", replacement: "x" });
    expect(csv.split("\n")[0]).toContain("match_number");
    expect(csv).toContain("'=SUM");
    expect(csv).toContain("'+cmd");
  });

  it("builds standalone JavaScript and typed TypeScript modules", () => {
    expect(buildRegexJavaScriptModule(state)).toContain("export function inspectInput(input)");
    expect(buildRegexTypeScriptModule(state)).toContain("export function inspectInput(input: string): RegexInspection");
  });

  it("preserves a low-risk assessment for ordinary patterns", () => {
    expect(assessRegexRisk(state.pattern).level).toBe("low");
  });
});
