import {
  analyzeJSON,
  formatJSON,
  minifyJSON,
  parseJSON,
  type IndentOption,
  type JsonStats,
  type JsonValue,
} from "./utils";

export type JsonFormatterView = "text" | "tree" | "table" | "stats";
export type JsonFormatterOperation =
  | "format"
  | "minify"
  | "validate"
  | "repair"
  | "sort"
  | "escape"
  | "unescape"
  | "preview";

export type JsonFormatterSettings = {
  indent: IndentOption;
  sortKeys: boolean;
  preferredView: JsonFormatterView;
};

export type JsonFormatterProfileFile = {
  schema: "darma.json-formatter-profile";
  version: 1;
  exportedAt: string;
  settings: JsonFormatterSettings;
  note: string;
};

export type JsonAuditSeverity = "error" | "warning" | "info" | "pass";

export type JsonAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: JsonAuditSeverity;
};

export type JsonSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type JsonFormatterSnapshot = {
  input: string;
  resultText: string;
  parsed?: JsonValue;
  valid: boolean;
  validationMessage?: string;
  stats?: JsonStats;
  settings: JsonFormatterSettings;
  operation: JsonFormatterOperation;
  repairChanges: string[];
  historyEnabled: boolean;
  unsafeIntegerLiterals: string[];
  sensitiveKeyPaths: string[];
  prototypeKeyPaths: string[];
};

export const MAX_JSON_IMPORT_BYTES = 5 * 1024 * 1024;
export const JSON_FORMATTER_PROFILE_NOTE =
  "This profile stores formatter settings only. It intentionally excludes pasted JSON, generated output, and local history.";

export const DEFAULT_JSON_FORMATTER_SETTINGS: JsonFormatterSettings = {
  indent: 2,
  sortKeys: false,
  preferredView: "text",
};

export const JSON_FORMATTER_PRESETS: Array<{
  id: string;
  title: string;
  description: string;
  settings: JsonFormatterSettings;
  operation: "format" | "minify" | "sort";
}> = [
  {
    id: "api-readable",
    title: "Readable API",
    description: "Two-space formatting without changing key order.",
    settings: { indent: 2, sortKeys: false, preferredView: "text" },
    operation: "format",
  },
  {
    id: "review-diff",
    title: "Stable review",
    description: "Four-space formatting with recursively sorted keys.",
    settings: { indent: 4, sortKeys: true, preferredView: "text" },
    operation: "sort",
  },
  {
    id: "compact-transport",
    title: "Compact transport",
    description: "Minified JSON for payload size checks.",
    settings: { indent: 2, sortKeys: false, preferredView: "stats" },
    operation: "minify",
  },
  {
    id: "data-inspection",
    title: "Data inspection",
    description: "Readable formatting with the tree inspector selected.",
    settings: { indent: 2, sortKeys: false, preferredView: "tree" },
    operation: "format",
  },
];

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeIndent(value: unknown): IndentOption {
  if (value === 4 || value === "tab") return value;
  return 2;
}

function normalizeView(value: unknown): JsonFormatterView {
  return value === "tree" || value === "table" || value === "stats"
    ? value
    : "text";
}

export function normalizeJsonFormatterSettings(
  input: unknown,
  fallback: JsonFormatterSettings = DEFAULT_JSON_FORMATTER_SETTINGS,
): JsonFormatterSettings {
  const source = isRecord(input) ? input : {};
  return {
    indent:
      source.indent === undefined
        ? fallback.indent
        : normalizeIndent(source.indent),
    sortKeys:
      typeof source.sortKeys === "boolean"
        ? source.sortKeys
        : fallback.sortKeys,
    preferredView:
      source.preferredView === undefined
        ? fallback.preferredView
        : normalizeView(source.preferredView),
  };
}

export function createJsonFormatterProfile(
  settings: JsonFormatterSettings,
  exportedAt = new Date().toISOString(),
): JsonFormatterProfileFile {
  return {
    schema: "darma.json-formatter-profile",
    version: 1,
    exportedAt,
    settings: normalizeJsonFormatterSettings(settings),
    note: JSON_FORMATTER_PROFILE_NOTE,
  };
}

export function parseJsonFormatterProfile(input: string): JsonFormatterSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("The selected profile is not valid JSON.");
  }

  if (!isRecord(parsed))
    throw new Error("The formatter profile must contain a JSON object.");
  if (parsed.schema !== "darma.json-formatter-profile")
    throw new Error("This is not a Darma JSON Formatter profile.");
  if (parsed.version !== 1)
    throw new Error("This JSON Formatter profile version is not supported.");
  if (!isRecord(parsed.settings))
    throw new Error("The formatter profile does not contain valid settings.");

  return normalizeJsonFormatterSettings(parsed.settings);
}

