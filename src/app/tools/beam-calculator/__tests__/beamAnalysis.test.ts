import { describe, expect, it } from "vitest";
import { analyzeBeam, classifySupports } from "../lib/beamAnalysis";
import type { BeamModel } from "../lib/beamTypes";

const TOL = 1e-6;

function model(partial: Partial<BeamModel>): BeamModel {
  return {
    length: 10,
    unitSystem: "metric",
    supports: [],
    loads: [],
    ...partial,
  };
}

describe("classifySupports", () => {
  it("recognises a simply supported beam", () => {
    const config = classifySupports([
      { id: "A", type: "pin", x: 0 },
      { id: "B", type: "roller", x: 10 },
    ]);
    expect(config?.kind).toBe("simply-supported");
  });

  it("recognises a cantilever", () => {
    const config = classifySupports([{ id: "A", type: "fixed", x: 0 }]);
    expect(config?.kind).toBe("cantilever");
  });

  it("rejects unsupported configurations", () => {
    expect(classifySupports([{ id: "A", type: "pin", x: 0 }])).toBeNull();
    expect(
      classifySupports([
        { id: "A", type: "fixed", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ]),
    ).toBeNull();
    expect(
      classifySupports([
        { id: "A", type: "pin", x: 5 },
        { id: "B", type: "roller", x: 5 },
      ]),
    ).toBeNull();
  });
});

describe("analyzeBeam — simply supported, center point load", () => {
  const result = analyzeBeam(
    model({
      length: 10,
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ],
      loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }],
    }),
  );

  it("produces reactions of 5 kN each", () => {
    expect(result).not.toBeNull();
    const ra = result!.reactions.find((r) => r.supportId === "A")!;
    const rb = result!.reactions.find((r) => r.supportId === "B")!;
    expect(ra.fy).toBeCloseTo(5, 6);
    expect(rb.fy).toBeCloseTo(5, 6);
  });

  it("has a max sagging moment of 25 kN·m at midspan", () => {
    expect(result!.maxPositiveMoment.value).toBeCloseTo(25, 6);
    expect(result!.maxPositiveMoment.x).toBeCloseTo(5, 6);
    expect(result!.maxAbsMoment.value).toBeCloseTo(25, 6);
  });

  it("has a max shear of 5 kN", () => {
    expect(Math.abs(result!.maxShear.value)).toBeCloseTo(5, 6);
  });

  it("is in equilibrium", () => {
    expect(result!.equilibrium.balanced).toBe(true);
    expect(Math.abs(result!.equilibrium.sumFy)).toBeLessThan(TOL);
    expect(Math.abs(result!.equilibrium.sumMoment)).toBeLessThan(TOL);
  });
});

describe("analyzeBeam — simply supported, full UDL", () => {
  const result = analyzeBeam(
    model({
      length: 10,
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ],
      loads: [{ id: "W1", kind: "udl", start: 0, end: 10, magnitude: 2, direction: "down" }],
    }),
  );

  it("totals 20 kN of applied load", () => {
    expect(result!.totalAppliedForce).toBeCloseTo(-20, 6);
  });

  it("produces reactions of 10 kN each", () => {
    expect(result!.reactions[0].fy).toBeCloseTo(10, 6);
    expect(result!.reactions[1].fy).toBeCloseTo(10, 6);
  });

  it("has a max moment of 25 kN·m at midspan (wL²/8)", () => {
    expect(result!.maxPositiveMoment.value).toBeCloseTo(25, 4);
    expect(result!.maxPositiveMoment.x).toBeCloseTo(5, 2);
  });

  it("is in equilibrium", () => {
    expect(result!.equilibrium.balanced).toBe(true);
  });
});

describe("analyzeBeam — simply supported, two point loads", () => {
  const result = analyzeBeam(
    model({
      length: 9,
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 9 },
      ],
      loads: [
        { id: "P1", kind: "point", x: 3, magnitude: 8, direction: "down" },
        { id: "P2", kind: "point", x: 6, magnitude: 8, direction: "down" },
      ],
    }),
  );

  it("splits reactions symmetrically (8 kN each)", () => {
    expect(result!.reactions[0].fy).toBeCloseTo(8, 6);
    expect(result!.reactions[1].fy).toBeCloseTo(8, 6);
  });

  it("has a max moment of 24 kN·m in the constant-moment region", () => {
    // M = 8 * 3 = 24 between the loads.
    expect(result!.maxPositiveMoment.value).toBeCloseTo(24, 6);
  });
});

describe("analyzeBeam — cantilever, tip load", () => {
  const result = analyzeBeam(
    model({
      length: 5,
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }],
    }),
  );

  it("classifies as a cantilever", () => {
    expect(result!.beamType).toBe("cantilever");
  });

  it("has a vertical reaction of 10 kN", () => {
    expect(result!.reactions[0].fy).toBeCloseTo(10, 6);
  });

  it("has a fixed-end (reaction) moment of 50 kN·m", () => {
    expect(Math.abs(result!.reactions[0].moment ?? 0)).toBeCloseTo(50, 6);
  });

  it("has a max absolute (hogging) moment of 50 kN·m at the support", () => {
    expect(Math.abs(result!.maxAbsMoment.value)).toBeCloseTo(50, 6);
    expect(result!.maxAbsMoment.x).toBeCloseTo(0, 6);
    expect(result!.maxNegativeMoment.value).toBeCloseTo(-50, 6);
  });

  it("is in equilibrium", () => {
    expect(result!.equilibrium.balanced).toBe(true);
  });
});

