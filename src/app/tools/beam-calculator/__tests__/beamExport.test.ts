import { describe, expect, it } from "vitest";
import { parseConfig, serializeConfig } from "../lib/beamExport";
import type { BeamModel } from "../lib/beamTypes";

const validModel: BeamModel = {
  length: 10,
  unitSystem: "metric",
  supports: [
    { id: "A", type: "pin", x: 0 },
    { id: "B", type: "roller", x: 10 },
  ],
  loads: [
    { id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" },
    { id: "W1", kind: "udl", start: 0, end: 4, magnitude: 2, direction: "up" },
    { id: "M1", kind: "moment", x: 7, magnitude: 3, rotation: "ccw" },
  ],
};

describe("parseConfig", () => {
  it("round-trips a valid config", () => {
    const parsed = parseConfig(serializeConfig(validModel));
    expect(parsed).not.toBeNull();
    expect(parsed!.loads).toHaveLength(3);
    expect(parsed!.length).toBe(10);
  });

  it("accepts a bare model object (no wrapper)", () => {
    expect(parseConfig(JSON.stringify(validModel))).not.toBeNull();
  });

  it("rejects invalid JSON", () => {
    expect(parseConfig("{not json")).toBeNull();
  });

  it("rejects a non-positive length", () => {
    expect(
      parseConfig(JSON.stringify({ ...validModel, length: 0 })),
    ).toBeNull();
  });

  it("rejects a point load with an invalid direction", () => {
    const bad = {
      ...validModel,
      loads: [
        { id: "P1", kind: "point", x: 5, magnitude: 10, direction: "sideways" },
      ],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
  });

  it("rejects a UDL with a missing direction", () => {
    const bad = {
      ...validModel,
      loads: [{ id: "W1", kind: "udl", start: 0, end: 4, magnitude: 2 }],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
  });

  it("rejects an applied moment with an invalid rotation", () => {
    const bad = {
      ...validModel,
      loads: [
        { id: "M1", kind: "moment", x: 7, magnitude: 3, rotation: "spin" },
      ],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
  });

  it("rejects non-finite numeric values", () => {
    const bad = {
      ...validModel,
      loads: [
        { id: "P1", kind: "point", x: 5, magnitude: "10", direction: "down" },
      ],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
    // NaN serializes to null in JSON, which is also non-numeric → rejected.
    const badX = {
      ...validModel,
      supports: [
        { id: "A", type: "pin", x: null },
        { id: "B", type: "roller", x: 10 },
      ],
    };
    expect(parseConfig(JSON.stringify(badX))).toBeNull();
  });

  it("rejects an unknown load kind", () => {
    const bad = {
      ...validModel,
      loads: [
        {
          id: "T1",
          kind: "triangular",
          x: 5,
          magnitude: 10,
          direction: "down",
        },
      ],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
  });
});

describe("parseConfig hardening", () => {
  it("rejects a wrapped project from another tool", () => {
    const payload = { tool: "another-tool", version: 1, model: validModel };
    expect(parseConfig(JSON.stringify(payload))).toBeNull();
  });

  it("rejects an unsupported wrapped project version", () => {
    const payload = {
      tool: "beam-calculator-studio",
      version: 99,
      model: validModel,
    };
    expect(parseConfig(JSON.stringify(payload))).toBeNull();
  });

  it("rejects duplicate support IDs", () => {
    const bad = {
      ...validModel,
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "A", type: "roller", x: 10 },
      ],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
  });

  it("rejects duplicate load IDs", () => {
    const bad = {
      ...validModel,
      loads: [
        { id: "P1", kind: "point", x: 3, magnitude: 5, direction: "down" },
        { id: "P1", kind: "point", x: 7, magnitude: 5, direction: "down" },
      ],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
  });

  it("rejects negative magnitudes instead of silently reversing direction", () => {
    const bad = {
      ...validModel,
      loads: [
        { id: "P1", kind: "point", x: 5, magnitude: -10, direction: "down" },
      ],
    };
    expect(parseConfig(JSON.stringify(bad))).toBeNull();
  });
});
