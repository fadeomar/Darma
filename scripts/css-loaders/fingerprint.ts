import { createHash } from "node:crypto";
import type { LoaderSourceDefinition } from "../../src/app/tools/css-loaders/types";

/**
 * Visual fingerprinting for loaders.
 *
 * The goal is to collapse "fake variety" — loaders that look identical but were
 * cloned with a different color, animation speed, or generated class/keyframe
 * name. Two loaders that share a fingerprint render the same animation pattern
 * and should not appear as separate cards in the gallery.
 *
 * The normalization deliberately removes everything that does NOT change the
 * visual structure of the loader (colors, durations, comments, whitespace,
 * keyframe names, color-only custom property plumbing) while keeping the
 * structural CSS/HTML so genuinely different loaders still produce distinct
 * fingerprints.
 */

// Common named CSS colors. Kept intentionally small but covering the values
// that actually show up in the loader sources (and the obvious primaries).
const NAMED_COLORS = new Set([
  "transparent",
  "currentcolor",
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "pink",
  "gray",
  "grey",
  "silver",
  "gold",
  "cyan",
  "magenta",
  "lime",
  "teal",
  "navy",
  "maroon",
  "olive",
  "aqua",
  "fuchsia",
  "indigo",
  "violet",
  "coral",
  "salmon",
  "crimson",
  "turquoise",
  "tomato",
  "tan",
  "brown",
  "beige",
  "khaki",
  "lavender",
  "ivory",
  "azure",
  "plum",
  "orchid",
  "skyblue",
  "steelblue",
  "slateblue",
  "slategray",
  "slategrey",
  "darkgray",
  "darkgrey",
  "lightgray",
  "lightgrey",
  "dodgerblue",
  "royalblue",
  "midnightblue",
  "rebeccapurple",
  "hotpink",
  "deeppink",
  "seagreen",
  "forestgreen",
  "limegreen",
  "darkgreen",
  "goldenrod",
  "chocolate",
]);

const COLOR_TOKEN = "Ⓒ";
const DURATION_TOKEN = "Ⓣ";
const KEYFRAME_TOKEN = "Ⓚ";

function stripComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "") // CSS comments
    .replace(/<!--[\s\S]*?-->/g, ""); // HTML comments
}

function collectKeyframeNames(css: string): string[] {
  const names = new Set<string>();
  for (const match of css.matchAll(/@(?:-webkit-)?keyframes\s+([_a-zA-Z][\w-]*)/g)) {
    names.add(match[1]);
  }
  return [...names].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace every reference to a loader's keyframe names with a stable token. */
function normalizeKeyframeNames(css: string): string {
  let output = css;
  for (const name of collectKeyframeNames(css)) {
    output = output.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, "g"), KEYFRAME_TOKEN);
  }
  return output;
}

/** Collapse hex / rgb(a) / hsl(a) / named colors to a single token. */
function normalizeColors(input: string): string {
  return input
    .replace(/#[0-9a-fA-F]{3,8}\b/g, COLOR_TOKEN)
    .replace(/\brgba?\([^)]*\)/gi, COLOR_TOKEN)
    .replace(/\bhsla?\([^)]*\)/gi, COLOR_TOKEN)
    .replace(/\b[a-zA-Z]+\b/g, (word) => (NAMED_COLORS.has(word.toLowerCase()) ? COLOR_TOKEN : word));
}

/**
 * Collapse loader CSS custom property usage so a hardcoded color and the same
 * value wrapped in `var(--loader-color, …)` fingerprint identically.
 */
