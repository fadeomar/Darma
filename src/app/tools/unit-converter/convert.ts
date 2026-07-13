import type {
  BatchConversionRow,
  ConversionCheck,
  ConversionFormat,
  ConversionOutcome,
  ConversionReport,
  ConversionRequest,
  UnitCategory,
  UnitDefinition,
  UnitSystem,
} from "./types";

export type LinearUnit = UnitDefinition;
export type { UnitCategory } from "./types";

function unit(
  id: string,
  name: string,
  symbol: string,
  factor: number,
  system: UnitSystem,
  aliases: string[] = [],
  note?: string,
): UnitDefinition {
  return { id, name, symbol, factor, system, aliases, note };
}

export const CATEGORIES: UnitCategory[] = [
  {
    id: "length",
    label: "Length",
    description: "Distance and physical dimensions.",
    baseUnitId: "m",
    physicalQuantity: "length",
    units: [
      unit("mm", "Millimeter", "mm", 0.001, "metric", ["millimeter", "millimeters"]),
      unit("cm", "Centimeter", "cm", 0.01, "metric", ["centimeter", "centimeters"]),
      unit("m", "Meter", "m", 1, "metric", ["meter", "meters", "metre", "metres"]),
      unit("km", "Kilometer", "km", 1000, "metric", ["kilometer", "kilometers", "kilometre", "kilometres"]),
      unit("in", "Inch", "in", 0.0254, "us-customary", ["inch", "inches", '"']),
      unit("ft", "Foot", "ft", 0.3048, "us-customary", ["foot", "feet", "'"]),
      unit("yd", "Yard", "yd", 0.9144, "us-customary", ["yard", "yards"]),
      unit("mi", "Mile", "mi", 1609.344, "us-customary", ["mile", "miles"]),
      unit("nmi", "Nautical mile", "nmi", 1852, "universal", ["nauticalmile", "nauticalmiles", "nm"]),
    ],
  },
  {
    id: "mass",
    label: "Mass / weight",
    description: "Mass values commonly used for people, products, and cargo.",
    baseUnitId: "g",
    physicalQuantity: "mass",
    units: [
      unit("mg", "Milligram", "mg", 0.001, "metric", ["milligram", "milligrams"]),
      unit("g", "Gram", "g", 1, "metric", ["gram", "grams"]),
      unit("kg", "Kilogram", "kg", 1000, "metric", ["kilogram", "kilograms", "kilo", "kilos"]),
      unit("t", "Tonne", "t", 1_000_000, "metric", ["tonne", "tonnes", "metricton", "metrictons"]),
      unit("oz", "Ounce", "oz", 28.349523125, "us-customary", ["ounce", "ounces"]),
      unit("lb", "Pound", "lb", 453.59237, "us-customary", ["pound", "pounds", "lbs"]),
      unit("st", "Stone", "st", 6350.29318, "imperial", ["stone", "stones"]),
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    description: "Celsius, Fahrenheit, and absolute Kelvin temperature.",
    baseUnitId: "c",
    physicalQuantity: "temperature",
    units: [
      unit("c", "Celsius", "°C", 1, "metric", ["c", "celsius", "°c"]),
      unit("f", "Fahrenheit", "°F", 1, "us-customary", ["f", "fahrenheit", "°f"]),
      unit("k", "Kelvin", "K", 1, "universal", ["k", "kelvin", "kelvins"]),
    ],
  },
  {
    id: "volume",
    label: "Volume",
    description: "Metric and US customary liquid volume.",
    baseUnitId: "l",
    physicalQuantity: "volume",
    units: [
      unit("ml", "Milliliter", "ml", 0.001, "metric", ["milliliter", "milliliters", "millilitre", "millilitres"]),
      unit("l", "Liter", "l", 1, "metric", ["liter", "liters", "litre", "litres"]),
      unit("m3", "Cubic meter", "m³", 1000, "metric", ["m3", "cubicmeter", "cubicmeters"]),
      unit("tsp", "Teaspoon (US)", "tsp", 0.00492892159375, "us-customary", ["teaspoon", "teaspoons"]),
      unit("tbsp", "Tablespoon (US)", "tbsp", 0.01478676478125, "us-customary", ["tablespoon", "tablespoons"]),
      unit("floz", "Fluid ounce (US)", "fl oz", 0.0295735295625, "us-customary", ["floz", "fluidounce", "fluidounces"]),
      unit("cup", "Cup (US)", "cup", 0.2365882365, "us-customary", ["cups"]),
      unit("pt", "Pint (US)", "pt", 0.473176473, "us-customary", ["pint", "pints"]),
      unit("qt", "Quart (US)", "qt", 0.946352946, "us-customary", ["quart", "quarts"]),
      unit("gal", "Gallon (US)", "gal", 3.785411784, "us-customary", ["gallon", "gallons"]),
    ],
  },
  {
    id: "area",
    label: "Area",
    description: "Surface area for rooms, land, and maps.",
    baseUnitId: "m2",
    physicalQuantity: "area",
    units: [
      unit("mm2", "Square millimeter", "mm²", 0.000001, "metric", ["mm2"]),
      unit("cm2", "Square centimeter", "cm²", 0.0001, "metric", ["cm2"]),
      unit("m2", "Square meter", "m²", 1, "metric", ["m2", "sqm"]),
      unit("ha", "Hectare", "ha", 10_000, "metric", ["hectare", "hectares"]),
      unit("km2", "Square kilometer", "km²", 1_000_000, "metric", ["km2", "sqkm"]),
      unit("in2", "Square inch", "in²", 0.00064516, "us-customary", ["in2", "sqin"]),
      unit("ft2", "Square foot", "ft²", 0.09290304, "us-customary", ["ft2", "sqft"]),
      unit("ac", "Acre", "ac", 4046.8564224, "us-customary", ["acre", "acres"]),
      unit("mi2", "Square mile", "mi²", 2_589_988.110336, "us-customary", ["mi2", "sqmi"]),
    ],
  },
  {
    id: "speed",
    label: "Speed",
    description: "Travel and motion speed.",
    baseUnitId: "mps",
    physicalQuantity: "speed",
    units: [
      unit("mps", "Meters per second", "m/s", 1, "metric", ["mps", "meterpersecond", "meterspersecond"]),
      unit("kmh", "Kilometers per hour", "km/h", 0.2777777777777778, "metric", ["kmh", "kph"]),
      unit("mph", "Miles per hour", "mph", 0.44704, "us-customary", ["mileperhour", "milesperhour"]),
      unit("fps", "Feet per second", "ft/s", 0.3048, "us-customary", ["fps"]),
      unit("knot", "Knot", "kn", 0.5144444444444445, "universal", ["knot", "knots", "kt"]),
    ],
  },
  {
    id: "digital",
    label: "Digital storage",
    description: "Decimal SI and binary IEC storage quantities.",
    baseUnitId: "B",
    physicalQuantity: "digital storage",
    units: [
      unit("bit", "Bit", "bit", 0.125, "universal", ["bits"]),
      unit("B", "Byte", "B", 1, "universal", ["byte", "bytes"]),
      unit("KB", "Kilobyte", "KB", 1000, "si-decimal", ["kilobyte", "kilobytes"]),
      unit("MB", "Megabyte", "MB", 1_000_000, "si-decimal", ["megabyte", "megabytes"]),
      unit("GB", "Gigabyte", "GB", 1_000_000_000, "si-decimal", ["gigabyte", "gigabytes"]),
      unit("TB", "Terabyte", "TB", 1_000_000_000_000, "si-decimal", ["terabyte", "terabytes"]),
      unit("KiB", "Kibibyte", "KiB", 1024, "iec-binary", ["kibibyte", "kibibytes"]),
      unit("MiB", "Mebibyte", "MiB", 1_048_576, "iec-binary", ["mebibyte", "mebibytes"]),
      unit("GiB", "Gibibyte", "GiB", 1_073_741_824, "iec-binary", ["gibibyte", "gibibytes"]),
      unit("TiB", "Tebibyte", "TiB", 1_099_511_627_776, "iec-binary", ["tebibyte", "tebibytes"]),
    ],
  },
  {
    id: "time",
    label: "Time",
    description: "Elapsed duration using fixed-length units.",
    baseUnitId: "s",
    physicalQuantity: "duration",
    units: [
      unit("ms", "Millisecond", "ms", 0.001, "universal", ["millisecond", "milliseconds"]),
      unit("s", "Second", "s", 1, "universal", ["second", "seconds", "sec"]),
      unit("min", "Minute", "min", 60, "universal", ["minute", "minutes"]),
      unit("h", "Hour", "h", 3600, "universal", ["hour", "hours", "hr", "hrs"]),
      unit("day", "Day", "d", 86_400, "universal", ["day", "days"]),
      unit("week", "Week", "wk", 604_800, "universal", ["week", "weeks", "wks"]),
    ],
  },
];

const ABSOLUTE_ZERO: Record<string, number> = { c: -273.15, f: -459.67, k: 0 };
const NON_NEGATIVE_CATEGORIES = new Set(["length", "mass", "volume", "area", "time", "digital"]);

export const DEFAULT_FORMAT: ConversionFormat = {
  mode: "auto",
  precision: 6,
  useGrouping: true,
};

export function getCategory(categoryId: string): UnitCategory | undefined {
  return CATEGORIES.find((category) => category.id === categoryId);
}

export function getUnit(category: UnitCategory, unitId: string): UnitDefinition | undefined {
  return category.units.find((candidate) => candidate.id === unitId);
}

export function findUnit(category: UnitCategory, token: string): UnitDefinition | undefined {
  const normalized = token.trim().toLowerCase().replace(/[\s._-]+/g, "");
  return category.units.find((candidate) => {
    const values = [candidate.id, candidate.symbol, candidate.name, ...(candidate.aliases ?? [])];
    return values.some((value) => value.toLowerCase().replace(/[\s._-]+/g, "") === normalized);
  });
}

export function convertTemperature(value: number, fromId: string, toId: string): number {
  if (!Object.prototype.hasOwnProperty.call(ABSOLUTE_ZERO, fromId) || !Object.prototype.hasOwnProperty.call(ABSOLUTE_ZERO, toId)) return Number.NaN;
  let celsius: number;
  switch (fromId) {
    case "f": celsius = ((value - 32) * 5) / 9; break;
    case "k": celsius = value - 273.15; break;
    default: celsius = value;
  }
  switch (toId) {
    case "f": return (celsius * 9) / 5 + 32;
    case "k": return celsius + 273.15;
    default: return celsius;
  }
}

export function convertValue(categoryId: string, value: number, fromId: string, toId: string): number {
  if (!Number.isFinite(value)) return Number.NaN;
  const category = getCategory(categoryId);
  if (!category) return Number.NaN;
  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);
  if (!from || !to) return Number.NaN;
  if (categoryId === "temperature") return convertTemperature(value, fromId, toId);
  return (value * from.factor) / to.factor;
}

