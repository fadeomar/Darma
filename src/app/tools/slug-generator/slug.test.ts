import { describe, it, expect } from "vitest";
import { generateSlug, DEFAULT_SLUG_OPTIONS } from "./slug";
import type { SlugOptions } from "./slug";

function opts(overrides: Partial<SlugOptions> = {}): SlugOptions {
  return { ...DEFAULT_SLUG_OPTIONS, ...overrides };
}

// ─── Basic slugification ──────────────────────────────────────────────────────

describe("generateSlug – basic", () => {
  it("converts a simple phrase to a hyphenated slug", () => {
    expect(generateSlug("Hello World", opts()).slug).toBe("hello-world");
  });

  it("handles leading and trailing whitespace", () => {
    expect(generateSlug("  hello world  ", opts()).slug).toBe("hello-world");
  });

  it("returns empty slug + empty-input warning for blank input", () => {
    const result = generateSlug("", opts());
    expect(result.slug).toBe("");
    expect(result.warnings).toContain("empty-input");
  });

  it("returns empty slug + empty-input warning for whitespace-only input", () => {
    const result = generateSlug("   ", opts());
    expect(result.slug).toBe("");
    expect(result.warnings).toContain("empty-input");
  });

  it("removes special characters", () => {
    expect(generateSlug("Hello! World?", opts()).slug).toBe("hello-world");
  });

  it("collapses multiple separators", () => {
    expect(generateSlug("hello---world", opts()).slug).toBe("hello-world");
  });
});

// ─── Separator ────────────────────────────────────────────────────────────────

describe("generateSlug – separator", () => {
  it("uses hyphen as default separator", () => {
    expect(generateSlug("hello world", opts()).slug).toBe("hello-world");
  });

  it("uses underscore when separator is _", () => {
    expect(generateSlug("hello world", opts({ separator: "_" })).slug).toBe("hello_world");
  });
});

// ─── Case mode ────────────────────────────────────────────────────────────────

describe("generateSlug – caseMode", () => {
  it("lowercases with lower mode (default)", () => {
    expect(generateSlug("Hello World", opts({ caseMode: "lower" })).slug).toBe("hello-world");
  });

  it("uppercases with upper mode", () => {
    expect(generateSlug("hello world", opts({ caseMode: "upper" })).slug).toBe("HELLO-WORLD");
  });

  it("keeps original case with keep mode", () => {
    expect(generateSlug("Hello World", opts({ caseMode: "keep" })).slug).toBe("Hello-World");
  });
});

// ─── Numbers ──────────────────────────────────────────────────────────────────

describe("generateSlug – keepNumbers", () => {
  it("keeps numbers by default", () => {
    expect(generateSlug("version 2 release", opts()).slug).toBe("version-2-release");
  });

  it("removes numbers when keepNumbers is false", () => {
    const result = generateSlug("version 2 release", opts({ keepNumbers: false }));
    expect(result.slug).not.toMatch(/\d/);
    expect(result.slug).toBe("version-release");
  });
});

// ─── Stop words ───────────────────────────────────────────────────────────────

describe("generateSlug – removeStopWords", () => {
  it("keeps stop words by default", () => {
    expect(generateSlug("the quick brown fox", opts()).slug).toBe("the-quick-brown-fox");
  });

  it("removes stop words when enabled", () => {
    const result = generateSlug("the quick brown fox", opts({ removeStopWords: true }));
    expect(result.slug).toBe("quick-brown-fox");
  });

  it("removes 'a' and 'of' as standalone stop words", () => {
    const result = generateSlug("a cup of tea", opts({ removeStopWords: true }));
    // "cup-tea" — the stop words 'a' and 'of' should be absent as slug segments
    const segments = result.slug.split("-");
    expect(segments).not.toContain("a");
    expect(segments).not.toContain("of");
    expect(result.slug).toBe("cup-tea");
  });
});

// ─── Max length ───────────────────────────────────────────────────────────────

describe("generateSlug – maxLength", () => {
  it("does not truncate when maxLengthEnabled is false", () => {
    const long = "this is a very long title with many words in it";
    const result = generateSlug(long, opts({ maxLengthEnabled: false }));
    expect(result.slug.length).toBeGreaterThan(10);
    expect(result.warnings).not.toContain("trimmed");
  });

  it("truncates to maxLength when maxLengthEnabled is true", () => {
    const result = generateSlug("hello world foo bar", opts({ maxLengthEnabled: true, maxLength: 10 }));
    expect(result.slug.length).toBeLessThanOrEqual(10);
    expect(result.warnings).toContain("trimmed");
  });

  it("does not end with a separator after trimming", () => {
    const result = generateSlug("hello world foo", opts({ maxLengthEnabled: true, maxLength: 7 }));
    expect(result.slug).not.toMatch(/[-_]$/);
  });
});

// ─── Preserve slashes ────────────────────────────────────────────────────────

describe("generateSlug – preserveSlashes", () => {
  it("treats slashes as word boundaries by default", () => {
    const result = generateSlug("blog/my post", opts({ preserveSlashes: false }));
    expect(result.slug).toBe("blog-my-post");
  });

  it("keeps slashes when preserveSlashes is true", () => {
    const result = generateSlug("blog/my post", opts({ preserveSlashes: true }));
    expect(result.slug).toBe("blog/my-post");
  });
});

// ─── Diacritics ───────────────────────────────────────────────────────────────

describe("generateSlug – diacritics", () => {
  it("removes Latin diacritics", () => {
    expect(generateSlug("résumé café", opts()).slug).toBe("resume-cafe");
  });

  it("removes umlaut — ü → u", () => {
    // ß is its own Unicode letter (not a diacritic combination) so it is preserved;
    // ü however decomposes to u + combining dieresis and is stripped correctly.
    expect(generateSlug("über", opts()).slug).toBe("uber");
  });
});

// ─── Stats & warnings ────────────────────────────────────────────────────────

describe("generateSlug – stats", () => {
  it("reports original character count", () => {
    const result = generateSlug("hello world", opts());
    expect(result.stats.originalChars).toBe(11);
  });

  it("reports slug character count", () => {
    const result = generateSlug("hello world", opts());
    expect(result.stats.slugChars).toBe(11);
  });

  it("marks slug as URL-friendly when it contains only safe chars", () => {
    expect(generateSlug("hello world", opts()).stats.isUrlFriendly).toBe(true);
  });

  it("warns very-long for slugs exceeding 96 characters", () => {
    const longInput = "word ".repeat(25); // 125 words
    const result = generateSlug(longInput, opts());
    expect(result.warnings).toContain("very-long");
  });
});
