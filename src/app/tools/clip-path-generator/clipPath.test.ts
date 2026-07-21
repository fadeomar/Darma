import { describe, expect, it } from "vitest";
import {
  appendPoint,
  clampPercent,
  createDefaultClipPathState,
  findDuplicatePointPair,
  findSelfIntersection,
  findShortEdge,
  formatPolygon,
  generateClipPathCss,
  generateClipPathValue,
  getClipPathStats,
  insertPointOnEdge,
  isConvex,
  MAX_POINTS,
  MAX_SHAPE_JSON_CHARS,
  MIN_POINTS,
  mirrorHorizontal,
  movePoint,
  parseShapeFile,
  regularPolygon,
  removePoint,
  reversePoints,
  roundCoord,
  segmentsIntersect,
  serializeShape,
  signedArea,
  star,
  validateClipPathState,
  validatePolygon,
} from "./clipPath";
import type { ClipPoint } from "./types";

const TRIANGLE: ClipPoint[] = [
  { x: 50, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

const SQUARE: ClipPoint[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

const CONCAVE: ClipPoint[] = [
  { x: 0, y: 0 },
  { x: 100, y: 50 },
  { x: 0, y: 100 },
  { x: 30, y: 50 },
];

const BOW_TIE: ClipPoint[] = [
  { x: 0, y: 0 },
  { x: 100, y: 100 },
  { x: 100, y: 0 },
  { x: 0, y: 100 },
];

function shapeJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    kind: "darma.clip-path",
    version: 1,
    className: "hero",
    points: TRIANGLE,
    ...overrides,
  });
}

describe("coordinate utilities", () => {
  it("clamps finite values into 0–100", () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(42)).toBe(42);
  });

  it("converts non-finite values to a safe coordinate", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("rounds to two decimals by default", () => {
    expect(roundCoord(33.33333)).toBe(33.33);
    expect(roundCoord(66.666)).toBe(66.67);
  });
});

describe("formatting and output", () => {
  it("emits a valid polygon() value", () => {
    expect(formatPolygon(TRIANGLE)).toBe("polygon(50% 0%, 100% 100%, 0% 100%)");
  });

  it("clamps out-of-range coordinates for generated output", () => {
    expect(formatPolygon([{ x: -5, y: 0 }, { x: 120, y: 50 }, { x: 50, y: 100 }])).toBe(
      "polygon(0% 0%, 100% 50%, 50% 100%)",
    );
  });

  it("includes the -webkit- fallback when enabled", () => {
    const state = { ...createDefaultClipPathState(), points: TRIANGLE, className: "hero", webkitFallback: true };
    const css = generateClipPathCss(state);
    expect(css).toContain(".hero {");
    expect(css).toContain("-webkit-clip-path: polygon(50% 0%, 100% 100%, 0% 100%);");
    expect(css).toContain("clip-path: polygon(50% 0%, 100% 100%, 0% 100%);");
  });

  it("omits the fallback when disabled and sanitizes the class name", () => {
    const state = { ...createDefaultClipPathState(), points: TRIANGLE, className: "my shape!", webkitFallback: false };
    const css = generateClipPathCss(state);
    expect(css).toContain(".my-shape- {");
    expect(css).not.toContain("-webkit-clip-path");
  });

  it("generates a raw value string", () => {
    expect(generateClipPathValue({ ...createDefaultClipPathState(), points: TRIANGLE })).toBe(
      "polygon(50% 0%, 100% 100%, 0% 100%)",
    );
  });
});

