export type UnitSystem =
  | "metric"
  | "us-customary"
  | "imperial"
  | "si-decimal"
  | "iec-binary"
  | "universal";

export type UnitFormatMode = "auto" | "fixed" | "significant" | "scientific";
export type UnitCheckLevel = "success" | "info" | "warning" | "danger";
export type UnitTab = "overview" | "table" | "batch" | "exports";

export type UnitDefinition = {
  id: string;
  name: string;
  symbol: string;
  factor: number;
  system: UnitSystem;
  aliases?: string[];
  note?: string;
};

export type UnitCategory = {
  id: string;
  label: string;
  description: string;
  baseUnitId: string;
  physicalQuantity: string;
  units: UnitDefinition[];
};

export type ConversionFormat = {
  mode: UnitFormatMode;
  precision: number;
  useGrouping: boolean;
};

export type ConversionRequest = {
  categoryId: string;
  value: number;
  fromId: string;
  toId: string;
};

export type ConversionOutcome = {
  valid: boolean;
  error: string | null;
  category: UnitCategory | null;
  fromUnit: UnitDefinition | null;
  toUnit: UnitDefinition | null;
  inputValue: number;
  outputValue: number;
  factor: number | null;
  formula: string;
  substitutedFormula: string;
  steps: string[];
};

export type ConversionCheck = {
  id: string;
  level: UnitCheckLevel;
  title: string;
  message: string;
};

export type BatchConversionRow = {
  lineNumber: number;
  raw: string;
  inputValue: number | null;
  fromUnitId: string | null;
  fromSymbol: string | null;
  outputValue: number | null;
  toUnitId: string;
  error: string | null;
};

export type UnitPreset = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  fromId: string;
  toId: string;
  value: number;
  batchInput?: string;
};

export type ConversionReport = {
  generatedAt: string;
  request: ConversionRequest;
  format: ConversionFormat;
  result: ConversionOutcome;
  checks: ConversionCheck[];
  batch: BatchConversionRow[];
};
