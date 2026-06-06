// ─── Types ────────────────────────────────────────────────────────────────────

export type IndentOption = 2 | 4 | "tab";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      raw: string;
      line?: number;
      col?: number;
    };

export type ProcessResult = {
  ok: boolean;
  output?: string;
  validation: ValidationResult;
  parsed?: JsonValue;
};

export type RepairResult = ProcessResult & {
  changed: boolean;
  changes: string[];
};

export type JsonStats = {
  rootType: string;
  topLevelCount: number;
  depth: number;
  objectCount: number;
  arrayCount: number;
  keyCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  characterCount: number;
  lineCount: number;
  minifiedCharacterCount: number;
  formattedCharacterCount: number;
  reductionPercent: number;
};

export type JsonTableData = {
  columns: string[];
  rows: Array<Record<string, string>>;
  truncatedRows: number;
  truncatedColumns: number;
  reason?: string;
};

// ─── Error parsing ────────────────────────────────────────────────────────────

function charPosToLineCol(
  input: string,
  pos: number,
): { line: number; col: number } {
  const before = input.substring(0, pos);
  const lines = before.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

function parseJsonError(err: unknown, input: string): ValidationResult {
  if (!(err instanceof SyntaxError)) {
    return {
      ok: false,
      error: "An unexpected error occurred while parsing.",
      raw: String(err),
    };
  }

  const msg = err.message;
  let line: number | undefined;
  let col: number | undefined;

  // Firefox / SpiderMonkey:
  // "JSON.parse: unexpected character at line 3 column 5 of the JSON data"
  const ffMatch = msg.match(/at line (\d+) column (\d+)/i);
  if (ffMatch) {
    line = parseInt(ffMatch[1], 10);
    col = parseInt(ffMatch[2], 10);
  }

  // V8 (Chrome / Node / Edge):
  // "Unexpected token '}' at position 42"
  // "Expected ',' or ']' after array element in JSON at position 42"
  if (!line) {
    const v8Match = msg.match(/at position (\d+)/i);
    if (v8Match) {
      const charPos = parseInt(v8Match[1], 10);
      ({ line, col } = charPosToLineCol(input, charPos));
    }
  }

  let human = msg
    .replace(/^JSON\.parse:\s*/i, "")
    .replace(/ in JSON at position \d+/i, "")
    .replace(/ of the JSON data/i, "")
    .trim();
  human = human.charAt(0).toUpperCase() + human.slice(1);
  if (!human.endsWith(".")) human += ".";

  return { ok: false, error: human, raw: msg, line, col };
}

// ─── Core operations ──────────────────────────────────────────────────────────

export function validateJSON(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Input is empty.", raw: "" };

  try {
    JSON.parse(trimmed);
    return { ok: true };
  } catch (err) {
    return parseJsonError(err, trimmed);
  }
}

export function parseJSON(input: string): ProcessResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      validation: { ok: false, error: "Input is empty.", raw: "" },
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as JsonValue;
    return { ok: true, parsed, validation: { ok: true } };
  } catch (err) {
    return { ok: false, validation: parseJsonError(err, trimmed) };
  }
}

export function formatJSON(
  input: string,
  indent: IndentOption,
  sortKeys = false,
): ProcessResult {
  const parsed = parseJSON(input);
  if (!parsed.ok || parsed.parsed === undefined) return parsed;

  const indentValue: string | number = indent === "tab" ? "\t" : indent;
  const value = sortKeys ? sortKeysDeep(parsed.parsed) : parsed.parsed;
  const output = JSON.stringify(value, null, indentValue);
  return { ok: true, output, parsed: value, validation: { ok: true } };
}

export function minifyJSON(input: string, sortKeys = false): ProcessResult {
  const parsed = parseJSON(input);
  if (!parsed.ok || parsed.parsed === undefined) return parsed;

  const value = sortKeys ? sortKeysDeep(parsed.parsed) : parsed.parsed;
  const output = JSON.stringify(value);
  return { ok: true, output, parsed: value, validation: { ok: true } };
}

// ─── Repair helpers ───────────────────────────────────────────────────────────

