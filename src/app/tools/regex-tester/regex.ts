import type { FlagInfo, RegexBuildError, RegexFlag, RegexMatchResult } from "./types";

export const REGEX_INPUT_LIMIT = 50_000;
export const REGEX_PATTERN_LIMIT = 2_000;
export const REGEX_REPLACEMENT_LIMIT = 10_000;
export const REGEX_MAX_MATCHES = 1_000;

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

function buildSearchRegex(pattern: string, flags: string): RegExp | RegexBuildError {
  const normalized = normalizeFlags(flags.includes("g") ? flags : `${flags}g`);
  return buildRegex(pattern, normalized);
}

export function findMatches(pattern: string, flags: string, text: string): RegexMatchResult[] {
  if (text.length > REGEX_INPUT_LIMIT) return [];

  const regex = buildSearchRegex(pattern, flags);
  if (!(regex instanceof RegExp)) return [];

  const results: RegexMatchResult[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null && results.length < REGEX_MAX_MATCHES) {
    const namedGroups = match.groups
      ? Object.entries(match.groups).map(([name, value]) => ({ name, value }))
      : [];

    results.push({
      match: match[0],
      index: match.index,
      endIndex: match.index + match[0].length,
      captures: match.slice(1).map((value, index) => ({ index: index + 1, value })),
      namedGroups,
    });

    if (match[0].length === 0) {
      regex.lastIndex += 1;
      if (regex.lastIndex > text.length) break;
    }
  }

  return results;
}

export function replaceMatches(pattern: string, flags: string, text: string, replacement: string): string {
  if (text.length > REGEX_INPUT_LIMIT || replacement.length > REGEX_REPLACEMENT_LIMIT) return text;

  const regex = buildRegex(pattern, normalizeFlags(flags));
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
