import { describe, expect, it } from "vitest";
import { validateBeam } from "../lib/beamValidation";
import type { BeamModel } from "../lib/beamTypes";

function model(partial: Partial<BeamModel>): BeamModel {
  return {
    length: 10,
    unitSystem: "metric",
    supports: [
      { id: "A", type: "pin", x: 0 },
      { id: "B", type: "roller", x: 10 },
    ],
    loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }],
    ...partial,
  };
}

describe("validateBeam", () => {
  it("accepts a valid simply supported beam", () => {
    const result = validateBeam(model({}));
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a non-positive beam length", () => {
    const result = validateBeam(model({ length: 0 }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.id === "beam-length")).toBe(true);
  });

  it("rejects a load positioned outside the beam", () => {
    const result = validateBeam(model({ loads: [{ id: "P1", kind: "point", x: 15, magnitude: 10, direction: "down" }] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.target?.id === "P1")).toBe(true);
  });

  it("rejects a UDL whose start is not less than its end", () => {
    const result = validateBeam(model({ loads: [{ id: "W1", kind: "udl", start: 6, end: 4, magnitude: 2, direction: "down" }] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.id === "load-W1-range-order")).toBe(true);
  });

  it("rejects a UDL range outside the beam", () => {
    const result = validateBeam(model({ loads: [{ id: "W1", kind: "udl", start: 0, end: 20, magnitude: 2, direction: "down" }] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.id === "load-W1-range-bounds")).toBe(true);
  });

  it("rejects duplicate support positions", () => {
    const result = validateBeam(
      model({
        supports: [
          { id: "A", type: "pin", x: 5 },
          { id: "B", type: "roller", x: 5 },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.id === "support-duplicate")).toBe(true);
  });

  it("flags an unsupported support combination with a suggestion", () => {
    const result = validateBeam(model({ supports: [{ id: "A", type: "pin", x: 0 }] }));
    expect(result.ok).toBe(false);
    const issue = result.errors.find((e) => e.id === "support-config");
    expect(issue).toBeDefined();
    expect(issue?.suggestionPresetId).toBeTruthy();
  });

  it("warns (but does not error) when there are no loads", () => {
    const result = validateBeam(model({ loads: [] }));
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.id === "loads-empty")).toBe(true);
  });

  it("treats NaN magnitudes as errors", () => {
    const result = validateBeam(model({ loads: [{ id: "P1", kind: "point", x: 5, magnitude: NaN, direction: "down" }] }));
    expect(result.ok).toBe(false);
  });
});
