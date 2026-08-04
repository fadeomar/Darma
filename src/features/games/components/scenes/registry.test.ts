import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getGames } from "../../registry";
import { GAMES_WITH_OWN_ARTWORK, GAME_SCENES, getGameScene } from "./registry";

const games = getGames();
const thumbnail = readFileSync(join(__dirname, "..", "GameThumbnail.tsx"), "utf8");
const scenes = readFileSync(join(__dirname, "gameScenes.tsx"), "utf8");

describe("game scene registry", () => {
  it("gives every game either a scene or its own artwork", () => {
    const missing = games
      .filter((game) => !GAME_SCENES[game.slug] && !GAMES_WITH_OWN_ARTWORK.includes(game.slug))
      .map((game) => game.slug);
    expect(missing).toEqual([]);
  });

  it("does not register a scene for a game that left the catalog", () => {
    const slugs = new Set(games.map((game) => game.slug));
    expect(Object.keys(GAME_SCENES).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it("returns null for an unknown slug", () => {
    expect(getGameScene("not-a-game")).toBeNull();
  });

  it("no longer renders an emoji as the card artwork", () => {
    // The emoji tile was the previous fallback for 20 of 21 games.
    expect(thumbnail).not.toContain("{game.thumbnail}</span>");
    expect(thumbnail).not.toContain("motifSize");
    expect(thumbnail).not.toContain("accentClass");
  });

  it("keeps each scene a distinct composition", () => {
    // A scene that is a copy of another would show up as a duplicated stage id.
    const ids = scenes.match(/id="s[a-z0-9]+"/g) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(Object.keys(GAME_SCENES).length);
  });
});