function stripComments(input: string): { value: string; changed: boolean } {
  let changed = false;
  let output = "";
  let inString = false;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      changed = true;
      while (index < input.length && input[index] !== "\n") index += 1;
      output += "\n";
      continue;
    }

    if (char === "/" && next === "*") {
      changed = true;
      index += 2;
      while (index < input.length && !(input[index] === "*" && input[index + 1] === "/")) {
        if (input[index] === "\n") output += "\n";
        index += 1;
      }
      index += 1;
      continue;
    }

    output += char;
  }

  return { value: output, changed };
}

function replaceSingleQuotedStrings(input: string): { value: string; changed: boolean } {
  let changed = false;
  let output = "";
  let inDoubleString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (inDoubleString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inDoubleString = false;
      }
      continue;
    }

    if (char === '"') {
      inDoubleString = true;
      output += char;
      continue;
    }

    if (char === "'") {
      changed = true;
      let value = "";
      index += 1;
      while (index < input.length) {
        const nextChar = input[index];
        if (nextChar === "\\" && index + 1 < input.length) {
          const escapedChar = input[index + 1];
          value += escapedChar === "'" ? "'" : `\\${escapedChar}`;
          index += 2;
          continue;
        }
        if (nextChar === "'") break;
        value += nextChar;
        index += 1;
      }
      output += JSON.stringify(value);
      continue;
    }

    output += char;
  }

  return { value: output, changed };
}

export function repairLooseJSON(
  input: string,
  indent: IndentOption,
  sortKeys = false,
): RepairResult {
  const changes: string[] = [];
  let working = input.trim();

  if (!working) {
    return {
      ok: false,
      changed: false,
      changes: [],
      validation: { ok: false, error: "Input is empty.", raw: "" },
    };
  }

  const withoutComments = stripComments(working);
  if (withoutComments.changed) changes.push("Removed JavaScript-style comments.");
  working = withoutComments.value;

  const withDoubleQuotes = replaceSingleQuotedStrings(working);
  if (withDoubleQuotes.changed) changes.push("Converted single-quoted strings to double-quoted strings.");
  working = withDoubleQuotes.value;

  const withQuotedKeys = working.replace(
    /([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g,
    (_match, prefix: string, key: string, suffix: string) => {
      changes.push(`Quoted object key: ${key}.`);
      return `${prefix}${JSON.stringify(key)}${suffix}`;
    },
  );
  working = withQuotedKeys;

  const withoutTrailingCommas = working.replace(/,\s*([}\]])/g, (_match, suffix: string) => {
    changes.push("Removed a trailing comma.");
    return suffix;
  });
  working = withoutTrailingCommas;

  const withSafeInvalidValues = working.replace(
    /:\s*(undefined|NaN|Infinity|-Infinity)(\s*[,}\]])/g,
    (_match, _value: string, suffix: string) => {
      changes.push("Replaced an unsupported JSON value with null.");
      return `: null${suffix}`;
    },
  );
  working = withSafeInvalidValues;

  const formatted = formatJSON(working, indent, sortKeys);
  return {
    ...formatted,
    changed: changes.length > 0 && formatted.ok,
    changes: Array.from(new Set(changes)),
  };
}

// ─── Analysis helpers ─────────────────────────────────────────────────────────

