import { describe, expect, it } from "vitest";
import {
  buildUrlChecks,
  computeUrlStats,
  hasMalformedPercentEncoding,
  inspectUrlInput,
  parseQueryParams,
  processUrlText,
  rebuildInputWithQueryRows,
  redactUrlForReport,
} from "./url";

describe("processUrlText", () => {
  it("encodes a full URL while preserving URL structure", () => {
    const result = processUrlText("https://example.com/my page?q=hello world", "encode", "full");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("https://");
      expect(result.output).toContain("%20");
      expect(result.output).toContain("?q=");
    }
  });

  it("encodes reserved characters in component mode", () => {
    const result = processUrlText("hello world&foo=bar", "encode", "component");
    expect(result).toMatchObject({ ok: true, output: "hello%20world%26foo%3Dbar" });
  });

  it("uses application/x-www-form-urlencoded rules", () => {
    const result = processUrlText("hello world + tools~", "encode", "form");
    expect(result).toMatchObject({ ok: true, output: "hello+world+%2B+tools%7E" });
  });

  it("decodes plus signs as spaces only in form mode", () => {
    expect(processUrlText("hello+world", "decode", "form")).toMatchObject({ ok: true, output: "hello world" });
    expect(processUrlText("hello+world", "decode", "component")).toMatchObject({ ok: true, output: "hello+world" });
  });

  it("round-trips Unicode text", () => {
    const original = "مرحبا café 🚀";
    const encoded = processUrlText(original, "encode", "component");
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(processUrlText(encoded.output, "decode", "component")).toMatchObject({ ok: true, output: original });
  });

  it("rejects malformed percent escapes", () => {
    expect(processUrlText("hello%ZZworld", "decode", "component")).toMatchObject({ ok: false, status: "Invalid URL encoding" });
    expect(hasMalformedPercentEncoding("abc%2Fdef")).toBe(false);
    expect(hasMalformedPercentEncoding("abc%2")).toBe(true);
  });
});

describe("inspectUrlInput", () => {
  it("inspects an absolute URL", () => {
    const inspection = inspectUrlInput("https://example.com:8443/docs?a=1#top");
    expect(inspection).toMatchObject({
      kind: "absolute-url",
      parseable: true,
      protocol: "https:",
      host: "example.com:8443",
      pathname: "/docs",
      hash: "#top",
    });
    expect(inspection.queryParams).toHaveLength(1);
  });

  it("inspects a relative URL without exposing the artificial base", () => {
    const inspection = inspectUrlInput("/products?q=phone");
    expect(inspection.kind).toBe("relative-url");
    expect(inspection.host).toBe("");
    expect(inspection.pathname).toBe("/products");
  });

  it("detects duplicate and sensitive query keys", () => {
    const inspection = inspectUrlInput("https://example.com/?tag=a&tag=b&api_key=secret");
    expect(inspection.duplicateParamKeys).toEqual(["tag"]);
    expect(inspection.sensitiveParamKeys).toEqual(["api_key"]);
    expect(inspection.queryParams.find((row) => row.key === "api_key")?.sensitive).toBe(true);
  });

  it("parses a standalone query string and preserves duplicate rows", () => {
    const params = parseQueryParams("?name=Darma&tag=ui&tag=web");
    expect(params.map((row) => [row.key, row.value])).toEqual([
      ["name", "Darma"],
      ["tag", "ui"],
      ["tag", "web"],
    ]);
  });

  it("classifies plain text without equals signs as text", () => {
    expect(inspectUrlInput("hello world").kind).toBe("text");
  });
});

describe("query editing", () => {
  it("rebuilds an absolute URL while preserving its fragment", () => {
    const rebuilt = rebuildInputWithQueryRows("https://example.com/search?q=old#results", [
      { key: "q", value: "new value" },
      { key: "page", value: "2" },
    ]);
    expect(rebuilt).toBe("https://example.com/search?q=new+value&page=2#results");
  });

  it("rebuilds a standalone query string", () => {
    expect(rebuildInputWithQueryRows("?a=1", [{ key: "a", value: "2" }])).toBe("?a=2");
  });
});

describe("production checks and reports", () => {
  it("flags credentials, sensitive keys, duplicate keys, and double encoding", () => {
    const input = "https://user:pass@example.com/?token=abc&tag=1&tag=2&next=%252Fdashboard";
    const result = processUrlText(input, "decode", "full");
    const inspection = inspectUrlInput(input);
    const checks = buildUrlChecks({ input, mode: "decode", type: "full", result, inspection });
    const ids = checks.map((check) => check.id);
    expect(ids).toEqual(expect.arrayContaining(["credentials", "sensitive-query", "duplicate-params", "double-encoding"]));
  });

  it("redacts credentials and sensitive query values", () => {
    const redacted = redactUrlForReport("https://user:pass@example.com/?token=abc&safe=yes");
    expect(redacted).not.toContain("pass");
    expect(redacted).not.toContain("abc");
    expect(redacted).toContain("safe=yes");
  });

  it("computes stable statistics", () => {
    const inspection = inspectUrlInput("?a=1&a=2&b=3");
    const stats = computeUrlStats("hello world", "hello%20world", inspection);
    expect(stats).toMatchObject({
      inputCharacters: 11,
      outputCharacters: 13,
      percentSequences: 1,
      queryParameters: 3,
      uniqueQueryKeys: 2,
      duplicateQueryKeys: 1,
    });
  });
});
