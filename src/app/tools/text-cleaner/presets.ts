import type { TextCleanerPreset } from "./types";

export const TEXT_CLEANER_PRESETS: TextCleanerPreset[] = [
  { id: "copied-pdf", title: "Clean copied PDF", description: "Fix line breaks, trim lines, collapse spaces, and remove repeated lines.", actionIds: ["trim-lines", "extra-spaces", "collapse-blank-lines", "empty-lines", "dedupe-lines"] },
  { id: "social-caption", title: "Social caption", description: "Normalize spacing while keeping readable paragraph rhythm.", actionIds: ["trim-lines", "extra-spaces", "collapse-blank-lines"] },
  { id: "developer-list", title: "Developer list", description: "Turn pasted lists into clean, unique, sorted values.", actionIds: ["trim-lines", "empty-lines", "dedupe-lines", "sort-az"] },
  { id: "arabic-cleanup", title: "Arabic cleanup", description: "Remove tashkeel/tatweel, normalize letters, and fix punctuation spacing.", actionIds: ["remove-tashkeel", "remove-tatweel", "normalize-arabic-alef", "normalize-arabic-yaa", "arabic-punctuation-spacing"] },
  { id: "extract-links-emails", title: "Links + emails", description: "Pull links and email addresses into a clean copy-ready list.", actionIds: ["extract-urls-emails"] },
  { id: "youtube-description", title: "YouTube description", description: "Clean spacing and duplicate lines while keeping links readable.", actionIds: ["trim-lines", "extra-spaces", "empty-lines", "dedupe-lines"] },
  { id: "csv-column-values", title: "CSV column values", description: "Clean a pasted column into unique alphabetized lines.", actionIds: ["trim-lines", "empty-lines", "dedupe-lines", "sort-az"] },
  { id: "email-recipient-list", title: "Email recipients", description: "Extract email addresses from copied messages or contact exports.", actionIds: ["extract-emails", "trim-lines", "dedupe-lines"] },
  { id: "phone-list", title: "Phone number list", description: "Extract likely phone numbers from mixed notes or CRM exports.", actionIds: ["extract-phone-numbers", "trim-lines", "dedupe-lines"] },
  { id: "hashtags", title: "Hashtag list", description: "Extract hashtags and remove duplicates before planning posts.", actionIds: ["extract-hashtags", "trim-lines", "dedupe-lines"] },
  { id: "mentions", title: "Mention list", description: "Extract @mentions from social copy or community notes.", actionIds: ["extract-mentions", "trim-lines", "dedupe-lines"] },
  { id: "keyword-lines", title: "Keyword list", description: "Normalize, dedupe, sort, and convert keywords to lowercase.", actionIds: ["trim-lines", "empty-lines", "dedupe-lines", "lowercase", "sort-az"] },
  { id: "comma-to-lines", title: "Comma list → lines", description: "Split comma-separated values into one clean item per line.", actionIds: ["comma-list-to-lines", "trim-lines", "empty-lines", "dedupe-lines"] },
  { id: "lines-to-comma", title: "Lines → comma list", description: "Clean line items and join them into a compact comma-separated list.", actionIds: ["trim-lines", "empty-lines", "dedupe-lines", "lines-to-comma-list"] },
  { id: "markdown-bullets", title: "Bullet list", description: "Clean raw lines and turn them into a readable bullet list.", actionIds: ["trim-lines", "empty-lines", "dedupe-lines", "bullet-points"] },
  { id: "numbered-checklist", title: "Numbered list", description: "Clean a task dump and add line numbers for review.", actionIds: ["trim-lines", "empty-lines", "number-lines"] },
  { id: "slug-seeds", title: "Slug seed lines", description: "Normalize labels into lowercase kebab-case values.", actionIds: ["trim-lines", "empty-lines", "kebab-case"] },
  { id: "constant-names", title: "Constant names", description: "Normalize labels into uppercase snake_case identifiers.", actionIds: ["trim-lines", "empty-lines", "snake-case", "uppercase"] },
];
