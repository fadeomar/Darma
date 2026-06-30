import { describe, expect, it } from "vitest";
import { analyzeBeam } from "../lib/beamAnalysis";
import { describeMomentLocation, buildBeamExplanation } from "../lib/beamExplain";
import { UNIT_SYSTEMS, type BeamModel } from "../lib/beamTypes";

const units = UNIT_SYSTEMS.metric;

function model(partial: Partial<BeamModel>): BeamModel {
  return { length: 10, unitSystem: "metric", supports: [], loads: [], ...partial };
}

describe("describeMomentLocation", () => {
  it("says 'at the fixed support' for a LEFT-fixed cantilever", () => {
    const result = analyzeBeam(
      model({ length: 5, supports: [{ id: "A", type: "fixed", x: 0 }], loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }] }),
    )!;
    expect(describeMomentLocation(model({ length: 5 }), result, units)).toBe("at the fixed support");
  });

  it("says 'at the fixed support' (not 'at the free end') for a RIGHT-fixed cantilever", () => {
    const m = model({ length: 5, supports: [{ id: "A", type: "fixed", x: 5 }], loads: [{ id: "P1", kind: "point", x: 0, magnitude: 10, direction: "down" }] });
    const result = analyzeBeam(m)!;
    // x = L here is the fixed support, so it must NOT be described as the free end.
    expect(describeMomentLocation(m, result, units)).toBe("at the fixed support");
  });

  it("uses an x coordinate for a simply supported midspan max", () => {
    const m = model({
      length: 10,
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ],
      loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }],
    });
    const result = analyzeBeam(m)!;
    expect(describeMomentLocation(m, result, units)).toBe("at x = 5 m");
  });
});

describe("buildBeamExplanation", () => {
  it("mentions hogging at the fixed support for a right-fixed cantilever", () => {
    const m = model({ length: 5, supports: [{ id: "A", type: "fixed", x: 5 }], loads: [{ id: "P1", kind: "point", x: 0, magnitude: 10, direction: "down" }] });
    const result = analyzeBeam(m)!;
    const text = buildBeamExplanation(m, result, units);
    expect(text).toContain("at the fixed support");
    expect(text).toContain("hogging");
    expect(text).not.toContain("free end");
  });

  it("handles the no-load case gracefully", () => {
    const m = model({
      length: 6,
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 6 },
      ],
      loads: [],
    });
    const result = analyzeBeam(m)!;
    expect(buildBeamExplanation(m, result, units)).toContain("no net bending");
  });
});
