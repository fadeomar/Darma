// ─── Percentage calculation logic ──────────────────────────────────────────
// Pure helpers for the four most common everyday percentage questions.

export type PercentMode = "of" | "isWhatPercent" | "change" | "applyChange";

/** "What is `percent`% of `value`?" */
export function percentOf(percent: number, value: number): number {
  return (value * percent) / 100;
}

/** "`part` is what percent of `whole`?" Returns NaN when `whole` is 0. */
export function whatPercent(part: number, whole: number): number {
  if (whole === 0) return NaN;
  return (part / whole) * 100;
}

/** Percentage change from `from` to `to`. Returns NaN when `from` is 0. */
export function percentChange(from: number, to: number): number {
  if (from === 0) return NaN;
  return ((to - from) / from) * 100;
}

/** Apply a `percent` increase (or decrease, if negative) to `value`. */
export function applyPercentChange(value: number, percent: number): number {
  return value * (1 + percent / 100);
}

export type PercentInputs = { a: number; b: number };

export type PercentOutcome = {
  /** The primary numeric answer, or NaN when inputs are incomplete/invalid. */
  value: number;
  /** A plain-language description of the answer, or "" when invalid. */
  sentence: string;
};

export const MODE_META: Record<PercentMode, { label: string; aLabel: string; bLabel: string }> = {
  of: { label: "Percent of a number", aLabel: "Percent (%)", bLabel: "Of value" },
  isWhatPercent: { label: "X is what percent of Y", aLabel: "Value (X)", bLabel: "Of total (Y)" },
  change: { label: "Percent change", aLabel: "From", bLabel: "To" },
  applyChange: { label: "Increase / decrease by %", aLabel: "Value", bLabel: "Change (%)" },
};

function round(value: number): number {
  return Math.round(value * 100000) / 100000;
}

function fmt(value: number): string {
  return round(value).toLocaleString("en-US", { maximumFractionDigits: 5 });
}

/** Compute the answer and a readable sentence for a mode and its two inputs. */
export function computePercent(mode: PercentMode, { a, b }: PercentInputs): PercentOutcome {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { value: NaN, sentence: "" };

  switch (mode) {
    case "of": {
      const value = percentOf(a, b);
      return { value: round(value), sentence: `${fmt(a)}% of ${fmt(b)} is ${fmt(value)}` };
    }
    case "isWhatPercent": {
      const value = whatPercent(a, b);
      if (!Number.isFinite(value)) return { value: NaN, sentence: "" };
      return { value: round(value), sentence: `${fmt(a)} is ${fmt(value)}% of ${fmt(b)}` };
    }
    case "change": {
      const value = percentChange(a, b);
      if (!Number.isFinite(value)) return { value: NaN, sentence: "" };
      const direction = value > 0 ? "increase" : value < 0 ? "decrease" : "change";
      return { value: round(value), sentence: `From ${fmt(a)} to ${fmt(b)} is a ${fmt(Math.abs(value))}% ${direction}` };
    }
    case "applyChange": {
      const value = applyPercentChange(a, b);
      return { value: round(value), sentence: `${fmt(a)} ${b >= 0 ? "increased" : "decreased"} by ${fmt(Math.abs(b))}% is ${fmt(value)}` };
    }
    default:
      return { value: NaN, sentence: "" };
  }
}
