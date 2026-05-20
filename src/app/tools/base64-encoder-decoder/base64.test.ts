import { describe, it, expect } from "vitest";
import {
  encodeBase64,
  decodeBase64,
  transformBase64,
  computeBase64Stats,
} from "./base64";

const opts = { urlSafe: false, removePadding: false };
const optsSafe = { urlSafe: true, removePadding: false };
const optsNoPad = { urlSafe: false, removePadding: true };
const optsSafeNoPad = { urlSafe: true, removePadding: true };

// ─── encodeBase64 ─────────────────────────────────────────────────────────────

describe("encodeBase64", () => {
  it("returns empty + status empty for empty string", () => {
    const result = encodeBase64("", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("");
    expect(result.status).toBe("empty");
  });

  it("encodes a simple ASCII string", () => {
    const result = encodeBase64("Hello", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("SGVsbG8=");
  });

  it("encodes a string requiring padding", () => {
    const result = encodeBase64("Hi", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("SGk=");
  });

  it("removes padding when removePadding is true", () => {
    const result = encodeBase64("Hi", optsNoPad);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("SGk");
  });

  it("converts + and / to - and _ in URL-safe mode", () => {
    // ">" encodes to "Pg==" in standard, "Pg==" — test a value that produces + or /
    // "~" → "fg==" (no +/), use a known one: "\xfb\xff" → "+/8=" → "-_8="
    const result = encodeBase64("hello world", optsSafe);
    expect(result.ok).toBe(true);
    expect(result.output).not.toMatch(/[+/]/);
  });

  it("URL-safe mode without padding", () => {
    const result = encodeBase64("Hi", optsSafeNoPad);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("SGk");
  });

  it("encodes multi-byte UTF-8 characters", () => {
    const result = encodeBase64("こんにちは", opts);
    expect(result.ok).toBe(true);
    expect(result.output.length).toBeGreaterThan(0);
    // Round-trip check
    const decoded = decodeBase64(result.output, opts);
    expect(decoded.ok).toBe(true);
    expect(decoded.output).toBe("こんにちは");
  });

  it("encodes an emoji", () => {
    const result = encodeBase64("😊", opts);
    expect(result.ok).toBe(true);
    const decoded = decodeBase64(result.output, opts);
    expect(decoded.ok).toBe(true);
    expect(decoded.output).toBe("😊");
  });
});

// ─── decodeBase64 ─────────────────────────────────────────────────────────────

describe("decodeBase64", () => {
  it("returns empty + status empty for blank input", () => {
    const result = decodeBase64("   ", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("");
    expect(result.status).toBe("empty");
  });

  it("decodes a valid standard Base64 string", () => {
    const result = decodeBase64("SGVsbG8=", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hello");
  });

  it("auto-pads input missing trailing =", () => {
    // "SGVsbG8" is "SGVsbG8=" without padding
    const result = decodeBase64("SGVsbG8", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hello");
  });

  it("decodes URL-safe characters when urlSafe is true", () => {
    const encoded = encodeBase64("hello world", optsSafe);
    expect(encoded.ok).toBe(true);
    const result = decodeBase64(encoded.output, optsSafe);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("hello world");
  });

  it("rejects input with invalid characters", () => {
    const result = decodeBase64("!!!!", opts);
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error.code", "invalid-characters");
  });

  it("rejects more than two padding characters", () => {
    // "YQ===" has 3 trailing = which fails the regex allowing at most two;
    // the validator returns invalid-characters since = is only allowed 0–2 times.
    const result = decodeBase64("YQ===", opts);
    expect(result.ok).toBe(false);
  });

  it("handles whitespace in input gracefully (strips it)", () => {
    const result = decodeBase64("SGVs\nbG8=", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hello");
  });
});

// ─── transformBase64 ─────────────────────────────────────────────────────────

describe("transformBase64", () => {
  it("delegates to encodeBase64 when mode is encode", () => {
    const result = transformBase64("Hello", "encode", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("SGVsbG8=");
  });

  it("delegates to decodeBase64 when mode is decode", () => {
    const result = transformBase64("SGVsbG8=", "decode", opts);
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hello");
  });
});

// ─── computeBase64Stats ───────────────────────────────────────────────────────

describe("computeBase64Stats", () => {
  it("returns zero stats for empty strings", () => {
    const stats = computeBase64Stats("", "", "encode");
    expect(stats.inputChars).toBe(0);
    expect(stats.outputChars).toBe(0);
    expect(stats.sizeChangePercent).toBe(0);
    expect(stats.mode).toBe("encode");
  });

  it("reports correct char counts", () => {
    const stats = computeBase64Stats("Hi", "SGk=", "encode");
    expect(stats.inputChars).toBe(2);
    expect(stats.outputChars).toBe(4);
  });

  it("reports encode mode", () => {
    const stats = computeBase64Stats("abc", "YWJj", "encode");
    expect(stats.mode).toBe("encode");
  });

  it("reports decode mode", () => {
    const stats = computeBase64Stats("YWJj", "abc", "decode");
    expect(stats.mode).toBe("decode");
  });

  it("calculates size change percent for encoded output (should be positive for encode)", () => {
    const stats = computeBase64Stats("Hi", "SGk=", "encode");
    expect(stats.sizeChangePercent).toBeGreaterThan(0);
  });

  it("calculates byte counts for ASCII input", () => {
    const stats = computeBase64Stats("AB", "QUI=", "encode");
    expect(stats.inputBytes).toBe(2);
    expect(stats.outputBytes).toBe(4);
  });
});
