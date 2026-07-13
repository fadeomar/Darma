import { describe, expect, it } from "vitest";
import {
  buildBase64Checks,
  buildBase64CodeSnippet,
  buildBase64Report,
  buildHexPreview,
  computeBase64Stats,
  decodeBase64,
  detectBase64Alphabet,
  detectMimeType,
  encodeBase64,
  encodeBytes,
  extractBase64Payload,
  fileNameForMimeType,
} from "./base64";
import { DEFAULT_ENCODE_OPTIONS } from "./presets";
import type { Base64DecodeOptions, Base64EncodeOptions } from "./types";

const standard: Base64EncodeOptions = { ...DEFAULT_ENCODE_OPTIONS };
const forgiving: Base64DecodeOptions = { alphabet: "auto", strict: false };

describe("Base64 encoding", () => {
  it("encodes and round-trips Unicode as UTF-8", () => {
    const encoded = encodeBase64("مرحبا 🚀", standard);
    expect(encoded.output).toBe("2YXYsdit2KjYpyDwn5qA");
    const decoded = decodeBase64(encoded.output, forgiving);
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe("مرحبا 🚀");
  });

  it("encodes arbitrary bytes without text conversion", () => {
    const encoded = encodeBytes(new Uint8Array([0, 255, 1, 254]), standard);
    expect(encoded.payload).toBe("AP8B/g==");
    const decoded = decodeBase64(encoded.output, forgiving);
    expect(Array.from(decoded.bytes)).toEqual([0, 255, 1, 254]);
    expect(decoded.text).toBeNull();
  });

  it("supports URL-safe output without padding", () => {
    const encoded = encodeBytes(new Uint8Array([251, 255]), {
      ...standard,
      alphabet: "url-safe",
      removePadding: true,
    });
    expect(encoded.output).toBe("-_8");
    expect(encoded.paddingCharacters).toBe(0);
  });

  it("wraps MIME output at the selected width", () => {
    const encoded = encodeBase64("a".repeat(80), { ...standard, lineWrap: 76 });
    expect(encoded.output.split("\n")).toHaveLength(2);
    expect(encoded.output.split("\n")[0]).toHaveLength(76);
  });

  it("creates a complete Data URL", () => {
    const encoded = encodeBase64("hello", {
      ...standard,
      outputKind: "data-url",
      mimeType: "text/plain;charset=utf-8",
    });
    expect(encoded.output).toBe("data:text/plain;charset=utf-8;base64,aGVsbG8=");
  });
});

describe("Base64 decoding and validation", () => {
  it("restores omitted padding in forgiving mode", () => {
    const decoded = decodeBase64("SGVsbG8", forgiving);
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe("Hello");
    expect(decoded.addedPadding).toBe(1);
  });

  it("rejects omitted padding in strict mode", () => {
    const decoded = decodeBase64("SGVsbG8", { alphabet: "auto", strict: true });
    expect(decoded.ok).toBe(false);
    expect(decoded.error?.code).toBe("invalid-padding");
  });

  it("normalizes wrapped payloads unless strict validation is enabled", () => {
    expect(decodeBase64("SGVs\nbG8=", forgiving).text).toBe("Hello");
    const strict = decodeBase64("SGVs\nbG8=", { alphabet: "auto", strict: true });
    expect(strict.ok).toBe(false);
    expect(strict.error?.code).toBe("invalid-characters");
  });

  it("auto-detects Base64URL and rejects a forced alphabet mismatch", () => {
    const automatic = decodeBase64("-_8", forgiving);
    expect(automatic.ok).toBe(true);
    expect(automatic.detectedAlphabet).toBe("url-safe");

    const mismatch = decodeBase64("-_8", { alphabet: "standard", strict: false });
    expect(mismatch.ok).toBe(false);
    expect(mismatch.error?.code).toBe("alphabet-mismatch");
  });

  it("rejects mixed alphabets and impossible lengths", () => {
    expect(decodeBase64("+-_A", forgiving).error?.code).toBe("mixed-alphabet");
    expect(decodeBase64("A", forgiving).error?.code).toBe("invalid-length");
  });

  it("extracts and preserves Data URL MIME metadata", () => {
    const input = "data:application/json;base64,eyJvayI6dHJ1ZX0=";
    expect(extractBase64Payload(input)).toEqual({
      payload: "eyJvayI6dHJ1ZX0=",
      mimeType: "application/json",
      isDataUrl: true,
      hasBase64Marker: true,
    });
    const decoded = decodeBase64(input, forgiving);
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe('{"ok":true}');
    expect(decoded.mimeType).toBe("application/json");
    expect(decoded.fileName).toBe("decoded.json");
  });


  it("rejects percent-encoded Data URLs that are not Base64", () => {
    const decoded = decodeBase64("data:text/plain,hello%20world", forgiving);
    expect(decoded.ok).toBe(false);
    expect(decoded.error?.code).toBe("data-url-not-base64");
  });

  it("returns structured errors for invalid characters", () => {
    const decoded = decodeBase64("SGVsbG8!!!", forgiving);
    expect(decoded.ok).toBe(false);
    expect(decoded.status).toBe("invalid");
    expect(decoded.error?.code).toBe("invalid-characters");
  });
});

