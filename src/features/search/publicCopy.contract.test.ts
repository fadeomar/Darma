import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..");

/**
 * F-22. Public copy must describe what a visitor gets, not how Darma is built.
 *
 * This checks user-facing *string literals* — JSX text, and `title` /
 * `description` / `eyebrow` / `label` / `placeholder` props. Identifiers, types
 * and comments are untouched: `CoreEntity` is a perfectly good type name, it
 * just must not reach a page. Developer-education content keeps its technical
 * vocabulary — the banned list is Darma's own implementation language only.
 */

const BANNED = [
  "CoreEntity",
  "Darma Core",
  "Core migration",
  "Core entity browser",
  "UI primitives",
  "discovery layer",
  "entity layer",
  "unified registry",
  "shared registry",
  "migration preview",
  "migration-safe",
  "Non-breaking migration",
  "Core-powered",
  /\bBatch \d+\b/,
  /\bSprint \d+\b/,
];

// Loader provenance data names its upstream research batches; those strings are
// attribution metadata for CSS sources, not product copy, and are out of scope
// for this phase.
const SKIP_PATHS = ["app/admin", "app/tools/css-loaders"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = full.slice(SRC.length + 1).split("\\").join("/");
    if (SKIP_PATHS.some((p) => rel === p || rel.startsWith(`${p}/`))) continue;
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

/** Strips comments, then keeps only text a visitor could read. */
function userFacingText(source: string): string {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  const parts: string[] = [];
  // JSX text nodes between tags.
  for (const m of withoutComments.matchAll(/>([^<>{}]{3,})</g)) parts.push(m[1]);
  // Copy-carrying props.
  const copyProps = /\b(title|description|label|eyebrow|placeholder|summary|ctaLabel|actionLabel|allLabel|aria-label)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g;
  for (const m of withoutComments.matchAll(copyProps)) parts.push(m[2] ?? m[3] ?? m[4] ?? "");
  // Default values for the same props in component signatures.
  const defaults = /\b(title|description|placeholder|allLabel|ctaLabel)\s*=\s*"([^"]*)"/g;
  for (const m of withoutComments.matchAll(defaults)) parts.push(m[2]);
  return parts.join("\n");
}

describe("public copy has no internal product vocabulary", () => {
  const files = walk(SRC);

  it("scans a meaningful number of source files", () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it("contains no banned implementation term in user-facing text", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = userFacingText(readFileSync(file, "utf8"));
      if (!text) continue;
      for (const term of BANNED) {
        const hit = typeof term === "string" ? text.includes(term) : term.test(text);
        if (hit) offenders.push(`${file.slice(SRC.length + 1).split("\\").join("/")}: ${term}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("search and collections explain user value", () => {
  const search = readFileSync(join(SRC, "features/search/components/UnifiedSearchClient.tsx"), "utf8");
  const collections = readFileSync(join(SRC, "app/collections/page.tsx"), "utf8");

  it("search says what a visitor can find", () => {
    expect(search).toContain("Search tools, games, resources, learning paths, careers, workflows, and collections from one place.");
  });

  it("collections says what is available and what is next", () => {
    expect(collections).toContain("Explore the sections available today and see what is planned next.");
  });
});
