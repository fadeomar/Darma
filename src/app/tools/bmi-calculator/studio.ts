import {
  CATEGORY_LABEL,
  WAIST_TO_HEIGHT_LABEL,
  bmiCategory,
  bmiMetric,
  formatWeightDelta,
  healthyWeightKg,
  kgToLb,
  round1,
  round2,
  validateMeasurementRange,
  waistToHeightCategory,
  waistToHeightRatio,
  weightDeltaToHealthyRange,
  type BmiCategory,
  type UnitSystem,
  type WaistToHeightCategory,
  type WeightDelta,
} from "./bmi";

export type BmiAuditSeverity = "error" | "warning" | "info" | "pass";

export type BmiAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: BmiAuditSeverity;
};

export type BmiSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type BmiScreeningConfig = {
  system: UnitSystem;
  weightKg: number;
  heightCm: number;
  waistCm: number | null;
  targetWeightKg: number | null;
  age: number | null;
  pregnant: boolean;
  athlete: boolean;
};

export type BmiScreeningSnapshot = {
  config: BmiScreeningConfig;
  bmi: number;
  category: BmiCategory | null;
  healthyRangeKg: { min: number; max: number } | null;
  delta: WeightDelta | null;
  waistRatio: number;
  waistCategory: WaistToHeightCategory | null;
  targetBmi: number;
  targetCategory: BmiCategory | null;
};

export type BmiProjectFile = {
  schema: "darma.bmi-screening";
  version: 1;
  exportedAt: string;
  config: BmiScreeningConfig;
  snapshot: {
    bmi: number | null;
    category: BmiCategory | null;
    healthyRangeKg: { min: number; max: number } | null;
    waistToHeightRatio: number | null;
    waistCategory: WaistToHeightCategory | null;
    targetBmi: number | null;
    targetCategory: BmiCategory | null;
  };
  disclaimer: string;
};

export const BMI_DISCLAIMER =
  "BMI and waist-to-height ratio are screening measures, not diagnoses. They do not replace personal advice from a qualified healthcare professional.";

