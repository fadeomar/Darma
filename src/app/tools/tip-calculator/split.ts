import type {
  TipCheck,
  TipCurrency,
  TipGuestInput,
  TipReport,
  TipResult,
  TipScenario,
  TipScenarioInput,
} from "./types";

export const TIP_SCENARIO_RATES = [0, 10, 15, 18, 20, 25];
export const MAX_TIP_PEOPLE = 100;
export const MAX_BILL_AMOUNT = 1_000_000_000;

const MINOR_DIGITS: Record<TipCurrency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  ILS: 2,
  JPY: 0,
};

export function getCurrencyMinorDigits(currency: TipCurrency) {
  return MINOR_DIGITS[currency];
}

export function getCurrencyFactor(currency: TipCurrency) {
  return 10 ** getCurrencyMinorDigits(currency);
}

export function formatMoney(value: number, currency: TipCurrency) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: getCurrencyMinorDigits(currency),
    maximumFractionDigits: getCurrencyMinorDigits(currency),
  }).format(value);
}

function toMinor(value: number, factor: number) {
  return Math.round((value + Number.EPSILON) * factor);
}

function fromMinor(value: number, factor: number) {
  return value / factor;
}

function normalizePeople(value: number) {
  return Math.floor(value);
}

function normalizedGuests(input: TipScenarioInput): TipGuestInput[] {
  if (input.splitMode === "equal") {
    return Array.from({ length: normalizePeople(input.people) }, (_, index) => ({
      id: `guest-${index + 1}`,
      name: `Guest ${index + 1}`,
      weight: 1,
    }));
  }
  return input.guests.map((guest, index) => ({
    id: guest.id || `guest-${index + 1}`,
    name: guest.name.trim() || `Guest ${index + 1}`,
    weight: guest.weight,
  }));
}

export function validateTipInput(input: TipScenarioInput) {
  const numeric = [input.subtotal, input.taxPercent, input.servicePercent, input.tipPercent, input.people];
  if (!numeric.every(Number.isFinite)) return "Bill, percentages, and people must be finite numbers.";
  if (input.subtotal < 0 || input.subtotal > MAX_BILL_AMOUNT) return `Subtotal must be between 0 and ${MAX_BILL_AMOUNT.toLocaleString()}.`;
  if (input.taxPercent < 0 || input.taxPercent > 100) return "Tax must be between 0% and 100%.";
  if (input.servicePercent < 0 || input.servicePercent > 100) return "Service charge must be between 0% and 100%.";
  if (input.tipPercent < 0 || input.tipPercent > 200) return "Tip must be between 0% and 200%.";
  if (input.splitMode === "equal") {
    const people = normalizePeople(input.people);
    if (people < 1 || people > MAX_TIP_PEOPLE) return `People must be between 1 and ${MAX_TIP_PEOPLE}.`;
  } else {
    if (input.guests.length < 1 || input.guests.length > MAX_TIP_PEOPLE) return `Weighted splits must contain between 1 and ${MAX_TIP_PEOPLE} guests.`;
    if (input.guests.some((guest) => !Number.isFinite(guest.weight) || guest.weight <= 0)) return "Every weighted guest must have a weight greater than zero.";
  }
  return null;
}

function roundStepMinor(input: TipScenarioInput, factor: number) {
  switch (input.roundMode) {
    case "up-005":
      return Math.max(1, Math.round(factor * 0.05));
    case "up-050":
      return Math.max(1, Math.round(factor * 0.5));
    case "up-whole":
      return factor;
    default:
      return 1;
  }
}

function allocateFairly(totalMinor: number, weights: number[]) {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => (totalMinor * weight) / totalWeight);
  const allocated = raw.map(Math.floor);
  let remainder = totalMinor - allocated.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let position = 0; remainder > 0; position += 1) {
    allocated[order[position % order.length].index] += 1;
    remainder -= 1;
  }
  return { raw, allocated };
}

