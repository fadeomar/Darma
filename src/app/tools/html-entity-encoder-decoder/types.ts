export type EntityMode = "encode" | "decode";
export type EntityFormat = "named" | "decimal" | "hex";
export type EncodeScope = "essential" | "special" | "nonAscii";

export interface EncodeOptions {
  format: EntityFormat;
  scope: EncodeScope;
  preserveLineBreaks: boolean;
  convertQuotes: boolean;
}

export interface EntityStats {
  inputCharacters: number;
  outputCharacters: number;
  changedCharacters: number;
  entityCount: number;
}

export interface EntityExample {
  id: string;
  label: string;
  description: string;
  mode: EntityMode;
  value: string;
}
