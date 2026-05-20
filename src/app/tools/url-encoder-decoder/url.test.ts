import { describe, it, expect } from "vitest";
import { processUrlText, parseQueryParams } from "./url";

// ─── processUrlText ───────────────────────────────────────────────────────────

describe("processUrlText – empty input", () => {
  it("returns an error for empty string", () => {
    const result = processUrlText("", "encode", "full");
    expect(result.ok).toBe(false);
    expect(result.status).toBe("Empty input");
  });
});

describe("processUrlText – encode", () => {
  it("encodes a URL with spaces (full mode preserves : // /)", () => {
    const result = processUrlText("https://example.com/my page", "encode", "full");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("%20");
      expect(result.output).toContain("https://");
      expect(result.status).toBe("Encoded");
    }
  });

  it("encodes all special chars in component mode", () => {
    const result = processUrlText("hello world&foo=bar", "encode", "component");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("%20");
      expect(result.output).toContain("%26");
      expect(result.output).toContain("%3D");
    }
  });

  it("encodes Arabic text", () => {
    const result = processUrlText("مرحبا", "encode", "component");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toMatch(/%[0-9A-F]{2}/i);
    }
  });

  it("round-trips: encode then decode returns original", () => {
    const original = "hello world & Darma tools!";
    const encoded = processUrlText(original, "encode", "component");
    expect(encoded.ok).toBe(true);
    if (encoded.ok) {
      const decoded = processUrlText(encoded.output, "decode", "component");
      expect(decoded.ok).toBe(true);
      if (decoded.ok) {
        expect(decoded.output).toBe(original);
      }
    }
  });
});

describe("processUrlText – decode", () => {
  it("decodes a percent-encoded string", () => {
    const result = processUrlText("hello%20world", "decode", "full");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe("hello world");
      expect(result.status).toBe("Decoded");
    }
  });

  it("decodes component-encoded ampersand", () => {
    const result = processUrlText("hello%26world", "decode", "component");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe("hello&world");
    }
  });

  it("returns an error for invalid percent sequence", () => {
    const result = processUrlText("hello%ZZworld", "decode", "component");
    expect(result.ok).toBe(false);
    expect(result.status).toBe("Invalid URL encoding");
  });

  it("returns an error for truncated percent sequence", () => {
    const result = processUrlText("hello%2", "decode", "component");
    expect(result.ok).toBe(false);
  });
});

// ─── parseQueryParams ─────────────────────────────────────────────────────────

describe("parseQueryParams", () => {
  it("returns empty array for empty string", () => {
    expect(parseQueryParams("")).toEqual([]);
  });

  it("parses a full URL and extracts query params", () => {
    const rows = parseQueryParams("https://example.com/search?q=hello&lang=en");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ key: "q", value: "hello" });
    expect(rows[1]).toEqual({ key: "lang", value: "en" });
  });

  it("parses a query string starting with ?", () => {
    const rows = parseQueryParams("?foo=bar&baz=qux");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ key: "foo", value: "bar" });
    expect(rows[1]).toEqual({ key: "baz", value: "qux" });
  });

  it("parses a query string without leading ?", () => {
    const rows = parseQueryParams("name=Darma&tool=url%20encoder");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ key: "name", value: "Darma" });
    expect(rows[1]).toEqual({ key: "tool", value: "url encoder" });
  });

  it("returns empty array for plain text without = sign", () => {
    expect(parseQueryParams("just some text")).toEqual([]);
  });

  it("returns empty array for malformed URL", () => {
    expect(parseQueryParams("not-a-url")).toEqual([]);
  });

  it("handles URL-encoded values in query params", () => {
    const rows = parseQueryParams("?q=hello%20world");
    expect(rows[0]).toEqual({ key: "q", value: "hello world" });
  });
});
