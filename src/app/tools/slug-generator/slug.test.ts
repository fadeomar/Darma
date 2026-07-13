import { describe, expect, it } from "vitest";
import {
  buildNextRedirectsSnippet,
  buildRedirectsJson,
  buildRoutesCsv,
  buildSlugBatch,
  buildSlugUtilitySnippet,
  DEFAULT_SLUG_BATCH_CONFIG,
  DEFAULT_SLUG_OPTIONS,
  generateSlug,
  normalizePath,
  normalizePathPrefix,
  parseSlugInput,
} from "./slug";
import type { SlugBatchConfig, SlugOptions } from "./types";

function opts(overrides: Partial<SlugOptions> = {}): SlugOptions {
  return { ...DEFAULT_SLUG_OPTIONS, ...overrides };
}

function config(overrides: Partial<SlugBatchConfig> = {}): SlugBatchConfig {
  return { ...DEFAULT_SLUG_BATCH_CONFIG, ...overrides };
}

describe("generateSlug", () => {
  it("creates a lowercase hyphenated slug", () => {
    expect(generateSlug("Hello World", opts()).slug).toBe("hello-world");
  });

  it("removes Latin diacritics while preserving letters", () => {
    expect(generateSlug("Résumé Café", opts()).slug).toBe("resume-cafe");
  });

  it("keeps multilingual Unicode by default", () => {
    expect(generateSlug("أفضل أدوات المطورين", opts()).slug).toBe("أفضل-أدوات-المطورين");
  });

  it("warns when ASCII-only mode loses non-ASCII content", () => {
    const result = generateSlug("أفضل أدوات المطورين", opts({ asciiOnly: true }));
    expect(result.slug).toBe("");
    expect(result.warnings).toContain("ascii-loss");
    expect(result.warnings).toContain("empty-output");
  });

  it("preserves nested path segments", () => {
    expect(generateSlug("docs/API Authentication/OAuth 2", opts({ preserveSlashes: true })).slug).toBe("docs/api-authentication/oauth-2");
  });

  it("removes English stop words", () => {
    expect(generateSlug("A Guide to the Future of Web Tools", opts({ removeStopWords: true })).slug).toBe("guide-future-web-tools");
  });

  it("removes numbers when disabled", () => {
    expect(generateSlug("Release 2026 Version 2", opts({ keepNumbers: false })).slug).toBe("release-version");
  });

  it("trims at a word boundary when possible", () => {
    const result = generateSlug("alpha beta gamma delta", opts({ maxLength: 12, maxLengthEnabled: true, trimAtWordBoundary: true }));
    expect(result.slug).toBe("alpha-beta");
    expect(result.warnings).toContain("trimmed");
  });

  it("can hard-trim when whole-word trimming is disabled", () => {
    const result = generateSlug("alpha beta gamma", opts({ maxLength: 8, maxLengthEnabled: true, trimAtWordBoundary: false }));
    expect(result.slug).toBe("alpha-be");
  });

  it("returns an empty-input warning for blank text", () => {
    expect(generateSlug("   ", opts()).warnings).toContain("empty-input");
  });
});

describe("input and path normalization", () => {
  it("parses bulk tab-separated previous paths", () => {
    const rows = parseSlugInput("New title\t/old-title\nSecond title", "bulk");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.previousPath).toBe("/old-title");
    expect(rows[1]?.sourceLine).toBe(2);
  });

  it("parses a single title with a previous path", () => {
    const rows = parseSlugInput("New title\t/old-title", "single");
    expect(rows[0]).toMatchObject({ title: "New title", previousPath: "/old-title" });
  });

  it("normalizes prefixes and full old URLs", () => {
    expect(normalizePathPrefix(" blog/posts/ ")).toBe("/blog/posts");
    expect(normalizePath("https://example.com/old/path/?x=1#top")).toBe("/old/path");
  });
});

