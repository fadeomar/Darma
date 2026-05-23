export type UuidFormat = "standard" | "uppercase" | "no-hyphens" | "urn";

export type UuidOutputStyle = "lines" | "json" | "csv";

export type QuantityPreset = 1 | 5 | 10 | 25 | 50;

export type UuidGenerationState = {
  values: string[];
  error: string | null;
};
