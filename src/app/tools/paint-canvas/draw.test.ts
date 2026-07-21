import { describe, expect, it } from "vitest";
import {
  clampBrush,
  createDefaultSettings,
  distance,
  MAX_BRUSH,
  MIN_BRUSH,
  rectFromDrag,
  triangleVertices,
} from "./draw";
import { isShapeTool } from "./types";

describe("clampBrush", () => {
  it("clamps into the supported range and rounds", () => {
    expect(clampBrush(0)).toBe(MIN_BRUSH);
    expect(clampBrush(999)).toBe(MAX_BRUSH);
    expect(clampBrush(6.4)).toBe(6);
  });
  it("handles non-finite input", () => {
    expect(clampBrush(Number.NaN)).toBe(MIN_BRUSH);
  });
});

describe("distance", () => {
  it("computes euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("rectFromDrag", () => {
  it("normalizes any drag direction to a positive-size rect", () => {
    expect(rectFromDrag({ x: 30, y: 40 }, { x: 10, y: 10 })).toEqual({ x: 10, y: 10, width: 20, height: 30 });
  });
});

describe("triangleVertices", () => {
  it("builds an isosceles triangle mirrored around the apex x", () => {
    expect(triangleVertices({ x: 50, y: 0 }, { x: 80, y: 60 })).toEqual([
      { x: 50, y: 0 },
      { x: 80, y: 60 },
      { x: 20, y: 60 },
    ]);
  });
});

describe("createDefaultSettings", () => {
  it("starts with a brush and a sensible size", () => {
    const settings = createDefaultSettings();
    expect(settings.tool).toBe("brush");
    expect(settings.size).toBeGreaterThanOrEqual(MIN_BRUSH);
    expect(settings.fill).toBe(false);
  });
});

describe("isShapeTool", () => {
  it("distinguishes shape tools from freehand tools", () => {
    expect(isShapeTool("rectangle")).toBe(true);
    expect(isShapeTool("circle")).toBe(true);
    expect(isShapeTool("brush")).toBe(false);
    expect(isShapeTool("eraser")).toBe(false);
  });
});
