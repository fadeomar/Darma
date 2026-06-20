// ─── BMI calculation logic ─────────────────────────────────────────────────
// Pure body-mass-index math for metric and imperial inputs, plus the WHO
// category bands and the healthy-weight range for a given height.

export type UnitSystem = "metric" | "imperial";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

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

/** Healthy weight range (BMI 18.5–24.9) in kilograms for a height in cm. */
export function healthyWeightKg(cm: number): { min: number; max: number } | null {
  if (!Number.isFinite(cm) || cm <= 0) return null;
  const metres = cm / 100;
  const area = metres * metres;
  return { min: 18.5 * area, max: 24.9 * area };
}

export function round1(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 10) / 10;
}

/** Convert feet + inches into total inches. */
export function feetInchesToInches(feet: number, inches: number): number {
  const f = Number.isFinite(feet) ? feet : 0;
  const i = Number.isFinite(inches) ? inches : 0;
  return f * 12 + i;
}

/** Convert pounds to kilograms (for showing the healthy range in imperial). */
export function lbToKg(lb: number): number {
  return lb * 0.45359237;
}

/** Convert kilograms to pounds. */
export function kgToLb(kg: number): number {
  return kg / 0.45359237;
}