export const DEFAULT_BMI_CONFIG: BmiScreeningConfig = {
  system: "metric",
  weightKg: 70,
  heightCm: 175,
  waistCm: 84,
  targetWeightKg: 76,
  age: 28,
  pregnant: false,
  athlete: false,
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeUnitSystem(value: unknown, fallback: UnitSystem): UnitSystem {
  return value === "metric" || value === "imperial" ? value : fallback;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  { min, max }: { min: number; max: number },
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeOptionalNumber(
  value: unknown,
  fallback: number | null,
  { min, max }: { min: number; max: number },
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function normalizeBmiConfig(
  input: unknown,
  fallback: BmiScreeningConfig = DEFAULT_BMI_CONFIG,
): BmiScreeningConfig {
  const source = isRecord(input) ? input : {};
  return {
    system: normalizeUnitSystem(source.system, fallback.system),
    weightKg: normalizeNumber(source.weightKg, fallback.weightKg, {
      min: 1,
      max: 1_000,
    }),
    heightCm: normalizeNumber(source.heightCm, fallback.heightCm, {
      min: 30,
      max: 300,
    }),
    waistCm: normalizeOptionalNumber(source.waistCm, fallback.waistCm, {
      min: 10,
      max: 400,
    }),
    targetWeightKg: normalizeOptionalNumber(
      source.targetWeightKg,
      fallback.targetWeightKg,
      {
        min: 1,
        max: 1_000,
      },
    ),
    age: normalizeOptionalNumber(source.age, fallback.age, {
      min: 0,
      max: 130,
    }),
    pregnant: normalizeBoolean(source.pregnant, fallback.pregnant),
    athlete: normalizeBoolean(source.athlete, fallback.athlete),
  };
}

export function calculateBmiScreening(
  config: BmiScreeningConfig,
): BmiScreeningSnapshot {
  const current = { ...config };
  const bmi = bmiMetric(current.weightKg, current.heightCm);
  const waistRatio =
    current.waistCm === null
      ? Number.NaN
      : waistToHeightRatio(current.waistCm, current.heightCm);
  const targetBmi =
    current.targetWeightKg === null
      ? Number.NaN
      : bmiMetric(current.targetWeightKg, current.heightCm);

  return {
    config: current,
    bmi,
    category: bmiCategory(bmi),
    healthyRangeKg: healthyWeightKg(current.heightCm),
    delta: weightDeltaToHealthyRange(current.weightKg, current.heightCm),
    waistRatio,
    waistCategory: waistToHeightCategory(waistRatio),
    targetBmi,
    targetCategory: bmiCategory(targetBmi),
  };
}

export function createBmiProject(
  config: BmiScreeningConfig,
  exportedAt = new Date().toISOString(),
): BmiProjectFile {
  const normalized = normalizeBmiConfig(config, {
    ...DEFAULT_BMI_CONFIG,
    system: config.system,
    waistCm: null,
    targetWeightKg: null,
    age: null,
    pregnant: config.pregnant,
    athlete: config.athlete,
  });
  const snapshot = calculateBmiScreening(normalized);
  return {
    schema: "darma.bmi-screening",
    version: 1,
    exportedAt,
    config: snapshot.config,
    snapshot: {
      bmi: Number.isFinite(snapshot.bmi) ? round2(snapshot.bmi) : null,
      category: snapshot.category,
      healthyRangeKg: snapshot.healthyRangeKg
        ? {
            min: round2(snapshot.healthyRangeKg.min),
            max: round2(snapshot.healthyRangeKg.max),
          }
        : null,
      waistToHeightRatio: Number.isFinite(snapshot.waistRatio)
        ? round2(snapshot.waistRatio)
        : null,
      waistCategory: snapshot.waistCategory,
      targetBmi: Number.isFinite(snapshot.targetBmi)
        ? round2(snapshot.targetBmi)
        : null,
      targetCategory: snapshot.targetCategory,
    },
    disclaimer: BMI_DISCLAIMER,
  };
}

export function parseBmiProject(input: string): BmiScreeningConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed))
    throw new Error("The project file must contain a JSON object.");
  if (parsed.schema !== "darma.bmi-screening")
    throw new Error("This is not a Darma BMI screening file.");
  if (parsed.version !== 1)
    throw new Error("This BMI screening file version is not supported.");
  if (!isRecord(parsed.config))
    throw new Error("The BMI screening file does not contain valid settings.");

  return normalizeBmiConfig(parsed.config, {
    ...DEFAULT_BMI_CONFIG,
    waistCm: null,
    targetWeightKg: null,
    age: null,
  });
}

