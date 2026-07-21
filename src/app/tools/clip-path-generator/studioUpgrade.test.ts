import { describe, expect, it } from "vitest";
import ClipPathGeneratorClient from "./ClipPathGeneratorClient";
import {
  calculateObjectFitPlacement,
  calculatePreviewExportSize,
  calculateSafeExportSize,
  generateClipPathSvg,
  pointsToExportCoordinates,
  resolveExportAspectRatio,
} from "./exporters";
import { clampPan, clampZoom, rescalePanForZoom } from "./hooks/useViewport";
import {
  createSavedShape,
  parseSavedShapeStore,
  serializeSavedShapeStore,
} from "./storage";
import {
  centerPoints,
  createDefaultStudioSettings,
  duplicatePoint,
  fitPointsToBounds,
  reorderPoint,
  rotatePoints,
  scalePoints,
  snapCoordinate,
  snapPoint,
  updatePointCoordinates,
} from "./studio";
import type { ClipPoint } from "./types";

const SQUARE: ClipPoint[] = [
  { x: 20, y: 20 },
  { x: 80, y: 20 },
  { x: 80, y: 80 },
  { x: 20, y: 80 },
];

describe("studio module smoke test", () => {
  it("loads the composed client component", () => {
    expect(typeof ClipPathGeneratorClient).toBe("function");
  });
});

describe("snap and numeric point editing", () => {
  it("snaps coordinates using a bounded grid size", () => {
    expect(snapCoordinate(12.4, 5)).toBe(10);
    expect(snapCoordinate(98.5, 5)).toBe(100);
    expect(snapPoint({ x: 13, y: 87 }, 10)).toEqual({ x: 10, y: 90 });
  });

  it("clamps completed numeric edits", () => {
    const next = updatePointCoordinates(SQUARE, 0, { x: -4, y: 104 });
    expect(next[0]).toEqual({ x: 0, y: 100 });
    expect(updatePointCoordinates(SQUARE, 99, { x: 50 })).toBe(SQUARE);
  });

  it("reorders without mutating and ignores no-ops", () => {
    const next = reorderPoint(SQUARE, 0, 2);
    expect(next).toEqual([SQUARE[1], SQUARE[2], SQUARE[0], SQUARE[3]]);
    expect(SQUARE[0]).toEqual({ x: 20, y: 20 });
    expect(reorderPoint(SQUARE, 1, 1)).toBe(SQUARE);
  });

  it("duplicates a point with a safe offset", () => {
    const next = duplicatePoint(SQUARE, 0);
    expect(next).toHaveLength(5);
    expect(next[1]).not.toEqual(next[0]);
  });
});

describe("shape transforms", () => {
  it("rotates clockwise and counterclockwise around the bounds center", () => {
    const clockwise = rotatePoints(SQUARE, "clockwise");
    expect(clockwise).toEqual([
      { x: 80, y: 20 },
      { x: 80, y: 80 },
      { x: 20, y: 80 },
      { x: 20, y: 20 },
    ]);
    expect(rotatePoints(clockwise, "counterclockwise")).toEqual(SQUARE);
  });

  it("centers an offset polygon", () => {
    const offset = SQUARE.map((point) => ({ x: point.x - 10, y: point.y - 15 }));
    expect(centerPoints(offset)).toEqual(SQUARE);
  });

  it("fits a polygon inside safe bounds", () => {
    const next = fitPointsToBounds([
      { x: 20, y: 30 },
      { x: 60, y: 30 },
      { x: 60, y: 70 },
      { x: 20, y: 70 },
    ]);
    expect(Math.min(...next.map((point) => point.x))).toBe(5);
    expect(Math.max(...next.map((point) => point.x))).toBe(95);
    expect(Math.min(...next.map((point) => point.y))).toBe(5);
    expect(Math.max(...next.map((point) => point.y))).toBe(95);
  });

  it("scales around the center and clamps safely", () => {
    const inward = scalePoints(SQUARE, -50);
    expect(inward[0]).toEqual({ x: 35, y: 35 });
    const outward = scalePoints(SQUARE, 100);
    expect(outward[0]).toEqual({ x: 0, y: 0 });
    expect(outward[2]).toEqual({ x: 100, y: 100 });
  });
});

describe("viewport calculations", () => {
  it("clamps zoom and pan", () => {
    expect(clampZoom(0.5)).toBe(1);
    expect(clampZoom(8)).toBe(4);
    expect(clampPan({ x: 500, y: -500 }, 2, 300, 200)).toEqual({ x: 150, y: -100 });
    expect(clampPan({ x: 10, y: 10 }, 1, 300, 200)).toEqual({ x: 0, y: 0 });
    expect(rescalePanForZoom({ x: 150, y: -100 }, 2, 1.5)).toEqual({ x: 75, y: -50 });
    expect(rescalePanForZoom({ x: 75, y: -50 }, 1.5, 1)).toEqual({ x: 0, y: 0 });
  });
});

