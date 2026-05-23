export type OutputStyle = "interface" | "type";
export type NullHandling = "include-null" | "null-as-optional";
export type ArrayHandling = "all-items" | "first-item";

export interface InferOptions {
  rootName: string;
  outputStyle: OutputStyle;
  exportTypes: boolean;
  optionalProperties: boolean;
  readonlyProperties: boolean;
  useSemicolons: boolean;
  nullHandling: NullHandling;
  arrayHandling: ArrayHandling;
}

export interface JsonParseSuccess {
  ok: true;
  value: unknown;
}

export interface JsonParseFailure {
  ok: false;
  error: string;
  line?: number;
  column?: number;
}

export type JsonParseResult = JsonParseSuccess | JsonParseFailure;

export interface TypeScriptOutput {
  code: string;
  rootName: string;
  warnings: string[];
}

export interface JsonExample {
  id: string;
  label: string;
  description: string;
  rootName: string;
  value: string;
}
