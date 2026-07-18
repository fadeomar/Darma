import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createProductionZip, parseProjectJson, type ProjectSource } from "./studio";

const source: ProjectSource = {
  html: '<main id="app"><h1>Preview</h1></main>',
  css: "#app { padding: 2rem; }",
  js: "document.querySelector('#app')?.classList.add('ready');",
};

describe("Code Preview production pack", () => {
  it("creates a reopenable seven-file ZIP", async () => {
    const bytes = await createProductionZip(source, "tablet", true);
    const zip = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual([
      "README.md",
      "darma-project.json",
      "index.html",
      "production-metrics.csv",
      "production-report.md",
      "script.js",
      "styles.css",
    ]);

    const project = await zip.file("darma-project.json")!.async("string");
    const html = await zip.file("index.html")!.async("string");
    const javascript = await zip.file("script.js")!.async("string");
    expect(parseProjectJson(project)).toEqual({ source, viewport: "tablet", autoRun: true });
    expect(html).toContain('href="styles.css"');
    expect(html).toContain('src="script.js"');
    expect(() => new Function(javascript)).not.toThrow();
    expect(await zip.file("production-report.md")!.async("string")).toContain("Code Preview production report");
    expect(await zip.file("production-metrics.csv")!.async("string")).toContain("readiness_score");
  });
});
