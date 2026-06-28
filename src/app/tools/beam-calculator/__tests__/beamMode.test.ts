import { describe, expect, it } from "vitest";
import { deriveBeamMode, supportsForMode, isGuidedMode } from "../lib/beamMode";
import type { BeamModel } from "../lib/beamTypes";

function model(supports: BeamModel["supports"], length = 10): BeamModel {
  return { length, unitSystem: "metric", supports, loads: [] };
}

describe("deriveBeamMode", () => {
  it("detects simply supported", () => {
    expect(
      deriveBeamMode(model([
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ])),
    ).toBe("simply-supported");
  });

  it("detects cantilever left and right", () => {
    expect(deriveBeamMode(model([{ id: "A", type: "fixed", x: 0 }]))).toBe("cantilever-left");
    expect(deriveBeamMode(model([{ id: "A", type: "fixed", x: 10 }]))).toBe("cantilever-right");
  });

  it("falls back to advanced for non-standard layouts", () => {
    expect(deriveBeamMode(model([{ id: "A", type: "fixed", x: 4 }]))).toBe("advanced");
    expect(
      deriveBeamMode(model([
        { id: "A", type: "pin", x: 2 },
        { id: "B", type: "roller", x: 8 },
      ])),
    ).toBe("advanced");
  });
});

describe("supportsForMode", () => {
  it("builds the right supports per mode", () => {
    expect(supportsForMode("simply-supported", 8)).toEqual([
      { id: "A", type: "pin", x: 0 },
      { id: "B", type: "roller", x: 8 },
    ]);
    expect(supportsForMode("cantilever-left", 8)).toEqual([{ id: "A", type: "fixed", x: 0 }]);
    expect(supportsForMode("cantilever-right", 8)).toEqual([{ id: "A", type: "fixed", x: 8 }]);
  });

  it("preserves existing supports in advanced mode", () => {
    const existing = [{ id: "A", type: "pin" as const, x: 1 }];
    expect(supportsForMode("advanced", 8, existing)).toBe(existing);
  });

  it("round-trips generated supports back to their mode", () => {
    for (const mode of ["simply-supported", "cantilever-left", "cantilever-right"] as const) {
      expect(deriveBeamMode(model(supportsForMode(mode, 10)))).toBe(mode);
    }
  });
});

describe("isGuidedMode", () => {
  it("treats only advanced as unguided", () => {
    expect(isGuidedMode("simply-supported")).toBe(true);
    expect(isGuidedMode("advanced")).toBe(false);
  });
});
