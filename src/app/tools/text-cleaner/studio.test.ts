import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEXT_CLEANER_WORKFLOW,
  buildTextCleanerAudit,
  buildTextCleanerJavaScript,
  buildTextCleanerMarkdownReport,
  buildTextCleanerMetricsCsv,
  buildTextCleanerProductionFiles,
  buildTextCleanerSnapshot,
  buildTextCleanerSummaryCards,
  computeTextCleanerMetrics,
  createTextCleanerProject,
  firstWorkflowGroup,
  normalizeTextCleanerWorkflow,
  parseTextCleanerProject,
  runTextCleanerWorkflow,
  summarizeTextCleanerAudit,
} from "./studio";

const workflow = {
  actionIds: ["trim-lines", "extra-spaces", "dedupe-lines"],
  prefixText: "> ",
  suffixText: ".",
};

function snapshot(
  overrides: Partial<Parameters<typeof buildTextCleanerSnapshot>[0]> = {},
) {
  return buildTextCleanerSnapshot({
    input: "  Alpha  \nAlpha\nBeta  ",
    output: "Alpha\nBeta",
    workflow,
    hasRun: true,
    isCurrent: true,
    ...overrides,
  });
}

describe("Text Cleaner production workflow", () => {
  it("normalizes workflow settings and removes invalid or duplicate actions", () => {
    expect(
      normalizeTextCleanerWorkflow({
        actionIds: ["trim", "invalid", "trim", "uppercase"],
        prefixText: "x",
        suffixText: "y",
      }),
    ).toEqual({
      actionIds: ["trim", "uppercase"],
      prefixText: "x",
      suffixText: "y",
    });
  });

  it("falls back when the workflow input is invalid", () => {
    expect(normalizeTextCleanerWorkflow(null)).toEqual(
      DEFAULT_TEXT_CLEANER_WORKFLOW,
    );
  });

  it("limits imported prefix and suffix values", () => {
    const normalized = normalizeTextCleanerWorkflow({
      actionIds: [],
      prefixText: "a".repeat(900),
      suffixText: "b".repeat(900),
    });
    expect(normalized.prefixText).toHaveLength(500);
    expect(normalized.suffixText).toHaveLength(500);
  });

  it("creates a workflow-only project file", () => {
    const project = createTextCleanerProject(
      workflow,
      "2026-07-14T00:00:00.000Z",
    );
    expect(project.schema).toBe("darma.text-cleaner-workflow");
    expect(project.exportedAt).toBe("2026-07-14T00:00:00.000Z");
    expect(JSON.stringify(project)).not.toContain("Alpha");
  });

  it("parses a valid project file", () => {
    const project = createTextCleanerProject(workflow);
    expect(parseTextCleanerProject(JSON.stringify(project))).toEqual(workflow);
  });

  it("rejects invalid JSON and unrelated schemas", () => {
    expect(() => parseTextCleanerProject("{")).toThrow("not valid JSON");
    expect(() =>
      parseTextCleanerProject(
        JSON.stringify({ schema: "other", version: 1, workflow: {} }),
      ),
    ).toThrow("not a Darma Text Cleaner");
  });

  it("rejects unsupported versions", () => {
    expect(() =>
      parseTextCleanerProject(
        JSON.stringify({
          schema: "darma.text-cleaner-workflow",
          version: 2,
          workflow: {},
        }),
      ),
    ).toThrow("version is not supported");
  });

  it("computes signed character, word, and line metrics", () => {
    expect(computeTextCleanerMetrics("a\na\nb", "a\nb")).toMatchObject({
      characterDelta: -2,
      wordDelta: -1,
      lineDelta: -1,
      matchedLines: 2,
      changedLines: 1,
      changedPercent: 33,
    });
  });

  it("builds four summary cards", () => {
    expect(buildTextCleanerSummaryCards(snapshot())).toHaveLength(4);
  });

  it("blocks empty input and empty workflows", () => {
    const checks = buildTextCleanerAudit(
      snapshot({
        input: "",
        output: "",
        workflow: { ...workflow, actionIds: [] },
        hasRun: false,
      }),
    );
    expect(
      checks.some(
        (check) => check.id === "input-empty" && check.severity === "error",
      ),
    ).toBe(true);
    expect(
      checks.some(
        (check) => check.id === "pipeline-empty" && check.severity === "error",
      ),
    ).toBe(true);
  });

  it("warns when extraction is not the final step", () => {
    const checks = buildTextCleanerAudit(
      snapshot({
        workflow: { ...workflow, actionIds: ["extract-emails", "uppercase"] },
      }),
    );
    expect(
      checks.some(
        (check) =>
          check.id === "extraction-order" && check.severity === "warning",
      ),
    ).toBe(true);
  });

  it("warns about competing case and sort actions", () => {
    const checks = buildTextCleanerAudit(
      snapshot({
        workflow: {
          ...workflow,
          actionIds: ["uppercase", "lowercase", "sort-az", "sort-za"],
        },
      }),
    );
    expect(checks.some((check) => check.id === "multiple-case-actions")).toBe(
      true,
    );
    expect(checks.some((check) => check.id === "opposite-sort")).toBe(true);
  });

  it("detects stale output", () => {
    const checks = buildTextCleanerAudit(snapshot({ isCurrent: false }));
    expect(
      checks.some(
        (check) => check.id === "stale-output" && check.severity === "warning",
      ),
    ).toBe(true);
  });

  it("treats an empty extraction result as informational", () => {
    const checks = buildTextCleanerAudit(
      snapshot({
        input: "No contacts here",
        output: "",
        workflow: { ...workflow, actionIds: ["extract-emails"] },
      }),
    );
    expect(
      checks.some(
        (check) => check.id === "empty-output" && check.severity === "info",
      ),
    ).toBe(true);
  });

  it("reports a current changed output as ready", () => {
    const checks = buildTextCleanerAudit(snapshot());
    expect(
      checks.some(
        (check) => check.id === "output-ready" && check.severity === "pass",
      ),
    ).toBe(true);
    expect(summarizeTextCleanerAudit(checks).status).not.toBe("Blocked");
  });

  it("warns when personal-data-like values are present", () => {
    const checks = buildTextCleanerAudit(
      snapshot({ input: "Email hello@example.com or +970 599 123 456" }),
    );
    expect(checks.some((check) => check.id === "sensitive-content")).toBe(true);
  });

  it("creates a Markdown report without embedding source text", () => {
    const report = buildTextCleanerMarkdownReport(snapshot());
    expect(report).toContain("# Darma Text Cleaner report");
    expect(report).toContain("Changed lines");
    expect(report).not.toContain("Alpha\nBeta");
  });

  it("creates a one-row metrics CSV", () => {
    const csv = buildTextCleanerMetricsCsv(snapshot());
    expect(csv.trim().split("\n")).toHaveLength(2);
    expect(csv).toContain("changed_percent");
  });

  it("creates valid CommonJS JavaScript source", () => {
    const source = buildTextCleanerJavaScript(workflow);
    expect(source).toContain('"use strict"');
    expect(source).toContain("module.exports = { workflow, cleanText }");
    expect(source).toContain('"dedupe-lines"');
  });

  it("creates all production files", () => {
    expect(
      Object.keys(buildTextCleanerProductionFiles(snapshot())).sort(),
    ).toEqual([
      "cleaned-text.txt",
      "text-cleaner-metrics.csv",
      "text-cleaner-pipeline.js",
      "text-cleaner-report.md",
      "text-cleaner-workflow.json",
    ]);
  });

  it("runs the selected workflow with custom context", () => {
    expect(
      runTextCleanerWorkflow("Alpha\nBeta", {
        actionIds: ["prefix-lines", "suffix-lines"],
        prefixText: "[",
        suffixText: "]",
      }),
    ).toBe("[Alpha]\n[Beta]");
  });

  it("returns the first selected action group", () => {
    expect(
      firstWorkflowGroup({
        ...workflow,
        actionIds: ["extract-emails", "uppercase"],
      }),
    ).toBe("extract");
    expect(firstWorkflowGroup({ ...workflow, actionIds: [] })).toBe("clean");
  });
});
