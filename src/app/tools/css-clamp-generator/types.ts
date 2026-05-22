export type ClampUnit = "rem" | "px";
export type ClampPropertyPreset = "font-size" | "spacing" | "width" | "custom";

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
