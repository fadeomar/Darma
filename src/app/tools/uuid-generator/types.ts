export type UuidVersion = "v4" | "v7";

export type UuidFormat = "standard" | "uppercase" | "no-hyphens" | "urn" | "braces";

export type UuidOutputStyle = "lines" | "json" | "csv";

export type UuidTab = "generator" | "inspector" | "exports";

export type UuidCheckLevel = "success" | "info" | "warning" | "danger";

export type UuidPreset = {
  id: string;
  name: string;
  description: string;
  version: UuidVersion;
  count: number;
  format: UuidFormat;
  outputStyle: UuidOutputStyle;
};

export type UuidInspection = {
  input: string;
  normalized: string | null;
  valid: boolean;
  canonical: boolean;
  version: number | null;
  versionLabel: string;
  variant: string;
  variantCompatible: boolean;
  isNil: boolean;
  isMax: boolean;
  timestampMs: number | null;
  timestampIso: string | null;
  error: string | null;
};

export type UuidCheck = {
  id: string;
  level: UuidCheckLevel;
  title: string;
  message: string;
};

export type UuidGenerationConfig = {
  version: UuidVersion;
  count: number;
  format: UuidFormat;
  outputStyle: UuidOutputStyle;
};

export type UuidAuditReport = {
  generatedAt: string;
  config: UuidGenerationConfig;
  summary: {
    generatedCount: number;
    uniqueCount: number;
    duplicateCount: number;
    secureRandomAvailable: boolean;
    approximateCollisionProbability: string;
  };
  current: UuidInspection | null;
  checks: UuidCheck[];
  values: string[];
};
