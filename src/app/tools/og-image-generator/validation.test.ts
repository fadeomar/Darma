import { describe, expect, it } from "vitest";
import { DEFAULT_OG_INPUT } from "./presets";
import type { OgGeneratedAsset } from "./types";
import {
  createReadinessChecks,
  scoreReadiness,
  validateExistingPackage,
  validateGeneratedAssets,
  validateOgInput,
} from "./validation";

function asset(filename: string, options: Partial<OgGeneratedAsset> = {}): OgGeneratedAsset {
  const blob = new Blob(["asset"], { type: "text/plain" });
  return {
    filename,
    mimeType: blob.type,
    blob,
    kind: "snippet",
    size: blob.size,
    ...options,
  };
}

describe("OG input validation", () => {
  it("returns a ready state for the default input", () => {
    expect(validateOgInput(DEFAULT_OG_INPUT)).toContainEqual(expect.objectContaining({ id: "ready", level: "success" }));
  });

  it("flags missing titles and invalid URLs", () => {
    const warnings = validateOgInput({ ...DEFAULT_OG_INPUT, title: "", siteUrl: "javascript:alert(1)" });
    expect(warnings).toContainEqual(expect.objectContaining({ id: "title-empty", level: "error" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "url-invalid", level: "error" }));
  });

  it("flags malformed colors and image backgrounds without a source", () => {
    const warnings = validateOgInput({ ...DEFAULT_OG_INPUT, backgroundMode: "image", foregroundColor: "white", backgroundImageDataUrl: "" });
    expect(warnings).toContainEqual(expect.objectContaining({ id: "color-1", level: "error" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "missing-background", level: "info" }));
  });

  it("warns about long copy", () => {
    const warnings = validateOgInput({ ...DEFAULT_OG_INPUT, title: "x".repeat(91), subtitle: "y".repeat(201) });
    expect(warnings).toContainEqual(expect.objectContaining({ id: "title-long", level: "warning" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "subtitle-long", level: "warning" }));
  });
});

describe("generated package validation", () => {
  const assets = [
    asset("opengraph-image.png", { kind: "image", mimeType: "image/png", width: 1200, height: 630 }),
    asset("twitter-image.png", { kind: "image", mimeType: "image/png", width: 1200, height: 630 }),
    asset("html-meta-tags.txt"),
    asset("metadata-snippet.ts"),
  ];

  it("scores a complete package at 100", () => {
    const checks = createReadinessChecks({ ...DEFAULT_OG_INPUT, exportPack: "nextjs" }, assets);
    expect(scoreReadiness(checks)).toBe(100);
    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("reduces readiness when required files are absent", () => {
    const checks = createReadinessChecks({ ...DEFAULT_OG_INPUT, exportPack: "nextjs" }, []);
    expect(scoreReadiness(checks)).toBeLessThan(70);
    expect(checks.find((check) => check.id === "size")?.passed).toBe(false);
  });

  it("reports unique non-empty assets and the primary size", () => {
    const warnings = validateGeneratedAssets(assets);
    expect(warnings).toContainEqual(expect.objectContaining({ id: "unique", level: "success" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "non-empty", level: "success" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "og-size", level: "success" }));
  });

  it("detects duplicate and empty outputs", () => {
    const emptyBlob = new Blob([]);
    const warnings = validateGeneratedAssets([
      asset("same.txt"),
      asset("same.txt"),
      { filename: "empty.txt", mimeType: "text/plain", blob: emptyBlob, kind: "snippet", size: 0 },
    ]);
    expect(warnings).toContainEqual(expect.objectContaining({ id: "duplicates", level: "warning" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "empty-files", level: "error" }));
  });
});

describe("existing package checker", () => {
  it("reports an empty upload state", async () => {
    expect(await validateExistingPackage([])).toContainEqual(expect.objectContaining({ id: "checker-empty" }));
  });

  it("recognizes expected loose files", async () => {
    const files = [
      new File(["png"], "opengraph-image.png", { type: "image/png" }),
      new File(["png"], "twitter-image.png", { type: "image/png" }),
      new File(["tags"], "html-meta-tags.txt", { type: "text/plain" }),
    ];
    const warnings = await validateExistingPackage(files);
    expect(warnings).toContainEqual(expect.objectContaining({ id: "has-og", level: "success" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "has-twitter", level: "success" }));
    expect(warnings).toContainEqual(expect.objectContaining({ id: "has-html", level: "success" }));
  });
});
