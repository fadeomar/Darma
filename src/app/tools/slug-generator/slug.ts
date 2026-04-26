export type SlugCaseMode = "lower" | "keep" | "upper";
export type SlugSeparator = "-" | "_";

export type SlugOptions = {
  separator: SlugSeparator;
  caseMode: SlugCaseMode;
  keepNumbers: boolean;
  removeStopWords: boolean;
  maxLengthEnabled: boolean;
  maxLength: number;
  preserveSlashes: boolean;
};

export type SlugWarning =
  | "empty-input"
  | "empty-output"
  | "very-long"
  | "trimmed";

export type SlugStats = {
  originalChars: number;
  slugChars: number;
  wordCount: number;
  isUrlFriendly: boolean;
};

export type SlugResult = {
  slug: string;
  warnings: SlugWarning[];
  stats: SlugStats;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "of",
  "in",
  "on",
  "to",
  "for",
  "with",
  "from",
  "by",
]);

const SPACES_REGEX = /\s+/g;
const ALLOWED_WITH_SLASH_REGEX = /[^\p{L}\p{N}\s/_-]+/gu;
const ALLOWED_NO_SLASH_REGEX = /[^\p{L}\p{N}\s_-]+/gu;

function applyCase(text: string, mode: SlugCaseMode): string {
  if (mode === "upper") return text.toUpperCase();
  if (mode === "keep") return text;
  return text.toLowerCase();
}

function removeLatinDiacritics(text: string): string {
  return text
    .normalize("NFD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFC");
}

function trimRepeatedSeparator(value: string, separator: SlugSeparator): string {
  const escaped = separator === "-" ? "\\-" : "_";
  return value
    .replace(new RegExp(`${escaped}{2,}`, "g"), separator)
    .replace(new RegExp(`^${escaped}+|${escaped}+$`, "g"), "");
}

function slugifySegment(text: string, opts: SlugOptions): string {
  const separator = opts.separator;
  let value = removeLatinDiacritics(text.normalize("NFKC"));
  value = applyCase(value, opts.caseMode);
  value = value.replace(SPACES_REGEX, " ").trim();
  value = value.replace(
    opts.preserveSlashes ? ALLOWED_WITH_SLASH_REGEX : ALLOWED_NO_SLASH_REGEX,
    " ",
  );
  value = value.replace(SPACES_REGEX, " ").trim();

  if (!opts.keepNumbers) {
    value = value.replace(/\p{N}+/gu, " ").replace(SPACES_REGEX, " ").trim();
  }

  if (opts.removeStopWords && value) {
    const parts = value.split(" ").filter((part) => {
      if (!part) return false;
      const normalized = part.toLowerCase();
      if (STOP_WORDS.has(normalized)) return false;
      return true;
    });
    value = parts.join(" ");
  }

  value = value.replace(/[_-]+/g, " ");
  value = value.replace(SPACES_REGEX, separator);
  return trimRepeatedSeparator(value, separator);
}

function safeTrimToLength(
  value: string,
  maxLength: number,
  separator: SlugSeparator,
): { value: string; trimmed: boolean } {
  if (value.length <= maxLength) return { value, trimmed: false };
  const sliced = value.slice(0, Math.max(0, maxLength));
  const escaped = separator === "-" ? "\\-" : "_";
  const cleaned = sliced
    .replace(new RegExp(`${escaped}+$`), "")
    .trim();
  return { value: cleaned, trimmed: true };
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
  separator: "-",
  caseMode: "lower",
  keepNumbers: true,
  removeStopWords: false,
  maxLengthEnabled: false,
  maxLength: 80,
  preserveSlashes: false,
};

export function generateSlug(input: string, options: SlugOptions): SlugResult {
  const source = input ?? "";
  const trimmedSource = source.trim();
  const warnings: SlugWarning[] = [];

  if (!trimmedSource) {
    warnings.push("empty-input");
    return {
      slug: "",
      warnings,
      stats: {
        originalChars: 0,
        slugChars: 0,
        wordCount: 0,
        isUrlFriendly: false,
      },
    };
  }

  const normalizedSource = options.preserveSlashes
    ? trimmedSource.replace(/\s*\/+\s*/g, "/")
    : trimmedSource;
  const rawSegments = options.preserveSlashes
    ? normalizedSource.split("/").filter((segment) => segment.trim().length > 0)
    : [normalizedSource];
  const segments = rawSegments
    .map((segment) => slugifySegment(segment, options))
    .filter(Boolean);

  let slug = options.preserveSlashes ? segments.join("/") : segments.join("");

  let trimmed = false;
  if (options.maxLengthEnabled && options.maxLength > 0 && slug) {
    const trimmedResult = safeTrimToLength(slug, options.maxLength, options.separator);
    slug = trimmedResult.value;
    trimmed = trimmedResult.trimmed;
  }

  if (!slug) warnings.push("empty-output");
  if (trimmed) warnings.push("trimmed");
  if (slug.length > 96) warnings.push("very-long");

  const safeSlugRegex = options.preserveSlashes
    ? /^[\p{L}\p{N}_/-]+$/u
    : /^[\p{L}\p{N}_-]+$/u;
  const isUrlFriendly = slug.length > 0 && safeSlugRegex.test(slug);

  return {
    slug,
    warnings,
    stats: {
      originalChars: source.length,
      slugChars: slug.length,
      wordCount: countWords(trimmedSource),
      isUrlFriendly,
    },
  };
}