function normalizeLoaderVariables(css: string): string {
  return (
    css
      // var(--loader-color, <color>) / var(--loader-color) → color token
      .replace(new RegExp(`var\\(\\s*--[\\w-]*color[\\w-]*\\s*(?:,\\s*${COLOR_TOKEN}\\s*)?\\)`, "g"), COLOR_TOKEN)
      .replace(new RegExp(`var\\(\\s*--loader-bg\\s*(?:,\\s*[^)]*)?\\)`, "g"), COLOR_TOKEN)
      // Drop color-only custom property declarations (default plumbing that has
      // no visual effect on its own): --loader-secondary-color: <color>;
      .replace(new RegExp(`--[\\w-]*color[\\w-]*\\s*:\\s*${COLOR_TOKEN}\\s*;?`, "g"), "")
      .replace(new RegExp(`--loader-bg\\s*:\\s*${COLOR_TOKEN}\\s*;?`, "g"), "")
  );
}

/** Collapse time values (1s, 1.2s, 800ms, 0.7799999s) to a single token. */
function normalizeDurations(input: string): string {
  return input.replace(/-?\d*\.?\d+\s*m?s\b/gi, DURATION_TOKEN);
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

/**
 * Produce the normalized structural string for a loader. Exposed for the audit
 * report / debugging so it is possible to see *why* two loaders collide.
 */
export function normalizeForFingerprint(definition: Pick<LoaderSourceDefinition, "html" | "css" | "tailwind">): string {
  const html = stripComments(definition.html ?? "");
  let css = stripComments(definition.css ?? "");

  css = normalizeKeyframeNames(css);
  css = normalizeColors(css);
  css = normalizeLoaderVariables(css);
  css = normalizeColors(css); // second pass: catch colors revealed inside var() fallbacks
  css = normalizeDurations(css);

  const normalizedHtml = normalizeWhitespace(normalizeColors(html.toLowerCase()));
  const normalizedCss = normalizeWhitespace(css.toLowerCase());
  const tailwind = definition.tailwind ? normalizeWhitespace(definition.tailwind.toLowerCase()) : "";

  return `${normalizedHtml}§${normalizedCss}§${tailwind}`;
}

/** Stable short fingerprint hash for a loader's visual pattern. */
export function fingerprintLoader(definition: Pick<LoaderSourceDefinition, "html" | "css" | "tailwind">): string {
  const normalized = normalizeForFingerprint(definition);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 12);
}

export type FingerprintEntry = {
  id: string;
  name: string;
  file: string;
  fingerprint: string;
  allowDuplicateVisual: boolean;
};

export type DuplicateGroup = {
  fingerprint: string;
  entries: FingerprintEntry[];
};

/** Group loaders that share a visual fingerprint (groups of 2+ only). */
export function findDuplicateGroups(entries: FingerprintEntry[]): DuplicateGroup[] {
  const byFingerprint = new Map<string, FingerprintEntry[]>();
  for (const entry of entries) {
    const group = byFingerprint.get(entry.fingerprint) ?? [];
    group.push(entry);
    byFingerprint.set(entry.fingerprint, group);
  }

  return [...byFingerprint.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([fingerprint, group]) => ({ fingerprint, entries: group }))
    .sort((a, b) => b.entries.length - a.entries.length || a.fingerprint.localeCompare(b.fingerprint));
}

/**
 * A duplicate group is only a *violation* when it contains more than one loader
 * that has NOT opted out via `allowDuplicateVisual`. A canonical loader plus
 * any number of explicitly-flagged intentional variants is allowed.
 */
export function getViolatingGroups(groups: DuplicateGroup[]): DuplicateGroup[] {
  return groups.filter((group) => group.entries.filter((entry) => !entry.allowDuplicateVisual).length > 1);
}

/** Human-readable report for the console, matching the task's expected shape. */
export function formatDuplicateReport(groups: DuplicateGroup[]): string {
  const lines: string[] = [];
  for (const group of groups) {
    lines.push("[css-loaders] Duplicate visual fingerprint detected:");
    lines.push(`- fingerprint: ${group.fingerprint}`);
    lines.push("- loaders:");
    for (const entry of group.entries) {
      const flag = entry.allowDuplicateVisual ? " (allowDuplicateVisual)" : "";
      lines.push(`  - ${entry.id} / ${entry.name} / ${entry.file}${flag}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