function directTemperatureFormula(fromId: string, toId: string): string {
  if (fromId === toId) return "value";
  const key = `${fromId}:${toId}`;
  const formulas: Record<string, string> = {
    "c:f": "(value × 9 ÷ 5) + 32",
    "f:c": "(value − 32) × 5 ÷ 9",
    "c:k": "value + 273.15",
    "k:c": "value − 273.15",
    "f:k": "((value − 32) × 5 ÷ 9) + 273.15",
    "k:f": "((value − 273.15) × 9 ÷ 5) + 32",
  };
  return formulas[key] ?? "Convert through Celsius";
}

function substitutedTemperatureFormula(value: number, fromId: string, toId: string, result: number): string {
  const input = formatResult(value, { mode: "significant", precision: 8, useGrouping: false });
  const output = formatResult(result, { mode: "significant", precision: 8, useGrouping: false });
  const formula = directTemperatureFormula(fromId, toId).replaceAll("value", input);
  return `${formula} = ${output}`;
}

export function computeConversion(request: ConversionRequest): ConversionOutcome {
  const category = getCategory(request.categoryId) ?? null;
  const fromUnit = category ? getUnit(category, request.fromId) ?? null : null;
  const toUnit = category ? getUnit(category, request.toId) ?? null : null;
  if (!category) return invalidOutcome(request.value, "Choose a supported category.");
  if (!fromUnit || !toUnit) return invalidOutcome(request.value, "Choose valid source and destination units.", category, fromUnit, toUnit);
  if (!Number.isFinite(request.value)) return invalidOutcome(request.value, "Enter a valid finite number.", category, fromUnit, toUnit);

  const outputValue = convertValue(category.id, request.value, fromUnit.id, toUnit.id);
  if (!Number.isFinite(outputValue)) return invalidOutcome(request.value, "The conversion could not be calculated.", category, fromUnit, toUnit);

  if (category.id === "temperature") {
    const formula = directTemperatureFormula(fromUnit.id, toUnit.id);
    return {
      valid: true,
      error: null,
      category,
      fromUnit,
      toUnit,
      inputValue: request.value,
      outputValue,
      factor: null,
      formula,
      substitutedFormula: substitutedTemperatureFormula(request.value, fromUnit.id, toUnit.id, outputValue),
      steps: fromUnit.id === toUnit.id
        ? ["The source and destination units are identical, so the value does not change."]
        : [
            `Convert ${fromUnit.symbol} to the Celsius pivot when needed.`,
            `Apply the ${fromUnit.symbol} → ${toUnit.symbol} offset and scale formula.`,
          ],
    };
  }

  const factor = fromUnit.factor / toUnit.factor;
  const input = formatResult(request.value, { mode: "significant", precision: 8, useGrouping: false });
  const formattedFactor = formatResult(factor, { mode: "significant", precision: 10, useGrouping: false });
  const output = formatResult(outputValue, { mode: "significant", precision: 10, useGrouping: false });
  return {
    valid: true,
    error: null,
    category,
    fromUnit,
    toUnit,
    inputValue: request.value,
    outputValue,
    factor,
    formula: `value × ${fromUnit.factor} ÷ ${toUnit.factor}`,
    substitutedFormula: `${input} × ${formattedFactor} = ${output}`,
    steps: fromUnit.id === toUnit.id
      ? ["The source and destination units are identical, so the value does not change."]
      : [
          `Convert ${fromUnit.symbol} to the base unit (${getUnit(category, category.baseUnitId)?.symbol ?? category.baseUnitId}).`,
          `Convert the base-unit value to ${toUnit.symbol}.`,
        ],
  };
}

