import ts from "typescript";
import { describe, expect, it } from "vitest";
import { presetToState, presets } from "./presets";
import { generateParticleData } from "./generateParticleData";
import { generateCss } from "./generateCss";
import { generateHtml } from "./generateHtml";
import {
  buildAnimatedBackgroundAudit,
  buildAnimatedBackgroundProductionFiles,
  parseAnimatedBackgroundProject,
} from "./studio";
import { createAnimatedBackgroundZip, readAnimatedBackgroundZip } from "./zip";

const state = presetToState(presets[0]);
const particles = generateParticleData(state);
const css = generateCss(state, particles);
const html = generateHtml(particles);
const checks = buildAnimatedBackgroundAudit(state, css, html);

describe("animated background production exports", () => {
  it("builds valid production files", () => {
    const files = buildAnimatedBackgroundProductionFiles(state, css, html, checks);
    expect(Object.keys(files).sort()).toEqual([
      "AnimatedBackground.tsx",
      "README.md",
      "animated-background-project.json",
      "animated-background.css",
      "animated-background.tokens.json",
      "index.html",
      "production-metrics.csv",
      "production-report.md",
    ]);
    expect(files["index.html"]).toContain("<!doctype html>");
    expect(files["index.html"]).toContain("prefers-reduced-motion");
    expect(() => JSON.parse(files["animated-background.tokens.json"])).not.toThrow();
    expect(parseAnimatedBackgroundProject(files["animated-background-project.json"]).state.seed).toBe(state.seed);
    expect(files["production-metrics.csv"].trim().split("\n")).toHaveLength(2);
    expect(files["AnimatedBackground.tsx"]).toContain("export function AnimatedBackground");

    const transpiled = ts.transpileModule(files["AnimatedBackground.tsx"], {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        strict: true,
      },
      reportDiagnostics: true,
    });
    expect(transpiled.diagnostics ?? []).toHaveLength(0);
    expect(transpiled.outputText).toContain("export function AnimatedBackground");
  });

  it("creates and reopens the complete ZIP", async () => {
    const files = buildAnimatedBackgroundProductionFiles(state, css, html, checks);
    const blob = await createAnimatedBackgroundZip(Object.entries(files).map(([filename, content]) => ({ filename, content })));
    const archive = new File([blob], "animated-background.zip", { type: "application/zip" });
    const entries = await readAnimatedBackgroundZip(archive);
    expect(entries.map((entry) => entry.name).sort()).toEqual(Object.keys(files).sort());
    const project = entries.find((entry) => entry.name === "animated-background-project.json");
    expect(project).toBeDefined();
    expect(parseAnimatedBackgroundProject(project?.text ?? "").state.presetId).toBe(state.presetId);
  });
});