describe("analyzeBeam — cantilever, full UDL", () => {
  const result = analyzeBeam(
    model({
      length: 5,
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [{ id: "W1", kind: "udl", start: 0, end: 5, magnitude: 2, direction: "down" }],
    }),
  );

  it("totals 10 kN and reacts with 10 kN", () => {
    expect(result!.totalAppliedForce).toBeCloseTo(-10, 6);
    expect(result!.reactions[0].fy).toBeCloseTo(10, 6);
  });

  it("has a fixed-end moment of 25 kN·m (wL²/2)", () => {
    expect(Math.abs(result!.reactions[0].moment ?? 0)).toBeCloseTo(25, 6);
    expect(Math.abs(result!.maxAbsMoment.value)).toBeCloseTo(25, 4);
  });
});

describe("analyzeBeam — cantilever fixed at the RIGHT end", () => {
  const result = analyzeBeam(
    model({
      length: 5,
      supports: [{ id: "A", type: "fixed", x: 5 }],
      loads: [{ id: "P1", kind: "point", x: 0, magnitude: 10, direction: "down" }],
    }),
  );

  it("classifies as a cantilever", () => {
    expect(result!.beamType).toBe("cantilever");
  });

  it("has a vertical reaction magnitude of 10 kN", () => {
    expect(Math.abs(result!.reactions[0].fy)).toBeCloseTo(10, 6);
  });

  it("has a fixed-end moment magnitude of 50 kN·m", () => {
    expect(Math.abs(result!.reactions[0].moment ?? 0)).toBeCloseTo(50, 6);
  });

  it("has a max absolute moment of 50 kN·m exactly at the fixed support (x = 5)", () => {
    expect(Math.abs(result!.maxAbsMoment.value)).toBeCloseTo(50, 6);
    expect(result!.maxAbsMoment.x).toBeCloseTo(5, 6);
  });

  it("reports the moment at the fixed-support key station (not collapsed to zero)", () => {
    const fixedStation = result!.keyStations.find((s) => Math.abs(s.x - 5) < 1e-6);
    expect(fixedStation).toBeDefined();
    expect(Math.abs(fixedStation!.moment)).toBeCloseTo(50, 6);
  });

  it("is in equilibrium", () => {
    expect(result!.equilibrium.balanced).toBe(true);
  });
});

describe("analyzeBeam — non-symmetric partial UDL (max moment at a non-obvious point)", () => {
  // SS beam, span 10, UDL 3 kN/m down over the left 6 m only.
  // RA = 12.6, RB = 5.4; zero shear at x = 4.2; M_max = 26.46 kN·m there.
  const result = analyzeBeam(
    model({
      length: 10,
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ],
      loads: [{ id: "W1", kind: "udl", start: 0, end: 6, magnitude: 3, direction: "down" }],
    }),
  );

  it("computes asymmetric reactions", () => {
    expect(result!.reactions[0].fy).toBeCloseTo(12.6, 6);
    expect(result!.reactions[1].fy).toBeCloseTo(5.4, 6);
  });

  it("locates the max moment at the exact zero-shear point x = 4.2 (not a 240-grid sample)", () => {
    expect(result!.maxPositiveMoment.x).toBeCloseTo(4.2, 4);
    expect(result!.maxPositiveMoment.value).toBeCloseTo(26.46, 4);
    expect(result!.maxAbsMoment.x).toBeCloseTo(4.2, 4);
  });
});

describe("analyzeBeam — applied moment sign", () => {
  it("returns to zero at the right support (balanced)", () => {
    const result = analyzeBeam(
      model({
        length: 10,
        supports: [
          { id: "A", type: "pin", x: 0 },
          { id: "B", type: "roller", x: 10 },
        ],
        loads: [{ id: "M1", kind: "moment", x: 5, magnitude: 20, rotation: "ccw" }],
      }),
    );
    expect(result!.equilibrium.balanced).toBe(true);
    // Reactions form a couple: ±M/L = ±2 kN.
    expect(Math.abs(result!.reactions[0].fy)).toBeCloseTo(2, 6);
    expect(Math.abs(result!.reactions[1].fy)).toBeCloseTo(2, 6);
  });
});

describe("analyzeBeam — upward load direction", () => {
  it("flips the reaction sign", () => {
    const result = analyzeBeam(
      model({
        length: 10,
        supports: [
          { id: "A", type: "pin", x: 0 },
          { id: "B", type: "roller", x: 10 },
        ],
        loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "up" }],
      }),
    );
    expect(result!.reactions[0].fy).toBeCloseTo(-5, 6);
    expect(result!.reactions[1].fy).toBeCloseTo(-5, 6);
  });
});

describe("analyzeBeam — unsupported configuration", () => {
  it("returns null", () => {
    expect(analyzeBeam(model({ supports: [{ id: "A", type: "pin", x: 0 }] }))).toBeNull();
  });
});
