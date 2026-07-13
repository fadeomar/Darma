import type { RegexExample, RegexFlag } from "./types";

export const DEFAULT_PATTERN = "(?<name>[A-Z][a-z]+)\\s+(?<id>#[0-9]{3})";
export const DEFAULT_FLAGS = "g";
export const DEFAULT_REPLACEMENT = "$<id> - $<name>";

export const SAMPLE_TEXT = `Order Alpha #102 is ready.
Order Beta #205 is delayed.
order gamma #309 is lowercase and will not match until you enable i.`;

export const FLAG_OPTIONS: { flag: RegexFlag; label: string; description: string }[] = [
  { flag: "g", label: "g", description: "Global — find every match" },
  { flag: "i", label: "i", description: "Ignore letter case" },
  { flag: "m", label: "m", description: "Multiline anchors" },
  { flag: "s", label: "s", description: "Dot matches newlines" },
  { flag: "u", label: "u", description: "Unicode-aware matching" },
  { flag: "y", label: "y", description: "Sticky matching" },
  { flag: "d", label: "d", description: "Capture match indices" },
];

export const REGEX_EXAMPLES: RegexExample[] = [
  {
    id: "emails",
    label: "Email finder",
    pattern: "[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}",
    flags: "gi",
    text: "Contact support@example.com or admin@darma.dev for access.",
    replacement: "[email]",
    description: "Extract common email-like strings.",
    category: "extract",
  },
  {
    id: "named-date",
    label: "Date reformat",
    pattern: "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
    flags: "g",
    text: "Created 2026-05-22 and updated 2026-06-01.",
    replacement: "$<day>/$<month>/$<year>",
    description: "Reuse named groups in replacement output.",
    category: "transform",
  },
  {
    id: "todo-lines",
    label: "TODO lines",
    pattern: "^TODO:.*$",
    flags: "gm",
    text: "TODO: add tests\nDone: wire UI\nTODO: review copy",
    replacement: "- $&",
    description: "Use multiline anchors to select full lines.",
    category: "extract",
  },
  {
    id: "hex-colors",
    label: "Hex colors",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    flags: "g",
    text: "Primary #2563eb, surface #fff, danger #dc2626.",
    replacement: "var(--color-token)",
    description: "Find short and long CSS hex colors.",
    category: "extract",
  },
  {
    id: "duplicate-spaces",
    label: "Extra spaces",
    pattern: "[ \\t]{2,}",
    flags: "g",
    text: "Clean   repeated spaces,\t\tbut keep\nline breaks intact.",
    replacement: " ",
    description: "Collapse repeated horizontal whitespace.",
    category: "cleanup",
  },
  {
    id: "username",
    label: "Username rule",
    pattern: "^[A-Za-z][A-Za-z0-9_-]{2,19}$",
    flags: "",
    text: "darma_user-26",
    replacement: "$&",
    description: "Validate a 3–20 character username.",
    category: "validate",
  },
];

export const CHEATSHEET = [
  { token: ".", meaning: "Any character except newline unless s is enabled" },
  { token: "\\d / \\w / \\s", meaning: "Digit / word character / whitespace" },
  { token: "^ / $", meaning: "Start / end anchor" },
  { token: "* + ?", meaning: "Zero or more / one or more / optional" },
  { token: "{2,5}", meaning: "Repeat between 2 and 5 times" },
  { token: "(...) / (?:...)", meaning: "Capture / non-capturing group" },
  { token: "(?<name>...)", meaning: "Named capture group" },
  { token: "$& / $1 / $<name>", meaning: "Replacement references" },
];
