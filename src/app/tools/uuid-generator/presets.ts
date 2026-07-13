import type { UuidFormat, UuidOutputStyle, UuidPreset, UuidVersion } from "./types";

export const UUID_PRESETS: UuidPreset[] = [
  {
    id: "api-fixtures",
    name: "API fixtures",
    description: "Ten random UUID v4 values in a JSON array for mocks and tests.",
    version: "v4",
    count: 10,
    format: "standard",
    outputStyle: "json",
  },
  {
    id: "database-v7",
    name: "Database keys",
    description: "Time-ordered UUID v7 values for index-friendly application records.",
    version: "v7",
    count: 25,
    format: "standard",
    outputStyle: "lines",
  },
  {
    id: "csv-seed",
    name: "CSV seed batch",
    description: "Fifty UUID v4 values with a CSV header for seed data imports.",
    version: "v4",
    count: 50,
    format: "standard",
    outputStyle: "csv",
  },
  {
    id: "compact-ids",
    name: "Compact IDs",
    description: "Hyphen-free UUID v4 values for systems that require 32 hex digits.",
    version: "v4",
    count: 10,
    format: "no-hyphens",
    outputStyle: "lines",
  },
  {
    id: "urn-values",
    name: "UUID URNs",
    description: "Standards-style urn:uuid values for identifiers in documents and metadata.",
    version: "v4",
    count: 5,
    format: "urn",
    outputStyle: "lines",
  },
  {
    id: "uppercase-legacy",
    name: "Legacy uppercase",
    description: "Uppercase UUID v4 values for legacy exports and case-sensitive fixtures.",
    version: "v4",
    count: 10,
    format: "uppercase",
    outputStyle: "json",
  },
];

export const VERSION_OPTIONS: Array<{ label: string; value: UuidVersion; description: string }> = [
  { label: "UUID v4", value: "v4", description: "Random identifiers with 122 random bits." },
  { label: "UUID v7", value: "v7", description: "Unix-millisecond prefix with secure random data." },
];

export const FORMAT_OPTIONS: Array<{ label: string; value: UuidFormat; description: string }> = [
  { label: "Standard lowercase", value: "standard", description: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  { label: "Uppercase", value: "uppercase", description: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" },
  { label: "Without hyphens", value: "no-hyphens", description: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
  { label: "URN prefix", value: "urn", description: "urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  { label: "Braces", value: "braces", description: "{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}" },
];

export const OUTPUT_STYLE_OPTIONS: Array<{ label: string; value: UuidOutputStyle }> = [
  { label: "Plain lines", value: "lines" },
  { label: "JSON array", value: "json" },
  { label: "CSV", value: "csv" },
];

export const DEFAULT_UUID_PRESET = UUID_PRESETS[0];