export function buildBmiAudit(snapshot: BmiScreeningSnapshot): BmiAuditCheck[] {
  const { config } = snapshot;
  const checks: BmiAuditCheck[] = [];

  if (!Number.isFinite(snapshot.bmi) || !snapshot.category) {
    checks.push({
      id: "measurements",
      title: "Weight and height",
      message:
        "Enter positive weight and height measurements before using the screening result.",
      severity: "error",
    });
  } else {
    checks.push({
      id: "measurements",
      title: "Weight and height",
      message:
        "The core measurements are valid and the BMI formula can be calculated.",
      severity: "pass",
    });
  }

  if (
    config.age !== null &&
    (!Number.isFinite(config.age) || config.age <= 0 || config.age > 120)
  ) {
    checks.push({
      id: "age",
      title: "Adult applicability",
      message:
        "Age is not a valid value. Clear it or enter an age from 1 to 120.",
      severity: "error",
    });
  } else if (config.age === null) {
    checks.push({
      id: "age",
      title: "Adult applicability",
      message:
        "Age is not set. Standard adult bands should not be used for children or teens.",
      severity: "info",
    });
  } else if (config.age < 18) {
    checks.push({
      id: "age",
      title: "Adult applicability",
      message:
        "This person is under 18. Use an age- and sex-specific child or teen growth assessment instead of adult BMI bands.",
      severity: "error",
    });
  } else if (config.age < 20) {
    checks.push({
      id: "age",
      title: "Adult applicability",
      message:
        "Some public-health calculators use child and teen BMI-for-age guidance through age 19. Interpret this adult result cautiously.",
      severity: "warning",
    });
  } else {
    checks.push({
      id: "age",
      title: "Adult applicability",
      message:
        "The entered age is within the range commonly used by adult BMI calculators.",
      severity: "pass",
    });
  }

  checks.push(
    config.pregnant
      ? {
          id: "pregnancy",
          title: "Pregnancy context",
          message:
            "Standard BMI category interpretation is not suitable for assessing weight status during pregnancy.",
          severity: "error",
        }
      : {
          id: "pregnancy",
          title: "Pregnancy context",
          message: "Pregnancy is not selected as a context limitation.",
          severity: "pass",
        },
  );

  if (config.athlete) {
    checks.push({
      id: "body-composition",
      title: "Body composition context",
      message:
        "High muscle mass can raise BMI without the same increase in body fat. Use additional context rather than BMI alone.",
      severity: "warning",
    });
  } else {
    checks.push({
      id: "body-composition",
      title: "Body composition context",
      message:
        "No high-muscle context is selected, but BMI still does not measure body fat directly.",
      severity: "info",
    });
  }

  if (
    config.waistCm !== null &&
    (!Number.isFinite(config.waistCm) || config.waistCm <= 0)
  ) {
    checks.push({
      id: "waist",
      title: "Waist context",
      message:
        "The waist value is not a valid number. Clear it or enter a positive measurement.",
      severity: "warning",
    });
  } else if (config.waistCm === null || !Number.isFinite(snapshot.waistRatio)) {
    checks.push({
      id: "waist",
      title: "Waist context",
      message:
        "Waist measurement is optional. Adding it provides a second screening measure alongside BMI.",
      severity: "info",
    });
  } else if (snapshot.waistRatio < 0.5) {
    checks.push({
      id: "waist",
      title: "Waist-to-height context",
      message: `The waist-to-height ratio is ${round2(snapshot.waistRatio)}, below one-half of height.`,
      severity: "pass",
    });
  } else {
    checks.push({
      id: "waist",
      title: "Waist-to-height context",
      message: `The waist-to-height ratio is ${round2(snapshot.waistRatio)}, at or above one-half of height. Treat this as a screening signal, not a diagnosis.`,
      severity: "info",
    });
  }

  if (
    config.targetWeightKg !== null &&
    (!Number.isFinite(config.targetWeightKg) || config.targetWeightKg <= 0)
  ) {
    checks.push({
      id: "target",
      title: "Target preview",
      message:
        "The target-weight value is not a valid number. Clear it or enter a positive measurement.",
      severity: "warning",
    });
  } else if (
    config.targetWeightKg === null ||
    !Number.isFinite(snapshot.targetBmi)
  ) {
    checks.push({
      id: "target",
      title: "Target preview",
      message:
        "No target weight is set. The target preview is optional and does not prescribe a goal.",
      severity: "info",
    });
  } else {
    checks.push({
      id: "target",
      title: "Target preview",
      message: `The target preview calculates to BMI ${round1(snapshot.targetBmi)}. It is a mathematical preview, not a recommended target.`,
      severity: "info",
    });
  }

  for (const [index, message] of validateMeasurementRange({
    weightKg: config.weightKg,
    heightCm: config.heightCm,
    waistCm: config.waistCm,
    age: config.age,
  }).entries()) {
    checks.push({
      id: `range-${index}`,
      title: "Measurement range",
      message,
      severity: "warning",
    });
  }

  checks.push({
    id: "privacy",
    title: "Export privacy",
    message:
      "Downloaded reports contain personal measurements. Store or share them only where appropriate.",
    severity: "info",
  });

  return checks;
}

