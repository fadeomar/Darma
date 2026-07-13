import type {
  GeneratedArtifacts,
  InferOptions,
  JsonInferenceReport,
  JsonParseResult,
  JsonProductionCheck,
  JsonStructureStats,
  TypeScriptOutput,
} from "./types";

export const JSON_TO_TS_INPUT_LIMIT = 100_000;

const RESERVED_WORDS = new Set([
  "abstract", "any", "as", "asserts", "async", "await", "bigint", "boolean", "break", "case", "catch", "class", "const", "constructor", "continue", "debugger", "declare", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "from", "function", "get", "if", "implements", "import", "in", "infer", "instanceof", "interface", "is", "keyof", "let", "module", "namespace", "never", "new", "null", "number", "object", "of", "package", "private", "protected", "public", "readonly", "require", "return", "set", "static", "string", "super", "switch", "symbol", "this", "throw", "true", "try", "type", "typeof", "undefined", "unique", "unknown", "var", "void", "while", "with", "yield",
]);

const SENSITIVE_KEY_PATTERN = /(?:password|passwd|secret|token|api[_-]?key|authorization|cookie|session|private[_-]?key|credit[_-]?card|card[_-]?number|ssn)/i;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

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
    const allPlainObjects = usableValues.length > 0 && usableValues.every((value) => typeof value === "object" && value !== null && !Array.isArray(value));
    const inferredTypes = !usableValues.length
      ? ["unknown"]
      : allPlainObjects
        ? [declareObjectType(usableValues as Record<string, unknown>[], childTypeName, context)]
        : usableValues.map((value) => typeForValue(value, childTypeName, context));
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
    warnings: unique(context.warnings),
    declarationCount: context.declarations.size,
  };
}

function valueKind(value: unknown): JsonStructureStats["rootKind"] | "undefined" {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "undefined";
}

function appendPath(path: string, key: string | number): string {
  if (typeof key === "number") return `${path}[${key}]`;
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

export function analyzeJsonStructure(value: unknown): JsonStructureStats {
  const stats: JsonStructureStats = {
    rootKind: valueKind(value) === "undefined" ? "null" : valueKind(value) as JsonStructureStats["rootKind"],
    nodeCount: 0,
    objectCount: 0,
    arrayCount: 0,
    propertyCount: 0,
    maxDepth: 0,
    nullableValueCount: 0,
    emptyArrayCount: 0,
    mixedArrayCount: 0,
    inconsistentObjectArrayCount: 0,
    sensitivePaths: [],
    longIntegerPaths: [],
  };

  function walk(current: unknown, path: string, depth: number) {
    stats.nodeCount += 1;
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    if (current === null) {
      stats.nullableValueCount += 1;
      return;
    }

    if (typeof current === "number" && Number.isInteger(current) && !Number.isSafeInteger(current)) {
      stats.longIntegerPaths.push(path);
    }

    if (Array.isArray(current)) {
      stats.arrayCount += 1;
      if (current.length === 0) stats.emptyArrayCount += 1;

      const kinds = new Set(current.filter((item) => item !== null).map(valueKind));
      if (kinds.size > 1) stats.mixedArrayCount += 1;

      const objectItems = current.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item));
      if (objectItems.length === current.filter((item) => item !== null).length && objectItems.length > 1) {
        const signatures = new Set(objectItems.map((item) => Object.keys(item).sort().join("\u0000")));
        if (signatures.size > 1) stats.inconsistentObjectArrayCount += 1;
      }

      current.forEach((item, index) => walk(item, appendPath(path, index), depth + 1));
      return;
    }

    if (typeof current === "object") {
      stats.objectCount += 1;
      Object.entries(current as Record<string, unknown>).forEach(([key, child]) => {
        stats.propertyCount += 1;
        const childPath = appendPath(path, key);
        if (SENSITIVE_KEY_PATTERN.test(key)) stats.sensitivePaths.push(childPath);
        walk(child, childPath, depth + 1);
      });
    }
  }

  walk(value, "$", 0);
  stats.sensitivePaths = unique(stats.sensitivePaths);
  stats.longIntegerPaths = unique(stats.longIntegerPaths);
  return stats;
}

