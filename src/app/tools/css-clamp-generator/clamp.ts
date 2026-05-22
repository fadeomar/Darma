import type { ClampInput, ClampResult, ClampToken, ClampValidation, ClampUnit } from "./types";

const DECIMALS = 4;

function round(value: number, decimals = DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function stripTrailingZeros(value: number): string {
  return String(round(value)).replace(/\.0+$/, "");
}

export function valueToPx(value: number, unit: ClampUnit, rootFontSize: number): number {
  return unit === "rem" ? value * rootFontSize : value;
}

export function pxToUnit(value: number, unit: ClampUnit, rootFontSize: number): number {
  return unit === "rem" ? value / rootFontSize : value;
}

export function formatCssValue(value: number, unit: ClampUnit): string {
  return `${stripTrailingZeros(value)}${unit}`;
}

export function validateClampInput(input: ClampInput): ClampValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(input.minViewport) || !Number.isFinite(input.maxViewport)) errors.push("Viewport values must be valid numbers.");
  if (!Number.isFinite(input.minValue) || !Number.isFinite(input.maxValue)) errors.push("Min and max values must be valid numbers.");
  if (!Number.isFinite(input.rootFontSize) || input.rootFontSize <= 0) errors.push("Root font size must be greater than 0.");
  if (input.minViewport >= input.maxViewport) errors.push("Min viewport must be less than max viewport.");
  if (input.minValue >= input.maxValue) errors.push("Min value should be less than max value for fluid scaling.");
  if (input.minViewport < 240) warnings.push("Very small viewport values can create surprising scaling on mobile devices.");
  if (input.property === "font-size" && valueToPx(input.minValue, input.unit, input.rootFontSize) < 12) {
    warnings.push("Minimum font size is below 12px. Check readability and browser zoom behavior.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function generateClampValue(input: ClampInput): ClampResult {
  const validation = validateClampInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? "Invalid clamp input.");
  }

  const minPx = valueToPx(input.minValue, input.unit, input.rootFontSize);
  const maxPx = valueToPx(input.maxValue, input.unit, input.rootFontSize);
  const slopePxPerVw = (maxPx - minPx) / (input.maxViewport - input.minViewport);
  const slopeVw = slopePxPerVw * 100;
  const interceptPx = minPx - slopePxPerVw * input.minViewport;
  const interceptUnit = pxToUnit(interceptPx, input.unit, input.rootFontSize);
  const min = formatCssValue(input.minValue, input.unit);
  const max = formatCssValue(input.maxValue, input.unit);
  const intercept = formatCssValue(interceptUnit, input.unit);
  const preferred = `${intercept} + ${stripTrailingZeros(slopeVw)}vw`;

  return {
    clamp: `clamp(${min}, ${preferred}, ${max})`,
    preferred,
    slope: round(slopeVw),
    intercept: round(interceptUnit),
    min,
    max,
  };
}

export function getComputedFluidValue(input: ClampInput, viewportWidth: number): number {
  const minPx = valueToPx(input.minValue, input.unit, input.rootFontSize);
  const maxPx = valueToPx(input.maxValue, input.unit, input.rootFontSize);
  const slopePxPerViewportPx = (maxPx - minPx) / (input.maxViewport - input.minViewport);
  const rawPx = minPx + (viewportWidth - input.minViewport) * slopePxPerViewportPx;
  const clampedPx = Math.min(Math.max(rawPx, minPx), maxPx);
  return round(pxToUnit(clampedPx, input.unit, input.rootFontSize), 3);
}

export function generateCssDeclaration(property: string, result: ClampResult): string {
  return `${property}: ${result.clamp};`;
}

export function generateCssVariable(name: string, result: ClampResult): string {
  const tokenName = name.trim().replace(/^--/, "").replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").toLowerCase() || "fluid-size";
  return `--${tokenName}: ${result.clamp};`;
}

export function generateCssVariables(tokens: ClampToken[]): string {
  return `:root {\n${tokens
    .map((token) => {
      const result = generateClampValue(token);
      return `  ${generateCssVariable(token.name, result)}`;
    })
    .join("\n")}\n}`;
}
