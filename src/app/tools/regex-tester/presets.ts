import type { RegexExample, RegexFlag } from "./types";

export const DEFAULT_PATTERN = "(?<name>[A-Z][a-z]+)\\s+(?<id>#[0-9]{3})";
export const DEFAULT_FLAGS = "g";
export const DEFAULT_REPLACEMENT = "$<id> - $<name>";

export const SAMPLE_TEXT = `Order Alpha #102 is ready.
Order Beta #205 is delayed.
order gamma #309 is lowercase and will not match until you enable i.`;

export const FLAG_OPTIONS: { flag: RegexFlag; label: string }[] = [
  { flag: "g", label: "g" },
  { flag: "i", label: "i" },
  { flag: "m", label: "m" },
  { flag: "s", label: "s" },
  { flag: "u", label: "u" },
  { flag: "y", label: "y" },
  { flag: "d", label: "d" },
];

export const REGEX_EXAMPLES: RegexExample[] = [
  {
    label: "Email addresses",
    pattern: "[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}",
    flags: "gi",
    text: "Contact support@example.com or admin@darma.dev for access.",
    replacement: "[email]",
    description: "Find common email-like strings in pasted text.",
  },
  {
    label: "Named groups",
    pattern: "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
    flags: "g",
    text: "Created 2026-05-22 and updated 2026-06-01.",
    replacement: "$<day>/$<month>/$<year>",
    description: "Capture readable date parts and reuse them in replacements.",
  },
  {
    label: "Lines starting with TODO",
    pattern: "^TODO:.*$",
    flags: "gm",
    text: "TODO: add tests\nDone: wire UI\nTODO: review copy",
    replacement: "- $&",
    description: "Use multiline mode so anchors work per line.",
  },
  {
    label: "Hex colors",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    flags: "g",
    text: "Primary #2563eb, surface #fff, danger #dc2626.",
    replacement: "<color>$&</color>",
    description: "Match short and long CSS hex colors.",
  },
];

export const CHEATSHEET = [
  { token: ".", meaning: "Any character except newline unless s is enabled" },
  { token: "\\d", meaning: "Digit" },
  { token: "\\w", meaning: "Word character" },
  { token: "\\s", meaning: "Whitespace" },
  { token: "^ / $", meaning: "Start / end anchor" },
  { token: "* + ?", meaning: "Zero or more, one or more, optional" },
  { token: "{2,5}", meaning: "Repeat between 2 and 5 times" },
  { token: "(...) / (?<name>...)", meaning: "Capture group / named capture group" },
];
