import { describe, expect, it } from "vitest";
import { getGames } from "../registry";
import { getGameExperienceManifest } from "./gameExperienceRegistry";

describe("game experience manifests", () => {
  it("provides usable instructions for every public game", () => {
    const games = getGames();
    expect(games.length).toBeGreaterThan(0);

    for (const game of games) {
      const manifest = getGameExperienceManifest(game);
      expect(manifest.title.length).toBeGreaterThan(8);
      expect(manifest.intro.length).toBeGreaterThan(20);
      expect(manifest.controls).toBe(game.controls);
      expect(manifest.accessibilityNote.length).toBeGreaterThan(20);
      expect(manifest.tips.length).toBeLessThanOrEqual(3);
    }
  });

  it("does not pretend preserved runtimes inherit native Darma controls", () => {
    const gridland = getGames().find((game) => game.slug === "gridland");
    expect(gridland).toBeDefined();
    expect(getGameExperienceManifest(gridland!).importedRuntime).toBe(true);
    expect(getGameExperienceManifest(gridland!).accessibilityNote).toContain("preserved runtime");
  });

  it("keeps mature flagship onboarding inside the game", () => {
    const reaction = getGames().find((game) => game.slug === "reaction-timer");
    const neon = getGames().find((game) => game.slug === "neon-core-defense");
    expect(getGameExperienceManifest(reaction!).nativeOnboarding).toBe(true);
    expect(getGameExperienceManifest(neon!).nativeOnboarding).toBe(true);
  });
});
