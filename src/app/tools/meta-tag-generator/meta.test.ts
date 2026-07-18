import { describe, expect, it } from "vitest";
import { DEFAULT_META_INPUT } from "./presets";
import {
  generateMetaTags,
  getPreviewModel,
  isValidAbsoluteUrl,
  isValidOgLocale,
  isValidSocialHandle,
  normalizeHandle,
  validateMetaTagInput,
} from "./meta";

describe("meta tag generation", () => {
  it("escapes title and attribute content", () => {
    const code = generateMetaTags({
      ...DEFAULT_META_INPUT,
      title: `A < B & "safe"`,
      description: `Use <tags> & "quotes"`,
    });

    expect(code).toContain("<title>A &lt; B &amp; &quot;safe&quot;</title>");
    expect(code).toContain("Use &lt;tags&gt; &amp; &quot;quotes&quot;");
  });

  it("does not emit image alt tags without an image URL", () => {
    const code = generateMetaTags({ ...DEFAULT_META_INPUT, imageUrl: "", imageAlt: "Orphan alt" });
    expect(code).not.toContain("og:image:alt");
    expect(code).not.toContain("twitter:image:alt");
  });

  it("normalizes handles without changing valid prefixed values", () => {
    expect(normalizeHandle("darmatools")).toBe("@darmatools");
    expect(normalizeHandle("@darmatools")).toBe("@darmatools");
    expect(normalizeHandle("  ")).toBe("");
  });

  it("validates URLs, locales, and social handles", () => {
    expect(isValidAbsoluteUrl("https://example.com/page")).toBe(true);
    expect(isValidAbsoluteUrl("javascript:alert(1)")).toBe(false);
    expect(isValidOgLocale("ar_PS")).toBe(true);
    expect(isValidOgLocale("ar-PS")).toBe(false);
    expect(isValidSocialHandle("@valid_name")).toBe(true);
    expect(isValidSocialHandle("bad handle")).toBe(false);
  });

  it("reports invalid raw social handles instead of hiding them after normalization", () => {
    const messages = validateMetaTagInput({ ...DEFAULT_META_INPUT, twitterSite: "bad handle" });
    expect(messages.some((item) => item.field === "twitterSite" && item.level === "warning")).toBe(true);
  });

  it("builds a safe fallback preview", () => {
    const preview = getPreviewModel({ ...DEFAULT_META_INPUT, title: "", description: "", canonicalUrl: "not a url" });
    expect(preview.title).toBe("Untitled page");
    expect(preview.description).toContain("Add a meta description");
    expect(preview.domain).toBe("example.com");
  });
});
