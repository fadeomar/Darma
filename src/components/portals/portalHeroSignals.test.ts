import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MAX_PORTAL_HERO_SIGNALS, resolvePortalHeroSignals } from "./portalHeroSignals";

const experienceCss = readFileSync(join(process.cwd(), "src", "styles", "experience.css"), "utf8");

const toolsSignals = [
  { label: "Interaction", value: "Controls beside results" },
  { label: "Output", value: "Copy and export ready" },
  { label: "Discovery", value: "Search by task" },
];

const gamesSignals = [
  { label: "Access", value: "No signup" },
  { label: "Input", value: "Keyboard, mouse, touch" },
  { label: "Progress", value: "Local when supported" },
  { label: "Mood", value: "Puzzle to arcade" },
];

describe("portal hero signal strip", () => {
  it("renders exactly the supplied items, never padding to four", () => {
    expect(resolvePortalHeroSignals(toolsSignals)).toHaveLength(3);
    expect(resolvePortalHeroSignals(gamesSignals)).toHaveLength(4);
    expect(resolvePortalHeroSignals([])).toHaveLength(0);
  });

  it("caps the strip instead of overflowing the hero", () => {
    const overflowing = [...gamesSignals, { label: "Extra", value: "Dropped" }];
    expect(resolvePortalHeroSignals(overflowing)).toHaveLength(MAX_PORTAL_HERO_SIGNALS);
    expect(resolvePortalHeroSignals(overflowing).map((signal) => signal.label)).not.toContain("Extra");
  });

  it("drives the grid from the real item count", () => {
    expect(experienceCss).toContain("repeat(var(--portal-hero-signal-count, 3), minmax(0, 1fr))");
  });

  it("gives four items a 2x2 block before the wide-desktop 4-up row", () => {
    expect(experienceCss).toContain('.portal-hero-signals[data-signal-count="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }');
    expect(experienceCss).toContain('.portal-hero-signals[data-signal-count="4"] { max-width: 46rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }');
  });

  it("does not truncate signal values to one ellipsized line", () => {
    const declaration = experienceCss.slice(experienceCss.indexOf(".portal-hero-signals dd"));
    const rule = declaration.slice(0, declaration.indexOf("}"));
    expect(rule).not.toContain("text-overflow");
    expect(rule).not.toContain("nowrap");
  });
});
