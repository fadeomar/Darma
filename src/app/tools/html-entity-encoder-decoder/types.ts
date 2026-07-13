export type EntityMode = "encode" | "decode";
export type EntityFormat = "named" | "decimal" | "hex";
export type EncodeScope = "essential" | "special" | "nonAscii";
export type EntityContext = "text" | "double-attribute" | "single-attribute";
export type EntityKind = "named" | "decimal" | "hex" | "unknown" | "malformed";
export type EntityCheckLevel = "success" | "info" | "warning" | "danger";

export interface EncodeOptions {
  format: EntityFormat;
  scope: EncodeScope;
  context: EntityContext;
  preserveLineBreaks: boolean;
  convertQuotes: boolean;
  preserveExistingEntities: boolean;
}

export interface EntityStats {
  inputCharacters: number;
  outputCharacters: number;
  changedCharacters: number;
  entityCount: number;
  namedEntities: number;
  numericEntities: number;
  unknownEntities: number;
  lines: number;
  expansionRatio: number;
  nonAsciiCharacters: number;
}

export interface EntityOccurrence {
  index: number;
  raw: string;
  decoded: string;
  kind: EntityKind;
  valid: boolean;
  codePoints: string;
  issue?: string;
}

export interface EntityCheck {
  id: string;
  level: EntityCheckLevel;
  title: string;
  message: string;
}

export interface EntityExample {
  id: string;
  label: string;
  description: string;
  mode: EntityMode;
  value: string;
  options?: Partial<EncodeOptions>;
  decodePasses?: 1 | 2;
}

export interface EntityCodeSnippets {
  javascript: string;
  react: string;
}

export interface EntityReport {
  generatedAt: string;
  mode: EntityMode;
  options: EncodeOptions;
  decodePasses: number;
  stats: EntityStats;
  checks: EntityCheck[];
  occurrences: EntityOccurrence[];
  input: string;
  output: string;
}
