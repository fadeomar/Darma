import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import loaderIndexJson from "./data/generated/loader-index.json";
import sourceStatsJson from "./data/generated/source-stats.json";
import { filterLoaders, matchesLoaderFilters } from "./filter-utils";
import { DEFAULT_LOADER_FILTERS } from "./loader-utils";
import {
  getLoaderSourceGroup,
  getLoaderSourceGroupName,
  isLoaderSourceGroupId,
  LOADER_SOURCE_GROUPS,
} from "./loader-sources";
import type { LoaderIndexItem } from "./types";

const loaderIndex = loaderIndexJson as LoaderIndexItem[];
const sourceStats = sourceStatsJson as { total: number; groups: Record<string, number> };
const SOURCE_DIR = path.join(__dirname, "data/source/loaders");

describe("loader source registry", () => {
  it("has unique source ids", () => {
    const ids = LOADER_SOURCE_GROUPS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("registers every source directory on disk", () => {
    const directories = readdirSync(SOURCE_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const registered = LOADER_SOURCE_GROUPS.map((group) => group.id).sort();
    expect(registered).toEqual(directories);
  });

  it("requires a name, description, author, and license on every source", () => {
    for (const group of LOADER_SOURCE_GROUPS) {
      expect(group.name.trim(), `${group.id} name`).not.toBe("");
      expect(group.description.trim(), `${group.id} description`).not.toBe("");
      expect(group.author.trim(), `${group.id} author`).not.toBe("");
      expect(group.license.trim(), `${group.id} license`).not.toBe("");
    }
  });

  it("makes every external source traceable to its origin", () => {
    // Multi-origin groups (open-pack-2026 blends several upstream projects) have no
    // single homepage, so a written attribution line satisfies this instead.
    for (const group of LOADER_SOURCE_GROUPS.filter((candidate) => !candidate.isOriginal)) {
      const isTraceable = Boolean(group.homepage ?? group.repository ?? group.attribution);
      expect(isTraceable, `${group.id} must record a homepage, repository, or attribution`).toBe(true);
    }
  });

  it("does not claim a verified license without a license url, unless Darma-authored", () => {
    for (const group of LOADER_SOURCE_GROUPS) {
      if (group.license === "Unknown") {
        expect(group.licenseVerified, `${group.id} cannot be verified with an Unknown license`).toBe(false);
      }
    }
  });

  it("marks Darma-authored sources as original", () => {
    for (const group of LOADER_SOURCE_GROUPS) {
      if (group.author === "Darma") {
        expect(group.isOriginal, `${group.id} authored by Darma must be isOriginal`).toBe(true);
      }
    }
  });

  it("resolves ids through the lookup helpers", () => {
    expect(isLoaderSourceGroupId("loaders-css")).toBe(true);
    expect(isLoaderSourceGroupId("not-a-real-source")).toBe(false);
    expect(getLoaderSourceGroup("loaders-css")?.author).toBe("Connor Atherton");
    expect(getLoaderSourceGroupName("loaders-css")).toBe("Loaders.css");
    // Unknown ids fall back to the raw id rather than throwing.
    expect(getLoaderSourceGroupName("not-a-real-source")).toBe("not-a-real-source");
  });
});

describe("loader index source integrity", () => {
  it("gives every loader a sourceId that references a registered source", () => {
    const unregistered = loaderIndex.filter((loader) => !isLoaderSourceGroupId(loader.sourceId));
    expect(unregistered.map((loader) => `${loader.id} -> ${loader.sourceId}`)).toEqual([]);
  });

  it("has at least one loader for every registered source", () => {
    const used = new Set(loaderIndex.map((loader) => loader.sourceId));
    const empty = LOADER_SOURCE_GROUPS.filter((group) => !used.has(group.id)).map((group) => group.id);
    expect(empty).toEqual([]);
  });

  it("keeps source-stats counts in sync with the index", () => {
    const counts = loaderIndex.reduce<Record<string, number>>((accumulator, loader) => {
      accumulator[loader.sourceId] = (accumulator[loader.sourceId] ?? 0) + 1;
      return accumulator;
    }, {});

    expect(counts).toEqual(sourceStats.groups);
    expect(sourceStats.total).toBe(loaderIndex.length);
  });

  it("indexes the source id and name into searchable text", () => {
    const loader = loaderIndex.find((candidate) => candidate.sourceId === "loaders-css");
    expect(loader?.searchText).toContain("loaders-css");
    expect(loader?.searchText).toContain("loaders.css");
  });
});

describe("source filtering", () => {
  it("returns every loader when the source filter is 'all'", () => {
    expect(DEFAULT_LOADER_FILTERS.source).toBe("all");
    const filtered = filterLoaders(loaderIndex, DEFAULT_LOADER_FILTERS);
    expect(filtered.length).toBe(loaderIndex.length);
  });

  it("narrows results to a single source", () => {
    const filtered = filterLoaders(loaderIndex, { ...DEFAULT_LOADER_FILTERS, source: "loaders-css" });
    expect(filtered.length).toBe(sourceStats.groups["loaders-css"]);
    expect(filtered.every((loader) => loader.sourceId === "loaders-css")).toBe(true);
  });

  it("combines the source filter with other filters", () => {
    const filters = { ...DEFAULT_LOADER_FILTERS, source: "darma-custom", category: "bars" as const };
    const filtered = filterLoaders(loaderIndex, filters);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((loader) => loader.sourceId === "darma-custom" && loader.category === "bars")).toBe(true);
  });

  it("excludes loaders from other sources", () => {
    const loader = loaderIndex.find((candidate) => candidate.sourceId === "loading-io");
    expect(loader).toBeDefined();
    expect(matchesLoaderFilters(loader!, { ...DEFAULT_LOADER_FILTERS, source: "loading-io" })).toBe(true);
    expect(matchesLoaderFilters(loader!, { ...DEFAULT_LOADER_FILTERS, source: "loaders-css" })).toBe(false);
  });
});
