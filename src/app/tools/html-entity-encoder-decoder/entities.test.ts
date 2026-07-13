import { describe, expect, it } from "vitest";
import { DEFAULT_OPTIONS } from "./presets";
import {
  buildEntityChecks,
  buildEntityCodeSnippets,
  buildEntityCsv,
  decodeHtmlEntities,
  encodeHtmlEntities,
  getDoubleEncodedEntities,
  getMalformedNumericEntities,
  getUnknownNamedEntities,
  inspectHtmlEntities,
} from "./entities";

describe("HTML entity logic", () => {
  it("encodes essential text characters", () => {
    expect(encodeHtmlEntities("A & B < C > D", DEFAULT_OPTIONS)).toBe("A &amp; B &lt; C &gt; D");
  });

  it("encodes the active attribute quote", () => {
    expect(encodeHtmlEntities('say "hi"', { ...DEFAULT_OPTIONS, context: "double-attribute" })).toBe("say &quot;hi&quot;");
    expect(encodeHtmlEntities("it's", { ...DEFAULT_OPTIONS, context: "single-attribute" })).toBe("it&#39;s");
  });

  it("preserves complete valid entities when requested", () => {
    expect(encodeHtmlEntities("&copy; & value", DEFAULT_OPTIONS)).toBe("&copy; &amp; value");
  });

  it("encodes Unicode by code point without splitting emoji", () => {
    expect(encodeHtmlEntities("🚀", { ...DEFAULT_OPTIONS, scope: "nonAscii", format: "hex" })).toBe("&#x1F680;");
  });

  it("decodes named and numeric entities", () => {
    expect(decodeHtmlEntities("&lt; &#169; &#x1F680;")).toBe("< © 🚀");
  });

  it("supports an explicit second decode pass", () => {
    expect(decodeHtmlEntities("&amp;lt;", 1)).toBe("&lt;");
    expect(decodeHtmlEntities("&amp;lt;", 2)).toBe("<");
  });

  it("preserves unknown and invalid entities", () => {
    expect(decodeHtmlEntities("&notInMap; &#xD800; &#0;")).toBe("&notInMap; &#xD800; &#0;");
  });

  it("inspects kinds and Unicode code points", () => {
    const occurrences = inspectHtmlEntities("&copy; &#169; &#x1F680; &unknown;");
    expect(occurrences.map((item) => item.kind)).toEqual(["named", "decimal", "hex", "unknown"]);
    expect(occurrences[2]?.codePoints).toBe("U+1F680");
  });

  it("detects malformed numeric entities", () => {
    const malformed = getMalformedNumericEntities("&#xZZ; &#99999999; &#169");
    expect(malformed).toContain("&#xZZ;");
    expect(malformed).toContain("&#99999999;");
    expect(malformed).toContain("&#169");
  });

  it("detects unknown and double-encoded values", () => {
    expect(getUnknownNamedEntities("&copy; &madeup;")).toEqual(["&madeup;"]);
    expect(getDoubleEncodedEntities("&amp;lt; &amp;#169;")).toEqual(["&amp;lt;", "&amp;#169;"]);
  });

  it("warns when decoded output contains markup", () => {
    const input = "&lt;script&gt;";
    const output = decodeHtmlEntities(input);
    const checks = buildEntityChecks({ input, output, mode: "decode", options: DEFAULT_OPTIONS, decodePasses: 1 });
    expect(checks.some((check) => check.id === "decoded-markup")).toBe(true);
  });

  it("generates valid JavaScript helper syntax", () => {
    const snippets = buildEntityCodeSnippets(DEFAULT_OPTIONS);
    const executable = snippets.javascript.replace(/\bexport\s+/g, "");
    expect(() => new Function(executable)).not.toThrow();
  });

  it("exports occurrence rows as CSV", () => {
    const csv = buildEntityCsv(inspectHtmlEntities("&copy;"));
    expect(csv).toContain("index,raw,decoded,kind,valid,codePoints,issue");
    expect(csv).toContain("&copy;");
  });
});