describe("saved shape storage", () => {
  it("serializes and restores safe non-image project data", () => {
    const item = createSavedShape({
      id: "shape-1",
      name: "  Hero   shape  ",
      className: "hero-shape",
      points: SQUARE,
      settings: createDefaultStudioSettings(),
      timestamp: "2026-07-21T10:00:00.000Z",
    });
    const parsed = parseSavedShapeStore(serializeSavedShapeStore([item]));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.items[0].name).toBe("Hero shape");
      expect(parsed.items[0].points).toEqual(SQUARE);
      expect(JSON.stringify(parsed.items[0])).not.toContain("imageUrl");
    }
  });

  it("fails gracefully for malformed or unsupported data", () => {
    expect(parseSavedShapeStore("{").ok).toBe(false);
    expect(parseSavedShapeStore(JSON.stringify({ kind: "other", version: 1, items: [] })).ok).toBe(false);
    expect(parseSavedShapeStore(null)).toEqual({ ok: true, items: [] });
  });
});

describe("SVG and export coordinates", () => {
  it("scales percentage points into export coordinates", () => {
    expect(pointsToExportCoordinates([{ x: 50, y: 25 }], 800, 400)).toEqual([{ x: 400, y: 100 }]);
  });

  it("generates a reusable clipPath with a sensible viewBox", () => {
    const svg = generateClipPathSvg({
      points: SQUARE,
      className: "hero shape",
      aspectRatio: "16:9",
      backgroundColor: "#123456",
    });
    expect(svg).toContain('viewBox="0 0 1000 563"');
    expect(svg).toContain('<clipPath id="hero-shape-clip"');
    expect(svg).toContain('clip-path="url(#hero-shape-clip)"');
    expect(svg).toContain('fill="#123456"');
  });

  it("downscales oversized PNG dimensions within the pixel budget", () => {
    expect(calculateSafeExportSize(4000, 3000, 12_000_000)).toEqual({ width: 4000, height: 3000, downscaled: false });
    const next = calculateSafeExportSize(8000, 6000, 12_000_000);
    expect(next.downscaled).toBe(true);
    expect(next.width * next.height).toBeLessThanOrEqual(12_000_000);
  });

  it("uses the rendered Free canvas ratio when available", () => {
    expect(resolveExportAspectRatio("free", 390, 520)).toBe(0.75);
    expect(resolveExportAspectRatio("free")).toBe(4 / 3);
  });
});

describe("preview-matched PNG composition", () => {
  it("centers a cover image and crops the overflowing axis", () => {
    const placement = calculateObjectFitPlacement({
      sourceWidth: 1600,
      sourceHeight: 900,
      canvasWidth: 900,
      canvasHeight: 1600,
      objectFit: "cover",
      objectPosition: "center",
    });
    expect(placement.width).toBeCloseTo(2844.44, 2);
    expect(placement.height).toBe(1600);
    expect(placement.x).toBeCloseTo(-972.22, 2);
    expect(placement.y).toBe(0);
  });

  it("centers a contained image with transparent letterbox space", () => {
    const placement = calculateObjectFitPlacement({
      sourceWidth: 1600,
      sourceHeight: 900,
      canvasWidth: 900,
      canvasHeight: 1600,
      objectFit: "contain",
      objectPosition: "center",
    });
    expect(placement).toEqual({ x: 0, y: 546.875, width: 900, height: 506.25 });
  });

  it("respects non-centered object positions", () => {
    const top = calculateObjectFitPlacement({
      sourceWidth: 1600,
      sourceHeight: 900,
      canvasWidth: 900,
      canvasHeight: 1600,
      objectFit: "contain",
      objectPosition: "top",
    });
    const right = calculateObjectFitPlacement({
      sourceWidth: 1600,
      sourceHeight: 900,
      canvasWidth: 900,
      canvasHeight: 1600,
      objectFit: "cover",
      objectPosition: "right",
    });
    expect(top.y).toBe(0);
    expect(top.x).toBe(0);
    expect(right.x).toBeCloseTo(-1944.44, 2);
    expect(right.y).toBe(0);
  });

  it("chooses a portrait artboard for a landscape source without upscaling", () => {
    expect(
      calculatePreviewExportSize({
        sourceWidth: 1600,
        sourceHeight: 900,
        artboardAspectRatio: 9 / 16,
        objectFit: "cover",
      }),
    ).toEqual({ width: 506, height: 900, downscaled: false });
  });

  it("chooses a landscape artboard for a portrait source without upscaling", () => {
    expect(
      calculatePreviewExportSize({
        sourceWidth: 900,
        sourceHeight: 1600,
        artboardAspectRatio: 16 / 9,
        objectFit: "cover",
      }),
    ).toEqual({ width: 900, height: 506, downscaled: false });
  });

  it("keeps a contained source at natural scale before safety downscaling", () => {
    expect(
      calculatePreviewExportSize({
        sourceWidth: 1600,
        sourceHeight: 900,
        artboardAspectRatio: 9 / 16,
        objectFit: "contain",
      }),
    ).toEqual({ width: 1600, height: 2844, downscaled: false });
  });

  it("preserves the artboard ratio within the safe pixel budget", () => {
    const size = calculatePreviewExportSize({
      sourceWidth: 12000,
      sourceHeight: 8000,
      artboardAspectRatio: 16 / 9,
      objectFit: "cover",
      maxPixels: 24_000_000,
    });
    expect(size.downscaled).toBe(true);
    expect(size.width * size.height).toBeLessThanOrEqual(24_000_000);
    expect(size.width / size.height).toBeCloseTo(16 / 9, 3);
  });
});
