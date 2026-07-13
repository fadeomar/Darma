import { describe, expect, it } from "vitest";
import {
  analyzeMarkdown,
  buildMarkdownProductionChecks,
  buildStandaloneHtml,
  extractMarkdownHeadings,
  renderMarkdownToHtml,
} from "./markdown";
import { DEFAULT_MARKDOWN_OPTIONS, MARKDOWN_PRESETS } from "./presets";

describe("Markdown previewer", () => {
  it("renders headings, task lists, and safe links", () => {
    const result = renderMarkdownToHtml(
      "# Hello\n\n- [x] Done\n\n[Docs](https://example.org)",
      DEFAULT_MARKDOWN_OPTIONS,
    );

    expect(result.sanitizedHtml).toContain('id="hello"');
    expect(result.sanitizedHtml).toContain('type="checkbox"');
    expect(result.sanitizedHtml).toContain('rel="noopener noreferrer"');
  });

  it("creates stable unique heading slugs", () => {
    const headings = extractMarkdownHeadings("# Title\n## Setup\n## Setup");
    expect(headings.map((heading) => heading.slug)).toEqual(["title", "setup", "setup-2"]);
  });

  it("flags unclosed fences and unsafe links", () => {
    const checks = buildMarkdownProductionChecks(
      "# Security notes\n\n[Bad](javascript:alert(1))\n\n```js\nconst ready = true;",
    );

    expect(checks).toContainEqual(expect.objectContaining({ id: "fences", severity: "danger" }));
    expect(checks).toContainEqual(expect.objectContaining({ id: "unsafe-links", severity: "danger" }));
  });

  it("keeps every practical preset renderable", () => {
    for (const preset of MARKDOWN_PRESETS) {
      const analysis = analyzeMarkdown(preset.content);
      const result = renderMarkdownToHtml(preset.content, DEFAULT_MARKDOWN_OPTIONS);

      expect(analysis.stats.words).toBeGreaterThan(10);
      expect(analysis.stats.headings).toBeGreaterThan(0);
      expect(result.sanitizedHtml.length).toBeGreaterThan(50);
    }
  });

  it("builds a complete standalone HTML document", () => {
    const html = buildStandaloneHtml("<h1>Hello</h1>", "Hello");
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain("<main>");
  });
});
