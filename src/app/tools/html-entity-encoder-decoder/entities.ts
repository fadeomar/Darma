import type {
  EncodeOptions,
  EntityCheck,
  EntityCodeSnippets,
  EntityMode,
  EntityOccurrence,
  EntityReport,
  EntityStats,
} from "./types";

export const HTML_ENTITY_INPUT_LIMIT = 100_000;

const NAMED_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "\u00A0": "&nbsp;",
  "©": "&copy;",
  "®": "&reg;",
  "™": "&trade;",
  "€": "&euro;",
  "£": "&pound;",
  "¥": "&yen;",
  "¢": "&cent;",
  "§": "&sect;",
  "¶": "&para;",
  "•": "&bull;",
  "…": "&hellip;",
  "–": "&ndash;",
  "—": "&mdash;",
  "‘": "&lsquo;",
  "’": "&rsquo;",
  "“": "&ldquo;",
  "”": "&rdquo;",
  "×": "&times;",
  "÷": "&divide;",
  "±": "&plusmn;",
  "°": "&deg;",
  "←": "&larr;",
  "→": "&rarr;",
  "↑": "&uarr;",
  "↓": "&darr;",
};

const DECODE_NAMED_ENTITIES = Object.entries(NAMED_ENTITIES).reduce<Record<string, string>>(
  (accumulator, [character, entity]) => {
    accumulator[entity.slice(1, -1)] = character;
    return accumulator;
  },
  { apos: "'" },
);

