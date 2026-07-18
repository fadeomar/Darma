import { describe, expect, it } from "vitest";
import {
  DEFAULT_JSON_FORMATTER_SETTINGS,
  MAX_JSON_IMPORT_BYTES,
  buildJsonFormatterAudit,
  buildJsonFormatterJavaScriptModule,
  buildJsonFormatterMarkdownReport,
  buildJsonFormatterMetricsCsv,
  buildJsonFormatterProductionFiles,
  buildJsonFormatterSnapshot,
  buildJsonFormatterSummaryCards,
  buildJsonFormatterTypeScriptModule,
  createJsonFormatterProfile,
  findPrototypeKeyPaths,
  findSensitiveKeyPaths,
  findUnsafeIntegerLiterals,
  normalizeJsonFormatterSettings,
  parseJsonFormatterProfile,
  summarizeJsonFormatterAudit,
} from "./studio";

const settings = {
  indent: 2 as const,
  sortKeys: false,
  preferredView: "text" as const,
};

function snapshot(
  overrides: Partial<Parameters<typeof buildJsonFormatterSnapshot>[0]> = {},
) {
  return buildJsonFormatterSnapshot({
    input: '{"user":{"id":1,"active":true},"items":[1,2]}',
    resultText: '{\n  "user": { "id": 1, "active": true },\n  "items": [1, 2]\n}',
    settings,
    operation: "format",
    ...overrides,
  });
}

