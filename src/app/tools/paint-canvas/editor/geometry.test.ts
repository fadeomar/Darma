import { describe, expect, it } from "vitest";
import { arrowPath, clampCanvasSize, clampZoom, fitZoom, MAX_ZOOM, MIN_ZOOM, normalizeRegion } from "./geometry";

describe("clampZoom", () => {
  it("keeps zoom in the supported range", () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
    expect(clampZoom(1.25)).toBe(1.25);
  });

  it("falls back to 100% for invalid values", () => {
    expect(clampZoom(Number.NaN)).toBe(1);
  });
});

describe("clampCanvasSize", () => {
  it("rounds and clamps custom artboard dimensions", () => {
    expect(clampCanvasSize({ width: 64, height: 5000 })).toEqual({ width: 128, height: 4096 });
    expect(clampCanvasSize({ width: 1080.4, height: Number.NaN })).toEqual({ width: 1080, height: 128 });
  });
});

describe("fitZoom", () => {
  it("fits a canvas without scaling it above 100%", () => {
    expect(fitZoom(600, 400, 1200, 800)).toBe(0.5);
    expect(fitZoom(1800, 1200, 1200, 800)).toBe(1);
  });
});

describe("normalizeRegion", () => {
  it("normalizes a drag in any direction", () => {
    expect(normalizeRegion({ x: 90, y: 80 }, { x: 20, y: 10 })).toEqual({
      left: 20,
      top: 10,
      width: 70,
      height: 70,
    });
  });
});

describe("arrowPath", () => {
  it("creates a shaft and arrow head", () => {
    const path = arrowPath({ x: 10, y: 10 }, { x: 110, y: 10 });
    expect(path).toContain("M 10 10 L 110 10");
    expect(path.match(/L 110 10/g)?.length).toBe(2);
  });

  it("handles a zero-length pointer drag", () => {
    expect(arrowPath({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe("M 5 5 L 5 5");
  });
});
