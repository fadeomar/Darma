import { describe, it, expect } from "vitest";
import { generate, computeStats, formatReadingTime } from "./generator";
import type { LoremConfig } from "./types";

function config(overrides: Partial<LoremConfig> = {}): LoremConfig {
  return {
    mode: "words",
    style: "classic",
    amount: 5,
    blockLength: "medium",
    outputFormat: "plain",
    startWithLorem: true,
    includeHeadings: false,
    includeLists: false,
    structuredBlock: "hero",
    ...overrides,
  };
}

// ─── generate – words mode ───────────────────────────────────────────────────

describe("generate – words mode", () => {
  it("returns a non-empty plain string", () => {
    const out = generate(config({ mode: "words", amount: 5 }));
    expect(out.plain.trim().length).toBeGreaterThan(0);
  });

  it("produces exactly amount words (roughly)", () => {
    const out = generate(config({ mode: "words", amount: 10 }));
    const wordCount = out.plain.trim().split(/\s+/).length;
    expect(wordCount).toBe(10);
  });

  it("wraps output in a <p> tag in html format", () => {
    const out = generate(config({ mode: "words", amount: 5 }));
    expect(out.html).toMatch(/^<p>.*<\/p>$/s);
  });

  it("works with all available styles", () => {
    const styles: LoremConfig["style"][] = ["classic", "readable", "startup", "ecommerce", "blog", "profile"];
    for (const style of styles) {
      const out = generate(config({ mode: "words", amount: 5, style }));
      expect(out.plain.trim().length).toBeGreaterThan(0);
    }
  });
});

// ─── generate – sentences mode ───────────────────────────────────────────────

describe("generate – sentences mode", () => {
  it("returns a non-empty plain string", () => {
    const out = generate(config({ mode: "sentences", amount: 3 }));
    expect(out.plain.trim().length).toBeGreaterThan(0);
  });

  it("wraps output in a <p> tag in html format", () => {
    const out = generate(config({ mode: "sentences", amount: 2 }));
    expect(out.html).toMatch(/^<p>.*<\/p>$/s);
  });

  it("starts with 'Lorem ipsum' for classic + startWithLorem", () => {
    const out = generate(config({ mode: "sentences", amount: 3, style: "classic", startWithLorem: true }));
    expect(out.plain).toMatch(/^Lorem ipsum/i);
  });
});

// ─── generate – paragraphs mode ──────────────────────────────────────────────

describe("generate – paragraphs mode", () => {
  it("returns plain text with content", () => {
    const out = generate(config({ mode: "paragraphs", amount: 2 }));
    expect(out.plain.trim().length).toBeGreaterThan(0);
  });

  it("html output contains at least one <p> tag", () => {
    const out = generate(config({ mode: "paragraphs", amount: 2 }));
    expect(out.html).toContain("<p>");
  });

  it("includes headings when includeHeadings is true and amount > 2", () => {
    const out = generate(config({ mode: "paragraphs", amount: 5, includeHeadings: true }));
    // Headings may appear at i=2 or i=3 etc — just verify h2 exists somewhere
    expect(out.html).toMatch(/<h2>/);
  });

  it("includes list when includeLists is true and amount >= 4", () => {
    const out = generate(config({ mode: "paragraphs", amount: 4, includeLists: true }));
    expect(out.html).toMatch(/<ul>/);
  });
});

// ─── generate – structured mode ──────────────────────────────────────────────

describe("generate – structured mode", () => {
  it("hero block produces an <h1> in html", () => {
    const out = generate(config({ mode: "structured", structuredBlock: "hero", amount: 1 }));
    expect(out.html).toMatch(/<h1>/);
  });

  it("card block produces a .card div in html", () => {
    const out = generate(config({ mode: "structured", structuredBlock: "card", amount: 1 }));
    expect(out.html).toContain('class="card"');
  });

  it("testimonial block contains a blockquote", () => {
    const out = generate(config({ mode: "structured", structuredBlock: "testimonial", amount: 1 }));
    expect(out.html).toContain("<blockquote");
  });

  it("faq block contains Q: in plain output", () => {
    const out = generate(config({ mode: "structured", structuredBlock: "faq", amount: 1 }));
    expect(out.plain).toContain("Q:");
  });

  it("pricing block contains .pricing-card in html", () => {
    const out = generate(config({ mode: "structured", structuredBlock: "pricing", amount: 1 }));
    expect(out.html).toContain("pricing-card");
  });
});

// ─── computeStats ────────────────────────────────────────────────────────────

describe("computeStats", () => {
  it("returns zero stats for empty string", () => {
    const stats = computeStats("");
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.paragraphs).toBe(0);
    expect(stats.readingTimeSeconds).toBe(0);
  });

  it("counts words correctly", () => {
    expect(computeStats("one two three").words).toBe(3);
  });

  it("counts characters", () => {
    expect(computeStats("hello").characters).toBe(5);
  });

  it("counts sentences by punctuation marks", () => {
    expect(computeStats("Hello. World! How?").sentences).toBe(3);
  });

  it("counts paragraphs separated by double newlines", () => {
    expect(computeStats("para one\n\npara two").paragraphs).toBe(2);
  });

  it("reading time is at least 1 for non-empty input", () => {
    expect(computeStats("hello world").readingTimeSeconds).toBeGreaterThanOrEqual(1);
  });

  it("reading time scales with word count (200 wpm)", () => {
    const text = Array(200).fill("word").join(" ");
    expect(computeStats(text).readingTimeSeconds).toBe(60);
  });
});

// ─── formatReadingTime ────────────────────────────────────────────────────────

describe("formatReadingTime", () => {
  it("shows seconds for < 60", () => {
    expect(formatReadingTime(30)).toBe("30s read");
  });

  it("shows minutes for >= 60", () => {
    expect(formatReadingTime(60)).toBe("1 min read");
  });

  it("rounds up to nearest minute", () => {
    expect(formatReadingTime(90)).toBe("2 min read");
  });
});
