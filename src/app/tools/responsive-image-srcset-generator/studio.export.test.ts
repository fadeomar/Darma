import JSZip from "jszip";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { createDefaultResponsiveImageState } from "./responsiveImage";
import { buildResponsiveImageAudit, buildResponsiveImageProductionFiles, parseResponsiveImageProject } from "./studio";

describe("responsive image production pack", () => {
  it("creates and reopens the complete eight-file package", async () => {
    const state = createDefaultResponsiveImageState();
    const checks = buildResponsiveImageAudit(state);
    const files = buildResponsiveImageProductionFiles(state, checks);
    expect(Object.keys(files).sort()).toEqual([
      "README.md",
      "ResponsiveImage.tsx",
      "production-metrics.csv",
      "production-report.md",
      "responsive-image-project.json",
      "responsive-image-snippets.txt",
      "responsive-image.css",
      "responsive-image.html",
    ]);

    const zip = new JSZip();
    Object.entries(files).forEach(([filename, content]) => zip.file(filename, content));
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const reopened = await JSZip.loadAsync(bytes);
    expect(Object.keys(reopened.files).sort()).toEqual(Object.keys(files).sort());

    const projectText = await reopened.file("responsive-image-project.json")!.async("string");
    expect(parseResponsiveImageProject(projectText).state.candidates).toHaveLength(4);
    const html = await reopened.file("responsive-image.html")!.async("string");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("</html>");
    expect(html).not.toContain("javascript:");

    const react = await reopened.file("ResponsiveImage.tsx")!.async("string");
    expect(react).toContain('from "next/image"');
    const transpiled = ts.transpileModule(react, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      reportDiagnostics: true,
    });
    expect(transpiled.diagnostics ?? []).toHaveLength(0);

    expect(JSON.parse(await reopened.file("responsive-image-project.json")!.async("string"))).toHaveProperty("schemaVersion", 1);
    expect((await reopened.file("production-metrics.csv")!.async("string")).trim().split("\n")).toHaveLength(2);
  });
});