function invalidOutcome(
  inputValue: number,
  error: string,
  category: UnitCategory | null = null,
  fromUnit: UnitDefinition | null = null,
  toUnit: UnitDefinition | null = null,
): ConversionOutcome {
  return {
    valid: false,
    error,
    category,
    fromUnit,
    toUnit,
    inputValue,
    outputValue: Number.NaN,
    factor: null,
    formula: "",
    substitutedFormula: "",
    steps: [],
  };
}

export function formatResult(value: number, format: ConversionFormat = DEFAULT_FORMAT): string {
  if (!Number.isFinite(value)) return "—";
  if (Object.is(value, -0) || value === 0) return "0";

  const precision = Math.max(0, Math.min(12, Math.trunc(format.precision)));
  if (format.mode === "scientific") return value.toExponential(Math.max(0, precision));
  if (format.mode === "fixed") {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: format.useGrouping,
    });
  }
  if (format.mode === "significant") {
    return Number(value.toPrecision(Math.max(1, precision))).toLocaleString("en-US", {
      maximumSignificantDigits: Math.max(1, precision),
      useGrouping: format.useGrouping,
    });
  }

  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-7) return value.toExponential(Math.max(2, Math.min(8, precision)));
  const rounded = Number.parseFloat(value.toPrecision(Math.max(1, Math.min(12, precision + 3))));
  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: precision,
    useGrouping: format.useGrouping,
  });
}

