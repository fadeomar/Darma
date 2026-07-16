import { describe, expect, it } from "vitest";
import {
  buildMetricsCsv,
  buildProjectJson,
  buildStandaloneDocument,
  canCompileJavascript,
  getMetrics,
  getProductionChecks,
  hasBalancedCssBraces,
  parseProjectJson,
  type ProjectSource,
} from "./studio";

const source: ProjectSource = {
  html: '<main><img src="hero.png" alt="Hero"><button type="button">Go</button></main>',
  css: "main { display: grid; }",
  js: "const run = () => true;",
};

describe("Code Preview studio", () => {
  it("builds and restores a version 2 project", () => {
    const imported = parseProjectJson(buildProjectJson(source, "mobile", false));
    expect(imported).toEqual({ source, viewport: "mobile", autoRun: false });
  });

  it("supports legacy version 1 projects", () => {
    const imported = parseProjectJson(JSON.stringify({
      schemaVersion: 1,
      tool: "darma-code-preview",
      files: { "index.html": "<p>Legacy</p>", "styles.css": "", "script.js": "" },
    }));
    expect(imported.viewport).toBe("desktop");
    expect(imported.autoRun).toBe(true);
  });

  it("rejects wrong tools and unsupported versions", () => {
    expect(() => parseProjectJson(JSON.stringify({ tool: "other", schemaVersion: 2, files: {} }))).toThrow(/not exported/i);
    expect(() => parseProjectJson(JSON.stringify({ tool: "darma-code-preview", schemaVersion: 99, files: {} }))).toThrow(/unsupported/i);
  });

  it("rejects malformed or oversized files", () => {
    expect(() => parseProjectJson("not json")).toThrow(/valid JSON/i);
    const huge = "x".repeat(1_000_001);
    expect(() => parseProjectJson(huge)).toThrow(/1 MB/i);
  });

  it("removes null characters during import", () => {
    const imported = parseProjectJson(JSON.stringify({
      schemaVersion: 2,
      tool: "darma-code-preview",
      settings: { viewport: "tablet", autoRun: true },
      files: { "index.html": "<p>safe\u0000</p>", "styles.css": "", "script.js": "" },
    }));
    expect(imported.source.html).toBe("<p>safe</p>");
  });

  it("checks CSS and JavaScript syntax", () => {
    expect(hasBalancedCssBraces(".a { color: red; }")).toBe(true);
    expect(hasBalancedCssBraces(".a { color: red;")).toBe(false);
    expect(canCompileJavascript("const value = 1;")).toBe(true);
    expect(canCompileJavascript("const = ;")).toBe(false);
  });

  it("detects accessibility and safety issues", () => {
    const checks = getProductionChecks({
      html: '<img src="x"><button>Go</button><a target="_blank" href="https://example.com">Link</a><input id="email">',
      css: "body { color: black; }",
      js: 'const apiKey = "1234567890-secret"; console.log(apiKey);',
    });
    expect(checks.find((check) => check.id === "image-alt")?.status).toBe("warning");
    expect(checks.find((check) => check.id === "form-labels")?.status).toBe("warning");
    expect(checks.find((check) => check.id === "secret-like-source")?.status).toBe("error");
  });

  it("computes readiness and source metrics", () => {
    const metrics = getMetrics(source);
    expect(metrics.sourceBytes).toBeGreaterThan(0);
    expect(metrics.elementCount).toBeGreaterThanOrEqual(3);
    expect(metrics.readinessScore).toBeGreaterThan(80);
  });

  it("escapes closing script and style tags in standalone HTML", () => {
    const html = buildStandaloneDocument({ html: "<main>Test</main>", css: "/* </style> */", js: 'console.log("</script>")' });
    expect(html).toContain("<\\/style>");
    expect(html).toContain("<\\/script>");
  });

  it("creates spreadsheet-safe metrics CSV", () => {
    const csv = buildMetricsCsv(source);
    expect(csv.split("\n")[0]).toBe("metric,value");
    expect(csv).toContain('"readiness_score"');
  });
});
