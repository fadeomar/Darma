import JSZip from "jszip";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  buildJsonFormatterProductionFiles,
  buildJsonFormatterSnapshot,
} from "./studio";

const snapshot = buildJsonFormatterSnapshot({
  input: '{"project":"Darma","items":[{"id":1,"ready":true}],"token":"private-example"}',
  resultText:
    '{\n  "project": "Darma",\n  "items": [\n    {\n      "id": 1,\n      "ready": true\n    }\n  ],\n  "token": "private-example"\n}',
  settings: { indent: 2, sortKeys: false, preferredView: "text" },
  operation: "format",
});

describe("JSON Formatter generated exports", () => {
  it("creates parseable JSON and syntactically valid developer modules", () => {
    const files = buildJsonFormatterProductionFiles(
      snapshot,
      "2026-07-14T00:00:00.000Z",
    );

    expect(JSON.parse(files["formatted.json"])).toMatchObject({ project: "Darma" });
    expect(JSON.parse(files["minified.json"])).toMatchObject({ project: "Darma" });
    expect(JSON.parse(files["json-formatter-profile.json"])).toMatchObject({
      schema: "darma.json-formatter-profile",
      version: 1,
    });

    const js = ts.transpileModule(files["json-data.js"], {
      fileName: "json-data.js",
      reportDiagnostics: true,
      compilerOptions: {
        allowJs: true,
        checkJs: true,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
    });
    const typed = ts.transpileModule(files["json-data.ts"], {
      fileName: "json-data.ts",
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        strict: true,
      },
    });
    expect(js.diagnostics ?? []).toHaveLength(0);
    expect(typed.diagnostics ?? []).toHaveLength(0);
  });

  it("creates and reopens a seven-file ZIP production pack", async () => {
    const files = buildJsonFormatterProductionFiles(snapshot);
    const zip = new JSZip();
    Object.entries(files).forEach(([name, content]) => zip.file(name, content));
    const archive = await zip.generateAsync({ type: "uint8array" });
    const reopened = await JSZip.loadAsync(archive);

    expect(Object.keys(reopened.files).sort()).toEqual(Object.keys(files).sort());
    expect(
      JSON.parse(await reopened.file("formatted.json")!.async("string")),
    ).toMatchObject({ project: "Darma" });
    expect(await reopened.file("json-audit.md")!.async("string")).not.toContain(
      "private-example",
    );
    expect(await reopened.file("formatted.json")!.async("string")).toContain(
      "private-example",
    );
  });
});
