import type { ClampHealth, ClampInput, ClampPreviewMode, ClampResult, ClampToken, ClampUnit, ClampValidation } from "./types";

const DECIMALS = 4;

function round(value: number, decimals = DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function stripTrailingZeros(value: number): string {
  const rounded = round(value);
  return String(rounded).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function sanitizeTokenName(value: string): string {
  return value.trim().replace(/^--/, "").replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "fluid-size";
}

function quote(value: string): string {
  return JSON.stringify(value);
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

export function inferPreviewMode(property: string): ClampPreviewMode {
  const normalized = property.toLowerCase();
  if (normalized.includes("font") || normalized.includes("text")) return "text";
  if (normalized.includes("gap") || normalized.includes("padding") || normalized.includes("margin") || normalized.includes("space")) return "spacing";
  return "width";
}

export function validateClampInput(input: ClampInput): ClampValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.property.trim()) errors.push("CSS property is required.");
  if (!Number.isFinite(input.minViewport) || !Number.isFinite(input.maxViewport)) errors.push("Viewport values must be valid numbers.");
  if (!Number.isFinite(input.minValue) || !Number.isFinite(input.maxValue)) errors.push("Min and max values must be valid numbers.");
  if (!Number.isFinite(input.rootFontSize) || input.rootFontSize <= 0) errors.push("Root font size must be greater than 0.");
  if (input.minViewport >= input.maxViewport) errors.push("Min viewport must be less than max viewport.");
  if (input.minValue >= input.maxValue) errors.push("Min value should be less than max value for fluid scaling.");
  if (input.minViewport < 280) warnings.push("Very small viewport values can create surprising scaling on mobile devices.");
  if (input.maxViewport > 1920) warnings.push("Very large max viewport values can make desktop scaling feel too stretched.");
  if (input.maxViewport - input.minViewport < 240) warnings.push("Viewport range is narrow; the fluid change may happen too quickly.");
  if (input.property === "font-size" && valueToPx(input.minValue, input.unit, input.rootFontSize) < 14) {
    warnings.push("Minimum font size is below 14px. Check readability and browser zoom behavior.");
  }
  if (input.property === "font-size" && valueToPx(input.maxValue, input.unit, input.rootFontSize) / Math.max(1, valueToPx(input.minValue, input.unit, input.rootFontSize)) > 4) {
    warnings.push("Typography scale grows more than 4x. Test headings on tablet widths.");
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
  const slopePxPerViewportPx = (maxPx - minPx) / (input.maxViewport - input.minViewport);
  const slopeVw = slopePxPerViewportPx * 100;
  const interceptPx = minPx - slopePxPerViewportPx * input.minViewport;
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

export function getSampleValues(input: ClampInput): Array<{ viewport: number; value: string }> {
  const middle = Math.round((input.minViewport + input.maxViewport) / 2);
  const quarter = Math.round(input.minViewport + (input.maxViewport - input.minViewport) * 0.25);
  const threeQuarter = Math.round(input.minViewport + (input.maxViewport - input.minViewport) * 0.75);
  return [input.minViewport, quarter, middle, threeQuarter, input.maxViewport]
    .filter((value, index, list) => list.indexOf(value) === index)
    .map((viewport) => ({ viewport, value: `${getComputedFluidValue(input, viewport)}${input.unit}` }));
}

export function getClampHealth(input: ClampInput, validation: ClampValidation): ClampHealth {
  if (!validation.valid) return { label: "Needs changes", tone: "danger", notes: validation.errors };

  const notes = [...validation.warnings];
  const minPx = valueToPx(input.minValue, input.unit, input.rootFontSize);
  const maxPx = valueToPx(input.maxValue, input.unit, input.rootFontSize);
  const range = input.maxViewport - input.minViewport;

  if (input.property === "font-size" && minPx >= 14 && maxPx <= 96 && notes.length === 0) {
    notes.push("Good readable range for fluid typography.");
  }
  if (inferPreviewMode(input.property) === "spacing" && maxPx > 160) {
    notes.push("Large spacing output. Good for sections, heavy for cards.");
  }
  if (range >= 720 && notes.length === 0) notes.push("Smooth viewport range for production UI.");

  return {
    label: validation.warnings.length > 0 ? "Review" : "Production-ready",
    tone: validation.warnings.length > 0 ? "warning" : "good",
    notes,
  };
}

export function generateCssDeclaration(property: string, result: ClampResult): string {
  return `${property}: ${result.clamp};`;
}

export function generateCssVariable(name: string, result: ClampResult): string {
  return `--${sanitizeTokenName(name)}: ${result.clamp};`;
}

export function generateCssVariables(tokens: ClampToken[]): string {
  return `:root {\n${tokens
    .map((token) => {
      const result = generateClampValue(token);
      return `  ${generateCssVariable(token.name, result)}`;
    })
    .join("\n")}\n}`;
}

export function generateScopedCss(input: ClampInput, result: ClampResult, className = "fluid-element"): string {
  const safeClass = className.trim().replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-") || "fluid-element";
  return `.${safeClass} {\n  ${generateCssDeclaration(input.property, result)}\n}`;
}

export function generateTailwindTheme(tokens: ClampToken[]): string {
  const isMostlyTypography = tokens.filter((token) => token.property === "font-size").length >= Math.ceil(tokens.length / 2);
  const themeKey = isMostlyTypography ? "fontSize" : "spacing";
  const entries = tokens
    .map((token) => {
      const result = generateClampValue(token);
      const name = sanitizeTokenName(token.name).replace(/^(text|space)-/, "");
      return `        ${quote(name)}: ${quote(result.clamp)},`;
    })
    .join("\n");

  return `// tailwind.config.ts\nexport default {\n  theme: {\n    extend: {\n      ${themeKey}: {\n${entries}\n      },\n    },\n  },\n};`;
}

export function generateTokenJson(tokens: ClampToken[]): string {
  const data = tokens.reduce<Record<string, { value: string; property: string; minViewport: number; maxViewport: number; min: string; max: string }>>((acc, token) => {
    const result = generateClampValue(token);
    acc[sanitizeTokenName(token.name)] = {
      value: result.clamp,
      property: token.property,
      minViewport: token.minViewport,
      maxViewport: token.maxViewport,
      min: result.min,
      max: result.max,
    };
    return acc;
  }, {});

  return JSON.stringify({ fluid: data }, null, 2);
}

export function generateScssMap(tokens: ClampToken[]): string {
  const lines = tokens
    .map((token) => {
      const result = generateClampValue(token);
      return `  "${sanitizeTokenName(token.name)}": ${result.clamp},`;
    })
    .join("\n");
  return `$fluid-sizes: (\n${lines}\n);`;
}
