import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getGameBySlug, getGameSlugs } from "../../registry";

const runtimeRoot = resolve(process.cwd(), "public/darma-games/gridland");
const bundlePath = resolve(runtimeRoot, "js/app.js");
const cssPath = resolve(runtimeRoot, "css/main.css");

describe("Gridland Darma integration", () => {
  it("registers Gridland as a public playable game", () => {
    const game = getGameBySlug("gridland");

    expect(game).not.toBeNull();
    expect(game?.href).toBe("/games/gridland");
    expect(game?.input).toEqual(expect.arrayContaining(["mouse", "touch"]));
    expect(getGameSlugs()).toContain("gridland");
  });

  it("ships the required local runtime assets", () => {
    const required = [
      "index.html",
      "js/app.js",
      "js/lib/require.js",
      "js/lib/jquery-2.0.3.min.js",
      "css/main.css",
      "img/tiles.png",
      "img/monsters.png",
      "audio/theme-day.ogg",
      "audio/theme-night.mp3",
      "LICENSE",
    ];

    for (const relativePath of required) {
      expect(existsSync(resolve(runtimeRoot, relativePath)), relativePath).toBe(true);
    }
  });

  it("uses local media and disables legacy analytics dependencies", () => {
    const bundle = readFileSync(bundlePath, "utf8");
    const css = readFileSync(cssPath, "utf8");

    expect(bundle).not.toContain("glmedia.doublespeakgames.com");
    expect(bundle).not.toContain("ajax.googleapis.com/ajax/libs/jquery");
    expect(bundle).not.toContain("google-analytics.com/analytics");
    expect(bundle).not.toContain("UA-41314886-2");
    expect(css).not.toContain("glmedia.doublespeakgames.com");
    expect(css).toContain("../img/tiles.png");
  });

  it("namespaces saves and settings without changing the save payload", () => {
    const bundle = readFileSync(bundlePath, "utf8");

    expect(bundle).toContain('localStorage["darma:games:gridland:v1:options"]');
    expect(bundle).toContain('localStorage["darma:games:gridland:v1:slot"+');
    expect(bundle).not.toContain('localStorage["slot"+');
    expect(bundle).not.toContain("localStorage.gameOptions");
  });
});
