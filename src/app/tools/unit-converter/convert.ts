// ─── Unit conversion logic ─────────────────────────────────────────────────
// Pure, browser-local unit conversion. Every linear category stores each unit's
// factor relative to a base unit, so converting is `value * from / to`.
// Temperature is non-linear (offsets), so it is handled separately.

export type LinearUnit = {
  id: string;
  name: string;
  symbol: string;
  /** Multiplier to the category's base unit. Unused for temperature. */
  factor: number;
};

export type UnitCategory = {
  id: string;
  label: string;
  units: LinearUnit[];
};

export const CATEGORIES: UnitCategory[] = [
  {
    id: "length",
    label: "Length",
    units: [
      { id: "mm", name: "Millimeter", symbol: "mm", factor: 0.001 },
      { id: "cm", name: "Centimeter", symbol: "cm", factor: 0.01 },
      { id: "m", name: "Meter", symbol: "m", factor: 1 },
      { id: "km", name: "Kilometer", symbol: "km", factor: 1000 },
      { id: "in", name: "Inch", symbol: "in", factor: 0.0254 },
      { id: "ft", name: "Foot", symbol: "ft", factor: 0.3048 },
      { id: "yd", name: "Yard", symbol: "yd", factor: 0.9144 },
      { id: "mi", name: "Mile", symbol: "mi", factor: 1609.344 },
      { id: "nmi", name: "Nautical mile", symbol: "nmi", factor: 1852 },
    ],
  },
  {
    id: "mass",
    label: "Mass / weight",
    units: [
      { id: "mg", name: "Milligram", symbol: "mg", factor: 0.001 },
      { id: "g", name: "Gram", symbol: "g", factor: 1 },
      { id: "kg", name: "Kilogram", symbol: "kg", factor: 1000 },
      { id: "t", name: "Tonne", symbol: "t", factor: 1_000_000 },
      { id: "oz", name: "Ounce", symbol: "oz", factor: 28.349523125 },
      { id: "lb", name: "Pound", symbol: "lb", factor: 453.59237 },
      { id: "st", name: "Stone", symbol: "st", factor: 6350.29318 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    units: [
      { id: "c", name: "Celsius", symbol: "°C", factor: 1 },
      { id: "f", name: "Fahrenheit", symbol: "°F", factor: 1 },
      { id: "k", name: "Kelvin", symbol: "K", factor: 1 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    units: [
      { id: "ml", name: "Milliliter", symbol: "ml", factor: 0.001 },
      { id: "l", name: "Liter", symbol: "l", factor: 1 },
      { id: "m3", name: "Cubic meter", symbol: "m³", factor: 1000 },
      { id: "tsp", name: "Teaspoon (US)", symbol: "tsp", factor: 0.00492892159375 },
      { id: "tbsp", name: "Tablespoon (US)", symbol: "tbsp", factor: 0.01478676478125 },
      { id: "floz", name: "Fluid ounce (US)", symbol: "fl oz", factor: 0.0295735295625 },
      { id: "cup", name: "Cup (US)", symbol: "cup", factor: 0.2365882365 },
      { id: "pt", name: "Pint (US)", symbol: "pt", factor: 0.473176473 },
      { id: "qt", name: "Quart (US)", symbol: "qt", factor: 0.946352946 },
      { id: "gal", name: "Gallon (US)", symbol: "gal", factor: 3.785411784 },
    ],
  },
  {
    id: "area",
    label: "Area",
    units: [
      { id: "mm2", name: "Square millimeter", symbol: "mm²", factor: 0.000001 },
      { id: "cm2", name: "Square centimeter", symbol: "cm²", factor: 0.0001 },
      { id: "m2", name: "Square meter", symbol: "m²", factor: 1 },
      { id: "ha", name: "Hectare", symbol: "ha", factor: 10_000 },
      { id: "km2", name: "Square kilometer", symbol: "km²", factor: 1_000_000 },
      { id: "in2", name: "Square inch", symbol: "in²", factor: 0.00064516 },
      { id: "ft2", name: "Square foot", symbol: "ft²", factor: 0.09290304 },
      { id: "ac", name: "Acre", symbol: "ac", factor: 4046.8564224 },
      { id: "mi2", name: "Square mile", symbol: "mi²", factor: 2_589_988.110336 },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    units: [
      { id: "mps", name: "Meters per second", symbol: "m/s", factor: 1 },
      { id: "kmh", name: "Kilometers per hour", symbol: "km/h", factor: 0.2777777777777778 },
      { id: "mph", name: "Miles per hour", symbol: "mph", factor: 0.44704 },
      { id: "fps", name: "Feet per second", symbol: "ft/s", factor: 0.3048 },
      { id: "knot", name: "Knot", symbol: "kn", factor: 0.5144444444444445 },
    ],
  },
  {
    id: "digital",
    label: "Digital storage",
    units: [
      { id: "bit", name: "Bit", symbol: "bit", factor: 0.125 },
      { id: "B", name: "Byte", symbol: "B", factor: 1 },
      { id: "KB", name: "Kilobyte", symbol: "KB", factor: 1000 },
      { id: "MB", name: "Megabyte", symbol: "MB", factor: 1_000_000 },
      { id: "GB", name: "Gigabyte", symbol: "GB", factor: 1_000_000_000 },
      { id: "TB", name: "Terabyte", symbol: "TB", factor: 1_000_000_000_000 },
      { id: "KiB", name: "Kibibyte", symbol: "KiB", factor: 1024 },
      { id: "MiB", name: "Mebibyte", symbol: "MiB", factor: 1_048_576 },
      { id: "GiB", name: "Gibibyte", symbol: "GiB", factor: 1_073_741_824 },
      { id: "TiB", name: "Tebibyte", symbol: "TiB", factor: 1_099_511_627_776 },
    ],
  },
  {
    id: "time",
    label: "Time",
    units: [
      { id: "ms", name: "Millisecond", symbol: "ms", factor: 0.001 },
      { id: "s", name: "Second", symbol: "s", factor: 1 },
      { id: "min", name: "Minute", symbol: "min", factor: 60 },
      { id: "h", name: "Hour", symbol: "h", factor: 3600 },
      { id: "day", name: "Day", symbol: "d", factor: 86_400 },
      { id: "week", name: "Week", symbol: "wk", factor: 604_800 },
    ],
  },
];

export function getCategory(categoryId: string): UnitCategory | undefined {
  return CATEGORIES.find((category) => category.id === categoryId);
}

export function getUnit(category: UnitCategory, unitId: string): LinearUnit | undefined {
  return category.units.find((unit) => unit.id === unitId);
}

/** Celsius/Fahrenheit/Kelvin conversion via a Celsius pivot. */
export function convertTemperature(value: number, fromId: string, toId: string): number {
  let celsius: number;
  switch (fromId) {
    case "f":
      celsius = ((value - 32) * 5) / 9;
      break;
    case "k":
      celsius = value - 273.15;
      break;
    default:
      celsius = value;
  }
  switch (toId) {
    case "f":
      return (celsius * 9) / 5 + 32;
    case "k":
      return celsius + 273.15;
    default:
      return celsius;
  }
}

/**
 * Convert `value` from one unit to another within a category. Returns NaN if
 * the category or either unit is unknown.
 */
export function convertValue(categoryId: string, value: number, fromId: string, toId: string): number {
  if (categoryId === "temperature") return convertTemperature(value, fromId, toId);

  const category = getCategory(categoryId);
  if (!category) return NaN;
  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);
  if (!from || !to) return NaN;

  return (value * from.factor) / to.factor;
}

/** Format a numeric result compactly: trims noise, uses grouping, falls back to exponent at extremes. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";

  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-6) return value.toExponential(4);

  const rounded = Number.parseFloat(value.toPrecision(9));
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 8 });
}
