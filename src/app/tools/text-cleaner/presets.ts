import type { TextCleanerPreset } from "./types";

export const TEXT_CLEANER_PRESETS: TextCleanerPreset[] = [
  {
    id: "copied-pdf",
    title: "Clean copied PDF text",
    description: "Fix line breaks, trim lines, collapse spaces, and remove repeated lines.",
    actionIds: ["trim-lines", "extra-spaces", "collapse-blank-lines", "empty-lines", "dedupe-lines"],
  },
  {
    id: "social-caption",
    title: "Social media caption cleanup",
    description: "Trim messy captions and normalize spacing while keeping blank-line rhythm.",
    actionIds: ["trim-lines", "extra-spaces", "collapse-blank-lines"],
  },
  {
    id: "developer-list",
    title: "Developer list cleanup",
    description: "Turn pasted lists into clean, unique, sorted values.",
    actionIds: ["trim-lines", "empty-lines", "dedupe-lines", "sort-az"],
  },
  {
    id: "arabic-cleanup",
    title: "Arabic text cleanup",
    description: "Remove tashkeel and tatweel, normalize alef and yaa, and fix punctuation spacing.",
    actionIds: ["remove-tashkeel", "remove-tatweel", "normalize-arabic-alef", "normalize-arabic-yaa", "arabic-punctuation-spacing"],
  },
  {
    id: "extract-links-emails",
    title: "Extract links and emails",
    description: "Pull links and email addresses into a clean copy-ready list.",
    actionIds: ["extract-urls-emails"],
  },
  {
    id: "youtube-description",
    title: "Prepare YouTube description",
    description: "Clean spacing, remove empty lines, dedupe repeated lines, and keep links readable.",
    actionIds: ["trim-lines", "extra-spaces", "empty-lines", "dedupe-lines"],
  },
];
