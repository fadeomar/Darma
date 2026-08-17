import { describe, expect, it } from "vitest";
import { estimateCanvasWorkingMemory, fitPreviewToWorkspace, resolveOutputDimensions, shouldWarnLargeExport } from "./workspace";

describe("photo editor workspace helpers", () => {
  it("fits a preview without changing aspect ratio", () => {
    expect(fitPreviewToWorkspace({ width: 1200, height: 800 }, { width: 632, height: 500 })).toEqual({ width: 600, height: 400 });
  });

  it("does not upscale a small preview", () => {
    expect(fitPreviewToWorkspace({ width: 400, height: 300 }, { width: 1200, height: 900 })).toEqual({ width: 400, height: 300 });
  });


  it("keeps custom dimensions proportional when aspect lock is enabled", () => {
    expect(resolveOutputDimensions(
      { width: 4000, height: 3000 },
      { mode: "custom", customWidth: "2000", customHeight: "999", lockAspect: true, driver: "width" },
    )).toEqual({ width: 2000, height: 1500 });

    expect(resolveOutputDimensions(
      { width: 4000, height: 3000 },
      { mode: "custom", customWidth: "999", customHeight: "750", lockAspect: true, driver: "height" },
    )).toEqual({ width: 1000, height: 750 });
  });

  it("honors both custom dimensions only when aspect lock is off", () => {
    expect(resolveOutputDimensions(
      { width: 4000, height: 3000 },
      { mode: "custom", customWidth: "1600", customHeight: "900", lockAspect: false, driver: "width" },
    )).toEqual({ width: 1600, height: 900 });
  });

  it("estimates temporary RGBA working memory", () => {
    expect(estimateCanvasWorkingMemory({ width: 4000, height: 3000 })).toBe(120_000_000);
  });

  it("warns for very large exports", () => {
    expect(shouldWarnLargeExport({ width: 8000, height: 7000 })).toBe(true);
    expect(shouldWarnLargeExport({ width: 6000, height: 4000 })).toBe(false);
    expect(shouldWarnLargeExport({ width: 17_000, height: 1000 })).toBe(true);
  });
});
