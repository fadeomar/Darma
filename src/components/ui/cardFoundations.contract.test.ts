import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(SRC, p), "utf8");

const gameCard = read("features/games/components/GameCard.tsx");
const toolDirectory = read("features/tools/layouts/ToolLayoutDirectory.tsx");
const toolCardLink = read("components/analytics/ToolCardLink.tsx");
const resourceArtwork = read("components/visuals/ResourceCardArtwork.tsx");

/**
 * Phase 2 card-foundation contracts. Source-level so a regression is caught in
 * the component that owns the rule rather than in a rendered snapshot.
 */

describe("game catalog card", () => {
  it("states play time exactly once", () => {
    const hits = gameCard.match(/game\.playTime/g) ?? [];
    expect(hits).toHaveLength(1);
  });

  it("does not pair synonymous metadata", () => {
    // "Quick hit" duplicated the "Quick break" category label; the
    // Mobile/Desktop chip duplicated "Touch ready".
    expect(gameCard).not.toContain("Quick hit");
    expect(gameCard).not.toContain("funLevel");
    expect(gameCard).not.toContain('game.devices.includes("mobile")');
  });

  it("keeps a single primary action: the card itself", () => {
    // Interaction model B — no second Play link competing with the card link.
    expect(gameCard).not.toContain("GamePlayLink");
    // Stretched link on the title makes the card the navigation target.
    expect(gameCard).toContain("after:absolute after:inset-0");
    // Favourite stays a real button, as a sibling.
    expect(gameCard).toContain("FavoriteGameButton");
  });

  it("clamps the title to two lines and reserves description height", () => {
    expect(gameCard).toContain("line-clamp-2");
    expect(gameCard).toContain("min-h-[3rem]");
  });

  it("keeps the thumbnail play-time label readable over a light thumbnail", () => {
    expect(gameCard).toContain("bg-black/65");
    expect(gameCard).not.toContain("bg-black/35");
  });
});

describe("tool catalog card", () => {
  it("reserves a two-line title region and a fixed description region", () => {
    expect(toolDirectory).toContain("line-clamp-2 min-h-[2.5rem]");
    expect(toolDirectory).toContain("sm:min-h-[3.5rem]");
    expect(toolDirectory).toContain("line-clamp-3 min-h-[4.5rem]");
  });

  it("reserves height for use cases and tags so the CTA cannot drift", () => {
    expect(toolDirectory).toContain("min-h-[2.5rem] content-start");
    expect(toolDirectory).toContain("min-h-8 flex-wrap content-start");
    expect(toolDirectory).toContain("mt-auto pt-5");
  });

  it("keeps the body link a growable flex column", () => {
    // A bare inline <a> severs the flex chain and `mt-auto` stops working.
    expect(toolDirectory).toContain('className="flex flex-1 flex-col"');
    expect(toolCardLink).toContain("className={className}");
  });

  it("keeps the full title available when the visual title is clamped", () => {
    expect(toolDirectory).toContain("title={tool.title}");
    expect(toolDirectory).toContain("toolName={tool.title}");
  });
});

describe("resource card", () => {
  it("does not repeat the type and pillar that the card body already states", () => {
    expect(resourceArtwork).not.toContain("resource-card-artwork-labels");
    expect(resourceArtwork).not.toContain("resource.resourceType.replace");
  });

  it("keeps the decorative identity panel out of the accessibility tree", () => {
    expect(resourceArtwork).toContain("aria-hidden");
  });
});

describe("no nested interactive structure", () => {
  const files = [
    ["GameCard", gameCard],
    ["ToolLayoutDirectory", toolDirectory],
  ] as const;

  for (const [name, source] of files) {
    it(`${name} does not put a Link inside a Link`, () => {
      // A <Link> directly wrapping another <Link> or a <button> is invalid and
      // a common source of mis-taps inside cards.
      expect(source).not.toMatch(/<Link[^>]*>\s*<(Link|button)\b/);
      expect(source).not.toMatch(/<ToolCardLink[^>]*>\s*<(Link|ToolCardLink|button)\b/);
    });
  }
});