describe("JSON Formatter production studio", () => {
  it("normalizes imported settings", () => {
    expect(
      normalizeJsonFormatterSettings({
        indent: 4,
        sortKeys: true,
        preferredView: "tree",
      }),
    ).toEqual({ indent: 4, sortKeys: true, preferredView: "tree" });
    expect(normalizeJsonFormatterSettings({ indent: 9 })).toEqual(
      DEFAULT_JSON_FORMATTER_SETTINGS,
    );
  });

  it("creates a profile without embedding payload data", () => {
    const profile = createJsonFormatterProfile(
      settings,
      "2026-07-14T00:00:00.000Z",
    );
    expect(profile.schema).toBe("darma.json-formatter-profile");
    expect(profile.exportedAt).toBe("2026-07-14T00:00:00.000Z");
    expect(JSON.stringify(profile)).not.toContain("user");
  });

  it("parses a valid formatter profile", () => {
    const profile = createJsonFormatterProfile({
      indent: "tab",
      sortKeys: true,
      preferredView: "stats",
    });
    expect(parseJsonFormatterProfile(JSON.stringify(profile))).toEqual(
      profile.settings,
    );
  });

  it("rejects invalid, unrelated, and unsupported profiles", () => {
    expect(() => parseJsonFormatterProfile("{")).toThrow("not valid JSON");
    expect(() =>
      parseJsonFormatterProfile(
        JSON.stringify({ schema: "other", version: 1, settings: {} }),
      ),
    ).toThrow("not a Darma JSON Formatter");
    expect(() =>
      parseJsonFormatterProfile(
        JSON.stringify({
          schema: "darma.json-formatter-profile",
          version: 2,
          settings: {},
        }),
      ),
    ).toThrow("version is not supported");
  });

  it("detects unsafe integer literals but ignores strings and safe integers", () => {
    expect(
      findUnsafeIntegerLiterals(
        '{"safe":9007199254740991,"unsafe":9007199254740993,"asText":"9007199254740995"}',
      ),
    ).toEqual(["9007199254740993"]);
  });

  it("detects negative unsafe integer literals", () => {
    expect(findUnsafeIntegerLiterals("[-9007199254740993]")).toEqual([
      "-9007199254740993",
    ]);
  });

  it("detects sensitive and prototype-sensitive key paths", () => {
    const value = {
      auth: { accessToken: "x" },
      nested: { __proto__: "x", constructor: "y" },
    } as unknown as Parameters<typeof findSensitiveKeyPaths>[0];
    expect(findSensitiveKeyPaths(value)).toContain("$.auth.accessToken");
    expect(findPrototypeKeyPaths(value)).toContain("$.nested.constructor");
  });

  it("builds a parsed snapshot with stats and signals", () => {
    const current = snapshot();
    expect(current.valid).toBe(true);
    expect(current.stats?.rootType).toBe("object");
    expect(current.stats?.depth).toBeGreaterThan(1);
  });

  it("builds four summary cards", () => {
    expect(buildJsonFormatterSummaryCards(snapshot())).toHaveLength(4);
  });

  it("blocks empty and invalid JSON", () => {
    const emptyChecks = buildJsonFormatterAudit(
      snapshot({ input: "", resultText: "" }),
    );
    expect(emptyChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "input-empty", severity: "error" }),
      ]),
    );

    const invalidChecks = buildJsonFormatterAudit(
      snapshot({ input: "{bad}", resultText: "{bad}" }),
    );
    expect(invalidChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "json-invalid", severity: "error" }),
      ]),
    );
  });

  it("blocks unsafe integers", () => {
    const checks = buildJsonFormatterAudit(
      snapshot({
        input: '{"id":9007199254740993}',
        resultText: '{"id":9007199254740993}',
      }),
    );
    expect(checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "unsafe-integers",
          severity: "error",
        }),
      ]),
    );
  });

  it("warns about credential-like and prototype-sensitive keys", () => {
    const checks = buildJsonFormatterAudit(
      snapshot({
        input: '{"apiKey":"secret","constructor":{"x":1}}',
        resultText: '{"apiKey":"secret","constructor":{"x":1}}',
        historyEnabled: true,
      }),
    );
    expect(checks.some((check) => check.id === "sensitive-keys")).toBe(true);
    expect(checks.some((check) => check.id === "history-sensitive")).toBe(
      true,
    );
    expect(checks.some((check) => check.id === "prototype-keys")).toBe(true);
  });

  it("warns for large payloads and reports oversized payloads as errors", () => {
    const large = `{"data":"${"x".repeat(1024 * 1024)}"}`;
    expect(
      buildJsonFormatterAudit(snapshot({ input: large, resultText: large })).some(
        (check) => check.id === "payload-large",
      ),
    ).toBe(true);

    const oversized = `{"data":"${"x".repeat(MAX_JSON_IMPORT_BYTES + 1)}"}`;
    expect(
      buildJsonFormatterAudit(
        snapshot({ input: oversized, resultText: oversized }),
      ).some(
        (check) =>
          check.id === "payload-oversized" && check.severity === "error",
      ),
    ).toBe(true);
  });

  it("marks a clean payload as ready", () => {
    const summary = summarizeJsonFormatterAudit(
      buildJsonFormatterAudit(snapshot()),
    );
    expect(summary.status).toBe("Ready");
    expect(summary.errors).toBe(0);
  });

  it("creates a metrics-only Markdown report", () => {
    const report = buildJsonFormatterMarkdownReport(snapshot());
    expect(report).toContain("# Darma JSON Formatter audit");
    expect(report).toContain("Production checks");
    expect(report).not.toContain('"user"');
  });

  it("creates a one-row metrics CSV", () => {
    const csv = buildJsonFormatterMetricsCsv(snapshot());
    expect(csv.trim().split("\n")).toHaveLength(2);
    expect(csv).toContain("unsafe_integer_count");
  });

  it("creates JavaScript and TypeScript modules", () => {
    expect(buildJsonFormatterJavaScriptModule(snapshot())).toContain(
      "export default data",
    );
    expect(buildJsonFormatterTypeScriptModule(snapshot())).toContain(
      "as const",
    );
  });

  it("rejects module exports when JSON is invalid", () => {
    const invalid = snapshot({ input: "{", resultText: "{" });
    expect(() => buildJsonFormatterJavaScriptModule(invalid)).toThrow(
      "Valid JSON is required",
    );
  });

  it("blocks developer exports when integer precision is unsafe", () => {
    const unsafe = snapshot({
      input: '{"id":9007199254740993}',
      resultText: '{"id":9007199254740993}',
    });
    expect(() => buildJsonFormatterJavaScriptModule(unsafe)).toThrow(
      "unsafe integer identifiers",
    );
    expect(() => buildJsonFormatterProductionFiles(unsafe)).toThrow(
      "unsafe integer identifiers",
    );
  });

  it("creates all production files", () => {
    expect(Object.keys(buildJsonFormatterProductionFiles(snapshot())).sort()).toEqual([
      "formatted.json",
      "json-audit.md",
      "json-data.js",
      "json-data.ts",
      "json-formatter-profile.json",
      "json-metrics.csv",
      "minified.json",
    ]);
  });

  it("keeps the profile and report free of payload values", () => {
    const files = buildJsonFormatterProductionFiles(
      snapshot({
        input: '{"password":"do-not-export-in-report"}',
        resultText: '{"password":"do-not-export-in-report"}',
      }),
    );
    expect(files["json-formatter-profile.json"]).not.toContain(
      "do-not-export-in-report",
    );
    expect(files["json-audit.md"]).not.toContain("do-not-export-in-report");
    expect(files["formatted.json"]).toContain("do-not-export-in-report");
  });
});
