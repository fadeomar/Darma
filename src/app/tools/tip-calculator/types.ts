export type TipCurrency = "USD" | "EUR" | "GBP" | "ILS" | "JPY";
export type TipBasis = "subtotal" | "subtotal-tax" | "pretip-total";
export type TipRoundMode = "fair" | "up-005" | "up-050" | "up-whole";
export type TipSplitMode = "equal" | "weighted";
export type TipTab = "overview" | "guests" | "scenarios" | "exports";
export type TipCheckLevel = "success" | "info" | "warning" | "danger";

export type TipGuestInput = {
  id: string;
  name: string;
  weight: number;
};

export type TipScenarioInput = {
  subtotal: number;
  taxPercent: number;
  servicePercent: number;
  tipPercent: number;
  people: number;
  currency: TipCurrency;
  tipBasis: TipBasis;
  roundMode: TipRoundMode;
  splitMode: TipSplitMode;
  guests: TipGuestInput[];
};

export type TipGuestShare = {
  id: string;
  name: string;
  weight: number;
  sharePercent: number;
  exactShare: number;
  finalShare: number;
  roundingDelta: number;
};

export type TipResult = {
  currency: TipCurrency;
  minorUnit: number;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  tipBasisAmount: number;
  tipAmount: number;
  preTipTotal: number;
  totalBeforeRounding: number;
  totalCollected: number;
  roundingDelta: number;
  people: number;
  averagePerPerson: number;
  minimumShare: number;
  maximumShare: number;
  guestShares: TipGuestShare[];
};

export type TipScenario = {
  tipPercent: number;
  tipAmount: number;
  total: number;
  averagePerPerson: number;
};

export type TipCheck = {
  id: string;
  level: TipCheckLevel;
  title: string;
  message: string;
};

export type TipPreset = {
  id: string;
  name: string;
  description: string;
  input: TipScenarioInput;
};

export type TipReport = {
  generatedAt: string;
  input: TipScenarioInput;
  result: TipResult | null;
  scenarios: TipScenario[];
  checks: TipCheck[];
};
