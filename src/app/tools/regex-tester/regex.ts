import type {
  FlagInfo,
  RegexBuildError,
  RegexFlag,
  RegexHighlightSegment,
  RegexMatchResult,
  RegexPatternStats,
  RegexProductionCheck,
  RegexRiskAssessment,
} from "./types";

export const REGEX_INPUT_LIMIT = 50_000;
export const REGEX_PATTERN_LIMIT = 2_000;
export const REGEX_REPLACEMENT_LIMIT = 10_000;
export const REGEX_MAX_MATCHES = 1_000;
export const REGEX_RISK_INPUT_LIMIT = 2_000;

const ALLOWED_FLAGS: RegexFlag[] = ["g", "i", "m", "s", "u", "y", "d"];

const FLAG_DETAILS: Record<RegexFlag, Omit<FlagInfo, "enabled">> = {
  g: { flag: "g", label: "Global", description: "Find all matches instead of stopping after the first match." },
  i: { flag: "i", label: "Ignore case", description: "Match letters without requiring the same uppercase or lowercase form." },
  m: { flag: "m", label: "Multiline", description: "Make ^ and $ match the start and end of each line." },
  s: { flag: "s", label: "Dot all", description: "Allow . to match newline characters." },
  u: { flag: "u", label: "Unicode", description: "Use Unicode-aware matching for code points and escapes." },
  y: { flag: "y", label: "Sticky", description: "Match only from the regex lastIndex position." },
  d: { flag: "d", label: "Indices", description: "Expose match and capture index ranges when the browser supports it." },
};

export function normalizeFlags(flags: string): string {
  const unique = new Set<RegexFlag>();
  for (const flag of flags) {
    if (ALLOWED_FLAGS.includes(flag as RegexFlag)) unique.add(flag as RegexFlag);
  }
  return ALLOWED_FLAGS.filter((flag) => unique.has(flag)).join("");
}

export function buildRegex(pattern: string, flags: string): RegExp | RegexBuildError {
  if (pattern.length > REGEX_PATTERN_LIMIT) {
    return { ok: false, message: `Pattern is too large. Keep it under ${REGEX_PATTERN_LIMIT.toLocaleString()} characters.` };
  }

  const invalidFlags = [...flags].filter((flag) => !ALLOWED_FLAGS.includes(flag as RegexFlag));
  if (invalidFlags.length) {
    return { ok: false, message: `Unsupported JavaScript regex flag: ${invalidFlags.join(", ")}` };
  }

  const duplicateFlags = [...flags].filter((flag, index, allFlags) => allFlags.indexOf(flag) !== index);
  if (duplicateFlags.length) {
    return { ok: false, message: `Duplicate regex flag: ${Array.from(new Set(duplicateFlags)).join(", ")}` };
  }

  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid regular expression.",
    };
  }
}

function getLineAndColumn(text: string, index: number) {
  const before = text.slice(0, index);
  const lines = before.split(/\r\n|\r|\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

export function findMatches(pattern: string, flags: string, text: string): RegexMatchResult[] {
  if (text.length > REGEX_INPUT_LIMIT) return [];

  const regex = buildRegex(pattern, flags);
  if (!(regex instanceof RegExp)) return [];

  const results: RegexMatchResult[] = [];
  const canContinue = regex.global || regex.sticky;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null && results.length < REGEX_MAX_MATCHES) {
    const namedGroups = match.groups
      ? Object.entries(match.groups).map(([name, value]) => ({ name, value }))
      : [];
    const position = getLineAndColumn(text, match.index);

    results.push({
      match: match[0],
      index: match.index,
      endIndex: match.index + match[0].length,
      line: position.line,
      column: position.column,
      captures: match.slice(1).map((value, index) => ({ index: index + 1, value })),
      namedGroups,
    });

    if (!canContinue) break;
    if (match[0].length === 0) {
      regex.lastIndex += 1;
      if (regex.lastIndex > text.length) break;
    }
  }

  return results;
}

export function replaceMatches(pattern: string, flags: string, text: string, replacement: string): string {
  if (text.length > REGEX_INPUT_LIMIT || replacement.length > REGEX_REPLACEMENT_LIMIT) return text;

  const regex = buildRegex(pattern, flags);
  if (!(regex instanceof RegExp)) return text;

  return text.replace(regex, replacement);
}

export function explainFlags(flags: string): FlagInfo[] {
  const normalized = normalizeFlags(flags);
  return ALLOWED_FLAGS.map((flag) => ({
    ...FLAG_DETAILS[flag],
    enabled: normalized.includes(flag),
  }));
}

export function countWords(value: string): number {
  const words = value.trim().match(/\S+/g);
  return words?.length ?? 0;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getPatternStats(pattern: string): RegexPatternStats {
  let captureGroups = 0;
  const namedGroups: string[] = [];
  let escaped = false;
  let inCharacterClass = false;

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "[") {
      inCharacterClass = true;
      continue;
    }
    if (character === "]") {
      inCharacterClass = false;
      continue;
    }
    if (character !== "(" || inCharacterClass) continue;

    if (pattern[index + 1] !== "?") {
      captureGroups += 1;
      continue;
    }

    if (pattern[index + 2] === "<" && !["=", "!"].includes(pattern[index + 3] ?? "")) {
      const end = pattern.indexOf(">", index + 3);
      if (end > index + 3) {
        captureGroups += 1;
        namedGroups.push(pattern.slice(index + 3, end));
      }
    }
  }

  return { captureGroups, namedGroups };
}