export function buildProductionChecks(stats: JsonStructureStats, inputLength: number): JsonProductionCheck[] {
  const checks: JsonProductionCheck[] = [];

  checks.push({
    id: "parse",
    level: "success",
    title: "Valid JSON",
    message: "The input parsed successfully and can be processed locally.",
  });

  if (stats.rootKind !== "object") {
    checks.push({
      id: "root-shape",
      level: stats.rootKind === "array" ? "info" : "warning",
      title: stats.rootKind === "array" ? "Array root" : "Primitive root",
      message: stats.rootKind === "array"
        ? "A top-level array is valid, but many API contracts wrap collections in an object with metadata."
        : "The root value is not an object or array, so the generated contract will be a type alias.",
    });
  }

  if (stats.emptyArrayCount > 0) {
    checks.push({
      id: "empty-arrays",
      level: "warning",
      title: "Empty arrays cannot reveal item types",
      message: `${stats.emptyArrayCount} empty array${stats.emptyArrayCount === 1 ? " was" : "s were"} inferred as unknown[]. Add representative items before committing the contract.`,
    });
  }

  if (stats.mixedArrayCount > 0) {
    checks.push({
      id: "mixed-arrays",
      level: "warning",
      title: "Mixed array item types",
      message: `${stats.mixedArrayCount} array${stats.mixedArrayCount === 1 ? " contains" : "s contain"} different item kinds, so union types are required. Confirm the payload is intentionally heterogeneous.`,
    });
  }

  if (stats.inconsistentObjectArrayCount > 0) {
    checks.push({
      id: "inconsistent-objects",
      level: "info",
      title: "Optional fields inferred from samples",
      message: `${stats.inconsistentObjectArrayCount} object array${stats.inconsistentObjectArrayCount === 1 ? " has" : "s have"} inconsistent keys. Missing properties are marked optional.`,
    });
  }

  if (stats.nullableValueCount > 0) {
    checks.push({
      id: "nullable-values",
      level: "info",
      title: "Nullable values detected",
      message: `${stats.nullableValueCount} null value${stats.nullableValueCount === 1 ? " was" : "s were"} found. Review whether null and missing should mean the same thing in your application.`,
    });
  }

  if (stats.maxDepth >= 8) {
    checks.push({
      id: "deep-nesting",
      level: stats.maxDepth >= 12 ? "danger" : "warning",
      title: "Deeply nested payload",
      message: `Maximum depth is ${stats.maxDepth}. Deep contracts are harder to validate, mock, and evolve safely.`,
    });
  }

  if (stats.sensitivePaths.length > 0) {
    checks.push({
      id: "sensitive-keys",
      level: "danger",
      title: "Potential secrets or personal data",
      message: `${stats.sensitivePaths.length} sensitive-looking path${stats.sensitivePaths.length === 1 ? " was" : "s were"} detected. Remove real credentials before sharing generated files.`,
    });
  }

  if (stats.longIntegerPaths.length > 0) {
    checks.push({
      id: "unsafe-integers",
      level: "danger",
      title: "Unsafe JavaScript integers",
      message: `${stats.longIntegerPaths.length} integer value${stats.longIntegerPaths.length === 1 ? " exceeds" : "s exceed"} Number.MAX_SAFE_INTEGER. Consider transporting these identifiers as strings.`,
    });
  }

  if (inputLength > 75_000) {
    checks.push({
      id: "large-sample",
      level: "warning",
      title: "Large inference sample",
      message: "This sample is close to the browser limit. Prefer a small representative fixture and validate the real response at runtime.",
    });
  }

  if (checks.length === 1) {
    checks.push({
      id: "stable-shape",
      level: "success",
      title: "Representative shape",
      message: "No obvious inference risks were found in this sample. Runtime validation is still recommended for external data.",
    });
  }

  return checks;
}

function objectSamples(values: unknown[]): Record<string, unknown>[] | null {
  const nonNull = values.filter((value) => value !== null);
  if (!nonNull.length || !nonNull.every((value) => typeof value === "object" && value !== null && !Array.isArray(value))) return null;
  return nonNull as Record<string, unknown>[];
}

function uniqueExpressions(expressions: string[]) {
  return Array.from(new Set(expressions));
}

function zodForSamples(values: unknown[], options: InferOptions, depth = 0): string {
  if (depth > 40) return "z.unknown()";
  const hasNull = values.some((value) => value === null);
  const usable = options.nullHandling === "null-as-optional" ? values.filter((value) => value !== null) : values;
  const nonNull = usable.filter((value) => value !== null);

  if (hasNull && nonNull.length === 0 && options.nullHandling === "include-null") return "z.null()";

  let expression: string;
  const objects = objectSamples(nonNull);
  if (objects) {
    const keys = Array.from(new Set(objects.flatMap((object) => Object.keys(object))));
    const properties = keys.map((key) => {
      const present = objects.filter((object) => Object.prototype.hasOwnProperty.call(object, key));
      const samples = present.map((object) => object[key]);
      const missing = present.length !== objects.length;
      const nullable = samples.some((sample) => sample === null);
      let child = zodForSamples(samples, options, depth + 1);
      if (options.optionalProperties || missing || (nullable && options.nullHandling === "null-as-optional")) child += ".optional()";
      return `${JSON.stringify(key)}: ${child}`;
    });
    expression = `z.object({\n${indent(properties.join(",\n"), 2)}\n})`;
  } else if (nonNull.length > 0 && nonNull.every(Array.isArray)) {
    const arrays = nonNull as unknown[][];
    const sampledArrays = options.arrayHandling === "first-item" ? arrays.map((array) => array.slice(0, 1)) : arrays;
    const items = sampledArrays.flat();
    expression = items.length ? `z.array(${zodForSamples(items, options, depth + 1)})` : "z.array(z.unknown())";
  } else {
    const expressions = uniqueExpressions(nonNull.map((value) => {
      if (typeof value === "string") return ISO_DATE_TIME_PATTERN.test(value) ? "z.string().datetime()" : "z.string()";
      if (typeof value === "number") return Number.isInteger(value) ? "z.number().int()" : "z.number()";
      if (typeof value === "boolean") return "z.boolean()";
      if (Array.isArray(value)) {
        const samples = options.arrayHandling === "first-item" ? value.slice(0, 1) : value;
        return samples.length ? `z.array(${zodForSamples(samples, options, depth + 1)})` : "z.array(z.unknown())";
      }
      if (typeof value === "object" && value !== null) return zodForSamples([value], options, depth + 1);
      return "z.unknown()";
    }));

    if (!expressions.length) expression = "z.unknown()";
    else if (expressions.length === 1) expression = expressions[0];
    else expression = `z.union([${expressions.join(", ")}])`;
  }

  if (hasNull && options.nullHandling === "include-null" && expression !== "z.null()") expression += ".nullable()";
  return expression;
}

