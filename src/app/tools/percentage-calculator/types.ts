export type PercentMode =
  | "of"
  | "isWhatPercent"
  | "change"
  | "applyChange"
  | "reverseChange"
  | "percentDifference"
  | "discount"
  | "markupMargin";

export type PercentInputKey = "a" | "b";
export type PercentUnit = "number" | "percent";
export type PercentDirection = "increase" | "decrease" | "unchanged" | "mixed" | "none";
export type PercentCheckLevel = "success" | "info" | "warning" | "danger";
export type PercentTab = "overview" | "breakdown" | "scenarios" | "exports";

export type PercentModeMeta = {
  label: string;
  shortLabel: string;
  description: string;
  aLabel: string;
  bLabel: string;
  aHint: string;
  bHint: string;
  answerLabel: string;
  answerUnit: PercentUnit;
  formula: string;
};

export type PercentInputs = {
  a: number;
  b: number;
};

export type PercentMetric = {
  label: string;
  value: number;
  unit: PercentUnit;
  hint?: string;
};

export type PercentOutcome = {
  mode: PercentMode;
  valid: boolean;
  error: string | null;
  value: number;
  unit: PercentUnit;
  sentence: string;
  direction: PercentDirection;
  formula: string;
  substitutedFormula: string;
  steps: string[];
  metrics: PercentMetric[];
  absoluteDelta: number | null;
  factor: number | null;
};

export type PercentScenario = {
  label: string;
  modifierPercent: number;
  inputA: number;
  inputB: number;
  outcome: PercentOutcome;
};

export type PercentCheck = {
  id: string;
  level: PercentCheckLevel;
  title: string;
  message: string;
};

export type PercentPreset = {
  id: string;
  name: string;
  description: string;
  mode: PercentMode;
  a: number;
  b: number;
};

export type PercentReport = {
  generatedAt: string;
  mode: PercentMode;
  modeLabel: string;
  inputs: PercentInputs;
  result: PercentOutcome;
  scenarios: PercentScenario[];
  checks: PercentCheck[];
};