export function assessRegexRisk(pattern: string): RegexRiskAssessment {
  const reasons: string[] = [];
  const nestedQuantifier = /\((?:[^()\\]|\\.)*(?:[+*]|\{\d+,?\d*\})(?:[^()\\]|\\.)*\)(?:[+*]|\{\d+,?\d*\})/;
  const repeatedWildcard = /(?:\.\*|\.\+)(?:[^|]|\|[^|])*(?:\.\*|\.\+)/;
  const overlappingAlternation = /\((?:[^()\\]|\\.)*\|(?:[^()\\]|\\.)*\)(?:[+*]|\{\d+,?\d*\})/;

  if (nestedQuantifier.test(pattern)) reasons.push("Nested quantifiers may cause excessive backtracking on long input.");
  if (repeatedWildcard.test(pattern)) reasons.push("Multiple broad wildcards can make matching expensive and unpredictable.");
  if (overlappingAlternation.test(pattern)) reasons.push("A repeated alternation may have overlapping paths and slow down on failures.");

  if (reasons.length >= 2) return { level: "high", reasons, blocksLongInput: true };
  if (reasons.length === 1) return { level: "medium", reasons, blocksLongInput: true };
  return { level: "low", reasons: [], blocksLongInput: false };
}

export function buildHighlightSegments(text: string, matches: RegexMatchResult[]): RegexHighlightSegment[] {
  if (!text) return [];
  if (!matches.length) return [{ id: "plain-0", text, highlighted: false }];

  const segments: RegexHighlightSegment[] = [];
  let cursor = 0;

  matches.forEach((match, matchIndex) => {
    if (match.index > cursor) {
      segments.push({ id: `plain-${cursor}`, text: text.slice(cursor, match.index), highlighted: false });
    }

    segments.push({
      id: `match-${matchIndex}-${match.index}`,
      text: match.match || "▏",
      highlighted: true,
      matchIndex,
      zeroLength: match.match.length === 0,
    });
    cursor = Math.max(cursor, match.endIndex);
  });

  if (cursor < text.length) {
    segments.push({ id: `plain-${cursor}`, text: text.slice(cursor), highlighted: false });
  }

  return segments;
}

export function calculateCoverage(matches: RegexMatchResult[], textLength: number): number {
  if (!textLength) return 0;
  const matchedCharacters = matches.reduce((total, match) => total + Math.max(0, match.endIndex - match.index), 0);
  return Math.min(100, (matchedCharacters / textLength) * 100);
}

function referencedReplacementGroups(replacement: string) {
  const numeric = [...replacement.matchAll(/\$(\d{1,2})/g)].map((match) => Number(match[1]));
  const named = [...replacement.matchAll(/\$<([^>]+)>/g)].map((match) => match[1]);
  return { numeric, named };
}