export function parseBatchInput(
  input: string,
  categoryId: string,
  defaultFromId: string,
  toUnitId: string,
): BatchConversionRow[] {
  const category = getCategory(categoryId);
  return input.split(/\r?\n/).map((raw, index): BatchConversionRow | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (!category) return batchError(index + 1, raw, toUnitId, "Unknown category.");

    const match = trimmed.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*)$/i);
    if (!match) return batchError(index + 1, raw, toUnitId, "Expected a number, optionally followed by a unit.");
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return batchError(index + 1, raw, toUnitId, "The number is not finite.");

    const token = match[2].trim();
    const source = token ? findUnit(category, token) : getUnit(category, defaultFromId);
    if (!source) return batchError(index + 1, raw, toUnitId, `Unknown ${category.label.toLowerCase()} unit “${token || defaultFromId}”.`, value);
    const outputValue = convertValue(category.id, value, source.id, toUnitId);
    if (!Number.isFinite(outputValue)) return batchError(index + 1, raw, toUnitId, "The conversion failed.", value, source);

    return {
      lineNumber: index + 1,
      raw,
      inputValue: value,
      fromUnitId: source.id,
      fromSymbol: source.symbol,
      outputValue,
      toUnitId,
      error: null,
    };
  }).filter((row): row is BatchConversionRow => row !== null);
}

