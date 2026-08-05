import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_PILLAR_CONCEPTS, resolveAtlasConcept } from "./AtlasPillarIllustration";

const source = readFileSync(join(__dirname, "AtlasPillarIllustration.tsx"), "utf8");
const atlasPage = readFileSync(join(__dirname, "..", "..", "app", "tech-atlas", "page.tsx"), "utf8");

/** The eight pillars plus the two editorial companions. */
const REQUIRED = [
  "resources",
  "learning-paths",
  "pathfinder",
  "careers",
  "ways-of-working",
  "teams",
  "glossary",
  "contribute",
  "guides",
  "comparisons",
];

describe("atlas pillar illustrations", () => {
  it("covers every section linked from the Atlas page", () => {
    const hrefs = [...atlasPage.matchAll(/\{ href: "([^"]+)"/g)].map((match) => match[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    const unmapped = hrefs.filter((href) => !resolveAtlasConcept(href));
    expect(unmapped).toEqual([]);
  });

  it("has a concept for each pillar and editorial companion", () => {
    const concepts = new Set(Object.values(ATLAS_PILLAR_CONCEPTS));
    expect(REQUIRED.filter((concept) => !concepts.has(concept as never))).toEqual([]);
  });

  it("gives each concept its own composition", () => {
    // A shared shell reused with a different label would show up as a repeated
    // root class; each illustration declares a distinct one.
    const roots = [...source.matchAll(/className="atlas-ill atlas-ill-([a-z-]+)"/g)].map((match) => match[1]);
    expect(roots.length).toBe(REQUIRED.length);
    expect(new Set(roots).size).toBe(roots.length);
  });

  it("no longer renders the shared icon-and-two-paths artwork", () => {
    expect(atlasPage).not.toContain("AtlasSectionArtwork");
  });

  it("returns null for a section that has no illustration", () => {
    expect(resolveAtlasConcept("/not-a-section")).toBeNull();
  });
});
