import JSZip from "jszip";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { createReadme } from "./generator";
import { DEFAULT_MOCKUP_INPUT } from "./presets";
import { createCssSnippet, createCssVariablesSnippet, createDesignTokenSnippet, createHtmlFigureSnippet, createNextImageSnippet, createResponsivePictureSnippet } from "./snippets";
import { createMockupFingerprint, createMockupMarkdownReport, createMockupMetricsCsv, createMockupProjectJson, parseMockupProjectJson } from "./studio";
import type { GeneratedMockupAsset } from "./types";
import { createZipArchive } from "./zip";

function asset(filename: string, width: number, height: number): GeneratedMockupAsset {
  return { filename, width, height, mimeType: "image/png", blob: new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), previewUrl: `blob:${filename}` };
}

describe("mockup production pack", () => {
  it("creates and reopens the complete textual handoff", async () => {
    const input = {
      ...DEFAULT_MOCKUP_INPUT,
      screenshotDataUrl: "data:image/png;base64,AAAA",
      screenshotName: "dashboard.png",
      screenshotWidth: 1600,
      screenshotHeight: 1000,
    };
    const assets = [asset("app-mockup-hero-wide.png", 1600, 1200), asset("app-mockup-hero-16x9.png", 1920, 1080), asset("app-mockup-feature-card.png", 1200, 900)];
    const fingerprint = createMockupFingerprint(input);
    const entries = [
      ...assets.map((item) => ({ filename: item.filename, data: item.blob })),
      { filename: "README.md", data: createReadme(input, assets) },
      { filename: "html-figure-snippet.html", data: createHtmlFigureSnippet(input, assets[0]) },
      { filename: "next-image-snippet.tsx", data: createNextImageSnippet(input, assets[0]) },
      { filename: "responsive-picture-snippet.html", data: createResponsivePictureSnippet(input, assets) },
      { filename: "mockup-styles.css", data: createCssSnippet() },
      { filename: "mockup-variables.css", data: createCssVariablesSnippet(input) },
      { filename: "mockup.tokens.json", data: createDesignTokenSnippet(input, assets) },
      { filename: "mockup-project.json", data: createMockupProjectJson(input) },
      { filename: "production-report.md", data: createMockupMarkdownReport(input, assets, fingerprint) },
      { filename: "production-metrics.csv", data: createMockupMetricsCsv(input, assets, fingerprint) },
    ];
    const archive = await createZipArchive(entries);
    const zip = await JSZip.loadAsync(await archive.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(entries.map((entry) => entry.filename).sort());

    const projectSource = await zip.file("mockup-project.json")!.async("string");
    expect(parseMockupProjectJson(projectSource).input.screenshotDataUrl).toBe("");
    expect(projectSource).not.toContain(input.screenshotDataUrl);
    expect(JSON.parse(await zip.file("mockup.tokens.json")!.async("string"))).toHaveProperty("exports", expect.any(Array));
    expect((await zip.file("production-metrics.csv")!.async("string")).split("\n")[0]).toBe("metric,value");
    expect(await zip.file("production-report.md")!.async("string")).toContain("Readiness");

    const tsx = await zip.file("next-image-snippet.tsx")!.async("string");
    const transpiled = ts.transpileModule(tsx, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
    expect(transpiled.diagnostics ?? []).toHaveLength(0);
  });
});
