// Small, dependency-free number formatting helpers shared by the engine and UI.

export function roundTo(value: number, digits = 3): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  // Avoid -0 and floating noise.
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Trims trailing zeros so "5.00" reads as "5" but "5.25" stays precise.
export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = roundTo(value, digits);
  return Number(rounded.toFixed(digits)).toString();
}

export function formatSigned(value: number, digits = 2): string {
  const formatted = formatNumber(Math.abs(value), digits);
  if (formatted === "0") return "0";
  return value < 0 ? `−${formatted}` : `+${formatted}`;
}