export function buildProductionChecks({
  pattern,
  flags,
  text,
  replacement,
  built,
  matches,
  risk,
}: {
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  built: RegExp | RegexBuildError;
  matches: RegexMatchResult[];
  risk: RegexRiskAssessment;
}): RegexProductionCheck[] {
  const checks: RegexProductionCheck[] = [];
  const stats = getPatternStats(pattern);

  if (!(built instanceof RegExp)) {
    checks.push({ id: "syntax", title: "Pattern syntax", message: built.message, severity: "danger" });
    return checks;
  }

  checks.push({ id: "syntax", title: "Pattern syntax", message: "The expression compiles as a JavaScript RegExp.", severity: "success" });

  if (!pattern) {
    checks.push({ id: "empty-pattern", title: "Empty pattern", message: "An empty regex matches at every position. Add a specific pattern before production use.", severity: "warning" });
  }

  if (risk.level !== "low") {
    checks.push({
      id: "backtracking",
      title: "Backtracking risk",
      message: risk.reasons.join(" "),
      severity: risk.level === "high" ? "danger" : "warning",
    });
  } else {
    checks.push({ id: "backtracking", title: "Backtracking heuristic", message: "No common nested-quantifier risk was detected. Test with realistic worst-case input before deployment.", severity: "success" });
  }

  if (/\\p\{[^}]+\}/.test(pattern) && !flags.includes("u")) {
    checks.push({ id: "unicode", title: "Unicode property escape", message: "Add the u flag when using Unicode property escapes such as \\p{Letter}.", severity: "warning" });
  }

  if (!flags.includes("g") && matches.length === 1) {
    checks.push({ id: "global", title: "First match only", message: "The g flag is disabled, so JavaScript stops after the first match and replacement.", severity: "info" });
  }

  if (matches.length >= REGEX_MAX_MATCHES) {
    checks.push({ id: "match-limit", title: "Match limit reached", message: `Preview stopped at ${REGEX_MAX_MATCHES.toLocaleString()} matches. Narrow the pattern before exporting results.`, severity: "warning" });
  }

  const references = referencedReplacementGroups(replacement);
  const invalidNumeric = references.numeric.filter((group) => group > stats.captureGroups);
  const invalidNamed = references.named.filter((name) => !stats.namedGroups.includes(name));
  if (invalidNumeric.length || invalidNamed.length) {
    checks.push({
      id: "replacement-groups",
      title: "Replacement references",
      message: `Unknown references: ${[...invalidNumeric.map((group) => `$${group}`), ...invalidNamed.map((name) => `$<${name}>`)].join(", ")}.`,
      severity: "warning",
    });
  } else if (replacement) {
    checks.push({ id: "replacement-groups", title: "Replacement references", message: "Replacement capture references match the groups detected in the pattern.", severity: "success" });
  }

  if (text.length > REGEX_INPUT_LIMIT) {
    checks.push({ id: "input-size", title: "Input limit", message: `Input exceeds the ${REGEX_INPUT_LIMIT.toLocaleString()} character preview limit.`, severity: "danger" });
  } else if (text.length > 20_000) {
    checks.push({ id: "input-size", title: "Large test input", message: "Use representative edge cases instead of very large text while designing a pattern.", severity: "info" });
  }

  if (pattern.includes("(?<=") || pattern.includes("(?<!")) {
    checks.push({ id: "lookbehind", title: "Lookbehind compatibility", message: "Lookbehind is supported by modern browsers, but verify your oldest target runtime.", severity: "info" });
  }

  return checks;
}

export function buildJavaScriptSnippet(pattern: string, flags: string, replacement: string): string {
  return `const regex = new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(flags)});\n\nconst matches = regex.global\n  ? Array.from(input.matchAll(regex))\n  : [regex.exec(input)].filter(Boolean);\n\nconst output = input.replace(regex, ${JSON.stringify(replacement)});`;
}

export function buildTypeScriptSnippet(pattern: string, flags: string, replacement: string): string {
  return `export function transformInput(input: string) {\n  const regex = new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(flags)});\n  const matches: RegExpMatchArray[] = regex.global\n    ? Array.from(input.matchAll(regex))\n    : [regex.exec(input)].filter((match): match is RegExpMatchArray => match !== null);\n\n  return {\n    matches,\n    output: input.replace(regex, ${JSON.stringify(replacement)}),\n  };\n}`;
}
