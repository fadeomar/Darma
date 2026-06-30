import { describe, expect, it } from "vitest";
import { CANVAS, beamXToSvgX, svgXToBeamX, clientXToBeamX, clampBeamX, snapBeamX } from "../lib/beamCoords";

describe("beam coordinate conversion", () => {
  it("maps beam ends to the plot margins", () => {
    expect(beamXToSvgX(0, 10)).toBeCloseTo(CANVAS.MARGIN, 6);
    expect(beamXToSvgX(10, 10)).toBeCloseTo(CANVAS.W - CANVAS.MARGIN, 6);
  });

  it("round-trips beam ↔ svg", () => {
    for (const x of [0, 2.5, 5, 7.3, 10]) {
      expect(svgXToBeamX(beamXToSvgX(x, 10), 10)).toBeCloseTo(x, 6);
    }
  });

  it("converts client pixels using the bounding rect", () => {
    // A 380px-wide rendering of a 760-unit viewBox = 0.5 scale.
    const rect = { left: 100, width: 380 };
    // Click at the left margin (MARGIN=70 → 35px on screen) maps to x = 0.
    expect(clientXToBeamX(100 + CANVAS.MARGIN * 0.5, rect, 10)).toBeCloseTo(0, 6);
    // Click at the right margin maps to x = L.
    expect(clientXToBeamX(100 + (CANVAS.W - CANVAS.MARGIN) * 0.5, rect, 10)).toBeCloseTo(10, 6);
  });

  it("clamps to the beam range", () => {
    expect(clampBeamX(-3, 10)).toBe(0);
    expect(clampBeamX(15, 10)).toBe(10);
    expect(clampBeamX(NaN, 10)).toBe(0);
  });
});

describe("snapBeamX", () => {
  it("snaps to center within threshold", () => {
    const result = snapBeamX(5.05, 10);
    expect(result.x).toBeCloseTo(5, 6);
    expect(result.label).toBe("Center");
  });

  it("snaps to the end", () => {
    expect(snapBeamX(9.95, 10).label).toBe("End");
  });

  it("does not snap when outside threshold", () => {
    const result = snapBeamX(3.7, 10);
    expect(result.x).toBeCloseTo(3.7, 6);
    expect(result.label).toBeUndefined();
  });

  it("snaps to an extra target (another item)", () => {
    const result = snapBeamX(6.01, 10, [6]);
    expect(result.x).toBeCloseTo(6, 6);
    expect(result.label).toBeUndefined();
  });
});