export function summarizeBmiAudit(checks: BmiAuditCheck[]): {
  status: "blocked" | "review" | "ready";
  label: string;
  errors: number;
  warnings: number;
  passes: number;
} {
  const errors = checks.filter((check) => check.severity === "error").length;
  const warnings = checks.filter(
    (check) => check.severity === "warning",
  ).length;
  const passes = checks.filter((check) => check.severity === "pass").length;
  if (errors > 0)
    return {
      status: "blocked",
      label: "Do not rely on adult result",
      errors,
      warnings,
      passes,
    };
  if (warnings > 0)
    return {
      status: "review",
      label: "Review context",
      errors,
      warnings,
      passes,
    };
  return {
    status: "ready",
    label: "Screening ready",
    errors,
    warnings,
    passes,
  };
}

export function buildBmiSummaryCards(
  snapshot: BmiScreeningSnapshot,
  checks: BmiAuditCheck[],
): BmiSummaryCard[] {
  const audit = summarizeBmiAudit(checks);
  return [
    {
      label: "BMI",
      value: Number.isFinite(snapshot.bmi)
        ? round1(snapshot.bmi).toString()
        : "—",
      detail: snapshot.category
        ? CATEGORY_LABEL[snapshot.category]
        : "Enter valid measurements",
    },
    {
      label: "Healthy range",
      value: snapshot.healthyRangeKg
        ? snapshot.config.system === "metric"
          ? `${round1(snapshot.healthyRangeKg.min)}–${round1(snapshot.healthyRangeKg.max)} kg`
          : `${round1(kgToLb(snapshot.healthyRangeKg.min))}–${round1(kgToLb(snapshot.healthyRangeKg.max))} lb`
        : "—",
      detail: "Adult BMI 18.5–24.9 at this height",
    },
    {
      label: "Waist / height",
      value: Number.isFinite(snapshot.waistRatio)
        ? round2(snapshot.waistRatio).toString()
        : "Not set",
      detail: snapshot.waistCategory
        ? WAIST_TO_HEIGHT_LABEL[snapshot.waistCategory]
        : "Optional second measure",
    },
    {
      label: "Applicability",
      value: audit.label,
      detail: `${audit.errors} errors · ${audit.warnings} warnings · ${audit.passes} passes`,
    },
  ];
}

function formatMeasurement(value: number | null, unit: "kg" | "cm"): string {
  return value === null || !Number.isFinite(value)
    ? "Not set"
    : `${round1(value)} ${unit}`;
}

function auditIcon(severity: BmiAuditSeverity): string {
  if (severity === "error") return "❌";
  if (severity === "warning") return "⚠️";
  if (severity === "pass") return "✅";
  return "ℹ️";
}

export function buildBmiMarkdownReport(
  snapshot: BmiScreeningSnapshot,
  checks: BmiAuditCheck[],
): string {
  const audit = summarizeBmiAudit(checks);
  const category = snapshot.category
    ? CATEGORY_LABEL[snapshot.category]
    : "Not available";
  const waist = Number.isFinite(snapshot.waistRatio)
    ? `${round2(snapshot.waistRatio)}${snapshot.waistCategory ? ` (${WAIST_TO_HEIGHT_LABEL[snapshot.waistCategory]})` : ""}`
    : "Not set";

  return [
    "# BMI Screening Snapshot",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `> ${BMI_DISCLAIMER}`,
    "",
    "## Measurements",
    "",
    `- Weight: ${formatMeasurement(snapshot.config.weightKg, "kg")}`,
    `- Height: ${round1(snapshot.config.heightCm)} cm`,
    `- Waist: ${formatMeasurement(snapshot.config.waistCm, "cm")}`,
    `- Age: ${snapshot.config.age ?? "Not set"}`,
    `- Pregnancy context: ${snapshot.config.pregnant ? "Yes" : "No"}`,
    `- Athlete / high-muscle context: ${snapshot.config.athlete ? "Yes" : "No"}`,
    "",
    "## Screening results",
    "",
    `- BMI: ${Number.isFinite(snapshot.bmi) ? round1(snapshot.bmi) : "Not available"}`,
    `- Adult category: ${category}`,
    `- Healthy-range comparison: ${formatWeightDelta(snapshot.delta, "metric")}`,
    `- Waist-to-height ratio: ${waist}`,
    `- Target-weight preview: ${Number.isFinite(snapshot.targetBmi) ? `BMI ${round1(snapshot.targetBmi)}` : "Not set"}`,
    "",
    `## Applicability audit — ${audit.label}`,
    "",
    ...checks.map(
      (check) =>
        `- ${auditIcon(check.severity)} **${check.title}:** ${check.message}`,
    ),
    "",
    "## Method",
    "",
    "BMI = weight in kilograms ÷ height in metres squared.",
    "",
    "Waist-to-height ratio = waist circumference ÷ height, using the same units.",
    "",
    "This report is intended for personal screening and record keeping only.",
    "",
  ].join("\n");
}

