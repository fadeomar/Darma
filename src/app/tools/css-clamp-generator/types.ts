export type ClampUnit = "rem" | "px";
export type ClampPropertyPreset = "font-size" | "spacing" | "width" | "custom";
export type ClampExportTab = "css" | "variables" | "tokens" | "tailwind" | "json" | "scss";
export type ClampPreviewMode = "text" | "spacing" | "width";

export type ClampInput = {
  property: string;
  minViewport: number;
  maxViewport: number;
  minValue: number;
  maxValue: number;
  unit: ClampUnit;
  rootFontSize: number;
};

export type ClampResult = {
  clamp: string;
  preferred: string;
  slope: number;
  intercept: number;
  min: string;
  max: string;
};

export type ClampValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type ClampToken = ClampInput & {
  name: string;
};

export type PresetOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export type ClampHealth = {
  label: string;
  tone: "good" | "warning" | "danger";
  notes: string[];
};