function scanNumberTokens(source: string): string[] {
  const values: string[] = [];
  let index = 0;
  let inString = false;
  let escaped = false;

  while (index < source.length) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      index += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      index += 1;
      continue;
    }

    if (char === "-" || /\d/.test(char)) {
      const start = index;
      if (source[index] === "-") index += 1;
      if (source[index] === "0") index += 1;
      else {
        while (index < source.length && /\d/.test(source[index])) index += 1;
      }
      if (source[index] === ".") {
        index += 1;
        while (index < source.length && /\d/.test(source[index])) index += 1;
      }
      if (source[index] === "e" || source[index] === "E") {
        index += 1;
        if (source[index] === "+" || source[index] === "-") index += 1;
        while (index < source.length && /\d/.test(source[index])) index += 1;
      }
      values.push(source.slice(start, index));
      continue;
    }

    index += 1;
  }

  return values;
}

export function findUnsafeIntegerLiterals(source: string): string[] {
  const unsafe: string[] = [];
  for (const token of scanNumberTokens(source)) {
    if (/[.eE]/.test(token)) continue;
    try {
      const value = BigInt(token);
      if (
        value > BigInt(Number.MAX_SAFE_INTEGER) ||
        value < BigInt(Number.MIN_SAFE_INTEGER)
      ) {
        if (!unsafe.includes(token)) unsafe.push(token);
      }
    } catch {
      // Invalid number tokens are handled by the JSON parser.
    }
  }
  return unsafe.slice(0, 20);
}

const SENSITIVE_KEY_PATTERN =
  /(?:password|passwd|secret|token|api[-_]?key|authorization|private[-_]?key|access[-_]?key|client[-_]?secret|refresh[-_]?token)/i;
const PROTOTYPE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function collectKeyPaths(
  value: JsonValue,
  predicate: (key: string) => boolean,
  path = "$",
  results: string[] = [],
): string[] {
  if (results.length >= 20 || value === null || typeof value !== "object")
    return results;

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length && results.length < 20; index += 1) {
      collectKeyPaths(value[index], predicate, `${path}[${index}]`, results);
    }
    return results;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (predicate(key)) results.push(childPath);
    if (results.length >= 20) break;
    collectKeyPaths(child, predicate, childPath, results);
  }
  return results;
}

export function findSensitiveKeyPaths(value: JsonValue): string[] {
  return collectKeyPaths(value, (key) => SENSITIVE_KEY_PATTERN.test(key));
}

export function findPrototypeKeyPaths(value: JsonValue): string[] {
  return collectKeyPaths(value, (key) => PROTOTYPE_KEYS.has(key));
}

export function buildJsonFormatterSnapshot({
  input,
  resultText,
  settings,
  operation = "preview",
  repairChanges = [],
  historyEnabled = false,
}: {
  input: string;
  resultText?: string;
  settings: JsonFormatterSettings;
  operation?: JsonFormatterOperation;
  repairChanges?: string[];
  historyEnabled?: boolean;
}): JsonFormatterSnapshot {
  const target = resultText?.trim() ? resultText : input;
  const parsedResult = parseJSON(target);
  const parsed = parsedResult.ok ? parsedResult.parsed : undefined;
  const validationMessage = parsedResult.ok
    ? undefined
    : "error" in parsedResult.validation
      ? parsedResult.validation.error
      : "The JSON could not be parsed.";

  return {
    input,
    resultText: target,
    parsed,
    valid: Boolean(parsedResult.ok && parsed !== undefined),
    validationMessage,
    stats: parsed === undefined ? undefined : analyzeJSON(parsed, target),
    settings: normalizeJsonFormatterSettings(settings),
    operation,
    repairChanges: repairChanges.slice(0, 20),
    historyEnabled,
    unsafeIntegerLiterals: findUnsafeIntegerLiterals(input),
    sensitiveKeyPaths:
      parsed === undefined ? [] : findSensitiveKeyPaths(parsed),
    prototypeKeyPaths:
      parsed === undefined ? [] : findPrototypeKeyPaths(parsed),
  };
}