export function sortKeysDeep(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map((item) => sortKeysDeep(item));
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .reduce<Record<string, JsonValue>>((acc, key) => {
        acc[key] = sortKeysDeep(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function getValueType(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function measureDepth(value: JsonValue): number {
  if (value === null || typeof value !== "object") return 1;
  const children = Array.isArray(value) ? value : Object.values(value);
  if (!children.length) return 1;
  return 1 + Math.max(...children.map((child) => measureDepth(child)));
}

function walkJson(value: JsonValue, stats: Omit<JsonStats, "characterCount" | "lineCount" | "minifiedCharacterCount" | "formattedCharacterCount" | "reductionPercent" | "rootType" | "topLevelCount" | "depth">) {
  if (value === null) {
    stats.nullCount += 1;
    return;
  }
  if (Array.isArray(value)) {
    stats.arrayCount += 1;
    value.forEach((item) => walkJson(item, stats));
    return;
  }
  if (typeof value === "object") {
    stats.objectCount += 1;
    const values = Object.values(value);
    stats.keyCount += Object.keys(value).length;
    values.forEach((item) => walkJson(item, stats));
    return;
  }
  if (typeof value === "string") stats.stringCount += 1;
  if (typeof value === "number") stats.numberCount += 1;
  if (typeof value === "boolean") stats.booleanCount += 1;
}

export function analyzeJSON(value: JsonValue, source = ""): JsonStats {
  const counters = {
    objectCount: 0,
    arrayCount: 0,
    keyCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
  };
  walkJson(value, counters);

  const minified = JSON.stringify(value);
  const formatted = JSON.stringify(value, null, 2);
  const characterCount = source.length || formatted.length;
  const lineCount = source ? source.split("\n").length : formatted.split("\n").length;
  const reductionPercent = characterCount > 0
    ? Math.max(0, Math.round(((characterCount - minified.length) / characterCount) * 100))
    : 0;

  return {
    ...counters,
    rootType: getValueType(value),
    topLevelCount: getTopLevelCountFromValue(value),
    depth: measureDepth(value),
    characterCount,
    lineCount,
    minifiedCharacterCount: minified.length,
    formattedCharacterCount: formatted.length,
    reductionPercent,
  };
}

export function getTopLevelCountFromValue(value: JsonValue): number {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") return Object.keys(value).length;
  return 0;
}

/** Rough count of top-level keys (works for objects and arrays). */
export function getTopLevelCount(json: string): number {
  try {
    const parsed = JSON.parse(json) as JsonValue;
    return getTopLevelCountFromValue(parsed);
  } catch {
    return 0;
  }
}

function stringifyCellValue(value: JsonValue | undefined): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function jsonToTableData(
  value: JsonValue | undefined,
  maxRows = 50,
  maxColumns = 12,
): JsonTableData {
  if (!Array.isArray(value)) {
    return {
      columns: [],
      rows: [],
      truncatedRows: 0,
      truncatedColumns: 0,
      reason: "Table view is available when the root JSON value is an array of objects.",
    };
  }

  const objectRows = value.filter(
    (item): item is Record<string, JsonValue> => item !== null && !Array.isArray(item) && typeof item === "object",
  );

  if (!objectRows.length) {
    return {
      columns: [],
      rows: [],
      truncatedRows: 0,
      truncatedColumns: 0,
      reason: "This array does not contain object rows that can be shown as a table.",
    };
  }

  const allColumns = Array.from(
    objectRows.reduce<Set<string>>((columns, row) => {
      Object.keys(row).forEach((key) => columns.add(key));
      return columns;
    }, new Set<string>()),
  );
  const columns = allColumns.slice(0, maxColumns);
  const rows = objectRows.slice(0, maxRows).map((row) =>
    columns.reduce<Record<string, string>>((acc, column) => {
      acc[column] = stringifyCellValue(row[column]);
      return acc;
    }, {}),
  );

  return {
    columns,
    rows,
    truncatedRows: Math.max(0, objectRows.length - rows.length),
    truncatedColumns: Math.max(0, allColumns.length - columns.length),
  };
}

// ─── Sample JSON ──────────────────────────────────────────────────────────────

export const SAMPLE_JSON = `{
  "user": {
    "id": 1042,
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "role": "developer",
    "active": true,
    "joinedAt": "2023-08-15T09:30:00Z",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    }
  },
  "projects": [
    {
      "id": "proj-001",
      "title": "API Dashboard",
      "status": "in-progress",
      "tags": ["api", "dashboard", "react"],
      "completionRate": 0.72
    },
    {
      "id": "proj-002",
      "title": "Mobile App",
      "status": "planning",
      "tags": ["mobile", "ios", "android"],
      "completionRate": 0.1
    }
  ],
  "meta": {
    "version": "2.1.0",
    "requestId": "req_8f3a9c2b",
    "processingMs": 43
  }
}`;

export const TABLE_SAMPLE_JSON = `[
  {
    "id": 1,
    "name": "Keyboard",
    "category": "Accessories",
    "price": 89.99,
    "inStock": true
  },
  {
    "id": 2,
    "name": "Wireless Mouse",
    "category": "Accessories",
    "price": 39.5,
    "inStock": true
  },
  {
    "id": 3,
    "name": "USB-C Hub",
    "category": "Adapters",
    "price": 54,
    "inStock": false
  }
]`;