describe("Binary inspection and MIME detection", () => {
  it("detects common magic signatures", () => {
    expect(detectMimeType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectMimeType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe("application/pdf");
    expect(fileNameForMimeType("image/png")).toBe("decoded.png");
  });

  it("detects JSON and SVG text", () => {
    expect(detectMimeType(new TextEncoder().encode('{"ok":true}'), '{"ok":true}')).toBe("application/json");
    expect(detectMimeType(new TextEncoder().encode("<svg></svg>"), "<svg></svg>")).toBe("image/svg+xml");
  });

  it("builds a bounded hex and ASCII preview", () => {
    const preview = buildHexPreview(new Uint8Array([0x41, 0x42, 0x00, 0xff]));
    expect(preview).toContain("41 42 00 ff");
    expect(preview).toContain("|AB..|");
  });

  it("classifies alphabets", () => {
    expect(detectBase64Alphabet("SGVsbG8=")).toBe("neutral");
    expect(detectBase64Alphabet("+/8=")).toBe("standard");
    expect(detectBase64Alphabet("-_8")).toBe("url-safe");
    expect(detectBase64Alphabet("+_8")).toBe("mixed");
  });
});

describe("Production outputs", () => {
  it("computes Base64 overhead from payload characters", () => {
    const stats = computeBase64Stats({
      sourceBytes: 3,
      encodedPayload: "YWJj",
      decodedBytes: 3,
      output: "YWJj",
    });
    expect(stats.encodedCharacters).toBe(4);
    expect(stats.overheadPercent).toBe(33.3);
  });

  it("warns when decoded output is binary", () => {
    const decoded = decodeBase64("AP8=", forgiving);
    const checks = buildBase64Checks({
      mode: "decode",
      sourceKind: "text",
      input: "AP8=",
      encodeOptions: standard,
      decodeOptions: forgiving,
      decodeResult: decoded,
    });
    expect(checks.some((check) => check.id === "binary" && check.level === "warning")).toBe(true);
  });

  it("builds a metadata-only report and practical code snippet", () => {
    const encoded = encodeBase64("secret-shaped-example", standard);
    const stats = computeBase64Stats({
      sourceBytes: encoded.sourceBytes.length,
      encodedPayload: encoded.payload,
      decodedBytes: encoded.sourceBytes.length,
      output: encoded.output,
    });
    const checks = buildBase64Checks({
      mode: "encode",
      sourceKind: "text",
      input: "secret-shaped-example",
      encodeOptions: standard,
      encodeResult: encoded,
      decodeOptions: forgiving,
    });
    const report = buildBase64Report({
      mode: "encode",
      sourceKind: "text",
      encodeOptions: standard,
      decodeOptions: forgiving,
      encodeResult: encoded,
      stats,
      checks,
    });
    expect(JSON.stringify(report)).not.toContain("secret-shaped-example");
    expect(buildBase64CodeSnippet("encode", "text", standard)).toContain("TextEncoder");
  });
});
