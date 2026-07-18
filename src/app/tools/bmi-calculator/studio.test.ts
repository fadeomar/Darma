import { describe, expect, it } from "vitest";
import {
  BMI_DISCLAIMER,
  DEFAULT_BMI_CONFIG,
  buildBmiAudit,
  buildBmiMarkdownReport,
  buildBmiMethodology,
  buildBmiProductionFiles,
  buildBmiSnapshotCsv,
  buildBmiSummaryCards,
  calculateBmiScreening,
  createBmiProject,
  normalizeBmiConfig,
  parseBmiProject,
  summarizeBmiAudit,
} from "./studio";

describe("BMI project normalization", () => {
  it("normalizes unknown values without changing the schema shape", () => {
    const config = normalizeBmiConfig({
      system: "imperial",
      weightKg: "82.5",
      heightCm: 180,
      waistCm: "",
      targetWeightKg: 78,
      age: "34",
      pregnant: false,
      athlete: true,
    });
    expect(config).toEqual({
      system: "imperial",
      weightKg: 82.5,
      heightCm: 180,
      waistCm: null,
      targetWeightKg: 78,
      age: 34,
      pregnant: false,
      athlete: true,
    });
  });

  it("uses safe fallbacks and broad bounds", () => {
    const config = normalizeBmiConfig({
      system: "other",
      weightKg: "bad",
      heightCm: 999,
      age: 500,
    });
    expect(config.system).toBe("metric");
    expect(config.weightKg).toBe(DEFAULT_BMI_CONFIG.weightKg);
    expect(config.heightCm).toBe(300);
    expect(config.age).toBe(130);
  });

  it("creates and parses a versioned project file", () => {
    const project = createBmiProject(
      DEFAULT_BMI_CONFIG,
      "2026-07-14T10:00:00.000Z",
    );
    expect(project.schema).toBe("darma.bmi-screening");
    expect(project.snapshot.bmi).toBeCloseTo(22.86, 1);
    expect(project.disclaimer).toBe(BMI_DISCLAIMER);
    expect(parseBmiProject(JSON.stringify(project))).toEqual(
      DEFAULT_BMI_CONFIG,
    );
  });

  it("rejects malformed and unrelated project files", () => {
    expect(() => parseBmiProject("not-json")).toThrow("not valid JSON");
    expect(() => parseBmiProject("[]")).toThrow("JSON object");
    expect(() =>
      parseBmiProject(
        JSON.stringify({ schema: "other", version: 1, config: {} }),
      ),
    ).toThrow("not a Darma BMI");
    expect(() =>
      parseBmiProject(
        JSON.stringify({
          schema: "darma.bmi-screening",
          version: 2,
          config: {},
        }),
      ),
    ).toThrow("version is not supported");
  });
});

describe("BMI screening snapshot", () => {
  it("calculates BMI, range, waist ratio, and target preview", () => {
    const snapshot = calculateBmiScreening(DEFAULT_BMI_CONFIG);
    expect(snapshot.bmi).toBeCloseTo(22.86, 2);
    expect(snapshot.category).toBe("normal");
    expect(snapshot.healthyRangeKg?.min).toBeCloseTo(56.66, 1);
    expect(snapshot.waistRatio).toBeCloseTo(0.48, 2);
    expect(snapshot.waistCategory).toBe("healthy");
    expect(snapshot.targetBmi).toBeCloseTo(24.82, 2);
  });

  it("supports optional waist and target fields", () => {
    const snapshot = calculateBmiScreening({
      ...DEFAULT_BMI_CONFIG,
      waistCm: null,
      targetWeightKg: null,
    });
    expect(snapshot.waistRatio).toBeNaN();
    expect(snapshot.waistCategory).toBeNull();
    expect(snapshot.targetBmi).toBeNaN();
    expect(snapshot.targetCategory).toBeNull();
  });
});

