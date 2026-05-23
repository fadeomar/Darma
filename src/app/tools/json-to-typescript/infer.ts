import type { InferOptions, JsonParseResult, TypeScriptOutput } from "./types";

export const JSON_TO_TS_INPUT_LIMIT = 100_000;

const RESERVED_WORDS = new Set([
  "abstract", "any", "as", "asserts", "async", "await", "bigint", "boolean", "break", "case", "catch", "class", "const", "constructor", "continue", "debugger", "declare", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "from", "function", "get", "if", "implements", "import", "in", "infer", "instanceof", "interface", "is", "keyof", "let", "module", "namespace", "never", "new", "null", "number", "object", "of", "package", "private", "protected", "public", "readonly", "require", "return", "set", "static", "string", "super", "switch", "symbol", "this", "throw", "true", "try", "type", "typeof", "undefined", "unique", "unknown", "var", "void", "while", "with", "yield",
]);

function getJsonErrorPosition(message: string): number | null {
  const match = message.match(/position\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function getLineColumn(input: string, position: number) {
  const before = input.slice(0, position);
  const lines = before.split(/\r\n|\r|\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function parseJsonInput(input: string): JsonParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste JSON to generate TypeScript." };
  if (input.length > JSON_TO_TS_INPUT_LIMIT) {
    return { ok: false, error: `Input is over the ${JSON_TO_TS_INPUT_LIMIT.toLocaleString()} character limit.` };
  }

  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    const position = getJsonErrorPosition(message);
    if (position !== null) {
      return { ok: false, error: message, ...getLineColumn(trimmed, position) };
    }
    return { ok: false, error: message };
  }
}

export function toPascalCaseName(name: string): string {
  const cleaned = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  const pascal = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");

  const fallback = pascal || "Root";
  return /^\d/.test(fallback) ? `Type${fallback}` : fallback;
}

export function sanitizePropertyName(key: string): string {
  if (/^[A-Za-z_$][\w$]*$/.test(key) && !RESERVED_WORDS.has(key)) return key;
  return JSON.stringify(key);
}

type TypeContext = {
  options: InferOptions;
  declarations: Map<string, string>;
  warnings: string[];
};

function indent(value: string, spaces = 2) {
  const padding = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line ? `${padding}${line}` : line))
    .join("\n");
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function joinUnion(types: string[]) {
  const normalized = unique(types).filter(Boolean);
  if (!normalized.length) return "unknown";
  if (normalized.length === 1) return normalized[0];
  return normalized.sort((a, b) => a.localeCompare(b)).join(" | ");
}

function ensureUniqueTypeName(context: TypeContext, preferredName: string) {
  const base = toPascalCaseName(preferredName);
  if (!context.declarations.has(base)) return base;
  let index = 2;
  while (context.declarations.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function primitiveType(value: unknown) {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (value === null) return "null";
  return null;
}

function typeForValue(value: unknown, typeName: string, context: TypeContext): string {
  const primitive = primitiveType(value);
  if (primitive) return primitive;

  if (Array.isArray(value)) return typeForArray(value, typeName, context);

  if (typeof value === "object" && value !== null) {
    return declareObjectType([value as Record<string, unknown>], typeName, context);
  }

  return "unknown";
}

function typeForArray(values: unknown[], typeName: string, context: TypeContext): string {
  if (!values.length) {
    context.warnings.push(`${typeName} is an empty array, so item type was inferred as unknown.`);
    return "unknown[]";
  }

  const sampledValues = context.options.arrayHandling === "first-item" ? values.slice(0, 1) : values;
  if (context.options.arrayHandling === "first-item" && values.length > 1) {
    context.warnings.push(`${typeName} was inferred from the first array item only.`);
  }

  const nonNullValues = sampledValues.filter((item) => item !== null);
  const hasNull = sampledValues.length !== nonNullValues.length;
  const allObjects = nonNullValues.length > 0 && nonNullValues.every((item) => typeof item === "object" && !Array.isArray(item));

  if (allObjects) {
    const itemName = ensureUniqueTypeName(context, `${typeName}Item`);
    const objectType = declareObjectType(nonNullValues as Record<string, unknown>[], itemName, context);
    const itemType = hasNull && context.options.nullHandling === "include-null" ? `${objectType} | null` : objectType;
    return `Array<${itemType}>`;
  }

  const itemTypes = sampledValues.map((item, index) => typeForValue(item, `${typeName}Item${index + 1}`, context));
  const itemType = joinUnion(itemTypes);
  if (unique(itemTypes).length > 1) context.warnings.push(`${typeName} contains mixed array item types, so a union type was generated.`);
  return `Array<${itemType}>`;
}

function declareObjectType(objects: Record<string, unknown>[], preferredName: string, context: TypeContext): string {
  const typeName = ensureUniqueTypeName(context, preferredName);
  const keySet = new Set<string>();
  objects.forEach((object) => Object.keys(object).forEach((key) => keySet.add(key)));
  const keys = Array.from(keySet);

  if (!keys.length) {
    const declaration = context.options.outputStyle === "interface"
      ? `${context.options.exportTypes ? "export " : ""}interface ${typeName} {}`
      : `${context.options.exportTypes ? "export " : ""}type ${typeName} = Record<string, never>${context.options.useSemicolons ? ";" : ""}`;
    context.declarations.set(typeName, declaration);
    return typeName;
  }

  const lines = keys.map((key) => {
    const values = objects.map((object) => object[key]);
    const presentValues = values.filter((value) => value !== undefined);
    const hasMissing = presentValues.length !== objects.length;
    const hasNull = presentValues.some((value) => value === null);
    const usableValues = context.options.nullHandling === "null-as-optional" ? presentValues.filter((value) => value !== null) : presentValues;
    const childTypeName = `${typeName}${toPascalCaseName(key)}`;
    const inferredTypes = usableValues.length ? usableValues.map((value) => typeForValue(value, childTypeName, context)) : ["unknown"];
    const shouldBeOptional = context.options.optionalProperties || hasMissing || (hasNull && context.options.nullHandling === "null-as-optional");
    const nullType = hasNull && context.options.nullHandling === "include-null" ? ["null"] : [];
    const propertyType = joinUnion([...inferredTypes, ...nullType]);
    const readonly = context.options.readonlyProperties ? "readonly " : "";
    const semicolon = context.options.useSemicolons ? ";" : "";
    return `${readonly}${sanitizePropertyName(key)}${shouldBeOptional ? "?" : ""}: ${propertyType}${semicolon}`;
  });

  const body = indent(lines.join("\n"));
  const exportPrefix = context.options.exportTypes ? "export " : "";
  const declaration = context.options.outputStyle === "interface"
    ? `${exportPrefix}interface ${typeName} {\n${body}\n}`
    : `${exportPrefix}type ${typeName} = {\n${body}\n}${context.options.useSemicolons ? ";" : ""}`;

  context.declarations.set(typeName, declaration);
  return typeName;
}

function safeRootName(name: string) {
  return toPascalCaseName(name || "Root");
}

export function inferTypeScript(value: unknown, options: InferOptions): TypeScriptOutput {
  const context: TypeContext = {
    options: { ...options, rootName: safeRootName(options.rootName) },
    declarations: new Map(),
    warnings: [],
  };

  const rootName = context.options.rootName;
  const rootType = typeForValue(value, rootName, context);

  if (rootType !== rootName) {
    const exportPrefix = context.options.exportTypes ? "export " : "";
    const ending = context.options.useSemicolons ? ";" : "";
    context.declarations.set(rootName, `${exportPrefix}type ${rootName} = ${rootType}${ending}`);
    if (Array.isArray(value)) context.warnings.push(`Top-level JSON is an array, so ${rootName} was generated as an array type.`);
  }

  return {
    code: Array.from(context.declarations.values()).join("\n\n"),
    rootName,
    warnings: context.warnings,
  };
}
