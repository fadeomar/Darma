import { describe, expect, it } from "vitest";
import {
  countLoadersForHub,
  getLoaderHub,
  getLoaderHubPath,
  getLoaderHubs,
  isLoaderHubSlug,
  LOADER_HUB_SLUGS,
} from "./loader-hubs";
import {
  buildCssLoadersMetadata,
  buildLoaderHubJsonLd,
  buildLoaderHubMetadata,
  CSS_LOADERS_DESCRIPTION,
  CSS_LOADERS_TITLE,
  serializeJsonLd,
} from "./seo";

describe("loader category allowlist", () => {
  it("exposes exactly the seven published hubs", () => {
    expect([...LOADER_HUB_SLUGS]).toEqual([
      "spinners",
      "dots",
      "skeletons",
      "button-loaders",
      "progress",
      "react",
      "tailwind",
    ]);
  });

  it("rejects unknown slugs so the route can 404", () => {
    expect(isLoaderHubSlug("skeletons")).toBe(true);
    expect(isLoaderHubSlug("skeleton")).toBe(false);
    expect(getLoaderHub("not-a-category")).toBeNull();
  });

  it("maps each hub to loader data that actually has results", () => {
    for (const hub of getLoaderHubs()) {
      expect(countLoadersForHub(hub.filters), hub.slug).toBeGreaterThan(0);
    }
  });

  it("maps button-loaders to the button category and skeletons to the skeleton data", () => {
    expect(getLoaderHub("button-loaders")?.filters.category).toBe("button");
    expect(getLoaderHub("skeletons")?.filters.category).toBe("skeleton");
    expect(getLoaderHub("tailwind")?.filters.category).toBe("tailwind");
    expect(getLoaderHub("react")?.filters.format).toBe("react");
  });
});

describe("loader hub metadata", () => {
  it("gives the gallery its own title and description instead of the generic tool helper", () => {
    const metadata = buildCssLoadersMetadata();
    expect(metadata.title).toBe(CSS_LOADERS_TITLE);
    expect(metadata.description).toBe(CSS_LOADERS_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe("/tools/css-loaders");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.openGraph?.url).toContain("/tools/css-loaders");
  });

  it("gives every hub a unique title, description, and self-referencing canonical", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const hub of getLoaderHubs()) {
      const metadata = buildLoaderHubMetadata(hub);
      expect(metadata.alternates?.canonical).toBe(getLoaderHubPath(hub.slug));
      expect(metadata.openGraph?.url).toContain(getLoaderHubPath(hub.slug));
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
      titles.add(String(metadata.title));
      descriptions.add(String(metadata.description));
    }

    expect(titles.size).toBe(LOADER_HUB_SLUGS.length);
    expect(descriptions.size).toBe(LOADER_HUB_SLUGS.length);
  });
});

describe("loader hub structured data", () => {
  const hub = getLoaderHub("skeletons")!;
  const loaders = [
    { id: "a", name: "Card skeleton", category: "skeleton", sourceId: "x", tags: [], formats: ["css" as const], flags: {} },
    { id: "b", name: "List skeleton", category: "skeleton", sourceId: "x", tags: [], formats: ["css" as const], flags: {} },
  ];

  it("describes the page, its breadcrumbs, and only the rendered loaders", () => {
    const graph = buildLoaderHubJsonLd({ hub, loaders, anchorPrefix: "css-loader-hub-" });
    const types = graph["@graph"].map((node) => (node as { "@type": string })["@type"]);
    expect(types).toEqual(["CollectionPage", "BreadcrumbList", "ItemList"]);

    const breadcrumbs = graph["@graph"][1] as { itemListElement: Array<{ name: string }> };
    expect(breadcrumbs.itemListElement.map((item) => item.name)).toEqual(["Home", "Tools", "CSS Loaders", "Skeletons"]);

    const itemList = graph["@graph"][2] as { numberOfItems: number; itemListElement: Array<{ url: string }> };
    expect(itemList.numberOfItems).toBe(loaders.length);
    expect(itemList.itemListElement[0].url).toContain("/tools/css-loaders/skeletons#css-loader-hub-a");
    expect(itemList.itemListElement[0].url.startsWith("http")).toBe(true);
  });

  it("escapes tag openers when serialized into the page", () => {
    expect(serializeJsonLd({ name: "</script>" })).not.toContain("</script>");
  });
});
