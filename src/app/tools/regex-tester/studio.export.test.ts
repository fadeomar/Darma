import JSZip from "jszip";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  buildRegexProductionPack,
  parseRegexProjectJson,
  type RegexStudioState,
} from "./studio";

const state: RegexStudioState = {
  pattern: "(?<date>\\d{4}-\\d{2}-\\d{2})",
  flags: "g",
  text: "Created 2026-07-14.",
  replacement: "[$<date>]",
};

describe("regex production pack", () => {
  it("creates and reopens the complete eight-file ZIP", async () => {
    const bytes = await buildRegexProductionPack(state);
    const zip = await JSZip.loadAsync(bytes);
    const files = Object.keys(zip.files).sort();

    expect(files).toEqual([
      "README.md",
      "regex-matches.csv",
      "regex-project.json",
      "regex-report.md",
      "regex.mjs",
      "regex.ts",
      "replacement-output.txt",
      "sample-input.txt",
    ]);

    const project = parseRegexProjectJson(await zip.file("regex-project.json")!.async("string"));
    expect(project).toMatchObject(state);
    expect(await zip.file("regex-report.md")!.async("string")).toContain("Regex production report");
    expect(await zip.file("regex-matches.csv")!.async("string")).toContain("2026-07-14");
    expect(await zip.file("regex.mjs")!.async("string")).toContain("export function inspectInput");
    expect(await zip.file("regex.ts")!.async("string")).toContain("RegexInspection");
    expect(await zip.file("sample-input.txt")!.async("string")).toBe(state.text);
    expect(await zip.file("replacement-output.txt")!.async("string")).toBe("Created [2026-07-14].");

    const javascript = await zip.file("regex.mjs")!.async("string");
    const typescript = await zip.file("regex.ts")!.async("string");
    const jsSyntax = ts.transpileModule(javascript, {
      compilerOptions: { allowJs: true, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      reportDiagnostics: true,
    });
    const tsSyntax = ts.transpileModule(typescript, {
      compilerOptions: { module: ts.ModuleKind.ESNext, strict: true, target: ts.ScriptTarget.ES2022 },
      reportDiagnostics: true,
    });
    expect(jsSyntax.diagnostics ?? []).toEqual([]);
    expect(tsSyntax.diagnostics ?? []).toEqual([]);
  });
});
