import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, posix, join, dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { getGameBySlug, getGameSlugs } from "../../registry";

const runtimeRoot = resolve(process.cwd(), "public/darma-games/gridland");
const bundlePath = resolve(runtimeRoot, "js/app.js");
const cssPath = resolve(runtimeRoot, "css/main.css");
const indexPath = resolve(runtimeRoot, "index.html");
const bridgePath = resolve(runtimeRoot, "js/darma-bridge.js");

/** Every file actually shipped under the runtime, as case-exact relative paths. */
function listRuntimeFiles(dir = runtimeRoot, rel = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const next = rel ? `${rel}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listRuntimeFiles(join(dir, entry.name), next) : [next];
  });
}

/** Strips HTML comments so attribution notes are not mistaken for live requests. */
function stripHtmlComments(html: string) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

describe("Gridland Darma integration", () => {
  it("registers Gridland as a public playable game", () => {
    const game = getGameBySlug("gridland");

    expect(game).not.toBeNull();
    expect(game?.href).toBe("/games/gridland");
    expect(game?.input).toEqual(expect.arrayContaining(["mouse", "touch"]));
    expect(game?.thumbnailType).toBe("image");
    expect(game?.thumbnail).toBe("/darma-games/gridland/img/badge.png");
    expect(getGameSlugs()).toContain("gridland");
  });

  it("ships the required local runtime assets", () => {
    const required = [
      "index.html",
      "js/app.js",
      "js/darma-bridge.js",
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

  it("ships the versioned Darma runtime bridge without modifying gameplay modules", () => {
    const index = readFileSync(indexPath, "utf8");
    const bridge = readFileSync(bridgePath, "utf8");

    expect(index).toContain('src="js/darma-bridge.js"');
    expect(bridge).toContain('var RUNTIME_SOURCE = "darma-gridland-runtime"');
    expect(bridge).toContain('var GAME_ID = "gridland"');
    expect(bridge).toContain('var VERSION = 1');
    expect(bridge).toContain('message.command === "request-state"');
    expect(bridge).toContain('EventManager.bind("phaseChange"');
    expect(bridge).not.toContain("localStorage");
    expect(bridge).not.toContain("switchTiles");
  });

});

describe("Gridland production runtime audit", () => {
  const files = listRuntimeFiles();

  it("loads no external subresource from the game document", () => {
    const html = stripHtmlComments(readFileSync(indexPath, "utf8"));

    // Attribution anchors may point outward; scripts, styles and icons may not.
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
      expect(match[1], `subresource ${match[1]} must be local`).not.toMatch(/^(https?:)?\/\//i);
    }
  });

  it("keeps the stylesheet free of remote and protocol-relative urls", () => {
    const css = readFileSync(cssPath, "utf8");

    for (const match of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      expect(match[1].trim(), "css url must be local").not.toMatch(/^(https?:)?\/\//i);
    }
  });

  it("resolves every referenced local asset with exact casing", () => {
    const shipped = new Set(files);
    const missing: string[] = [];

    for (const file of files.filter((f) => /\.(css|js|html)$/.test(f))) {
      const text = readFileSync(resolve(runtimeRoot, file), "utf8");
      const refs = [
        ...[...text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1].trim()),
        ...[...text.matchAll(/["'`]([^"'`\s>]+\.(?:mp3|ogg|png|jpg|jpeg|gif|ico|css))["'`]/gi)].map((m) => m[1]),
      ];

      for (const ref of refs) {
        if (/^(data:|https?:|\/\/)/i.test(ref)) continue;
        const resolved = posix.normalize(posix.join(posix.dirname(file), ref.split(/[?#]/)[0]));
        if (resolved.startsWith("..")) continue;
        if (!shipped.has(resolved)) missing.push(`${resolved} (referenced by ${file})`);
      }
    }

    expect(missing).toEqual([]);
  });

  it("ships jQuery and RequireJS locally and points RequireJS at the local jQuery", () => {
    expect(files).toContain("js/lib/require.js");
    expect(files).toContain("js/lib/jquery-2.0.3.min.js");
    expect(readFileSync(bundlePath, "utf8")).toContain('jquery:"jquery-2.0.3.min"');
  });

  it("carries no active analytics identifier or tracker request", () => {
    for (const file of files.filter((f) => /\.(js|html)$/.test(f))) {
      const text = readFileSync(resolve(runtimeRoot, file), "utf8");
      expect(text, file).not.toMatch(/UA-\d{4,}-\d+/);
      expect(text, file).not.toMatch(/google-analytics\.com|googletagmanager\.com/i);
    }
  });

  it("neutralises the analytics module instead of deleting the dependency", () => {
    // RequireJS still resolves "app/analytics", so removing it would break the
    // original module graph. It must resolve to a no-op.
    const analytics = readFileSync(resolve(runtimeRoot, "js/lib/analytics.js"), "utf8");
    expect(analytics).toContain("define");
    expect(analytics).not.toMatch(/XMLHttpRequest|fetch\(|new Image|\.send\(/);
    expect(readFileSync(bundlePath, "utf8")).toContain('define("app/analytics",[],function(){return{init:function(){}}})');
  });

  it("includes the Darma bridge exactly once", () => {
    const html = stripHtmlComments(readFileSync(indexPath, "utf8"));
    const includes = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*darma-bridge\.js["']/gi)];

    expect(includes).toHaveLength(1);
  });

  it("uses only the namespaced storage prefix for every storage access", () => {
    const bundle = readFileSync(bundlePath, "utf8");
    const accesses = [
      ...[...bundle.matchAll(/localStorage\[\s*"([^"]*)"/g)].map((m) => m[1]),
      ...[...bundle.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*"([^"]*)"/g)].map((m) => m[1]),
    ];

    expect(accesses.length).toBeGreaterThan(0);
    for (const key of accesses) {
      expect(key, `storage key ${key}`).toMatch(/^darma:games:gridland:v1:/);
    }
  });

  it("keeps the runtime source mirror in sync with the shipped bridge", () => {
    const mirror = resolve(process.cwd(), "vendor/gridland-source/www/js/darma-bridge.js");
    expect(existsSync(mirror)).toBe(true);
    expect(readFileSync(mirror, "utf8")).toBe(readFileSync(bridgePath, "utf8"));
  });

  it("keeps the bridge observational and same-origin only", () => {
    const bridge = readFileSync(bridgePath, "utf8");

    // The bridge may report state, but must never broadcast to a wildcard
    // origin, and must guard against a second initialisation.
    expect(bridge).toMatch(/window\.parent\.postMessage\(/);
    expect(bridge).toContain("window.location.origin");
    expect(bridge).not.toMatch(/postMessage\([\s\S]*?,\s*["']\*["']\s*\)/);
    expect(bridge).toContain("if (connected) return;");
  });

  it("retains the original licence and attribution", () => {
    expect(files).toContain("LICENSE");
    const license = readFileSync(resolve(runtimeRoot, "LICENSE"), "utf8");
    expect(license).toMatch(/Mozilla Public License/i);
  });

  it("credits the original author and licence in the Darma registry", () => {
    const credits = getGameBySlug("gridland")?.credits;

    expect(credits).toBeDefined();
    expect(credits?.author).toMatch(/Doublespeak Games/i);
    expect(credits?.license).toBe("MPL 2.0");
    // The licence link must resolve to the licence actually shipped.
    expect(credits?.licenseUrl).toBe("/darma-games/gridland/LICENSE");
    expect(existsSync(resolve(process.cwd(), "public", credits!.licenseUrl!.replace(/^\//, "")))).toBe(true);
    expect(credits?.additional).toEqual([{ role: "Music", name: "Vince Nitro" }]);
    // Darma integrates Gridland; it must never be presented as its creator.
    expect(credits?.integrationNote).toMatch(/not by Darma/i);
  });

  it("ships the integration and licensing documentation", () => {
    for (const doc of ["DARMA-INTEGRATION.md", "README-ORIGINAL.md"]) {
      expect(files, doc).toContain(doc);
    }
  });
});
