import { describe, expect, it } from "vitest";
import { DEFAULT_MOCKUP_INPUT } from "./presets";
import { createReadinessChecks, scoreReadiness, validateExistingPackage, validateGeneratedAssets, validateMockupInput } from "./validation";

function blobAsset(filename: string, width = 1200, height = 900, bytes = 4096) {
  return { filename, width, height, mimeType: "image/png" as const, blob: new Blob([new Uint8Array(bytes)]), previewUrl: `blob:${filename}` };
}

describe("mockup validation", () => {
  it("warns when the screenshot is missing", () => {
    expect(validateMockupInput(DEFAULT_MOCKUP_INPUT)).toContainEqual(expect.objectContaining({ id: "missing-screenshot" }));
  });

  it("reports invalid colors and long titles", () => {
    const warnings = validateMockupInput({ ...DEFAULT_MOCKUP_INPUT, backgroundColor: "red", title: "x".repeat(77) });
    expect(warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "invalid-color", level: "error" }),
      expect.objectContaining({ id: "long-title", level: "warning" }),
    ]));
  });

  it("scores readiness from passed checks", () => {
    const checks = createReadinessChecks({ ...DEFAULT_MOCKUP_INPUT, screenshotDataUrl: "data:x", screenshotName: "shot.png", screenshotWidth: 1200, screenshotHeight: 900 }, [blobAsset("a.png")]);
    expect(scoreReadiness(checks)).toBeGreaterThan(80);
  });

  it("detects duplicate and suspicious generated assets", () => {
    const results = validateGeneratedAssets([blobAsset("same.png", 400, 300, 100), blobAsset("same.png")]);
    expect(results.some((result) => result.level === "error")).toBe(true);
    expect(results.some((result) => result.level === "warning")).toBe(true);
  });

  it("checks existing local packages", async () => {
    const files = [
      new File([new Uint8Array(1024)], "good-image.png", { type: "image/png" }),
      new File([new Uint8Array(1024)], "bad name.jpg", { type: "image/jpeg" }),
    ];
    const results = await validateExistingPackage(files);
    expect(results).toContainEqual(expect.objectContaining({ id: "name-bad name.jpg", level: "warning" }));
  });
});
