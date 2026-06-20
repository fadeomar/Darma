import type { TextActionGroup, TransformContext, TransformDef, TransformFn } from "./types";

export type { TextActionGroup, TransformContext, TransformDef, TransformFn } from "./types";

export const DEFAULT_PREFIX_TEXT = "> ";
export const DEFAULT_SUFFIX_TEXT = ".";

export const toUpperCase: TransformFn = (text) => text.toUpperCase();
export const toLowerCase: TransformFn = (text) => text.toLowerCase();

export const toTitleCase: TransformFn = (text) =>
  text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

export const toSentenceCase: TransformFn = (text) =>
  text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export const toCamelCase: TransformFn = (text) =>
  splitWords(text)
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("");

export const toPascalCase: TransformFn = (text) =>
  splitWords(text)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

export const toSnakeCase: TransformFn = (text) => splitWords(text).map((word) => word.toLowerCase()).join("_");
export const toKebabCase: TransformFn = (text) => splitWords(text).map((word) => word.toLowerCase()).join("-");

export const trimText: TransformFn = (text) => text.trim();
export const trimEachLine: TransformFn = (text) => text.split("\n").map((line) => line.trim()).join("\n");
export const normalizeLineBreaks: TransformFn = (text) => text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
export const removeExtraSpaces: TransformFn = (text) =>
  text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
export const removeEmptyLines: TransformFn = (text) => text.split("\n").filter((line) => line.trim() !== "").join("\n");
export const collapseBlankLines: TransformFn = (text) => text.replace(/\n{3,}/g, "\n\n");

export const removeDuplicateLines: TransformFn = (text) => {
  const seen = new Set<string>();
  return text
    .split("\n")
    .filter((line) => {
      const key = line.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
};

export const sortLinesAZ: TransformFn = (text) =>
  text.split("\n").sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })).join("\n");

export const sortLinesZA: TransformFn = (text) =>
  text.split("\n").sort((a, b) => b.localeCompare(a, undefined, { sensitivity: "base" })).join("\n");

export const removeTashkeel: TransformFn = (text) => text.replace(/[\u064B-\u065F\u0670]/g, "");
export const removeTatweel: TransformFn = (text) => text.replace(/\u0640/g, "");
export const normalizeArabicAlef: TransformFn = (text) => text.replace(/[إأآٱ]/g, "ا");
export const normalizeArabicYaa: TransformFn = (text) => text.replace(/ى/g, "ي");
export const normalizeArabicPunctuationSpacing: TransformFn = (text) =>
  text
    .replace(/\s+([،؛؟])/g, "$1")
    .replace(/([،؛؟])(?=\S)/g, "$1 ")
    .replace(/[ \t]+/g, " ");

export const cleanCopiedArabicPdfText: TransformFn = (text) =>
  [
    normalizeLineBreaks,
    trimEachLine,
    removeExtraSpaces,
    removeTashkeel,
    removeTatweel,
    normalizeArabicAlef,
    normalizeArabicYaa,
    normalizeArabicPunctuationSpacing,
    collapseBlankLines,
    removeEmptyLines,
  ].reduce((value, transform) => transform(value), text);

function extractMatches(text: string, pattern: RegExp) {
  return Array.from(text.matchAll(pattern), (match) => match[0]).join("\n");
}

