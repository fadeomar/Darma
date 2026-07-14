import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { analyzeBeam } from "../lib/beamAnalysis";
import type { BeamModel } from "../lib/beamTypes";
import { validateBeam } from "../lib/beamValidation";
import {
  BEAM_PRODUCTION_PACK_FILES,
  buildBeamDiagramsSvg,
  buildStationsCsv,
  createBeamAudit,
  createBeamProductionPack,
  createBeamStudioSummary,
  getBeamReadiness,
} from "../lib/studio";

const model: BeamModel = {
  length: 10,
  unitSystem: "metric",
  supports: [
    { id: "A", type: "pin", x: 0 },
    { id: "B", type: "roller", x: 10 },
  ],
  loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }],
};

function solved() {
  const validation = validateBeam(model);
  const result = analyzeBeam(model);
  const checks = createBeamAudit(model, validation, result);
  return { validation, result, checks };
}

describe("beam production audit", () => {
  it("marks a valid solved beam as ready", () => {
    const { checks } = solved();
    expect(getBeamReadiness(checks)).toBe("ready");
    expect(
      checks.some(
        (check) => check.id === "equilibrium" && check.severity === "pass",
      ),
    ).toBe(true);
  });

  it("blocks invalid configurations", () => {
    const invalid = { ...model, supports: [] };
    const validation = validateBeam(invalid);
    const checks = createBeamAudit(invalid, validation, null);
    expect(getBeamReadiness(checks)).toBe("blocked");
  });

  it("warns when a beam has no loads", () => {
    const empty = { ...model, loads: [] };
    const validation = validateBeam(empty);
    const result = analyzeBeam(empty);
    const checks = createBeamAudit(empty, validation, result);
    expect(getBeamReadiness(checks)).toBe("review");
    expect(
      checks.some(
        (check) => check.id === "loads-present" && check.severity === "warning",
      ),
    ).toBe(true);
  });

  it("adds an informational uplift check", () => {
    const upward: BeamModel = {
      ...model,
      loads: [
        { id: "P1", kind: "point", x: 5, magnitude: 10, direction: "up" },
      ],
    };
    const checks = createBeamAudit(
      upward,
      validateBeam(upward),
      analyzeBeam(upward),
    );
    expect(checks.some((check) => check.id === "upward-loads")).toBe(true);
  });

  it("creates four decision-ready summary values", () => {
    const { result, checks } = solved();
    const summary = createBeamStudioSummary(model, result, checks);
    expect(summary).toEqual({
      beamType: "Simply supported",
      loadSummary: "1 point",
      maxMoment: "25 kN·m",
      readiness: "ready",
    });
  });
});

describe("beam production exports", () => {
  it("creates a spreadsheet-friendly station CSV", () => {
    const { result } = solved();
    const csv = buildStationsCsv(model, result);
    expect(csv.split("\n")[0]).toContain("shear (kN)");
    expect(csv).toContain("Point load P1");
  });

  it("creates a standalone SVG with both diagrams", () => {
    const { result } = solved();
    const svg = buildBeamDiagramsSvg(model, result);
    expect(svg).toMatch(/^<\?xml version=/);
    expect(svg).toContain("Shear force diagram");
    expect(svg).toContain("Bending moment diagram");
    expect(svg).toContain('<path d="');
  });

  it("creates the complete ZIP production pack", async () => {
    const { result, checks } = solved();
    const bytes = await createBeamProductionPack(model, result, checks);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(
      [...BEAM_PRODUCTION_PACK_FILES].sort(),
    );
    const project = JSON.parse(
      await zip.file("beam-project.json")!.async("string"),
    );
    const results = JSON.parse(
      await zip.file("beam-results.json")!.async("string"),
    );
    expect(project.model.length).toBe(10);
    expect(results.result.equilibrium.balanced).toBe(true);
    expect(await zip.file("beam-stations.csv")!.async("string")).toContain(
      "moment (kN·m)",
    );
    expect(await zip.file("beam-diagrams.svg")!.async("string")).toContain(
      "<svg",
    );
  });
});
