import type {
  PercentCheck,
  PercentInputs,
  PercentMode,
  PercentModeMeta,
  PercentOutcome,
  PercentReport,
  PercentScenario,
  PercentUnit,
} from "./types";

export type { PercentInputs, PercentMode, PercentOutcome } from "./types";

export const MODE_ORDER: PercentMode[] = [
  "of",
  "isWhatPercent",
  "change",
  "applyChange",
  "reverseChange",
  "percentDifference",
  "discount",
  "markupMargin",
];

export const MODE_META: Record<PercentMode, PercentModeMeta> = {
  of: {
    label: "Percent of a number",
    shortLabel: "% of value",
    description: "Calculate a percentage amount from a base value.",
    aLabel: "Percent",
    bLabel: "Base value",
    aHint: "%",
    bHint: "number",
    answerLabel: "Percentage amount",
    answerUnit: "number",
    formula: "base × percent ÷ 100",
  },
  isWhatPercent: {
    label: "X is what percent of Y",
    shortLabel: "Ratio percent",
    description: "Convert a part-to-whole ratio into a percentage.",
    aLabel: "Part (X)",
    bLabel: "Whole (Y)",
    aHint: "number",
    bHint: "non-zero",
    answerLabel: "Share of whole",
    answerUnit: "percent",
    formula: "part ÷ whole × 100",
  },
  change: {
    label: "Percentage change",
    shortLabel: "% change",
    description: "Measure growth or decline relative to a starting value.",
    aLabel: "Starting value",
    bLabel: "New value",
    aHint: "non-zero",
    bHint: "number",
    answerLabel: "Percentage change",
    answerUnit: "percent",
    formula: "(new − start) ÷ start × 100",
  },
  applyChange: {
    label: "Increase or decrease by %",
    shortLabel: "Apply change",
    description: "Apply a signed percentage adjustment to a value.",
    aLabel: "Starting value",
    bLabel: "Change",
    aHint: "number",
    bHint: "% (+/−)",
    answerLabel: "Adjusted value",
    answerUnit: "number",
    formula: "value × (1 + change ÷ 100)",
  },
  reverseChange: {
    label: "Reverse a percentage change",
    shortLabel: "Find original",
    description: "Recover the original value before an increase or decrease.",
    aLabel: "Final value",
    bLabel: "Applied change",
    aHint: "number",
    bHint: "% (+/−)",
    answerLabel: "Original value",
    answerUnit: "number",
    formula: "final ÷ (1 + change ÷ 100)",
  },
  percentDifference: {
    label: "Percentage difference",
    shortLabel: "% difference",
    description: "Compare two peer values using their average as the reference.",
    aLabel: "First value",
    bLabel: "Second value",
    aHint: "measurement",
    bHint: "measurement",
    answerLabel: "Percentage difference",
    answerUnit: "percent",
    formula: "|A − B| ÷ ((|A| + |B|) ÷ 2) × 100",
  },
  discount: {
    label: "Discount calculator",
    shortLabel: "Discount",
    description: "Calculate savings and the final price after a discount.",
    aLabel: "Original price",
    bLabel: "Discount",
    aHint: "amount",
    bHint: "%",
    answerLabel: "Final price",
    answerUnit: "number",
    formula: "price × (1 − discount ÷ 100)",
  },
  markupMargin: {
    label: "Markup and margin",
    shortLabel: "Markup/margin",
    description: "Compare cost and selling price using both business percentages.",
    aLabel: "Cost",
    bLabel: "Selling price",
    aHint: "> 0",
    bHint: "> 0",
    answerLabel: "Markup",
    answerUnit: "percent",
    formula: "(price − cost) ÷ cost × 100",
  },
};

const INTERNAL_PRECISION = 12;