function nodeCount(stats?: JsonStats): number {
  if (!stats) return 0;
  return (
    stats.objectCount +
    stats.arrayCount +
    stats.stringCount +
    stats.numberCount +
    stats.booleanCount +
    stats.nullCount
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function buildJsonFormatterAudit(
  snapshot: JsonFormatterSnapshot,
): JsonAuditCheck[] {
  const checks: JsonAuditCheck[] = [];
  const byteSize = new TextEncoder().encode(snapshot.resultText).length;
  const nodes = nodeCount(snapshot.stats);

  if (!snapshot.input.trim()) {
    checks.push({
      id: "input-empty",
      title: "JSON input required",
      message: "Paste JSON or load a local file before running production checks.",
      severity: "error",
    });
    return checks;
  }

  if (!snapshot.valid) {
    checks.push({
      id: "json-invalid",
      title: "JSON is not valid",
      message:
        snapshot.validationMessage ??
        "Resolve the syntax error or use the conservative repair helper.",
      severity: "error",
    });
    return checks;
  }

  checks.push({
    id: "json-valid",
    title: "JSON parses successfully",
    message: "The current result can be consumed by standards-compliant JSON parsers.",
    severity: "pass",
  });

  if (snapshot.unsafeIntegerLiterals.length) {
    checks.push({
      id: "unsafe-integers",
      title: "Unsafe integer precision",
      message: `${snapshot.unsafeIntegerLiterals.length} integer literal(s) exceed JavaScript's safe integer range and may already have lost precision after JSON.parse. Encode identifiers as strings when exact digits matter.`,
      severity: "error",
    });
  } else {
    checks.push({
      id: "safe-integers",
      title: "Integer precision check passed",
      message: "No integer literal outside JavaScript's safe integer range was detected.",
      severity: "pass",
    });
  }

  if (snapshot.prototypeKeyPaths.length) {
    checks.push({
      id: "prototype-keys",
      title: "Prototype-sensitive keys found",
      message: `${snapshot.prototypeKeyPaths.length} path(s) use __proto__, prototype, or constructor. Treat this payload carefully before deep-merging it into application objects.`,
      severity: "warning",
    });
  }

  if (snapshot.sensitiveKeyPaths.length) {
    checks.push({
      id: "sensitive-keys",
      title: "Secret-like fields detected",
      message: `${snapshot.sensitiveKeyPaths.length} field path(s) look like credentials or tokens. Review downloads, clipboard use, screenshots, and optional local history before sharing.`,
      severity: "warning",
    });
  }

  if (snapshot.historyEnabled && snapshot.sensitiveKeyPaths.length) {
    checks.push({
      id: "history-sensitive",
      title: "Local history contains sensitive payloads",
      message: "Disable or clear local history when working with credentials on a shared browser profile.",
      severity: "warning",
    });
  }

  if (byteSize > MAX_JSON_IMPORT_BYTES) {
    checks.push({
      id: "payload-oversized",
      title: "Payload exceeds the import guard",
      message: `${formatBytes(byteSize)} is above the 5 MB browser-workbench limit. Use a streaming or command-line JSON processor for this payload.`,
      severity: "error",
    });
  } else if (byteSize > 1024 * 1024) {
    checks.push({
      id: "payload-large",
      title: "Large browser payload",
      message: `${formatBytes(byteSize)} may make Monaco, tree expansion, and repeated formatting slow on lower-memory devices.`,
      severity: "warning",
    });
  } else {
    checks.push({
      id: "payload-size",
      title: "Payload size is browser-friendly",
      message: `${formatBytes(byteSize)} is within the recommended interactive workbench range.`,
      severity: "pass",
    });
  }

  if ((snapshot.stats?.depth ?? 0) > 40) {
    checks.push({
      id: "depth-extreme",
      title: "Extreme nesting depth",
      message: `Depth ${snapshot.stats?.depth} can be difficult to review and may exceed limits in downstream validators or databases.`,
      severity: "warning",
    });
  } else if ((snapshot.stats?.depth ?? 0) > 20) {
    checks.push({
      id: "depth-high",
      title: "Deeply nested payload",
      message: `Depth ${snapshot.stats?.depth} is valid, but consider flattening the contract or validating it against a schema.`,
      severity: "info",
    });
  }

  if (nodes > 50_000) {
    checks.push({
      id: "node-count-high",
      title: "High node count",
      message: `${nodes.toLocaleString()} values and containers can make tree inspection expensive. Prefer text or stats view.`,
      severity: "warning",
    });
  }

  if (
    snapshot.stats?.rootType !== "object" &&
    snapshot.stats?.rootType !== "array"
  ) {
    checks.push({
      id: "primitive-root",
      title: "Primitive root value",
      message: `A root ${snapshot.stats?.rootType} is valid JSON, but some APIs and tooling expect an object or array contract.`,
      severity: "info",
    });
  }

  if (snapshot.settings.sortKeys) {
    checks.push({
      id: "sorted-keys",
      title: "Key sorting is enabled",
      message: "Sorting improves stable diffs but intentionally changes property order in the exported text.",
      severity: "info",
    });
  }

  if (snapshot.repairChanges.length) {
    checks.push({
      id: "repair-applied",
      title: "Automatic repair changed the source",
      message: `${snapshot.repairChanges.length} repair rule(s) were applied. Review the formatted result before replacing the original file.`,
      severity: "warning",
    });
  }

  checks.push({
    id: "schema-reminder",
    title: "Syntax is not schema validation",
    message: "A valid payload can still violate required fields, types, enums, or business rules. Validate important contracts with JSON Schema or application tests.",
    severity: "info",
  });

  return checks;
}

export function summarizeJsonFormatterAudit(checks: JsonAuditCheck[]): {
  status: "Blocked" | "Review" | "Ready";
  errors: number;
  warnings: number;
  passes: number;
} {
  const errors = checks.filter((check) => check.severity === "error").length;
  const warnings = checks.filter((check) => check.severity === "warning").length;
  const passes = checks.filter((check) => check.severity === "pass").length;
  return {
    status: errors ? "Blocked" : warnings ? "Review" : "Ready",
    errors,
    warnings,
    passes,
  };
}

export function buildJsonFormatterSummaryCards(
  snapshot: JsonFormatterSnapshot,
  checks = buildJsonFormatterAudit(snapshot),
): JsonSummaryCard[] {
  const summary = summarizeJsonFormatterAudit(checks);
  const nodes = nodeCount(snapshot.stats);
  const byteSize = new TextEncoder().encode(snapshot.resultText).length;
  return [
    {
      label: "Root",
      value: snapshot.stats?.rootType ?? "—",
      detail: snapshot.stats
        ? `${snapshot.stats.topLevelCount.toLocaleString()} top-level item(s)`
        : "Waiting for valid JSON",
    },
    {
      label: "Structure",
      value: snapshot.stats ? `${snapshot.stats.depth} levels` : "—",
      detail: snapshot.stats
        ? `${nodes.toLocaleString()} total value nodes`
        : "No structure available",
    },
    {
      label: "Payload",
      value: snapshot.resultText ? formatBytes(byteSize) : "—",
      detail: snapshot.stats
        ? `${snapshot.stats.reductionPercent}% removable formatting whitespace`
        : "Paste JSON to measure",
    },
    {
      label: "Readiness",
      value: summary.status,
      detail: `${summary.errors} error(s), ${summary.warnings} warning(s)`,
    },
  ];
}

function escapeCsv(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildJsonFormatterMetricsCsv(
  snapshot: JsonFormatterSnapshot,
): string {
  const checks = buildJsonFormatterAudit(snapshot);
  const summary = summarizeJsonFormatterAudit(checks);
  const stats = snapshot.stats;
  const headers = [
    "valid",
    "root_type",
    "top_level_count",
    "depth",
    "object_count",
    "array_count",
    "key_count",
    "string_count",
    "number_count",
    "boolean_count",
    "null_count",
    "characters",
    "lines",
    "minified_characters",
    "reduction_percent",
    "unsafe_integer_count",
    "sensitive_key_count",
    "prototype_key_count",
    "audit_status",
    "audit_errors",
    "audit_warnings",
  ];
  const row = [
    snapshot.valid,
    stats?.rootType ?? "",
    stats?.topLevelCount ?? 0,
    stats?.depth ?? 0,
    stats?.objectCount ?? 0,
    stats?.arrayCount ?? 0,
    stats?.keyCount ?? 0,
    stats?.stringCount ?? 0,
    stats?.numberCount ?? 0,
    stats?.booleanCount ?? 0,
    stats?.nullCount ?? 0,
    stats?.characterCount ?? 0,
    stats?.lineCount ?? 0,
    stats?.minifiedCharacterCount ?? 0,
    stats?.reductionPercent ?? 0,
    snapshot.unsafeIntegerLiterals.length,
    snapshot.sensitiveKeyPaths.length,
    snapshot.prototypeKeyPaths.length,
    summary.status,
    summary.errors,
    summary.warnings,
  ];
  return `${headers.join(",")}\n${row.map(escapeCsv).join(",")}\n`;
}

export function buildJsonFormatterMarkdownReport(
  snapshot: JsonFormatterSnapshot,
  exportedAt = new Date().toISOString(),
): string {
  const checks = buildJsonFormatterAudit(snapshot);
  const summary = summarizeJsonFormatterAudit(checks);
  const stats = snapshot.stats;
  const lines = [
    "# Darma JSON Formatter audit",
    "",
    `Generated: ${exportedAt}`,
    `Status: ${summary.status}`,
    "",
    "## Formatter profile",
    "",
    `- Indent: ${snapshot.settings.indent === "tab" ? "tabs" : `${snapshot.settings.indent} spaces`}`,
    `- Sort keys: ${snapshot.settings.sortKeys ? "enabled" : "disabled"}`,
    `- Preferred view: ${snapshot.settings.preferredView}`,
    `- Last operation: ${snapshot.operation}`,
    "",
    "## Payload metrics",
    "",
    `- Valid JSON: ${snapshot.valid ? "yes" : "no"}`,
    `- Root type: ${stats?.rootType ?? "unavailable"}`,
    `- Top-level items: ${stats?.topLevelCount ?? 0}`,
    `- Depth: ${stats?.depth ?? 0}`,
    `- Keys: ${stats?.keyCount ?? 0}`,
    `- Characters: ${stats?.characterCount ?? snapshot.resultText.length}`,
    `- Minified characters: ${stats?.minifiedCharacterCount ?? 0}`,
    `- Unsafe integers: ${snapshot.unsafeIntegerLiterals.length}`,
    `- Secret-like key paths: ${snapshot.sensitiveKeyPaths.length}`,
    `- Prototype-sensitive key paths: ${snapshot.prototypeKeyPaths.length}`,
    "",
    "## Production checks",
    "",
    ...checks.map(
      (check) =>
        `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`,
    ),
    "",
    "## Privacy",
    "",
    "This report contains metrics, settings, and key-path counts only. It intentionally excludes JSON values and the original payload. The ZIP production pack also contains the formatted and minified payload files, so review those files before sharing.",
    "",
  ];
  return lines.join("\n");
}

function safeModuleJson(value: JsonValue, spacing: number | string): string {
  return JSON.stringify(value, null, spacing)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildJsonFormatterJavaScriptModule(
  snapshot: JsonFormatterSnapshot,
): string {
  if (snapshot.parsed === undefined)
    throw new Error("Valid JSON is required before exporting a module.");
  if (snapshot.unsafeIntegerLiterals.length)
    throw new Error("Convert unsafe integer identifiers to strings before exporting a JavaScript module.");
  const indent = snapshot.settings.indent === "tab" ? "\t" : snapshot.settings.indent;
  return `// Generated by Darma JSON Formatter\nconst data = ${safeModuleJson(snapshot.parsed, indent)};\n\nexport default data;\n`;
}

export function buildJsonFormatterTypeScriptModule(
  snapshot: JsonFormatterSnapshot,
): string {
  if (snapshot.parsed === undefined)
    throw new Error("Valid JSON is required before exporting a module.");
  if (snapshot.unsafeIntegerLiterals.length)
    throw new Error("Convert unsafe integer identifiers to strings before exporting a TypeScript module.");
  const indent = snapshot.settings.indent === "tab" ? "\t" : snapshot.settings.indent;
  return `// Generated by Darma JSON Formatter\nexport const data = ${safeModuleJson(snapshot.parsed, indent)} as const;\n\nexport type JsonData = typeof data;\nexport default data;\n`;
}

export function buildJsonFormatterProductionFiles(
  snapshot: JsonFormatterSnapshot,
  exportedAt = new Date().toISOString(),
): Record<string, string> {
  if (snapshot.parsed === undefined)
    throw new Error("Valid JSON is required before creating a production pack.");
  if (snapshot.unsafeIntegerLiterals.length)
    throw new Error("Convert unsafe integer identifiers to strings before creating a production pack.");

  const formatted = formatJSON(
    snapshot.resultText,
    snapshot.settings.indent,
    snapshot.settings.sortKeys,
  );
  const minified = minifyJSON(
    snapshot.resultText,
    snapshot.settings.sortKeys,
  );
  if (!formatted.output || !minified.output)
    throw new Error("The current JSON could not be exported.");

  return {
    "formatted.json": `${formatted.output}\n`,
    "minified.json": `${minified.output}\n`,
    "json-data.js": buildJsonFormatterJavaScriptModule(snapshot),
    "json-data.ts": buildJsonFormatterTypeScriptModule(snapshot),
    "json-formatter-profile.json": `${JSON.stringify(createJsonFormatterProfile(snapshot.settings, exportedAt), null, 2)}\n`,
    "json-audit.md": buildJsonFormatterMarkdownReport(snapshot, exportedAt),
    "json-metrics.csv": buildJsonFormatterMetricsCsv(snapshot),
  };
}