function escapeCsv(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildBmiSnapshotCsv(
  snapshot: BmiScreeningSnapshot,
  checks: BmiAuditCheck[],
): string {
  const audit = summarizeBmiAudit(checks);
  const headers = [
    "weight_kg",
    "height_cm",
    "waist_cm",
    "age",
    "bmi",
    "adult_category",
    "healthy_min_kg",
    "healthy_max_kg",
    "waist_to_height_ratio",
    "target_weight_kg",
    "target_bmi",
    "applicability_status",
    "error_count",
    "warning_count",
  ];
  const row = [
    round2(snapshot.config.weightKg),
    round2(snapshot.config.heightCm),
    snapshot.config.waistCm === null ? null : round2(snapshot.config.waistCm),
    snapshot.config.age,
    Number.isFinite(snapshot.bmi) ? round2(snapshot.bmi) : null,
    snapshot.category,
    snapshot.healthyRangeKg ? round2(snapshot.healthyRangeKg.min) : null,
    snapshot.healthyRangeKg ? round2(snapshot.healthyRangeKg.max) : null,
    Number.isFinite(snapshot.waistRatio) ? round2(snapshot.waistRatio) : null,
    snapshot.config.targetWeightKg === null
      ? null
      : round2(snapshot.config.targetWeightKg),
    Number.isFinite(snapshot.targetBmi) ? round2(snapshot.targetBmi) : null,
    audit.status,
    audit.errors,
    audit.warnings,
  ];
  return `${headers.join(",")}\n${row.map(escapeCsv).join(",")}\n`;
}

export function buildBmiProductionFiles(
  snapshot: BmiScreeningSnapshot,
  checks: BmiAuditCheck[],
): Record<string, string> {
  return {
    "bmi-screening.json": JSON.stringify(
      createBmiProject(snapshot.config),
      null,
      2,
    ),
    "bmi-screening-report.md": buildBmiMarkdownReport(snapshot, checks),
    "bmi-screening.csv": buildBmiSnapshotCsv(snapshot, checks),
    "methodology.txt": buildBmiMethodology(),
    "README.txt": [
      "Darma BMI Screening Pack",
      "",
      "This pack contains personal measurements and screening calculations.",
      "Keep it private and do not treat it as a diagnosis or medical record.",
      "",
      BMI_DISCLAIMER,
    ].join("\n"),
  };
}
export function buildBmiMethodology(): string {
  return [
    "BMI SCREENING METHODOLOGY",
    "",
    "BMI formula (metric): weight_kg / (height_m × height_m)",
    "Adult screening bands: under 18.5, 18.5–24.9, 25.0–29.9, and 30.0 or above.",
    "Waist-to-height formula: waist / height using matching units.",
    "A waist measurement below one-half of height is a common public-health screening guide.",
    "",
    BMI_DISCLAIMER,
    "Adult bands are not a substitute for child or teen BMI-for-age assessment, pregnancy care, or body-composition evaluation.",
    "",
    "References checked for this implementation:",
    "- CDC adult BMI categories and adult calculator guidance",
    "- WHO adult overweight and obesity definitions",
    "- NHS waist-to-height ratio guidance",
    "",
  ].join("\n");
}