export function generateZodSchema(value: unknown, options: InferOptions): string {
  const rootName = safeRootName(options.rootName);
  const schemaName = `${rootName}Schema`;
  const schema = zodForSamples([value], options);
  return `import { z } from "zod";\n\nexport const ${schemaName} = ${schema};\n\nexport type ${rootName} = z.infer<typeof ${schemaName}>;\n`;
}

type JsonSchema = Record<string, unknown>;

function uniqueSchemas(schemas: JsonSchema[]) {
  const seen = new Set<string>();
  return schemas.filter((schema) => {
    const key = JSON.stringify(schema);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function schemaForSamples(values: unknown[], options: InferOptions, depth = 0): JsonSchema {
  if (depth > 40) return {};
  const hasNull = values.some((value) => value === null);
  const usable = options.nullHandling === "null-as-optional" ? values.filter((value) => value !== null) : values;
  const nonNull = usable.filter((value) => value !== null);

  if (hasNull && nonNull.length === 0 && options.nullHandling === "include-null") return { type: "null" };

  let schema: JsonSchema;
  const objects = objectSamples(nonNull);
  if (objects) {
    const keys = Array.from(new Set(objects.flatMap((object) => Object.keys(object))));
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    keys.forEach((key) => {
      const present = objects.filter((object) => Object.prototype.hasOwnProperty.call(object, key));
      const samples = present.map((object) => object[key]);
      const missing = present.length !== objects.length;
      const nullable = samples.some((sample) => sample === null);
      properties[key] = schemaForSamples(samples, options, depth + 1);
      if (!options.optionalProperties && !missing && !(nullable && options.nullHandling === "null-as-optional")) required.push(key);
    });
    schema = { type: "object", properties, additionalProperties: false };
    if (required.length) schema.required = required;
  } else if (nonNull.length > 0 && nonNull.every(Array.isArray)) {
    const arrays = nonNull as unknown[][];
    const sampledArrays = options.arrayHandling === "first-item" ? arrays.map((array) => array.slice(0, 1)) : arrays;
    const items = sampledArrays.flat();
    schema = { type: "array", items: items.length ? schemaForSamples(items, options, depth + 1) : {} };
  } else {
    const schemas = uniqueSchemas(nonNull.map((value) => {
      if (typeof value === "string") return ISO_DATE_TIME_PATTERN.test(value) ? { type: "string", format: "date-time" } : { type: "string" };
      if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
      if (typeof value === "boolean") return { type: "boolean" };
      if (Array.isArray(value)) {
        const samples = options.arrayHandling === "first-item" ? value.slice(0, 1) : value;
        return { type: "array", items: samples.length ? schemaForSamples(samples, options, depth + 1) : {} };
      }
      if (typeof value === "object" && value !== null) return schemaForSamples([value], options, depth + 1);
      return {};
    }));
    schema = schemas.length <= 1 ? (schemas[0] ?? {}) : { anyOf: schemas };
  }

  if (hasNull && options.nullHandling === "include-null") {
    schema = { anyOf: [schema, { type: "null" }] };
  }
  return schema;
}

export function generateJsonSchema(value: unknown, options: InferOptions): string {
  const rootName = safeRootName(options.rootName);
  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: rootName,
    ...schemaForSamples([value], options),
  };
  return `${JSON.stringify(schema, null, 2)}\n`;
}

export function buildInferenceReport(
  value: unknown,
  inputLength: number,
  output: TypeScriptOutput,
  options: InferOptions,
): JsonInferenceReport {
  const stats = analyzeJsonStructure(value);
  return {
    generatedAt: new Date().toISOString(),
    rootName: output.rootName,
    options: { ...options, rootName: output.rootName },
    stats,
    warnings: output.warnings,
    checks: buildProductionChecks(stats, inputLength),
  };
}

export function generateArtifacts(value: unknown, inputLength: number, options: InferOptions): GeneratedArtifacts {
  const output = inferTypeScript(value, options);
  const report = buildInferenceReport(value, inputLength, output, options);
  return {
    typescript: output.code,
    zod: generateZodSchema(value, { ...options, rootName: output.rootName }),
    jsonSchema: generateJsonSchema(value, { ...options, rootName: output.rootName }),
    report: `${JSON.stringify(report, null, 2)}\n`,
  };
}