function batchError(
  lineNumber: number,
  raw: string,
  toUnitId: string,
  error: string,
  inputValue: number | null = null,
  source?: UnitDefinition,
): BatchConversionRow {
  return {
    lineNumber,
    raw,
    inputValue,
    fromUnitId: source?.id ?? null,
    fromSymbol: source?.symbol ?? null,
    outputValue: null,
    toUnitId,
    error,
  };
}

export function buildChecks(outcome: ConversionOutcome, batch: BatchConversionRow[] = []): ConversionCheck[] {
  const checks: ConversionCheck[] = [];
  if (!outcome.valid || !outcome.category || !outcome.fromUnit || !outcome.toUnit) {
    return [{ id: "invalid", level: "danger", title: "Conversion blocked", message: outcome.error ?? "Enter a valid conversion." }];
  }

  const { category, fromUnit, toUnit, inputValue, outputValue } = outcome;
  checks.push({ id: "local", level: "success", title: "Local calculation", message: "The conversion and exports are generated in your browser." });

  if (category.id === "temperature" && inputValue < ABSOLUTE_ZERO[fromUnit.id]) {
    checks.push({
      id: "absolute-zero",
      level: "danger",
      title: "Below absolute zero",
      message: `${formatResult(inputValue)} ${fromUnit.symbol} is below the physical minimum of ${ABSOLUTE_ZERO[fromUnit.id]} ${fromUnit.symbol}.`,
    });
  }
  if (NON_NEGATIVE_CATEGORIES.has(category.id) && inputValue < 0) {
    checks.push({ id: "negative", level: "warning", title: "Negative physical quantity", message: `Negative ${category.physicalQuantity} can be mathematically converted but may not fit the real-world context.` });
  }
  if (fromUnit.id === toUnit.id) {
    checks.push({ id: "same-unit", level: "info", title: "Same source and destination", message: "The result is unchanged because both units are identical." });
  }
  if (category.id === "digital" && new Set([fromUnit.system, toUnit.system]).has("si-decimal") && new Set([fromUnit.system, toUnit.system]).has("iec-binary")) {
    checks.push({ id: "digital-system", level: "warning", title: "SI and IEC units are different", message: "Decimal KB/MB/GB use powers of 1,000; binary KiB/MiB/GiB use powers of 1,024." });
  }
  if (category.id === "volume" && (fromUnit.system === "us-customary" || toUnit.system === "us-customary")) {
    checks.push({ id: "us-volume", level: "info", title: "US customary volume", message: "Cup, pint, quart, gallon, tablespoon, teaspoon, and fluid ounce use US customary definitions—not UK imperial volume." });
  }
  if (fromUnit.system !== toUnit.system && ![fromUnit.system, toUnit.system].includes("universal")) {
    checks.push({ id: "cross-system", level: "info", title: "Cross-system conversion", message: `${systemLabel(fromUnit.system)} → ${systemLabel(toUnit.system)} conversion uses the defined standard factor.` });
  }
  if (Math.abs(outputValue) >= 1e15 || (outputValue !== 0 && Math.abs(outputValue) < 1e-9)) {
    checks.push({ id: "extreme-result", level: "warning", title: "Extreme output scale", message: "Scientific notation is recommended to avoid a misleading wall of zeros." });
  }
  if (!Number.isSafeInteger(inputValue) && Number.isInteger(inputValue)) {
    checks.push({ id: "unsafe-integer", level: "warning", title: "Unsafe JavaScript integer", message: "This integer exceeds exact IEEE-754 representation; lower-order digits may already be rounded." });
  }
  const invalidRows = batch.filter((row) => row.error);
  if (invalidRows.length) {
    checks.push({ id: "batch-errors", level: "warning", title: `${invalidRows.length} batch row${invalidRows.length === 1 ? "" : "s"} skipped`, message: "Fix the highlighted rows before using the batch export as a production dataset." });
  }
  if (batch.length > 1000) {
    checks.push({ id: "large-batch", level: "warning", title: "Large batch", message: "Review the CSV output carefully; the browser is processing more than 1,000 rows." });
  }
  return checks;
}