describe("applicability audit", () => {
  it("marks a typical adult screening as ready", () => {
    const checks = buildBmiAudit(calculateBmiScreening(DEFAULT_BMI_CONFIG));
    const summary = summarizeBmiAudit(checks);
    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(0);
    expect(summary.status).toBe("ready");
  });

  it("blocks standard adult interpretation for children", () => {
    const checks = buildBmiAudit(
      calculateBmiScreening({ ...DEFAULT_BMI_CONFIG, age: 12 }),
    );
    expect(checks).toContainEqual(
      expect.objectContaining({ id: "age", severity: "error" }),
    );
    expect(summarizeBmiAudit(checks).status).toBe("blocked");
  });

  it("flags ages 18–19 for careful interpretation", () => {
    const checks = buildBmiAudit(
      calculateBmiScreening({ ...DEFAULT_BMI_CONFIG, age: 19 }),
    );
    expect(checks).toContainEqual(
      expect.objectContaining({ id: "age", severity: "warning" }),
    );
    expect(summarizeBmiAudit(checks).status).toBe("review");
  });

  it("blocks pregnancy interpretation and warns for high-muscle context", () => {
    const checks = buildBmiAudit(
      calculateBmiScreening({
        ...DEFAULT_BMI_CONFIG,
        pregnant: true,
        athlete: true,
      }),
    );
    expect(checks).toContainEqual(
      expect.objectContaining({ id: "pregnancy", severity: "error" }),
    );
    expect(checks).toContainEqual(
      expect.objectContaining({ id: "body-composition", severity: "warning" }),
    );
  });

  it("does not treat a BMI category itself as a software error", () => {
    const checks = buildBmiAudit(
      calculateBmiScreening({ ...DEFAULT_BMI_CONFIG, weightKg: 120 }),
    );
    expect(
      checks.some(
        (check) => check.id === "category" && check.severity === "error",
      ),
    ).toBe(false);
  });

  it("adds measurement-range warnings", () => {
    const checks = buildBmiAudit(
      calculateBmiScreening({
        ...DEFAULT_BMI_CONFIG,
        weightKg: 10,
        heightCm: 300,
        waistCm: 12,
      }),
    );
    expect(
      checks.filter((check) => check.id.startsWith("range-")).length,
    ).toBeGreaterThanOrEqual(2);
  });
});

describe("summaries and exports", () => {
  const snapshot = calculateBmiScreening(DEFAULT_BMI_CONFIG);
  const checks = buildBmiAudit(snapshot);

  it("builds exactly four summary cards", () => {
    const cards = buildBmiSummaryCards(snapshot, checks);
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.label)).toEqual([
      "BMI",
      "Healthy range",
      "Waist / height",
      "Applicability",
    ]);
  });

  it("builds a Markdown report with limitations and audit", () => {
    const report = buildBmiMarkdownReport(snapshot, checks);
    expect(report).toContain("# BMI Screening Snapshot");
    expect(report).toContain(BMI_DISCLAIMER);
    expect(report).toContain("Applicability audit");
    expect(report).toContain("BMI: 22.9");
  });

  it("builds a parseable one-row CSV", () => {
    const csv = buildBmiSnapshotCsv(snapshot, checks);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("weight_kg,height_cm");
    expect(lines[1]).toContain("normal");
    expect(lines[1]).toContain("ready");
  });

  it("builds a methodology file with formulas and references", () => {
    const methodology = buildBmiMethodology();
    expect(methodology).toContain("weight_kg / (height_m × height_m)");
    expect(methodology).toContain("CDC");
    expect(methodology).toContain("NHS");
  });

  it("serializes project JSON without non-finite numbers", () => {
    const project = createBmiProject({
      ...DEFAULT_BMI_CONFIG,
      waistCm: null,
      targetWeightKg: null,
    });
    const json = JSON.stringify(project);
    expect(json).not.toContain("NaN");
    expect(JSON.parse(json).snapshot.waistToHeightRatio).toBeNull();
  });

  it("builds a five-file production pack without browser history", () => {
    const files = buildBmiProductionFiles(snapshot, checks);
    expect(Object.keys(files).sort()).toEqual([
      "README.txt",
      "bmi-screening-report.md",
      "bmi-screening.csv",
      "bmi-screening.json",
      "methodology.txt",
    ]);
    expect(files["bmi-screening.json"]).not.toContain("history");
    expect(JSON.parse(files["bmi-screening.json"]).schema).toBe(
      "darma.bmi-screening",
    );
  });
});