const COMPLETE_ENTITY_PATTERN = /&(#x?[0-9A-Za-z]+|[A-Za-z][A-Za-z0-9]+);/g;
const DOUBLE_ENCODED_PATTERN = /&amp;(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/gi;

function isValidUnicodeScalar(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff);
}

function parseEntityBody(body: string): {
  decoded: string;
  kind: EntityOccurrence["kind"];
  valid: boolean;
  issue?: string;
} {
  if (/^#x/i.test(body)) {
    if (!/^#x[0-9a-f]+$/i.test(body)) {
      return { decoded: "", kind: "malformed", valid: false, issue: "Invalid hexadecimal digits" };
    }
    const value = Number.parseInt(body.slice(2), 16);
    if (!isValidUnicodeScalar(value)) {
      return { decoded: "", kind: "malformed", valid: false, issue: "Invalid Unicode code point" };
    }
    return { decoded: String.fromCodePoint(value), kind: "hex", valid: true };
  }

  if (body.startsWith("#")) {
    if (!/^#[0-9]+$/.test(body)) {
      return { decoded: "", kind: "malformed", valid: false, issue: "Invalid decimal digits" };
    }
    const value = Number.parseInt(body.slice(1), 10);
    if (!isValidUnicodeScalar(value)) {
      return { decoded: "", kind: "malformed", valid: false, issue: "Invalid Unicode code point" };
    }
    return { decoded: String.fromCodePoint(value), kind: "decimal", valid: true };
  }

  const decoded = DECODE_NAMED_ENTITIES[body];
  if (decoded === undefined) {
    return { decoded: "", kind: "unknown", valid: false, issue: "Unknown named entity" };
  }
  return { decoded, kind: "named", valid: true };
}

function toCodePointLabel(value: string): string {
  if (!value) return "—";
  return Array.from(value)
    .map((character) => `U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`)
    .join(" ");
}

function isCompleteValidEntityAt(input: string, index: number): string | null {
  const match = /^&(#x?[0-9A-Za-z]+|[A-Za-z][A-Za-z0-9]+);/.exec(input.slice(index));
  if (!match) return null;
  return parseEntityBody(match[1] ?? "").valid ? match[0] : null;
}

function shouldEncodeCharacter(character: string, options: EncodeOptions): boolean {
  if (character === "\n" || character === "\r") return !options.preserveLineBreaks;
  if (character === "&" || character === "<" || character === ">") return true;
  if (options.context === "double-attribute" && character === '"') return true;
  if (options.context === "single-attribute" && character === "'") return true;
  if (options.context === "text" && options.convertQuotes && (character === '"' || character === "'")) return true;
  if (options.scope === "essential") return false;
  if (options.scope === "special" && NAMED_ENTITIES[character]) return true;
  return options.scope === "nonAscii" && (character.codePointAt(0) ?? 0) > 127;
}

function encodeCharacter(character: string, format: EncodeOptions["format"]): string {
  const codePoint = character.codePointAt(0) ?? 0;
  if (format === "named" && NAMED_ENTITIES[character]) return NAMED_ENTITIES[character];
  if (format === "hex") return `&#x${codePoint.toString(16).toUpperCase()};`;
  return `&#${codePoint};`;
}

export function encodeHtmlEntities(input: string, options: EncodeOptions): string {
  let output = "";
  let index = 0;

  while (index < input.length) {
    if (options.preserveExistingEntities && input[index] === "&") {
      const entity = isCompleteValidEntityAt(input, index);
      if (entity) {
        output += entity;
        index += entity.length;
        continue;
      }
    }

    const codePoint = input.codePointAt(index);
    if (codePoint === undefined) break;
    const character = String.fromCodePoint(codePoint);
    output += shouldEncodeCharacter(character, options)
      ? encodeCharacter(character, options.format)
      : character;
    index += character.length;
  }

  return output;
}

export function decodeHtmlEntities(input: string, passes: 1 | 2 = 1): string {
  let output = input;
  for (let pass = 0; pass < passes; pass += 1) {
    output = output.replace(COMPLETE_ENTITY_PATTERN, (raw, body: string) => {
      const parsed = parseEntityBody(body);
      return parsed.valid ? parsed.decoded : raw;
    });
  }
  return output;
}

export function inspectHtmlEntities(input: string): EntityOccurrence[] {
  const occurrences: EntityOccurrence[] = [];
  const pattern = new RegExp(COMPLETE_ENTITY_PATTERN.source, "g");
  for (const match of input.matchAll(pattern)) {
    const raw = match[0];
    const body = match[1] ?? "";
    const parsed = parseEntityBody(body);
    occurrences.push({
      index: match.index ?? 0,
      raw,
      decoded: parsed.valid ? parsed.decoded : raw,
      kind: parsed.kind,
      valid: parsed.valid,
      codePoints: parsed.valid ? toCodePointLabel(parsed.decoded) : "—",
      issue: parsed.issue,
    });
  }
  return occurrences;
}

export function getMalformedNumericEntities(input: string): string[] {
  const completeCandidates: string[] = input.match(/&(?:#x[^;\s<>&]*|#[^;\s<>&]*);/gi) ?? [];
  const invalidComplete = completeCandidates.filter((entity) => {
    const body = entity.slice(1, -1);
    return !parseEntityBody(body).valid;
  });
  const missingSemicolon = input.match(/&#(?:x[0-9a-f]+|[0-9]+)(?![0-9a-f]*;)/gi) ?? [];
  return [...new Set([...invalidComplete, ...missingSemicolon])];
}

export function getUnknownNamedEntities(input: string): string[] {
  return [...new Set(inspectHtmlEntities(input)
    .filter((occurrence) => occurrence.kind === "unknown")
    .map((occurrence) => occurrence.raw))];
}

export function getDoubleEncodedEntities(input: string): string[] {
  return [...new Set(input.match(DOUBLE_ENCODED_PATTERN) ?? [])];
}

export function getEntityStats(input: string, output: string): EntityStats {
  const occurrences = inspectHtmlEntities(output);
  const inputCodePoints = Array.from(input);
  const outputCodePoints = Array.from(output);
  const max = Math.max(inputCodePoints.length, outputCodePoints.length);
  let changedCharacters = 0;
  for (let index = 0; index < max; index += 1) {
    if (inputCodePoints[index] !== outputCodePoints[index]) changedCharacters += 1;
  }

  return {
    inputCharacters: input.length,
    outputCharacters: output.length,
    changedCharacters,
    entityCount: occurrences.length,
    namedEntities: occurrences.filter((item) => item.kind === "named").length,
    numericEntities: occurrences.filter((item) => item.kind === "decimal" || item.kind === "hex").length,
    unknownEntities: occurrences.filter((item) => !item.valid).length,
    lines: input ? input.split(/\r\n|\r|\n/).length : 0,
    expansionRatio: input.length ? output.length / input.length : 0,
    nonAsciiCharacters: Array.from(input).filter((character) => (character.codePointAt(0) ?? 0) > 127).length,
  };
}

export function buildEntityChecks(args: {
  input: string;
  output: string;
  mode: EntityMode;
  options: EncodeOptions;
  decodePasses: 1 | 2;
}): EntityCheck[] {
  const { input, output, mode, options, decodePasses } = args;
  const checks: EntityCheck[] = [];
  const malformed = getMalformedNumericEntities(input);
  const unknown = getUnknownNamedEntities(input);
  const doubleEncoded = getDoubleEncodedEntities(input);
  const stats = getEntityStats(input, output);

  if (!input) {
    return [{ id: "empty", level: "info", title: "Add content", message: "Paste text or HTML entities to begin the local conversion." }];
  }

  if (input.length > HTML_ENTITY_INPUT_LIMIT) {
    checks.push({ id: "limit", level: "danger", title: "Input exceeds the recommended limit", message: `Keep the input at or below ${HTML_ENTITY_INPUT_LIMIT.toLocaleString()} characters for responsive browser processing.` });
  }
  if (malformed.length) {
    checks.push({ id: "malformed", level: "danger", title: "Malformed numeric entities", message: `${malformed.length} malformed or unterminated numeric entity value(s) were detected.` });
  }
  if (unknown.length) {
    checks.push({ id: "unknown", level: "warning", title: "Unknown named entities", message: `${unknown.length} named entity value(s) are outside this tool's curated compatibility map and were preserved unchanged.` });
  }
  if (doubleEncoded.length) {
    checks.push({ id: "double", level: "warning", title: "Possible double encoding", message: `${doubleEncoded.length} value(s) look like an entity that was encoded more than once.${mode === "decode" && decodePasses === 1 ? " Try two decode passes only when the source is trusted." : ""}` });
  }
  if (mode === "encode" && options.context !== "text" && /[\r\n]/.test(input)) {
    checks.push({ id: "attribute-lines", level: "warning", title: "Multiline attribute value", message: "Line breaks inside HTML attributes can be legal but are easy to mishandle. Review the generated value in its final markup context." });
  }
  if (mode === "encode" && stats.expansionRatio > 5) {
    checks.push({ id: "expansion", level: "warning", title: "Large encoded expansion", message: `The output is ${stats.expansionRatio.toFixed(1)}× the input size. Encoding every non-ASCII character can reduce readability and increase payload size.` });
  }
  if (mode === "decode" && /[<>]/.test(output)) {
    checks.push({ id: "decoded-markup", level: "warning", title: "Decoded markup characters", message: "The decoded output contains angle brackets. Do not inject it with innerHTML unless it has been sanitized for the target context." });
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(output)) {
    checks.push({ id: "controls", level: "warning", title: "Control characters present", message: "The output contains non-printing control characters that can cause logging, transport, or display issues." });
  }

  checks.push({ id: "context", level: "info", title: "Encoding is context-specific", message: "HTML entity encoding is not HTML sanitization. JavaScript, CSS, URL, and unquoted-attribute contexts require different defenses." });

  if (!checks.some((check) => check.level === "danger" || check.level === "warning")) {
    checks.unshift({ id: "ready", level: "success", title: "Conversion looks consistent", message: "No malformed, unknown, or obvious double-encoded entities were detected." });
  }
  return checks;
}

export function buildEntityCodeSnippets(options: EncodeOptions): EntityCodeSnippets {
  const contextQuote = options.context === "double-attribute" ? '"' : options.context === "single-attribute" ? "'" : "";
  const javascript = `const ENTITY_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function encodeHtmlText(value) {
  return Array.from(value, (char) => {
    if (char === "&" || char === "<" || char === ">") return ENTITY_MAP[char];
    ${contextQuote ? `if (char === ${JSON.stringify(contextQuote)}) return ENTITY_MAP[char];` : ""}
    return char;
  }).join("");
}

export function decodeCommonEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}
`;

  const react = `import type { ReactNode } from "react";

// React escapes string children automatically.
export function SafeText({ children }: { children: string }): ReactNode {
  return <span>{children}</span>;
}

// Avoid dangerouslySetInnerHTML for decoded or untrusted content.
`;
  return { javascript, react };
}

export function buildEntityReport(args: {
  input: string;
  output: string;
  mode: EntityMode;
  options: EncodeOptions;
  decodePasses: 1 | 2;
  checks: EntityCheck[];
  occurrences: EntityOccurrence[];
}): EntityReport {
  return {
    generatedAt: new Date().toISOString(),
    mode: args.mode,
    options: args.options,
    decodePasses: args.decodePasses,
    stats: getEntityStats(args.input, args.output),
    checks: args.checks,
    occurrences: args.occurrences,
    input: args.input,
    output: args.output,
  };
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildEntityCsv(occurrences: EntityOccurrence[]): string {
  const rows = ["index,raw,decoded,kind,valid,codePoints,issue"];
  for (const occurrence of occurrences) {
    rows.push([
      occurrence.index,
      occurrence.raw,
      occurrence.decoded,
      occurrence.kind,
      occurrence.valid,
      occurrence.codePoints,
      occurrence.issue ?? "",
    ].map(csvCell).join(","));
  }
  return `${rows.join("\n")}\n`;
}