describe("shape generators and point operations", () => {
  it("produces regular polygons within supported point limits", () => {
    expect(regularPolygon(6)).toHaveLength(6);
    expect(regularPolygon(2)).toHaveLength(MIN_POINTS);
    expect(regularPolygon(100)).toHaveLength(MAX_POINTS);
    expect(regularPolygon(4)[0]).toEqual({ x: 50, y: 0 });
  });

  it("produces two vertices per star spike", () => {
    expect(star(5)).toHaveLength(10);
  });

  it("moves and clamps a vertex", () => {
    const moved = movePoint(TRIANGLE, 0, { x: 150, y: -20 });
    expect(moved[0]).toEqual({ x: 100, y: 0 });
    expect(moved).not.toBe(TRIANGLE);
  });

  it("returns the same array for a no-op move", () => {
    expect(movePoint(TRIANGLE, 0, TRIANGLE[0])).toBe(TRIANGLE);
  });

  it("never removes below the minimum", () => {
    expect(removePoint(TRIANGLE, 0)).toBe(TRIANGLE);
    expect(removePoint([...TRIANGLE, { x: 0, y: 0 }], 0)).toHaveLength(3);
  });

  it("inserts an edge midpoint and respects the maximum", () => {
    const next = insertPointOnEdge(TRIANGLE, 0);
    expect(next).toHaveLength(4);
    expect(next[1]).toEqual({ x: 75, y: 50 });
    const many = regularPolygon(MAX_POINTS);
    expect(insertPointOnEdge(many, 0)).toBe(many);
  });

  it("appends and transforms points without mutation", () => {
    expect(appendPoint(TRIANGLE)).toHaveLength(4);
    expect(reversePoints(TRIANGLE)).toEqual([TRIANGLE[2], TRIANGLE[1], TRIANGLE[0]]);
    expect(mirrorHorizontal(TRIANGLE)).toEqual([
      { x: 50, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ]);
  });
});

describe("geometry validation", () => {
  it("accepts a valid convex polygon", () => {
    expect(validatePolygon(SQUARE).some((message) => message.type === "error")).toBe(false);
    expect(getClipPathStats(SQUARE).isValid).toBe(true);
  });

  it("accepts a valid concave polygon", () => {
    expect(isConvex(CONCAVE)).toBe(false);
    expect(findSelfIntersection(CONCAVE)).toBeNull();
    expect(getClipPathStats(CONCAVE).isValid).toBe(true);
  });

  it("detects a self-intersecting bow-tie", () => {
    expect(findSelfIntersection(BOW_TIE)).toEqual([0, 2]);
    expect(validatePolygon(BOW_TIE).some((message) => message.message.includes("cross"))).toBe(true);
    expect(getClipPathStats(BOW_TIE).isValid).toBe(false);
  });

  it("detects duplicate and near-duplicate points", () => {
    expect(findDuplicatePointPair([...TRIANGLE, { ...TRIANGLE[0] }])).toEqual([0, 3]);
    expect(findDuplicatePointPair([...TRIANGLE, { x: 50.03, y: 0.02 }])).toEqual([0, 3]);
  });

  it("detects a zero-area polygon", () => {
    const flat = [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }];
    expect(validatePolygon(flat).some((message) => message.message.includes("area"))).toBe(true);
    expect(getClipPathStats(flat).isValid).toBe(false);
  });

  it("detects a very short consecutive edge", () => {
    const points = [{ x: 0, y: 0 }, { x: 0.08, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
    expect(findDuplicatePointPair(points)).toBeNull();
    expect(findShortEdge(points)).toEqual([0, 1]);
    expect(validatePolygon(points).some((message) => message.message.includes("too short"))).toBe(true);
  });

  it("does not treat adjacent edges sharing an endpoint as intersections", () => {
    expect(segmentsIntersect(SQUARE[0], SQUARE[1], SQUARE[1], SQUARE[2])).toBe(true);
    expect(findSelfIntersection(SQUARE)).toBeNull();
  });

  it("handles the first and last polygon edges as adjacent", () => {
    expect(findSelfIntersection(SQUARE)).toBeNull();
    expect(validatePolygon(SQUARE).some((message) => message.message.includes("cross"))).toBe(false);
  });

  it("rejects out-of-range and non-finite coordinates", () => {
    expect(validatePolygon([{ x: -1, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }])[0].type).toBe("error");
    expect(
      validatePolygon([{ x: Number.NaN, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }])[0].message,
    ).toContain("invalid");
  });

  it("reports area percentage and validity from full validation", () => {
    const stats = getClipPathStats(TRIANGLE);
    expect(Math.abs(signedArea(TRIANGLE))).toBe(5000);
    expect(stats).toMatchObject({ pointCount: 3, areaPercent: 50, isValid: true });
  });

  it("keeps image-preview warnings separate from valid polygon geometry", () => {
    const state = { ...createDefaultClipPathState(), previewShape: "image" as const, imageUrl: null };
    const messages = validateClipPathState(state);
    expect(messages.some((message) => message.field === "image" && message.type === "warning")).toBe(true);
    expect(validateClipPathState(createDefaultClipPathState())).toEqual([]);
  });
});

describe("shape JSON parsing and serialization", () => {
  it("parses a valid current version-1 file and restores class name", () => {
    const parsed = parseShapeFile(shapeJson());
    expect(parsed).toEqual({ ok: true, className: "hero", points: TRIANGLE });
  });

  it("rejects the wrong kind and unsupported versions", () => {
    expect(parseShapeFile(shapeJson({ kind: "other" }))).toMatchObject({ ok: false });
    expect(parseShapeFile(shapeJson({ version: 2 }))).toMatchObject({ ok: false });
  });

  it("rejects missing or invalid class names", () => {
    expect(parseShapeFile(shapeJson({ className: undefined }))).toMatchObject({ ok: false });
    expect(parseShapeFile(shapeJson({ className: 42 }))).toMatchObject({ ok: false });
  });

  it("rejects too few or too many points", () => {
    expect(parseShapeFile(shapeJson({ points: TRIANGLE.slice(0, 2) }))).toMatchObject({ ok: false });
    const tooMany = Array.from({ length: MAX_POINTS + 1 }, (_, index) => ({ x: index, y: index }));
    expect(parseShapeFile(shapeJson({ points: tooMany }))).toMatchObject({ ok: false });
  });

  it("rejects invalid coordinate types and malformed point objects", () => {
    expect(parseShapeFile(shapeJson({ points: [{ x: "0", y: 0 }, ...TRIANGLE.slice(1)] }))).toMatchObject({ ok: false });
    expect(parseShapeFile(shapeJson({ points: [null, ...TRIANGLE.slice(1)] }))).toMatchObject({ ok: false });
  });

  it("rejects non-finite and out-of-range coordinates", () => {
    const nonFinite = '{"kind":"darma.clip-path","version":1,"className":"hero","points":[{"x":1e999,"y":0},{"x":100,"y":100},{"x":0,"y":100}]}';
    expect(parseShapeFile(nonFinite)).toMatchObject({ ok: false });
    expect(parseShapeFile(shapeJson({ points: [{ x: -1, y: 0 }, ...TRIANGLE.slice(1)] }))).toMatchObject({ ok: false });
  });

  it("rejects malformed and oversized JSON", () => {
    expect(parseShapeFile("not json")).toMatchObject({ ok: false });
    expect(parseShapeFile(" ".repeat(MAX_SHAPE_JSON_CHARS + 1))).toMatchObject({ ok: false, error: expect.stringContaining("large") });
  });

  it("round-trips exported points and class name", () => {
    const state = { ...createDefaultClipPathState(), points: TRIANGLE, className: "hero shape" };
    const parsed = parseShapeFile(serializeShape(state));
    expect(parsed).toEqual({ ok: true, className: "hero-shape", points: TRIANGLE });
  });
});
