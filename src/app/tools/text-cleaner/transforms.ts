// ─── Pure transform functions ─────────────────────────────────────────────────

export type TransformFn = (text: string) => string;

// ── Case ──────────────────────────────────────────────────────────────────────

export const toUpperCase: TransformFn = (t) => t.toUpperCase();
export const toLowerCase: TransformFn = (t) => t.toLowerCase();

export const toTitleCase: TransformFn = (t) =>
  t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export const toSentenceCase: TransformFn = (t) =>
  t
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());

export const capitalizeEachWord: TransformFn = (t) =>
  t.replace(/\b\w/g, (c) => c.toUpperCase());

export const toInverseCase: TransformFn = (t) =>
  t
    .split("")
    .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
    .join("");

// Split text into words by whitespace and non-alphanumeric boundaries
function splitWords(t: string): string[] {
  return t
    .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase / PascalCase
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, " ") // non-word → space (preserve Arabic)
    .split(/\s+/)
    .filter(Boolean);
}

export const toCamelCase: TransformFn = (t) =>
  splitWords(t)
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");

export const toPascalCase: TransformFn = (t) =>
  splitWords(t)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");

export const toSnakeCase: TransformFn = (t) =>
  splitWords(t).map((w) => w.toLowerCase()).join("_");

export const toKebabCase: TransformFn = (t) =>
  splitWords(t).map((w) => w.toLowerCase()).join("-");

// ── Clean ─────────────────────────────────────────────────────────────────────

export const trimText: TransformFn = (t) => t.trim();

export const removeExtraSpaces: TransformFn = (t) =>
  // Collapse runs of horizontal whitespace to a single space per line
  t
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");

export const removeEmptyLines: TransformFn = (t) =>
  t
    .split("\n")
    .filter((l) => l.trim() !== "")
    .join("\n");

export const trimEachLine: TransformFn = (t) =>
  t
    .split("\n")
    .map((l) => l.trim())
    .join("\n");

export const normalizeLineBreaks: TransformFn = (t) =>
  t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

export const collapseBlankLines: TransformFn = (t) =>
  t.replace(/\n{3,}/g, "\n\n");

export const removeDuplicateLines: TransformFn = (t) => {
  const seen = new Set<string>();
  return t
    .split("\n")
    .filter((line) => {
      const key = line.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
};

export const sortLinesAZ: TransformFn = (t) =>
  t
    .split("\n")
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .join("\n");

export const sortLinesZA: TransformFn = (t) =>
  t
    .split("\n")
    .sort((a, b) => b.localeCompare(a, undefined, { sensitivity: "base" }))
    .join("\n");

// ─── Transform registry ───────────────────────────────────────────────────────

export type TransformDef = {
  id: string;
  label: string;
  title: string;
  fn: TransformFn;
  mono?: boolean; // render label in monospace
};

export const CASE_TRANSFORMS: TransformDef[] = [
  { id: "uppercase",    label: "UPPERCASE",       title: "Convert to UPPERCASE",          fn: toUpperCase },
  { id: "lowercase",    label: "lowercase",       title: "Convert to lowercase",           fn: toLowerCase },
  { id: "title",        label: "Title Case",       title: "Capitalize each word",          fn: toTitleCase },
  { id: "sentence",     label: "Sentence case",    title: "Capitalize first of each sentence", fn: toSentenceCase },
  { id: "each",         label: "Each Word",        title: "Capitalize start of every word", fn: capitalizeEachWord },
  { id: "inverse",      label: "iNVERSE",          title: "Flip case of every character",  fn: toInverseCase },
  { id: "camel",        label: "camelCase",        title: "Convert to camelCase",          fn: toCamelCase,  mono: true },
  { id: "pascal",       label: "PascalCase",       title: "Convert to PascalCase",         fn: toPascalCase, mono: true },
  { id: "snake",        label: "snake_case",       title: "Convert to snake_case",         fn: toSnakeCase,  mono: true },
  { id: "kebab",        label: "kebab-case",       title: "Convert to kebab-case",         fn: toKebabCase,  mono: true },
];

export const CLEAN_TRANSFORMS: TransformDef[] = [
  { id: "trim",         label: "Trim",             title: "Remove leading & trailing whitespace", fn: trimText },
  { id: "extraspaces",  label: "Remove extra spaces", title: "Collapse multiple spaces to one",  fn: removeExtraSpaces },
  { id: "emptylines",   label: "Remove empty lines", title: "Delete all blank lines",           fn: removeEmptyLines },
  { id: "trimlines",    label: "Trim each line",    title: "Trim whitespace on every line",     fn: trimEachLine },
  { id: "normalize",    label: "Normalize breaks",  title: "Normalize \\r\\n and \\r to \\n",   fn: normalizeLineBreaks },
  { id: "collapse",     label: "Collapse blank lines", title: "Reduce multiple blank lines to one", fn: collapseBlankLines },
  { id: "dedupe",       label: "Remove duplicates", title: "Keep only unique lines",            fn: removeDuplicateLines },
  { id: "sortaz",       label: "Sort A → Z",        title: "Sort lines alphabetically",        fn: sortLinesAZ },
  { id: "sortza",       label: "Sort Z → A",        title: "Sort lines reverse alphabetically", fn: sortLinesZA },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

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
  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/).filter((s) => s.trim()).length
    : 0;
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words,
    lines,
    paragraphs,
    readingTimeSec: Math.max(1, Math.round((words / 200) * 60)),
  };
}

export function formatReadingTime(sec: number): string {
  if (sec < 60) return `${sec}s read`;
  return `${Math.ceil(sec / 60)} min read`;
}

// ─── Sample text ──────────────────────────────────────────────────────────────

export const SAMPLE_TEXT = `  hello world — this is some MESSY text.

it has   extra   spaces between words.
And inconsistent Capitalization throughout.

Some lines are duplicated below.
Some lines are duplicated below.

  Leading spaces on this line.
  And this one too.

great for: developers, writers, content editors, and anyone cleaning up pasted text.`;
