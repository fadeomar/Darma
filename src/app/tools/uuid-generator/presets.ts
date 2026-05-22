import type { UuidFormat, UuidOutputStyle, QuantityPreset } from "./types";

export const QUANTITY_PRESETS: Array<{ label: string; value: QuantityPreset }> = [
  { label: "1", value: 1 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
];

export const FORMAT_OPTIONS: Array<{ label: string; value: UuidFormat; description: string }> = [
  { label: "Standard lowercase", value: "standard", description: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  { label: "Uppercase", value: "uppercase", description: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" },
  { label: "Without hyphens", value: "no-hyphens", description: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
  { label: "URN prefix", value: "urn", description: "urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
];

export const OUTPUT_STYLE_OPTIONS: Array<{ label: string; value: UuidOutputStyle }> = [
  { label: "Plain lines", value: "lines" },
  { label: "JSON array", value: "json" },
  { label: "CSV", value: "csv" },
];