export function computeSplit(input: TipScenarioInput): TipResult | null {
  if (validateTipInput(input)) return null;
  const factor = getCurrencyFactor(input.currency);
  const subtotalMinor = toMinor(input.subtotal, factor);
  const taxMinor = Math.round((subtotalMinor * input.taxPercent) / 100);
  const serviceMinor = Math.round((subtotalMinor * input.servicePercent) / 100);
  const preTipMinor = subtotalMinor + taxMinor + serviceMinor;
  const tipBasisMinor = input.tipBasis === "subtotal"
    ? subtotalMinor
    : input.tipBasis === "subtotal-tax"
      ? subtotalMinor + taxMinor
      : preTipMinor;
  const tipMinor = Math.round((tipBasisMinor * input.tipPercent) / 100);
  const totalMinor = preTipMinor + tipMinor;
  const guests = normalizedGuests(input);
  const weights = guests.map((guest) => guest.weight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const { raw, allocated } = allocateFairly(totalMinor, weights);
  const stepMinor = roundStepMinor(input, factor);
  const finalMinor = input.roundMode === "fair"
    ? allocated
    : raw.map((share) => Math.ceil(share / stepMinor) * stepMinor);
  const totalCollectedMinor = finalMinor.reduce((sum, value) => sum + value, 0);
  const guestShares = guests.map((guest, index) => ({
    id: guest.id,
    name: guest.name,
    weight: guest.weight,
    sharePercent: (guest.weight / totalWeight) * 100,
    exactShare: fromMinor(raw[index], factor),
    finalShare: fromMinor(finalMinor[index], factor),
    roundingDelta: fromMinor(finalMinor[index] - raw[index], factor),
  }));
  const finalValues = guestShares.map((guest) => guest.finalShare);

  return {
    currency: input.currency,
    minorUnit: getCurrencyMinorDigits(input.currency),
    subtotal: fromMinor(subtotalMinor, factor),
    taxAmount: fromMinor(taxMinor, factor),
    serviceAmount: fromMinor(serviceMinor, factor),
    tipBasisAmount: fromMinor(tipBasisMinor, factor),
    tipAmount: fromMinor(tipMinor, factor),
    preTipTotal: fromMinor(preTipMinor, factor),
    totalBeforeRounding: fromMinor(totalMinor, factor),
    totalCollected: fromMinor(totalCollectedMinor, factor),
    roundingDelta: fromMinor(totalCollectedMinor - totalMinor, factor),
    people: guests.length,
    averagePerPerson: guests.length ? fromMinor(totalCollectedMinor / guests.length, factor) : 0,
    minimumShare: finalValues.length ? Math.min(...finalValues) : 0,
    maximumShare: finalValues.length ? Math.max(...finalValues) : 0,
    guestShares,
  };
}

export function buildTipScenarios(input: TipScenarioInput): TipScenario[] {
  return TIP_SCENARIO_RATES.map((tipPercent) => {
    const result = computeSplit({ ...input, tipPercent });
    return {
      tipPercent,
      tipAmount: result?.tipAmount ?? Number.NaN,
      total: result?.totalBeforeRounding ?? Number.NaN,
      averagePerPerson: result?.averagePerPerson ?? Number.NaN,
    };
  });
}

export function buildTipChecks(input: TipScenarioInput, result: TipResult | null): TipCheck[] {
  const error = validateTipInput(input);
  if (error) return [{ id: "input", level: "danger", title: "Invalid bill setup", message: error }];
  const checks: TipCheck[] = [
    { id: "estimate", level: "info", title: "Estimate only", message: "Confirm the receipt, local tax rules, automatic gratuity, and card-terminal rounding before paying." },
  ];
  if (input.subtotal === 0) checks.push({ id: "zero", level: "warning", title: "Zero subtotal", message: "The entered subtotal is zero, so percentage-based tax, service, and tip amounts are also zero." });
  if (input.tipPercent === 0 && input.servicePercent === 0) checks.push({ id: "no-tip", level: "info", title: "No gratuity included", message: "Both the service charge and additional tip are 0%." });
  if (input.tipPercent >= 50) checks.push({ id: "high-tip", level: input.tipPercent >= 100 ? "danger" : "warning", title: "High tip percentage", message: `The entered tip is ${input.tipPercent}%. Confirm that this is intentional.` });
  if (input.taxPercent >= 30) checks.push({ id: "high-tax", level: "warning", title: "High tax percentage", message: `The entered tax rate is ${input.taxPercent}%. Check whether the receipt amount is tax-inclusive.` });
  if (input.servicePercent > 0 && input.tipPercent > 0) checks.push({ id: "double-gratuity", level: "warning", title: "Service charge plus tip", message: `The bill includes a ${input.servicePercent}% service charge and an additional ${input.tipPercent}% tip. Confirm that both should apply.` });
  if (input.servicePercent > 0 && input.tipBasis === "pretip-total" && input.tipPercent > 0) checks.push({ id: "tip-on-service", level: "warning", title: "Tip includes the service charge", message: "The selected basis calculates the tip on subtotal, tax, and service charge." });
  if (input.splitMode === "weighted") {
    const weights = input.guests.map((guest) => guest.weight);
    const ratio = Math.max(...weights) / Math.min(...weights);
    if (ratio >= 4) checks.push({ id: "weight-range", level: "info", title: "Wide split-weight range", message: `The largest guest weight is ${ratio.toFixed(1)}× the smallest. Review the guest table before sharing the result.` });
  }
  if (result && result.roundingDelta > 0) {
    const ratio = result.totalBeforeRounding > 0 ? (result.roundingDelta / result.totalBeforeRounding) * 100 : 0;
    checks.push({
      id: "rounding",
      level: ratio >= 2 ? "warning" : "info",
      title: "Round-up collection",
      message: `${formatMoney(result.roundingDelta, input.currency)} is collected above the calculated total so each guest can pay a rounded amount.`,
    });
  }
  if (result && result.people >= 20) checks.push({ id: "large-party", level: "info", title: "Large group", message: `${result.people} shares are included. Confirm the guest count and any automatic gratuity policy.` });
  if (input.currency === "JPY") checks.push({ id: "zero-decimal", level: "info", title: "Zero-decimal currency", message: "JPY amounts are rounded to whole yen because the currency has no minor unit." });
  if (checks.every((check) => check.level !== "warning" && check.level !== "danger")) checks.push({ id: "ready", level: "success", title: "Inputs are internally consistent", message: "No structural issue was found in the current bill and split setup." });
  return checks;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildGuestCsv(result: TipResult | null) {
  const rows: Array<Array<string | number>> = [["guest", "weight", "share_percent", "exact_share", "final_share", "rounding_delta"]];
  if (result) for (const share of result.guestShares) rows.push([share.name, share.weight, share.sharePercent.toFixed(4), share.exactShare, share.finalShare, share.roundingDelta]);
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function buildScenarioCsv(scenarios: TipScenario[]) {
  const rows: Array<Array<string | number>> = [["tip_percent", "tip_amount", "bill_total", "average_per_person"]];
  for (const scenario of scenarios) rows.push([scenario.tipPercent, scenario.tipAmount, scenario.total, scenario.averagePerPerson]);
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function buildTipReport(input: TipScenarioInput, result: TipResult | null, scenarios: TipScenario[], checks: TipCheck[]): TipReport {
  return {
    generatedAt: new Date().toISOString(),
    input,
    result,
    scenarios,
    checks,
  };
}

export function buildTipSummaryMarkdown(input: TipScenarioInput, result: TipResult | null, checks: TipCheck[]) {
  if (!result) return "# Tip and bill split\n\nEnter valid values to generate a split.\n";
  const money = (value: number) => formatMoney(value, input.currency);
  return [
    "# Tip and bill split",
    "",
    `- Subtotal: ${money(result.subtotal)}`,
    `- Tax (${input.taxPercent}%): ${money(result.taxAmount)}`,
    `- Service charge (${input.servicePercent}%): ${money(result.serviceAmount)}`,
    `- Tip (${input.tipPercent}%): ${money(result.tipAmount)}`,
    `- Calculated total: ${money(result.totalBeforeRounding)}`,
    `- Collected total: ${money(result.totalCollected)}`,
    `- Guests: ${result.people}`,
    `- Average per guest: ${money(result.averagePerPerson)}`,
    "",
    "## Guest shares",
    "",
    ...result.guestShares.map((share) => `- ${share.name}: ${money(share.finalShare)} (${share.sharePercent.toFixed(1)}%)`),
    "",
    "## Production review",
    "",
    ...checks.map((check) => `- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
  ].join("\n");
}

export function buildJavaScriptSnippet() {
  return `function splitBill({ subtotal, taxPercent = 0, servicePercent = 0, tipPercent = 0, people = 1 }) {
  if (![subtotal, taxPercent, servicePercent, tipPercent, people].every(Number.isFinite)) {
    throw new TypeError("All bill values must be finite numbers.");
  }
  if (subtotal < 0 || people < 1) throw new RangeError("Check subtotal and people.");

  const tax = subtotal * taxPercent / 100;
  const service = subtotal * servicePercent / 100;
  const tip = (subtotal + tax) * tipPercent / 100;
  const total = subtotal + tax + service + tip;

  return {
    tax,
    service,
    tip,
    total,
    perPerson: total / Math.floor(people),
  };
}
`;
}
