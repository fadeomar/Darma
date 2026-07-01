// ─── BMI Health Snapshot logic ─────────────────────────────────────────────
// Pure body-mass-index math for metric and imperial inputs, plus helper
// calculations used by the client UI. These helpers intentionally avoid any
// browser APIs so they stay easy to test and safe to reuse.

export type UnitSystem = "metric" | "imperial";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";
export type WeightDeltaDirection = "below" | "inside" | "above";
export type WaistToHeightCategory = "low" | "healthy" | "increased" | "high";

export type WeightDelta = {
  direction: WeightDeltaDirection;
  amountKg: number;
};

export type BmiHistoryEntry = {
  id: string;
  createdAt: string;
  system: UnitSystem;
  bmi: number;
  category: BmiCategory;
  weight: number;
  weightUnit: "kg" | "lb";
  heightCm: number;
  waistToHeightRatio?: number | null;
  targetBmi?: number | null;
};

/** BMI from kilograms and centimeters: kg ÷ (height in metres)². */
export function bmiMetric(kg: number, cm: number): number {
  if (!Number.isFinite(kg) || !Number.isFinite(cm) || cm <= 0 || kg <= 0) return NaN;
  const metres = cm / 100;
  return kg / (metres * metres);
}

/** BMI from pounds and total inches: 703 × lb ÷ (inches)². */
export function bmiImperial(lb: number, inches: number): number {
  if (!Number.isFinite(lb) || !Number.isFinite(inches) || inches <= 0 || lb <= 0) return NaN;
  return (703 * lb) / (inches * inches);
}

export function bmiCategory(bmi: number): BmiCategory | null {
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

export const CATEGORY_LABEL: Record<BmiCategory, string> = {
  underweight: "Underweight",
  normal: "Normal weight",
  overweight: "Overweight",
  obese: "Obese",
};

export const CATEGORY_EXPLANATION: Record<BmiCategory, string> = {
  underweight: "Your BMI is below the adult healthy range. BMI is a screening number, so consider the full context of your health, diet, and body composition.",
  normal: "Your BMI is inside the adult healthy range. Keep reading it together with waist measurement, habits, and overall health context.",
  overweight: "Your BMI is above the adult healthy range. Waist measurement and health history can help explain what this number means for you.",
  obese: "Your BMI is in the adult obesity range. This is a screening signal only, not a diagnosis, and it should be interpreted with professional guidance when possible.",
};

/** Healthy weight range (BMI 18.5–24.9) in kilograms for a height in cm. */
export function healthyWeightKg(cm: number): { min: number; max: number } | null {
  if (!Number.isFinite(cm) || cm <= 0) return null;
  const metres = cm / 100;
  const area = metres * metres;
  return { min: 18.5 * area, max: 24.9 * area };
}

/** Healthy weight range in pounds for a height in total inches. */
export function healthyWeightLb(inches: number): { min: number; max: number } | null {
  if (!Number.isFinite(inches) || inches <= 0) return null;
  const rangeKg = healthyWeightKg(inches * 2.54);
  if (!rangeKg) return null;
  return { min: kgToLb(rangeKg.min), max: kgToLb(rangeKg.max) };
}

export function weightDeltaToHealthyRange(weightKg: number, heightCm: number): WeightDelta | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  const range = healthyWeightKg(heightCm);
  if (!range) return null;
  if (weightKg < range.min) return { direction: "below", amountKg: range.min - weightKg };
  if (weightKg > range.max) return { direction: "above", amountKg: weightKg - range.max };
  return { direction: "inside", amountKg: 0 };
}

export function targetBmi(targetWeightKg: number, heightCm: number): number {
  return bmiMetric(targetWeightKg, heightCm);
}

export function waistToHeightRatio(waistCm: number, heightCm: number): number {
  if (!Number.isFinite(waistCm) || !Number.isFinite(heightCm) || waistCm <= 0 || heightCm <= 0) return NaN;
  return waistCm / heightCm;
}

export function waistToHeightCategory(ratio: number): WaistToHeightCategory | null {
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  if (ratio < 0.4) return "low";
  if (ratio < 0.5) return "healthy";
  if (ratio < 0.6) return "increased";
  return "high";
}

export const WAIST_TO_HEIGHT_LABEL: Record<WaistToHeightCategory, string> = {
  low: "Low ratio",
  healthy: "Usually favorable",
  increased: "Increased attention",
  high: "High attention",
};

export function waistToHeightMessage(ratio: number): string {
  const category = waistToHeightCategory(ratio);
  if (!category) return "Add waist measurement to see waist-to-height ratio.";
  if (category === "low") return "This ratio is low. Interpret it with your general health and body composition.";
  if (category === "healthy") return "This ratio is usually considered favorable because waist is less than half of height.";
  if (category === "increased") return "This ratio suggests waist is at or above half of height, so it is worth paying attention to.";
  return "This ratio is high and may be a useful reason to discuss risk factors with a healthcare professional.";
}

export function round1(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 10) / 10;
}

export function round2(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100) / 100;
}

/** Convert feet + inches into total inches. */
export function feetInchesToInches(feet: number, inches: number): number {
  const f = Number.isFinite(feet) ? feet : 0;
  const i = Number.isFinite(inches) ? inches : 0;
  return f * 12 + i;
}

/** Convert pounds to kilograms. */
export function lbToKg(lb: number): number {
  return lb * 0.45359237;
}

/** Convert kilograms to pounds. */
export function kgToLb(kg: number): number {
  return kg / 0.45359237;
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

export function validateMeasurementRange({
  weightKg,
  heightCm,
  waistCm,
  age,
}: {
  weightKg: number;
  heightCm: number;
  waistCm?: number | null;
  age?: number | null;
}): string[] {
  const warnings: string[] = [];
  if (Number.isFinite(heightCm) && (heightCm < 90 || heightCm > 240)) warnings.push("Height looks unusual. Please check the value and unit.");
  if (Number.isFinite(weightKg) && (weightKg < 25 || weightKg > 350)) warnings.push("Weight looks unusual. Please check the value and unit.");
  if (waistCm && Number.isFinite(waistCm) && (waistCm < 35 || waistCm > 220)) warnings.push("Waist measurement looks unusual. Please check the value and unit.");
  if (age && Number.isFinite(age) && age < 18) warnings.push("Adult BMI categories may not apply to people under 18.");
  return warnings;
}

export function formatWeightDelta(delta: WeightDelta | null, unit: UnitSystem): string {
  if (!delta) return "Enter valid measurements to compare with the healthy range.";
  const amount = unit === "metric" ? round1(delta.amountKg) : round1(kgToLb(delta.amountKg));
  const suffix = unit === "metric" ? "kg" : "lb";
  if (delta.direction === "inside") return "Within the adult healthy BMI range.";
  if (delta.direction === "below") return `${amount} ${suffix} below the adult healthy BMI range.`;
  return `${amount} ${suffix} above the adult healthy BMI range.`;
}

export function historyToCsv(entries: BmiHistoryEntry[]): string {
  const header = ["date", "unit_system", "bmi", "category", "weight", "weight_unit", "height_cm", "waist_to_height_ratio", "target_bmi"];
  const rows = entries.map((entry) => [
    entry.createdAt,
    entry.system,
    round1(entry.bmi).toString(),
    entry.category,
    entry.weight.toString(),
    entry.weightUnit,
    round1(entry.heightCm).toString(),
    entry.waistToHeightRatio ? round2(entry.waistToHeightRatio).toString() : "",
    entry.targetBmi ? round1(entry.targetBmi).toString() : "",
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string): string {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