describe("buildSlugBatch", () => {
  it("adds deterministic suffixes for duplicate slugs", () => {
    const result = buildSlugBatch("Product Name\nProduct Name\nProduct Name", opts(), config({ mode: "bulk", pathPrefix: "/products", collisionMode: "suffix" }));
    expect(result.rows.map((row) => row.path)).toEqual(["/products/product-name", "/products/product-name-2", "/products/product-name-3"]);
    expect(result.stats.collisions).toBe(2);
  });

  it("blocks duplicates under the error policy", () => {
    const result = buildSlugBatch("Same\nSame", opts(), config({ mode: "bulk", collisionMode: "error" }));
    expect(result.rows[1]?.valid).toBe(false);
    expect(result.checks.some((check) => check.level === "danger")).toBe(true);
  });

  it("allows duplicates under the allow policy", () => {
    const result = buildSlugBatch("Same\nSame", opts(), config({ mode: "bulk", collisionMode: "allow" }));
    expect(result.rows.every((row) => row.valid)).toBe(true);
    expect(result.rows[0]?.path).toBe(result.rows[1]?.path);
  });

  it("respects the configured collision starting suffix without reusing it", () => {
    const result = buildSlugBatch("Same\nSame\nSame", opts(), config({ mode: "bulk", collisionMode: "suffix", collisionStart: 10 }));
    expect(result.rows.map((row) => row.slug)).toEqual(["same", "same-10", "same-11"]);
  });

  it("avoids collisions between generated suffixes and later source slugs", () => {
    const result = buildSlugBatch("Same\nSame\nSame 2", opts(), config({ mode: "bulk", collisionMode: "suffix", collisionStart: 2 }));
    expect(new Set(result.rows.map((row) => row.slug)).size).toBe(3);
    expect(result.rows[2]?.slug).toBe("same-2-2");
  });

  it("flags reserved route segments", () => {
    const result = buildSlugBatch("Admin", opts(), config({ reservedWords: ["admin"] }));
    expect(result.rows[0]?.warnings).toContain("reserved-route");
    expect(result.stats.reservedHits).toBe(1);
  });

  it("creates normalized redirect mappings only when paths change", () => {
    const changed = buildSlugBatch("New title\t/old-title", opts(), config({ mode: "single", pathPrefix: "/blog" }));
    expect(changed.rows[0]?.redirectFrom).toBe("/old-title");
    expect(changed.rows[0]?.path).toBe("/blog/new-title");

    const unchanged = buildSlugBatch("New title\t/blog/new-title", opts(), config({ mode: "single", pathPrefix: "/blog" }));
    expect(unchanged.rows[0]?.redirectFrom).toBeNull();
  });

  it("keeps collision suffixes inside max length", () => {
    const result = buildSlugBatch("A very long repeated product title\nA very long repeated product title", opts({ maxLengthEnabled: true, maxLength: 18 }), config({ mode: "bulk", collisionMode: "suffix" }));
    expect(result.rows[1]?.slug.length).toBeLessThanOrEqual(18);
    expect(result.rows[1]?.slug.endsWith("-2")).toBe(true);
  });
});

describe("exports", () => {
  const batch = buildSlugBatch("New Page\t/old-page\nSecond Page", opts(), config({ mode: "bulk", pathPrefix: "/blog" }));

  it("builds CSV with route and redirect data", () => {
    const csv = buildRoutesCsv(batch.rows);
    expect(csv).toContain("source_line,title,slug,path");
    expect(csv).toContain("/blog/new-page");
    expect(csv).toContain("/old-page");
  });

  it("builds redirect JSON and a Next.js config snippet", () => {
    expect(JSON.parse(buildRedirectsJson(batch.rows))).toEqual([{ source: "/old-page", destination: "/blog/new-page", permanent: true }]);
    const snippet = buildNextRedirectsSnippet(batch.rows);
    expect(snippet).toContain("async redirects()");
    expect(snippet).toContain("/blog/new-page");
  });

  it("builds a TypeScript slug utility without undefined placeholders", () => {
    const snippet = buildSlugUtilitySnippet(opts());
    expect(snippet).toContain("export function slugify");
    expect(snippet).not.toContain("undefined");
  });
});