function clean(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Number(value.toPrecision(INTERNAL_PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatPercentNumber(value: number, precision = 4): string {
  if (!Number.isFinite(value)) return "—";
  return clean(value).toLocaleString("en-US", {
    maximumFractionDigits: Math.max(0, Math.min(8, precision)),
    useGrouping: true,
  });
}

function metric(label: string, value: number, unit: PercentUnit, hint?: string) {
  return { label, value: clean(value), unit, hint };
}

function invalid(mode: PercentMode, error: string): PercentOutcome {
  const meta = MODE_META[mode];
  return {
    mode,
    valid: false,
    error,
    value: Number.NaN,
    unit: meta.answerUnit,
    sentence: "",
    direction: "none",
    formula: meta.formula,
    substitutedFormula: "",
    steps: [],
    metrics: [],
    absoluteDelta: null,
    factor: null,
  };
}

function directionFromDelta(delta: number) {
  return delta > 0 ? "increase" as const : delta < 0 ? "decrease" as const : "unchanged" as const;
}

/** "What is `percent`% of `value`?" */
export function percentOf(percent: number, value: number): number {
  return (value * percent) / 100;
}

/** "`part` is what percent of `whole`?" Returns NaN when `whole` is 0. */
export function whatPercent(part: number, whole: number): number {
  if (whole === 0) return Number.NaN;
  return (part / whole) * 100;
}

/** Percentage change from `from` to `to`. Returns NaN when `from` is 0. */
export function percentChange(from: number, to: number): number {
  if (from === 0) return Number.NaN;
  return ((to - from) / from) * 100;
}

/** Apply a signed percentage change to a value. */
export function applyPercentChange(value: number, percent: number): number {
  return value * (1 + percent / 100);
}

export function reversePercentChange(finalValue: number, percent: number): number {
  const factor = 1 + percent / 100;
  if (factor === 0) return Number.NaN;
  return finalValue / factor;
}

export function percentageDifference(first: number, second: number): number {
  const denominator = (Math.abs(first) + Math.abs(second)) / 2;
  if (denominator === 0) return 0;
  return (Math.abs(first - second) / denominator) * 100;
}

export function markupPercent(cost: number, sellingPrice: number): number {
  if (cost === 0) return Number.NaN;
  return ((sellingPrice - cost) / cost) * 100;
}

export function marginPercent(cost: number, sellingPrice: number): number {
  if (sellingPrice === 0) return Number.NaN;
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

export function computePercent(mode: PercentMode, { a, b }: PercentInputs): PercentOutcome {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return invalid(mode, "Enter two valid finite numbers.");
  }

  const fa = formatPercentNumber(a);
  const fb = formatPercentNumber(b);

  switch (mode) {
    case "of": {
      const value = clean(percentOf(a, b));
      const factor = a / 100;
      return {
        mode,
        valid: true,
        error: null,
        value,
        unit: "number",
        sentence: `${fa}% of ${fb} is ${formatPercentNumber(value)}.`,
        direction: "none",
        formula: MODE_META[mode].formula,
        substitutedFormula: `${fb} × ${fa} ÷ 100 = ${formatPercentNumber(value)}`,
        steps: [
          `Convert ${fa}% to the factor ${formatPercentNumber(factor, 6)}.`,
          `Multiply ${fb} by ${formatPercentNumber(factor, 6)}.`,
        ],
        metrics: [
          metric("Percentage amount", value, "number"),
          metric("Decimal factor", factor, "number"),
          metric("Remaining after subtracting", b - value, "number"),
        ],
        absoluteDelta: value,
        factor: clean(factor),
      };
    }
    case "isWhatPercent": {
      if (b === 0) return invalid(mode, "The whole value cannot be zero.");
      const value = clean(whatPercent(a, b));
      const factor = a / b;
      return {
        mode,
        valid: true,
        error: null,
        value,
        unit: "percent",
        sentence: `${fa} is ${formatPercentNumber(value)}% of ${fb}.`,
        direction: "none",
        formula: MODE_META[mode].formula,
        substitutedFormula: `${fa} ÷ ${fb} × 100 = ${formatPercentNumber(value)}%`,
        steps: [
          `Divide the part ${fa} by the whole ${fb}.`,
          `Multiply ${formatPercentNumber(factor, 6)} by 100.`,
        ],
        metrics: [
          metric("Share of whole", value, "percent"),
          metric("Decimal ratio", factor, "number"),
          metric("Gap to whole", b - a, "number"),
        ],
        absoluteDelta: clean(b - a),
        factor: clean(factor),
      };
    }
    case "change": {
      if (a === 0) return invalid(mode, "Percentage change is undefined when the starting value is zero.");
      const delta = b - a;
      const value = clean(percentChange(a, b));
      const factor = b / a;
      const direction = directionFromDelta(delta);
      const directionLabel = direction === "increase" ? "increase" : direction === "decrease" ? "decrease" : "change";
      return {
        mode,
        valid: true,
        error: null,
        value,
        unit: "percent",
        sentence: `From ${fa} to ${fb} is a ${formatPercentNumber(Math.abs(value))}% ${directionLabel}.`,
        direction,
        formula: MODE_META[mode].formula,
        substitutedFormula: `(${fb} − ${fa}) ÷ ${fa} × 100 = ${formatPercentNumber(value)}%`,
        steps: [
          `Find the absolute change: ${fb} − ${fa} = ${formatPercentNumber(delta)}.`,
          `Divide by the starting value ${fa}, then multiply by 100.`,
        ],
        metrics: [
          metric("Percentage change", value, "percent"),
          metric("Absolute change", delta, "number"),
          metric("New ÷ starting", factor, "number"),
        ],
        absoluteDelta: clean(delta),
        factor: clean(factor),
      };
    }
    case "applyChange": {
      const factor = 1 + b / 100;
      const value = clean(applyPercentChange(a, b));
      const delta = value - a;
      const direction = directionFromDelta(delta);
      return {
        mode,
        valid: true,
        error: null,
        value,
        unit: "number",
        sentence: `${fa} ${b >= 0 ? "increased" : "decreased"} by ${formatPercentNumber(Math.abs(b))}% is ${formatPercentNumber(value)}.`,
        direction,
        formula: MODE_META[mode].formula,
        substitutedFormula: `${fa} × (1 + ${fb} ÷ 100) = ${formatPercentNumber(value)}`,
        steps: [
          `Convert the signed change to a multiplier: 1 + ${fb} ÷ 100 = ${formatPercentNumber(factor, 6)}.`,
          `Multiply ${fa} by ${formatPercentNumber(factor, 6)}.`,
        ],
        metrics: [
          metric("Adjusted value", value, "number"),
          metric("Change amount", delta, "number"),
          metric("Multiplier", factor, "number"),
        ],
        absoluteDelta: clean(delta),
        factor: clean(factor),
      };
    }
    case "reverseChange": {
      const factor = 1 + b / 100;
      if (factor === 0) return invalid(mode, "A −100% change collapses every original value to zero, so it cannot be reversed.");
      const value = clean(reversePercentChange(a, b));
      const delta = a - value;
      return {
        mode,
        valid: true,
        error: null,
        value,
        unit: "number",
        sentence: `Before a ${formatPercentNumber(Math.abs(b))}% ${b >= 0 ? "increase" : "decrease"}, ${fa} was ${formatPercentNumber(value)}.`,
        direction: directionFromDelta(delta),
        formula: MODE_META[mode].formula,
        substitutedFormula: `${fa} ÷ (1 + ${fb} ÷ 100) = ${formatPercentNumber(value)}`,
        steps: [
          `Rebuild the applied multiplier: 1 + ${fb} ÷ 100 = ${formatPercentNumber(factor, 6)}.`,
          `Divide the final value ${fa} by that multiplier.`,
        ],
        metrics: [
          metric("Original value", value, "number"),
          metric("Applied amount", delta, "number"),
          metric("Multiplier", factor, "number"),
        ],
        absoluteDelta: clean(delta),
        factor: clean(factor),
      };
    }
    case "percentDifference": {
      const average = (Math.abs(a) + Math.abs(b)) / 2;
      const delta = Math.abs(a - b);
      const value = clean(percentageDifference(a, b));
      return {
        mode,
        valid: true,
        error: null,
        value,
        unit: "percent",
        sentence: `The percentage difference between ${fa} and ${fb} is ${formatPercentNumber(value)}%.`,
        direction: "none",
        formula: MODE_META[mode].formula,
        substitutedFormula: `|${fa} − ${fb}| ÷ ${formatPercentNumber(average)} × 100 = ${formatPercentNumber(value)}%`,
        steps: [
          `Find the absolute difference: |${fa} − ${fb}| = ${formatPercentNumber(delta)}.`,
          `Divide by the average magnitude ${formatPercentNumber(average)}, then multiply by 100.`,
        ],
        metrics: [
          metric("Percentage difference", value, "percent"),
          metric("Absolute difference", delta, "number"),
          metric("Average magnitude", average, "number"),
        ],
        absoluteDelta: clean(delta),
        factor: average === 0 ? 0 : clean(delta / average),
      };
    }
    case "discount": {
      const factor = 1 - b / 100;
      const value = clean(a * factor);
      const savings = a - value;
      return {
        mode,
        valid: true,
        error: null,
        value,
        unit: "number",
        sentence: `After a ${formatPercentNumber(b)}% discount, ${fa} becomes ${formatPercentNumber(value)} and saves ${formatPercentNumber(savings)}.`,
        direction: directionFromDelta(value - a),
        formula: MODE_META[mode].formula,
        substitutedFormula: `${fa} × (1 − ${fb} ÷ 100) = ${formatPercentNumber(value)}`,
        steps: [
          `Calculate savings: ${fa} × ${fb} ÷ 100 = ${formatPercentNumber(savings)}.`,
          `Subtract savings from the original price.`,
        ],
        metrics: [
          metric("Final price", value, "number"),
          metric("Savings", savings, "number"),
          metric("Price multiplier", factor, "number"),
        ],
        absoluteDelta: clean(-savings),
        factor: clean(factor),
      };
    }
    case "markupMargin": {
      if (a <= 0 || b <= 0) return invalid(mode, "Cost and selling price must both be greater than zero.");
      const profit = b - a;
      const markup = clean(markupPercent(a, b));
      const margin = clean(marginPercent(a, b));
      const factor = b / a;
      return {
        mode,
        valid: true,
        error: null,
        value: markup,
        unit: "percent",
        sentence: `A cost of ${fa} sold for ${fb} has ${formatPercentNumber(markup)}% markup and ${formatPercentNumber(margin)}% margin.`,
        direction: directionFromDelta(profit),
        formula: MODE_META[mode].formula,
        substitutedFormula: `(${fb} − ${fa}) ÷ ${fa} × 100 = ${formatPercentNumber(markup)}% markup`,
        steps: [
          `Find profit: ${fb} − ${fa} = ${formatPercentNumber(profit)}.`,
          `Divide profit by cost for markup and by selling price for margin.`,
        ],
        metrics: [
          metric("Markup", markup, "percent", "profit ÷ cost"),
          metric("Gross margin", margin, "percent", "profit ÷ selling price"),
          metric("Profit amount", profit, "number"),
          metric("Price ÷ cost", factor, "number"),
        ],
        absoluteDelta: clean(profit),
        factor: clean(factor),
      };
    }
    default:
      return invalid(mode, "Unsupported percentage mode.");
  }
}

export function buildPercentScenarios(mode: PercentMode, inputs: PercentInputs): PercentScenario[] {
  const modifiers = [-20, -10, 0, 10, 20];
  return modifiers.map((modifierPercent) => {
    const inputB = clean(inputs.b * (1 + modifierPercent / 100));
    return {
      label: modifierPercent === 0 ? "Current" : `${modifierPercent > 0 ? "+" : ""}${modifierPercent}% B`,
      modifierPercent,
      inputA: inputs.a,
      inputB,
      outcome: computePercent(mode, { a: inputs.a, b: inputB }),
    };
  });
}

export function buildPercentChecks(mode: PercentMode, inputs: PercentInputs, outcome: PercentOutcome): PercentCheck[] {
  const checks: PercentCheck[] = [];
  const { a, b } = inputs;

  if (!outcome.valid) {
    checks.push({ id: "invalid", level: "danger", title: "Calculation blocked", message: outcome.error ?? "Review the two inputs." });
    return checks;
  }

  checks.push({ id: "valid", level: "success", title: "Calculation is valid", message: "Both inputs are finite and the selected formula has a defined denominator." });

  if (Math.abs(a) > Number.MAX_SAFE_INTEGER || Math.abs(b) > Number.MAX_SAFE_INTEGER) {
    checks.push({ id: "unsafe-number", level: "danger", title: "Integer precision risk", message: "At least one input exceeds JavaScript's safe integer range. Verify the result with decimal or big-number tooling." });
  } else if (Math.max(Math.abs(a), Math.abs(b)) >= 1e12) {
    checks.push({ id: "large-number", level: "warning", title: "Large magnitude", message: "Large values can make small floating-point rounding differences more visible." });
  }

  if (mode === "discount") {
    if (b < 0) checks.push({ id: "negative-discount", level: "warning", title: "Negative discount", message: "A negative discount increases the final price. Use Apply change if that is intentional." });
    if (b > 100) checks.push({ id: "over-discount", level: "danger", title: "Discount above 100%", message: "The calculated final price is negative and is usually not meaningful for commerce." });
  }

  if (mode === "applyChange" && b < -100) {
    checks.push({ id: "negative-result", level: "warning", title: "Change below −100%", message: "The multiplier is negative, so a positive starting value becomes negative." });
  }

  if (mode === "reverseChange" && Math.abs(1 + b / 100) < 0.01) {
    checks.push({ id: "unstable-reverse", level: "warning", title: "Near-zero reverse multiplier", message: "A change close to −100% amplifies small input or rounding errors when reversing the value." });
  }

  if ((mode === "change" || mode === "isWhatPercent") && Math.abs(a) > 0 && Math.abs(b / a) > 1000) {
    checks.push({ id: "scale-gap", level: "info", title: "Large scale difference", message: "The two values differ by more than three orders of magnitude; confirm their units match." });
  }

  if (mode === "percentDifference" && (a < 0 || b < 0)) {
    checks.push({ id: "signed-difference", level: "info", title: "Magnitude-based denominator", message: "Percentage difference uses the average absolute magnitude so opposite signs do not cancel the denominator." });
  }

  if (mode === "markupMargin") {
    if (b < a) checks.push({ id: "negative-profit", level: "warning", title: "Selling below cost", message: "Markup, margin, and profit are negative in this scenario." });
    if (outcome.metrics.find((item) => item.label === "Gross margin")?.value === 100) checks.push({ id: "margin-boundary", level: "warning", title: "Margin boundary", message: "A 100% gross margin generally implies zero cost, which this mode does not allow." });
  }

  if (outcome.value === 0) {
    checks.push({ id: "zero-result", level: "info", title: "Zero result", message: "The selected inputs produce exactly zero at the calculator's internal precision." });
  }

  if (checks.length === 1) {
    checks.push({ id: "local", level: "info", title: "Browser-local", message: "The calculation and exported report are generated locally in your browser." });
  }

  return checks;
}

export function buildPercentReport(
  mode: PercentMode,
  inputs: PercentInputs,
  outcome: PercentOutcome,
  scenarios: PercentScenario[],
  checks: PercentCheck[],
): PercentReport {
  return {
    generatedAt: new Date().toISOString(),
    mode,
    modeLabel: MODE_META[mode].label,
    inputs,
    result: outcome,
    scenarios,
    checks,
  };
}

function formatMetricValue(value: number, unit: PercentUnit) {
  return `${formatPercentNumber(value, 6)}${unit === "percent" ? "%" : ""}`;
}

export function buildPercentSummaryMarkdown(
  mode: PercentMode,
  inputs: PercentInputs,
  outcome: PercentOutcome,
  checks: PercentCheck[],
): string {
  const meta = MODE_META[mode];
  const lines = [
    "# Percentage calculation",
    "",
    `- Mode: ${meta.label}`,
    `- ${meta.aLabel}: ${formatPercentNumber(inputs.a, 8)}`,
    `- ${meta.bLabel}: ${formatPercentNumber(inputs.b, 8)}`,
    `- Result: ${outcome.valid ? formatMetricValue(outcome.value, outcome.unit) : outcome.error ?? "Invalid"}`,
    "",
    "## Formula",
    "",
    `- ${outcome.formula}`,
  ];

  if (outcome.substitutedFormula) lines.push(`- ${outcome.substitutedFormula}`);
  if (outcome.sentence) lines.push("", outcome.sentence);

  if (outcome.metrics.length) {
    lines.push("", "## Breakdown", "");
    outcome.metrics.forEach((item) => lines.push(`- ${item.label}: ${formatMetricValue(item.value, item.unit)}${item.hint ? ` (${item.hint})` : ""}`));
  }

  lines.push("", "## Production checks", "");
  checks.forEach((check) => lines.push(`- [${check.level.toUpperCase()}] ${check.title}: ${check.message}`));
  lines.push("", "Generated locally with Darma Percentage Analysis Studio.", "");
  return lines.join("\n");
}

export function buildScenarioCsv(scenarios: PercentScenario[]): string {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [["scenario", "modifier_percent", "input_a", "input_b", "valid", "result", "unit", "sentence"]];
  scenarios.forEach((scenario) => {
    rows.push([
      scenario.label,
      String(scenario.modifierPercent),
      String(scenario.inputA),
      String(scenario.inputB),
      String(scenario.outcome.valid),
      scenario.outcome.valid ? String(scenario.outcome.value) : "",
      scenario.outcome.unit,
      scenario.outcome.sentence || scenario.outcome.error || "",
    ]);
  });
  return `${rows.map((row) => row.map(escape).join(",")).join("\n")}\n`;
}

export function buildJavaScriptSnippet(mode: PercentMode): string {
  const functions: Record<PercentMode, string> = {
    of: "const result = (base * percent) / 100;",
    isWhatPercent: "if (whole === 0) throw new Error(\"whole cannot be zero\");\nconst resultPercent = (part / whole) * 100;",
    change: "if (start === 0) throw new Error(\"start cannot be zero\");\nconst changePercent = ((next - start) / start) * 100;",
    applyChange: "const adjusted = value * (1 + changePercent / 100);",
    reverseChange: "const factor = 1 + changePercent / 100;\nif (factor === 0) throw new Error(\"-100% cannot be reversed\");\nconst original = finalValue / factor;",
    percentDifference: "const averageMagnitude = (Math.abs(a) + Math.abs(b)) / 2;\nconst differencePercent = averageMagnitude === 0 ? 0 : Math.abs(a - b) / averageMagnitude * 100;",
    discount: "const savings = price * discountPercent / 100;\nconst finalPrice = price - savings;",
    markupMargin: "if (cost <= 0 || sellingPrice <= 0) throw new Error(\"positive values required\");\nconst profit = sellingPrice - cost;\nconst markupPercent = profit / cost * 100;\nconst marginPercent = profit / sellingPrice * 100;",
  };
  return `// ${MODE_META[mode].label}\n${functions[mode]}\n`;
}
