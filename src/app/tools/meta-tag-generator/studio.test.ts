import { describe, expect, it } from "vitest";
import { DEFAULT_META_INPUT } from "./presets";
import {
  META_PROJECT_TOOL,
  META_PROJECT_VERSION,
  buildMetaAudit,
  buildMetaMarkdownReport,
  buildMetaMetricsCsv,
  buildMetaProductionFiles,
  buildMetaSummary,
  buildNextMetadataModule,
  createMetaProject,
  normalizeMetaInput,
  parseMetaProject,
  summarizeMetaAudit,
} from "./studio";

describe("meta tag production studio", () => {
  it("normalizes imported values and removes null characters", () => {
    const input = normalizeMetaInput({
      ...DEFAULT_META_INPUT,
      title: "Hello\0 world",
      ogType: "invalid",
      twitterCard: "invalid",
      locale: 123,
    });

    expect(input.title).toBe("Hello world");
    expect(input.ogType).toBe(DEFAULT_META_INPUT.ogType);
    expect(input.twitterCard).toBe(DEFAULT_META_INPUT.twitterCard);
    expect(input.locale).toBe(DEFAULT_META_INPUT.locale);
  });

  it("round-trips a versioned project", () => {
    const project = createMetaProject(DEFAULT_META_INPUT, "2026-07-14T00:00:00.000Z");
    const restored = parseMetaProject(JSON.stringify(project));

    expect(restored.tool).toBe(META_PROJECT_TOOL);
    expect(restored.schemaVersion).toBe(META_PROJECT_VERSION);
    expect(restored.input).toEqual(DEFAULT_META_INPUT);
  });

  it("rejects empty, invalid, foreign, and unsupported project files", () => {
    expect(() => parseMetaProject(" ")).toThrow(/empty/i);
    expect(() => parseMetaProject("{")).toThrow(/valid JSON/i);
    expect(() => parseMetaProject(JSON.stringify({ tool: "other", schemaVersion: 1, input: {} }))).toThrow(/not created/i);
    expect(() => parseMetaProject(JSON.stringify({ tool: META_PROJECT_TOOL, schemaVersion: 99, input: {} }))).toThrow(/Unsupported/i);
  });

  it("builds four decision cards", () => {
    const checks = buildMetaAudit(DEFAULT_META_INPUT);
    const summary = buildMetaSummary(DEFAULT_META_INPUT, checks);

    expect(summary).toHaveLength(4);
    expect(summary.map((item) => item.label)).toEqual(["Search title", "Description", "Social image", "Readiness"]);
  });

  it("blocks missing title and canonical URL", () => {
    const next = { ...DEFAULT_META_INPUT, title: "", canonicalUrl: "" };
    const checks = buildMetaAudit(next);
    const counts = summarizeMetaAudit(checks);

    expect(counts.error).toBeGreaterThanOrEqual(2);
    expect(buildMetaSummary(next, checks)[3]?.value).toBe("Blocked");
  });

  it("warns about insecure production URLs", () => {
    const checks = buildMetaAudit({
      ...DEFAULT_META_INPUT,
      canonicalUrl: "http://example.com/page",
      imageUrl: "http://example.com/card.jpg",
    });

    expect(checks.some((check) => check.id === "canonical-http" && check.severity === "warning")).toBe(true);
    expect(checks.some((check) => check.id === "image-http" && check.severity === "warning")).toBe(true);
  });

  it("generates a Next.js metadata module and maps product to website", () => {
    const metadataModule = buildNextMetadataModule({ ...DEFAULT_META_INPUT, ogType: "product" });
    expect(metadataModule).toContain('import type { Metadata } from "next"');
    expect(metadataModule).toContain("does not expose an Open Graph product type");
    expect(metadataModule).toContain('"type": "website"');
  });

  it("builds readable reports and spreadsheet-safe metrics", () => {
    const malicious = { ...DEFAULT_META_INPUT, siteName: "=HYPERLINK(\"https://bad.example\")" };
    const checks = buildMetaAudit(malicious);
    const report = buildMetaMarkdownReport(malicious, checks);
    const csv = buildMetaMetricsCsv(malicious, checks);

    expect(report).toContain("Production checks");
    expect(report).toContain("Generated head tags");
    expect(csv).toContain("metric,value");
    expect(csv).toContain("'=HYPERLINK");
  });

  it("returns the complete seven-file production handoff", () => {
    const files = buildMetaProductionFiles(DEFAULT_META_INPUT, buildMetaAudit(DEFAULT_META_INPUT));
    expect(Object.keys(files).sort()).toEqual([
      "README.md",
      "head-example.html",
      "meta-project.json",
      "meta-tags.html",
      "metadata.ts",
      "production-metrics.csv",
      "production-report.md",
    ]);
    expect(JSON.parse(files["meta-project.json"] ?? "{}").tool).toBe(META_PROJECT_TOOL);
  });
});