export const extractUrls: TransformFn = (text) =>
  extractMatches(text, /\bhttps?:\/\/[^\s<>"')\]]+/gi).replace(/[.,;:!?]+$/gm, "");
export const extractEmails: TransformFn = (text) =>
  extractMatches(text, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
export const extractUrlsAndEmails: TransformFn = (text) =>
  [extractUrls(text), extractEmails(text)].filter(Boolean).join("\n");
export const extractPhoneNumbers: TransformFn = (text) =>
  extractMatches(text, /(?<!\w)(?:\+?\d[\d\s().-]{6,}\d)(?!\w)/g);
export const extractHashtags: TransformFn = (text) => extractMatches(text, /#[\p{L}\p{N}_-]+/gu);
export const extractMentions: TransformFn = (text) => extractMatches(text, /@[\p{L}\p{N}_-]+/gu);
export const extractNumbers: TransformFn = (text) => extractMatches(text, /-?\d+(?:[.,]\d+)?/g);

export const numberLines: TransformFn = (text) =>
  text.split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n");
export const addBulletPoints: TransformFn = (text) => text.split("\n").map((line) => `- ${line}`).join("\n");
export const convertLinesToCommaList: TransformFn = (text) =>
  text.split("\n").map((line) => line.trim()).filter(Boolean).join(", ");
export const convertCommaListToLines: TransformFn = (text) =>
  text.split(",").map((item) => item.trim()).filter(Boolean).join("\n");
export const addPrefixToEachLine: TransformFn = (text, context) =>
  text.split("\n").map((line) => `${context?.prefixText ?? DEFAULT_PREFIX_TEXT}${line}`).join("\n");
export const addSuffixToEachLine: TransformFn = (text, context) =>
  text.split("\n").map((line) => `${line}${context?.suffixText ?? DEFAULT_SUFFIX_TEXT}`).join("\n");
export const wrapEachLineInQuotes: TransformFn = (text) =>
  text.split("\n").map((line) => `"${line.replace(/"/g, '\\"')}"`).join("\n");

export const CLEAN_TRANSFORMS: TransformDef[] = [
  { id: "trim", group: "clean", label: "Trim text", title: "Remove leading and trailing whitespace", fn: trimText },
  { id: "trim-lines", group: "clean", label: "Trim each line", title: "Trim whitespace on every line", fn: trimEachLine },
  { id: "extra-spaces", group: "clean", label: "Remove extra spaces", title: "Collapse repeated spaces", fn: removeExtraSpaces },
  { id: "empty-lines", group: "clean", label: "Remove empty lines", title: "Delete blank lines", fn: removeEmptyLines },
  { id: "collapse-blank-lines", group: "clean", label: "Collapse blank lines", title: "Reduce 3 or more line breaks to 2", fn: collapseBlankLines },
  { id: "dedupe-lines", group: "clean", label: "Remove duplicate lines", title: "Keep the first occurrence of each line", fn: removeDuplicateLines },
  { id: "sort-az", group: "clean", label: "Sort A-Z", title: "Sort lines alphabetically", fn: sortLinesAZ },
  { id: "sort-za", group: "clean", label: "Sort Z-A", title: "Sort lines reverse alphabetically", fn: sortLinesZA },
];

export const ARABIC_TRANSFORMS: TransformDef[] = [
  { id: "remove-tashkeel", group: "arabic", label: "Remove tashkeel", title: "Remove Arabic diacritics", fn: removeTashkeel },
  { id: "remove-tatweel", group: "arabic", label: "Remove tatweel", title: "Remove Arabic elongation marks", fn: removeTatweel },
  { id: "normalize-arabic-alef", group: "arabic", label: "Normalize Arabic alef", title: "Normalize alef variants to ا", fn: normalizeArabicAlef },
  { id: "normalize-arabic-yaa", group: "arabic", label: "Normalize Arabic yaa", title: "Normalize ى to ي", fn: normalizeArabicYaa },
  { id: "arabic-punctuation-spacing", group: "arabic", label: "Arabic punctuation spacing", title: "Normalize spacing around Arabic punctuation", fn: normalizeArabicPunctuationSpacing },
  { id: "clean-arabic-pdf", group: "arabic", label: "Clean copied Arabic PDF text", title: "Run a practical Arabic PDF cleanup chain", fn: cleanCopiedArabicPdfText },
];

export const EXTRACT_TRANSFORMS: TransformDef[] = [
  { id: "extract-urls", group: "extract", label: "Extract URLs", title: "Extract web links", fn: extractUrls },
  { id: "extract-emails", group: "extract", label: "Extract emails", title: "Extract email addresses", fn: extractEmails },
  { id: "extract-urls-emails", group: "extract", label: "Extract URLs and emails", title: "Extract links and email addresses", fn: extractUrlsAndEmails },
  { id: "extract-phone-numbers", group: "extract", label: "Extract phone numbers", title: "Extract likely phone numbers", fn: extractPhoneNumbers },
  { id: "extract-hashtags", group: "extract", label: "Extract hashtags", title: "Extract hashtags", fn: extractHashtags },
  { id: "extract-mentions", group: "extract", label: "Extract mentions", title: "Extract social mentions", fn: extractMentions },
  { id: "extract-numbers", group: "extract", label: "Extract numbers", title: "Extract numbers", fn: extractNumbers },
];

export const FORMAT_TRANSFORMS: TransformDef[] = [
  { id: "number-lines", group: "format", label: "Number lines", title: "Add line numbers", fn: numberLines },
  { id: "bullet-points", group: "format", label: "Add bullet points", title: "Prefix each line with a bullet", fn: addBulletPoints },
  { id: "lines-to-comma-list", group: "format", label: "Lines to comma list", title: "Join lines with commas", fn: convertLinesToCommaList },
  { id: "comma-list-to-lines", group: "format", label: "Comma list to lines", title: "Split comma-separated values into lines", fn: convertCommaListToLines },
  { id: "prefix-lines", group: "format", label: "Add prefix to each line", title: "Prefix each line with custom text", fn: addPrefixToEachLine },
  { id: "suffix-lines", group: "format", label: "Add suffix to each line", title: "Add custom text to the end of each line", fn: addSuffixToEachLine },
  { id: "quote-lines", group: "format", label: "Wrap each line in quotes", title: "Wrap each line in double quotes", fn: wrapEachLineInQuotes },
];

export const CASE_TRANSFORMS: TransformDef[] = [
  { id: "uppercase", group: "case", label: "UPPERCASE", title: "Convert to uppercase", fn: toUpperCase },
  { id: "lowercase", group: "case", label: "lowercase", title: "Convert to lowercase", fn: toLowerCase },
  { id: "title-case", group: "case", label: "Title Case", title: "Capitalize each word", fn: toTitleCase },
  { id: "sentence-case", group: "case", label: "Sentence case", title: "Capitalize sentences", fn: toSentenceCase },
  { id: "camel-case", group: "case", label: "camelCase", title: "Convert to camelCase", fn: toCamelCase, mono: true },
  { id: "pascal-case", group: "case", label: "PascalCase", title: "Convert to PascalCase", fn: toPascalCase, mono: true },
  { id: "snake-case", group: "case", label: "snake_case", title: "Convert to snake_case", fn: toSnakeCase, mono: true },
  { id: "kebab-case", group: "case", label: "kebab-case", title: "Convert to kebab-case", fn: toKebabCase, mono: true },
];

export const TEXT_ACTION_GROUPS: Array<{ id: TextActionGroup; label: string; transforms: TransformDef[] }> = [
  { id: "clean", label: "Clean", transforms: CLEAN_TRANSFORMS },
  { id: "arabic", label: "Arabic", transforms: ARABIC_TRANSFORMS },
  { id: "extract", label: "Extract", transforms: EXTRACT_TRANSFORMS },
  { id: "format", label: "Format", transforms: FORMAT_TRANSFORMS },
  { id: "case", label: "Case", transforms: CASE_TRANSFORMS },
];

export const ALL_TRANSFORMS = TEXT_ACTION_GROUPS.flatMap((group) => group.transforms);

export function getTransformById(id: string) {
  return ALL_TRANSFORMS.find((transform) => transform.id === id) ?? null;
}

export function runPipeline(text: string, actionIds: string[], context?: TransformContext) {
  return actionIds.reduce((value, actionId) => getTransformById(actionId)?.fn(value, context) ?? value, text);
}

export type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  readingTimeSec: number;
};

export function computeStats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const lines = text ? text.split("\n").length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((value) => value.trim()).length : 0;

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words,
    lines,
    paragraphs,
    readingTimeSec: Math.max(1, Math.round((words / 200) * 60)),
  };
}

export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s read`;
  return `${Math.ceil(seconds / 60)} min read`;
}

export const SAMPLE_TEXT = `  Darma launch notes

Visit https://darma.tools and email hello@example.com for access.
Visit https://darma.tools and email hello@example.com for access.

  This text   has extra     spaces.
  This text   has extra     spaces.

النَّصُّ العَرَبِيُّ يحتاج إلى تنظيف،وتنسيق ؟

#design #tools @darma
`;
