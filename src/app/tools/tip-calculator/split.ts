// ─── Tip & bill split logic ────────────────────────────────────────────────
// Pure money math for splitting a bill plus tip across people. All amounts are
// rounded to cents; an optional "round up" rounds each person's share up to the
// next whole currency unit (handy for cash).

export type SplitInput = {
  bill: number;
  tipPercent: number;
  people: number;
  roundUp: boolean;
};

export type SplitResult = {
  tipAmount: number;
  total: number;
  perPerson: number;
  perPersonBill: number;
  perPersonTip: number;
  rounded: boolean;
  /** perPerson × people — equals total unless rounding collected a little extra. */
  totalCollected: number;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeSplit({ bill, tipPercent, people, roundUp }: SplitInput): SplitResult | null {
  if (!Number.isFinite(bill) || bill < 0) return null;
  if (!Number.isFinite(tipPercent) || tipPercent < 0) return null;
  if (!Number.isFinite(people) || people < 1) return null;

  const headcount = Math.floor(people);
  const tipAmount = round2((bill * tipPercent) / 100);
  const total = round2(bill + tipAmount);

  const perPersonRaw = total / headcount;
  const perPerson = roundUp ? Math.ceil(perPersonRaw) : round2(perPersonRaw);
  const totalCollected = round2(perPerson * headcount);

  return {
    tipAmount,
    total,
    perPerson,
    perPersonBill: round2(bill / headcount),
    perPersonTip: round2(tipAmount / headcount),
    rounded: roundUp && perPerson !== round2(perPersonRaw),
    totalCollected,
  };
}

export const TIP_PRESETS = [10, 15, 18, 20, 25];

/** Format a number as a plain money string with two decimals. */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
