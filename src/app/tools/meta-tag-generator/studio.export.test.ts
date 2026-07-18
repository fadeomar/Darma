import JSZip from "jszip";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { DEFAULT_META_INPUT } from "./presets";
import { buildMetaAudit, buildMetaProductionFiles } from "./studio";

describe("meta production export syntax", () => {
  it("produces parseable project JSON, CSV rows, HTML, TypeScript, and ZIP content", async () => {
    const files = buildMetaProductionFiles(DEFAULT_META_INPUT, buildMetaAudit(DEFAULT_META_INPUT));

    const project = JSON.parse(files["meta-project.json"] ?? "{}");
    expect(project.input.title).toBe(DEFAULT_META_INPUT.title);

    const csvLines = (files["production-metrics.csv"] ?? "").trim().split(/\r?\n/);
    expect(csvLines[0]).toBe("metric,value");
    expect(csvLines.length).toBeGreaterThan(5);

    expect(files["head-example.html"]).toContain("<!doctype html>");
    expect(files["head-example.html"]).toContain("<head>");
    expect(files["meta-tags.html"]).toContain("og:title");

    const transpiled = ts.transpileModule(files["metadata.ts"] ?? "", {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        strict: true,
      },
      reportDiagnostics: true,
    });
    expect(transpiled.diagnostics ?? []).toHaveLength(0);
    expect(transpiled.outputText).toContain("export const metadata");

    const zip = new JSZip();
    Object.entries(files).forEach(([name, content]) => zip.file(name, content));
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const reopened = await JSZip.loadAsync(bytes);
    expect(Object.keys(reopened.files).sort()).toEqual(Object.keys(files).sort());
    expect(await reopened.file("meta-project.json")?.async("string")).toContain("darma-meta-tag-generator");
  });
});
