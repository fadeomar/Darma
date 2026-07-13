export type OutputStyle = "interface" | "type";
export type NullHandling = "include-null" | "null-as-optional";
export type ArrayHandling = "all-items" | "first-item";
export type GeneratedArtifactId = "typescript" | "zod" | "json-schema" | "report";
export type JsonCheckLevel = "success" | "info" | "warning" | "danger";

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
  declarationCount: number;
}

export interface JsonExample {
  id: string;
  label: string;
  description: string;
  rootName: string;
  value: string;
  options?: Partial<InferOptions>;
}

export interface JsonStructureStats {
  rootKind: "object" | "array" | "string" | "number" | "boolean" | "null";
  nodeCount: number;
  objectCount: number;
  arrayCount: number;
  propertyCount: number;
  maxDepth: number;
  nullableValueCount: number;
  emptyArrayCount: number;
  mixedArrayCount: number;
  inconsistentObjectArrayCount: number;
  sensitivePaths: string[];
  longIntegerPaths: string[];
}

export interface JsonProductionCheck {
  id: string;
  level: JsonCheckLevel;
  title: string;
  message: string;
}

export interface JsonInferenceReport {
  generatedAt: string;
  rootName: string;
  options: InferOptions;
  stats: JsonStructureStats;
  warnings: string[];
  checks: JsonProductionCheck[];
}

export interface GeneratedArtifacts {
  typescript: string;
  zod: string;
  jsonSchema: string;
  report: string;
}