export function systemLabel(system: UnitSystem): string {
  const labels: Record<UnitSystem, string> = {
    metric: "Metric",
    "us-customary": "US customary",
    imperial: "Imperial",
    "si-decimal": "SI decimal",
    "iec-binary": "IEC binary",
    universal: "Universal",
  };
  return labels[system];
}

export function buildAllConversions(request: ConversionRequest): Array<{ unit: UnitDefinition; value: number }> {
  const category = getCategory(request.categoryId);
  if (!category || !Number.isFinite(request.value)) return [];
  return category.units.map((candidate) => ({
    unit: candidate,
    value: convertValue(category.id, request.value, request.fromId, candidate.id),
  }));
}

export function buildReport(
  request: ConversionRequest,
  format: ConversionFormat,
  outcome: ConversionOutcome,
  checks: ConversionCheck[],
  batch: BatchConversionRow[],
): ConversionReport {
  return {
    generatedAt: new Date().toISOString(),
    request,
    format,
    result: outcome,
    checks,
    batch,
  };
}

function csvCell(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildConversionsCsv(
  request: ConversionRequest,
  format: ConversionFormat,
): string {
  const category = getCategory(request.categoryId);
  if (!category) return "unit_name,unit_symbol,value,system\n";
  const rows = buildAllConversions(request).map(({ unit: item, value }) => [
    item.name,
    item.symbol,
    formatResult(value, format),
    systemLabel(item.system),
  ]);
  return ["unit_name,unit_symbol,value,system", ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
}

export function buildBatchCsv(rows: BatchConversionRow[], format: ConversionFormat): string {
  return [
    "line,input,source_unit,output,target_unit,status",
    ...rows.map((row) => [
      row.lineNumber,
      row.inputValue,
      row.fromSymbol,
      row.outputValue == null ? "" : formatResult(row.outputValue, format),
      row.toUnitId,
      row.error ?? "ok",
    ].map(csvCell).join(",")),
  ].join("\n");
}

export function buildMarkdownReport(report: ConversionReport): string {
  const { result, request, checks, batch, format } = report;
  const resultLine = result.valid && result.fromUnit && result.toUnit
    ? `${formatResult(request.value, format)} ${result.fromUnit.symbol} = ${formatResult(result.outputValue, format)} ${result.toUnit.symbol}`
    : result.error ?? "Invalid conversion";
  return [
    "# Unit conversion report",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Category: ${result.category?.label ?? request.categoryId}`,
    `- Result: **${resultLine}**`,
    `- Formula: \`${result.substitutedFormula || result.formula || "—"}\``,
    `- Batch rows: ${batch.length}`,
    "",
    "## Production checks",
    "",
    ...checks.map((check) => `- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "> Conversion factors are deterministic, but always confirm the required measurement standard for regulated, medical, scientific, or contractual use.",
    "",
  ].join("\n");
}

export function buildJavaScriptSnippet(request: ConversionRequest): string {
  const category = getCategory(request.categoryId);
  const fromUnit = category ? getUnit(category, request.fromId) : undefined;
  const toUnit = category ? getUnit(category, request.toId) : undefined;
  if (!category || !fromUnit || !toUnit) return "// Select a valid conversion first.\n";
  if (category.id === "temperature") {
    const expressions: Record<string, string> = {
      "c:f": "(value * 9) / 5 + 32",
      "f:c": "((value - 32) * 5) / 9",
      "c:k": "value + 273.15",
      "k:c": "value - 273.15",
      "f:k": "((value - 32) * 5) / 9 + 273.15",
      "k:f": "((value - 273.15) * 9) / 5 + 32",
    };
    const expression = fromUnit.id === toUnit.id ? "value" : expressions[`${fromUnit.id}:${toUnit.id}`];
    return `export function convert${fromUnit.id.toUpperCase()}To${toUnit.id.toUpperCase()}(value) {\n  if (!Number.isFinite(value)) throw new TypeError("value must be finite");\n  return ${expression};\n}\n`;
  }
  return `const FACTOR = ${fromUnit.factor / toUnit.factor}; // ${fromUnit.symbol} → ${toUnit.symbol}\n\nexport function convert${safeIdentifier(fromUnit.id)}To${safeIdentifier(toUnit.id)}(value) {\n  if (!Number.isFinite(value)) throw new TypeError("value must be finite");\n  return value * FACTOR;\n}\n`;
}

function safeIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^\d/, "_$&");
}
