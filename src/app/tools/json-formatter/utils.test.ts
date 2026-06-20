import { describe, expect, it } from "vitest";
import {
  escapeJSONString,
  formatJSON,
  getTopLevelCount,
  minifyJSON,
  unescapeJSONString,
  validateJSON,
} from "./utils";

// ─── validateJSON ─────────────────────────────────────────────────────────────

describe("validateJSON", () => {
  it("returns ok:true for a valid object", () => {
    expect(validateJSON('{"a":1}')).toEqual({ ok: true });
  });

  it("returns ok:true for a valid array", () => {
    expect(validateJSON("[1,2,3]")).toEqual({ ok: true });
  });

  it("returns ok:true for primitive values (string, number, null, bool)", () => {
    expect(validateJSON('"hello"')).toEqual({ ok: true });
    expect(validateJSON("42")).toEqual({ ok: true });
    expect(validateJSON("null")).toEqual({ ok: true });
    expect(validateJSON("true")).toEqual({ ok: true });
  });

  it("returns ok:false for empty input", () => {
    const result = validateJSON("   ");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error", expect.stringMatching(/empty/i));
  });

  it("returns ok:false with an error message for invalid JSON", () => {
    const result = validateJSON("{bad json}");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("catches trailing comma", () => {
    const result = validateJSON('{"a":1,}');
    expect(result.ok).toBe(false);
  });

  it("catches single-quoted strings", () => {
    const result = validateJSON("{'key':'val'}");
    expect(result.ok).toBe(false);
  });

  it("trims whitespace before parsing", () => {
    expect(validateJSON('  { "a": 1 }  ')).toEqual({ ok: true });
  });
});

// ─── formatJSON ───────────────────────────────────────────────────────────────

describe("formatJSON", () => {
  const compact = '{"a":1,"b":[2,3]}';

  it("formats with 2-space indent", () => {
    const result = formatJSON(compact, 2);
    expect(result.ok).toBe(true);
    expect(result.output).toContain("  ");
    expect(result.validation.ok).toBe(true);
  });

  it("formats with 4-space indent", () => {
    const result = formatJSON(compact, 4);
    expect(result.ok).toBe(true);
    expect(result.output).toContain("    ");
  });

  it("formats with tab indent", () => {
    const result = formatJSON(compact, "tab");
    expect(result.ok).toBe(true);
    expect(result.output).toContain("\t");
  });

  it("round-trips: minify(format(x)) === minify(x)", () => {
    const formatted = formatJSON(compact, 2);
    expect(formatted.ok).toBe(true);
    const minified = minifyJSON(formatted.output!);
    expect(minified.output).toBe(compact);
  });

  it("returns ok:false and no output for invalid JSON", () => {
    const result = formatJSON("{bad}", 2);
    expect(result.ok).toBe(false);
    expect(result.output).toBeUndefined();
    expect(result.validation.ok).toBe(false);
  });

  it("returns ok:false for empty input", () => {
    const result = formatJSON("", 2);
    expect(result.ok).toBe(false);
  });
});

// ─── minifyJSON ───────────────────────────────────────────────────────────────

describe("minifyJSON", () => {
  it("strips all whitespace from a formatted object", () => {
    const pretty = `{
  "a": 1,
  "b": [2, 3]
}`;
    const result = minifyJSON(pretty);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('{"a":1,"b":[2,3]}');
  });

  it("returns ok:false for invalid JSON", () => {
    const result = minifyJSON("{bad}");
    expect(result.ok).toBe(false);
    expect(result.output).toBeUndefined();
  });

  it("handles root-level arrays", () => {
    const result = minifyJSON("[ 1, 2, 3 ]");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("[1,2,3]");
  });

  it("returns ok:false for empty input", () => {
    expect(minifyJSON("").ok).toBe(false);
    expect(minifyJSON("   ").ok).toBe(false);
  });
});

// ─── getTopLevelCount ─────────────────────────────────────────────────────────

describe("escapeJSONString", () => {
  it("escapes plain text as a JSON string literal", () => {
    const result = escapeJSONString('Line 1\n"quoted"');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('"Line 1\\n\\"quoted\\""');
  });
});

describe("unescapeJSONString", () => {
  it("unescapes a JSON string literal into plain text", () => {
    const result = unescapeJSONString('"Line 1\\n\\"quoted\\""');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('Line 1\n"quoted"');
  });

  it("returns ok:false for non-string JSON values", () => {
    const result = unescapeJSONString('{"a":1}');
    expect(result.ok).toBe(false);
    expect(result.validation.ok).toBe(false);
  });
});

describe("getTopLevelCount", () => {
  it("counts keys in a top-level object", () => {
    expect(getTopLevelCount('{"a":1,"b":2,"c":3}')).toBe(3);
  });

  it("counts items in a top-level array", () => {
    expect(getTopLevelCount("[1,2,3,4]")).toBe(4);
  });

  it("returns 0 for a primitive root value", () => {
    expect(getTopLevelCount('"hello"')).toBe(0);
    expect(getTopLevelCount("42")).toBe(0);
    expect(getTopLevelCount("null")).toBe(0);
  });

  it("returns 0 for invalid JSON", () => {
    expect(getTopLevelCount("{bad}")).toBe(0);
  });

  it("returns 0 for an empty object", () => {
    expect(getTopLevelCount("{}")).toBe(0);
  });

  it("returns 0 for an empty array", () => {
    expect(getTopLevelCount("[]")).toBe(0);
  });
});
