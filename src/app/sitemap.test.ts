import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { getLoaderHubPath, LOADER_HUB_SLUGS } from "./tools/css-loaders/loader-hubs";

const entries = sitemap();
const urls = entries.map((entry) => entry.url);

describe("sitemap", () => {
  it("lists the loader gallery and every category hub", () => {
    expect(urls.some((url) => url.endsWith("/tools/css-loaders"))).toBe(true);

    for (const slug of LOADER_HUB_SLUGS) {
      expect(urls.some((url) => url.endsWith(getLoaderHubPath(slug))), slug).toBe(true);
    }
  });

  it("contains no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("still derives tool and game routes from their registries", () => {
    expect(urls.some((url) => url.endsWith("/tools/json-formatter"))).toBe(true);
    expect(urls.some((url) => url.includes("/games/"))).toBe(true);
  });
});
