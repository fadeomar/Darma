import type {
  Base64Alphabet,
  Base64Check,
  Base64DecodeAlphabet,
  Base64DecodeOptions,
  Base64DecodeResult,
  Base64EncodeOptions,
  Base64EncodeResult,
  Base64Mode,
  Base64Report,
  Base64SourceKind,
  Base64Stats,
} from "./types";

export const BASE64_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const BASE64_LARGE_PAYLOAD_BYTES = 1024 * 1024;
export const BASE64_HEX_PREVIEW_BYTES = 192;

const textEncoder = new TextEncoder();
const fatalTextDecoder = new TextDecoder("utf-8", { fatal: true });

function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return binary;
}

export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(bytesToBinary(bytes));
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function applyAlphabet(payload: string, alphabet: Base64Alphabet): string {
  return alphabet === "url-safe"
    ? payload.replaceAll("+", "-").replaceAll("/", "_")
    : payload;
}

function restoreStandardAlphabet(payload: string): string {
  return payload.replaceAll("-", "+").replaceAll("_", "/");
}

function wrapPayload(payload: string, width: number): string {
  if (!width || payload.length <= width) return payload;
  const lines: string[] = [];
  for (let index = 0; index < payload.length; index += width) {
    lines.push(payload.slice(index, index + width));
  }
  return lines.join("\n");
}

function normalizeMimeType(value: string): string {
  const trimmed = value.trim();
  return trimmed || "application/octet-stream";
}

export function encodeBytes(
  sourceBytes: Uint8Array,
  options: Base64EncodeOptions,
): Base64EncodeResult {
  if (!sourceBytes.length) {
    return {
      ok: true,
      status: "empty",
      output: "",
      payload: "",
      sourceBytes,
      mimeType: normalizeMimeType(options.mimeType),
      paddingCharacters: 0,
      lineCount: 0,
    };
  }

  let payload = applyAlphabet(bytesToBase64(sourceBytes), options.alphabet);
  if (options.removePadding) payload = payload.replace(/=+$/g, "");
  const paddingCharacters = (payload.match(/=+$/)?.[0].length ?? 0);
  const mimeType = normalizeMimeType(options.mimeType);
  const displayedPayload = options.outputKind === "data-url"
    ? payload
    : wrapPayload(payload, options.lineWrap);
  const output = options.outputKind === "data-url"
    ? `data:${mimeType};base64,${displayedPayload}`
    : displayedPayload;

  return {
    ok: true,
    status: "ready",
    output,
    payload,
    sourceBytes,
    mimeType,
    paddingCharacters,
    lineCount: output ? output.split(/\r?\n/).length : 0,
  };
}

export function encodeBase64(
  input: string,
  options: Base64EncodeOptions,
): Base64EncodeResult {
  return encodeBytes(textEncoder.encode(input ?? ""), options);
}

interface ExtractedPayload {
  payload: string;
  mimeType: string;
  isDataUrl: boolean;
  hasBase64Marker: boolean;
}

export function extractBase64Payload(input: string): ExtractedPayload {
  const trimmed = input.trim();
  if (!trimmed.toLowerCase().startsWith("data:")) {
    return {
      payload: input,
      mimeType: "application/octet-stream",
      isDataUrl: false,
      hasBase64Marker: true,
    };
  }

  const commaIndex = trimmed.indexOf(",");
  if (commaIndex < 0) {
    return {
      payload: trimmed,
      mimeType: "application/octet-stream",
      isDataUrl: true,
      hasBase64Marker: false,
    };
  }

  const metadata = trimmed.slice(5, commaIndex);
  const payload = trimmed.slice(commaIndex + 1);
  const segments = metadata.split(";").filter(Boolean);
  const mimeType = segments[0] && !segments[0].includes("=") && segments[0].toLowerCase() !== "base64"
    ? segments[0]
    : "application/octet-stream";

  return { payload, mimeType, isDataUrl: true, hasBase64Marker: segments.some((segment) => segment.toLowerCase() === "base64") };
}

export function detectBase64Alphabet(payload: string): Base64DecodeResult["detectedAlphabet"] {
  const hasStandard = /[+/]/.test(payload);
  const hasUrlSafe = /[-_]/.test(payload);
  if (hasStandard && hasUrlSafe) return "mixed";
  if (hasUrlSafe) return "url-safe";
  if (hasStandard) return "standard";
  return "neutral";
}

function invalidDecodeResult(
  code: NonNullable<Base64DecodeResult["error"]>["code"],
  message: string,
  partial: Partial<Base64DecodeResult> = {},
): Base64DecodeResult {
  return {
    ok: false,
    status: "invalid",
    output: "",
    bytes: new Uint8Array(),
    text: null,
    mimeType: partial.mimeType ?? "application/octet-stream",
    fileName: partial.fileName ?? "decoded.bin",
    isDataUrl: partial.isDataUrl ?? false,
    normalizedPayload: partial.normalizedPayload ?? "",
    detectedAlphabet: partial.detectedAlphabet ?? "neutral",
    hadWhitespace: partial.hadWhitespace ?? false,
    addedPadding: partial.addedPadding ?? 0,
    error: { code, message },
  };
}

function matchesRequestedAlphabet(
  detected: Base64DecodeResult["detectedAlphabet"],
  requested: Base64DecodeAlphabet,
): boolean {
  if (requested === "auto" || detected === "neutral") return true;
  return detected === requested;
}

export function decodeBase64(
  input: string,
  options: Base64DecodeOptions,
): Base64DecodeResult {
  const source = input ?? "";
  if (!source.trim()) {
    return {
      ok: true,
      status: "empty",
      output: "",
      bytes: new Uint8Array(),
      text: "",
      mimeType: "application/octet-stream",
      fileName: "decoded.bin",
      isDataUrl: false,
      normalizedPayload: "",
      detectedAlphabet: "neutral",
      hadWhitespace: false,
      addedPadding: 0,
    };
  }

  const extracted = extractBase64Payload(source);
  if (extracted.isDataUrl && !extracted.hasBase64Marker) {
    return invalidDecodeResult(
      "data-url-not-base64",
      "This Data URL does not include the ;base64 marker and contains percent-encoded rather than Base64 data.",
      { isDataUrl: true, mimeType: extracted.mimeType },
    );
  }
  const hadWhitespace = /\s/.test(extracted.payload);
  if (options.strict && hadWhitespace) {
    return invalidDecodeResult(
      "invalid-characters",
      "Strict mode rejects whitespace inside the Base64 payload.",
      { isDataUrl: extracted.isDataUrl, mimeType: extracted.mimeType, hadWhitespace },
    );
  }

  const compact = extracted.payload.replace(/\s+/g, "");
  const detectedAlphabet = detectBase64Alphabet(compact);
  if (detectedAlphabet === "mixed") {
    return invalidDecodeResult(
      "mixed-alphabet",
      "The payload mixes standard (+ /) and URL-safe (- _) Base64 characters.",
      { isDataUrl: extracted.isDataUrl, mimeType: extracted.mimeType, hadWhitespace, detectedAlphabet },
    );
  }

  if (!matchesRequestedAlphabet(detectedAlphabet, options.alphabet)) {
    return invalidDecodeResult(
      "alphabet-mismatch",
      `This payload looks ${detectedAlphabet}, but ${options.alphabet} decoding is selected.`,
      { isDataUrl: extracted.isDataUrl, mimeType: extracted.mimeType, hadWhitespace, detectedAlphabet },
    );
  }

  const standardPayload = restoreStandardAlphabet(compact);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(standardPayload)) {
    return invalidDecodeResult(
      "invalid-characters",
      "Invalid Base64 characters or misplaced padding were detected.",
      { isDataUrl: extracted.isDataUrl, mimeType: extracted.mimeType, hadWhitespace, detectedAlphabet },
    );
  }

  const paddingLength = standardPayload.match(/=+$/)?.[0].length ?? 0;
  if (paddingLength > 2) {
    return invalidDecodeResult(
      "invalid-padding",
      "Base64 allows at most two trailing padding characters.",
      { isDataUrl: extracted.isDataUrl, mimeType: extracted.mimeType, hadWhitespace, detectedAlphabet },
    );
  }

  const unpaddedLength = standardPayload.replace(/=+$/g, "").length;
  const remainder = unpaddedLength % 4;
  if (remainder === 1) {
    return invalidDecodeResult(
      "invalid-length",
      "The Base64 payload has an impossible length and cannot be padded safely.",
      { isDataUrl: extracted.isDataUrl, mimeType: extracted.mimeType, hadWhitespace, detectedAlphabet },
    );
  }

  const expectedPadding = remainder === 0 ? 0 : 4 - remainder;
  if (options.strict && paddingLength !== expectedPadding) {
    return invalidDecodeResult(
      "invalid-padding",
      `Strict mode expected ${expectedPadding} trailing padding character${expectedPadding === 1 ? "" : "s"}.`,
      { isDataUrl: extracted.isDataUrl, mimeType: extracted.mimeType, hadWhitespace, detectedAlphabet },
    );
  }

  const withoutPadding = standardPayload.replace(/=+$/g, "");
  const addedPadding = Math.max(0, expectedPadding - paddingLength);
  const normalizedPayload = `${withoutPadding}${"=".repeat(expectedPadding)}`;

  try {
    const bytes = base64ToBytes(normalizedPayload);
    let text: string | null = null;
    try {
      text = fatalTextDecoder.decode(bytes);
    } catch {
      text = null;
    }
    const detectedMime = extracted.isDataUrl && extracted.mimeType !== "application/octet-stream"
      ? extracted.mimeType
      : detectMimeType(bytes, text);
    const fileName = fileNameForMimeType(detectedMime);

    return {
      ok: true,
      status: "valid",
      output: text ?? "",
      bytes,
      text,
      mimeType: detectedMime,
      fileName,
      isDataUrl: extracted.isDataUrl,
      normalizedPayload,
      detectedAlphabet,
      hadWhitespace,
      addedPadding,
    };
  } catch {
    return invalidDecodeResult(
      "unable-to-decode",
      "The payload passed structural checks but could not be decoded.",
      {
        isDataUrl: extracted.isDataUrl,
        mimeType: extracted.mimeType,
        hadWhitespace,
        detectedAlphabet,
        normalizedPayload,
        addedPadding,
      },
    );
  }
}

function beginsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectMimeType(bytes: Uint8Array, decodedText?: string | null): string {
  if (beginsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (beginsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (beginsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (beginsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (beginsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return "application/zip";
  if (
    beginsWith(bytes, [0x52, 0x49, 0x46, 0x46])
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50
  ) return "image/webp";

  if (decodedText !== null && decodedText !== undefined) {
    const trimmed = decodedText.trimStart();
    if (/^<svg\b/i.test(trimmed)) return "image/svg+xml";
    if (/^<!doctype html\b|^<html\b/i.test(trimmed)) return "text/html";
    if (/^<\?xml\b/i.test(trimmed)) return "application/xml";
    if (/^[\[{]/.test(trimmed)) {
      try {
        JSON.parse(trimmed);
        return "application/json";
      } catch {
        // Continue with plain text.
      }
    }
    return "text/plain;charset=utf-8";
  }

  return "application/octet-stream";
}

export function fileNameForMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(";")[0];
  const extensions: Record<string, string> = {
    "text/plain": "txt",
    "text/html": "html",
    "application/json": "json",
    "application/xml": "xml",
    "image/svg+xml": "svg",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/zip": "zip",
  };
  return `decoded.${extensions[normalized] ?? "bin"}`;
}

export function buildHexPreview(bytes: Uint8Array, limit = BASE64_HEX_PREVIEW_BYTES): string {
  const slice = bytes.subarray(0, Math.max(0, limit));
  const lines: string[] = [];
  for (let offset = 0; offset < slice.length; offset += 16) {
    const row = slice.subarray(offset, offset + 16);
    const hex = Array.from(row, (value) => value.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = Array.from(row, (value) => value >= 32 && value <= 126 ? String.fromCharCode(value) : ".").join("");
    lines.push(`${offset.toString(16).padStart(6, "0")}  ${hex}  |${ascii}|`);
  }
  if (bytes.length > slice.length) lines.push(`… ${bytes.length - slice.length} more byte(s)`);
  return lines.join("\n");
}

export function computeBase64Stats(args: {
  sourceBytes: number;
  encodedPayload: string;
  decodedBytes: number;
  output: string;
}): Base64Stats {
  const compactPayload = args.encodedPayload.replace(/\s+/g, "");
  const encodedCharacters = compactPayload.length;
  const referenceBytes = args.decodedBytes || args.sourceBytes;
  const overheadPercent = referenceBytes
    ? Math.round(((encodedCharacters - referenceBytes) / referenceBytes) * 1000) / 10
    : 0;
  return {
    sourceBytes: args.sourceBytes,
    encodedCharacters,
    decodedBytes: args.decodedBytes,
    lineCount: args.output ? args.output.split(/\r?\n/).length : 0,
    paddingCharacters: compactPayload.match(/=+$/)?.[0].length ?? 0,
    overheadPercent,
  };
}

export function buildBase64Checks(args: {
  mode: Base64Mode;
  sourceKind: Base64SourceKind;
  input: string;
  fileSize?: number;
  encodeOptions: Base64EncodeOptions;
  encodeResult?: Base64EncodeResult;
  decodeOptions: Base64DecodeOptions;
  decodeResult?: Base64DecodeResult;
}): Base64Check[] {
  const checks: Base64Check[] = [];
  const size = args.fileSize ?? textEncoder.encode(args.input).length;

  if (!size && !args.input.trim()) {
    checks.push({ id: "empty", level: "info", title: "Ready for input", message: "Paste text, paste Base64, or import a local file to begin." });
    return checks;
  }

  if (size > BASE64_MAX_FILE_BYTES) {
    checks.push({ id: "file-limit", level: "danger", title: "Payload exceeds the browser limit", message: `This input is larger than ${formatBytes(BASE64_MAX_FILE_BYTES)}. Use a streaming or command-line workflow instead.` });
  } else if (size > BASE64_LARGE_PAYLOAD_BYTES) {
    checks.push({ id: "large-payload", level: "warning", title: "Large in-memory payload", message: `${formatBytes(size)} will be held in browser memory together with encoded and decoded copies.` });
  } else {
    checks.push({ id: "local-size", level: "success", title: "Browser-safe payload size", message: `${formatBytes(size)} is within the local processing limit.` });
  }

  checks.push({ id: "not-encryption", level: "info", title: "Encoding is not encryption", message: "Base64 is reversible and must not be used to protect secrets or confidential data." });

  if (args.mode === "encode" && args.encodeResult) {
    if (args.encodeOptions.outputKind === "data-url" && args.encodeOptions.alphabet === "url-safe") {
      checks.push({ id: "data-url-alphabet", level: "warning", title: "Non-standard Data URL alphabet", message: "Data URLs normally use the standard + / Base64 alphabet. Switch from URL-safe for broad compatibility." });
    }
    if (args.encodeOptions.outputKind === "data-url" && args.encodeResult.output.length > 100_000) {
      checks.push({ id: "large-data-url", level: "warning", title: "Large Data URL", message: "Large inline assets increase HTML/CSS size and cannot be cached independently. Prefer a real file URL for production." });
    }
    if (args.encodeOptions.lineWrap === 76) {
      checks.push({ id: "mime-wrap", level: "success", title: "MIME-compatible wrapping", message: "The Base64 payload is wrapped at 76 characters for MIME-style transport." });
    }
    if (args.sourceKind === "file") {
      checks.push({ id: "file-encoded", level: "success", title: "Binary-safe encoding", message: "The file was encoded from raw bytes without UTF-8 conversion." });
    }
  }

  if (args.mode === "decode" && args.decodeResult) {
    if (!args.decodeResult.ok && args.decodeResult.error) {
      checks.unshift({ id: "invalid", level: "danger", title: "Invalid Base64", message: args.decodeResult.error.message });
      return checks;
    }
    if (args.decodeResult.isDataUrl) {
      checks.push({ id: "data-url", level: "success", title: "Data URL recognized", message: `The metadata prefix was removed and ${args.decodeResult.mimeType} was preserved or detected.` });
    }
    if (args.decodeResult.hadWhitespace) {
      checks.push({ id: "whitespace", level: "info", title: "Whitespace normalized", message: "Spaces and line breaks were removed before decoding." });
    }
    if (args.decodeResult.addedPadding) {
      checks.push({ id: "padding", level: "info", title: "Missing padding restored", message: `${args.decodeResult.addedPadding} trailing = character${args.decodeResult.addedPadding === 1 ? " was" : "s were"} added before decoding.` });
    }
    if (args.decodeResult.ok && args.decodeResult.text === null) {
      checks.push({ id: "binary", level: "warning", title: "Binary output detected", message: `The decoded bytes are not valid UTF-8 text. Download them as ${args.decodeResult.fileName} instead of copying an empty text value.` });
    } else if (args.decodeResult.ok) {
      checks.push({ id: "utf8", level: "success", title: "Valid UTF-8 text", message: `Decoded successfully as ${args.decodeResult.mimeType}.` });
    }
    if (args.decodeOptions.strict) {
      checks.push({ id: "strict", level: "success", title: "Strict validation enabled", message: "Whitespace, missing padding, and alphabet mismatches are rejected instead of normalized." });
    }
  }

  return checks;
}

export function buildBase64Report(args: {
  mode: Base64Mode;
  sourceKind: Base64SourceKind;
  file?: { name: string; type: string; size: number };
  encodeOptions: Base64EncodeOptions;
  decodeOptions: Base64DecodeOptions;
  encodeResult?: Base64EncodeResult;
  decodeResult?: Base64DecodeResult;
  stats: Base64Stats;
  checks: Base64Check[];
}): Base64Report {
  const outputCharacters = args.mode === "encode"
    ? args.encodeResult?.output.length ?? 0
    : args.decodeResult?.output.length ?? 0;
  return {
    generatedAt: new Date().toISOString(),
    mode: args.mode,
    sourceKind: args.sourceKind,
    file: args.file,
    options: {
      alphabet: args.mode === "encode" ? args.encodeOptions.alphabet : args.decodeOptions.alphabet,
      removePadding: args.encodeOptions.removePadding,
      lineWrap: args.encodeOptions.lineWrap,
      outputKind: args.encodeOptions.outputKind,
      strictDecode: args.decodeOptions.strict,
      mimeType: args.encodeOptions.mimeType,
    },
    result: {
      status: args.mode === "encode" ? args.encodeResult?.status ?? "empty" : args.decodeResult?.status ?? "empty",
      outputCharacters,
      sourceBytes: args.stats.sourceBytes,
      decodedBytes: args.stats.decodedBytes,
      detectedMimeType: args.decodeResult?.ok ? args.decodeResult.mimeType : null,
      detectedAlphabet: args.decodeResult?.detectedAlphabet ?? null,
      textDecoded: args.mode === "decode" ? (args.decodeResult?.ok ? args.decodeResult.text !== null : null) : null,
      dataUrl: args.mode === "encode" ? args.encodeOptions.outputKind === "data-url" : args.decodeResult?.isDataUrl ?? false,
    },
    stats: args.stats,
    checks: args.checks,
  };
}

export function buildBase64CodeSnippet(
  mode: Base64Mode,
  sourceKind: Base64SourceKind,
  encodeOptions: Base64EncodeOptions,
): string {
  if (mode === "encode" && sourceKind === "file") {
    return `// Browser: encode a File as ${encodeOptions.outputKind === "data-url" ? "a Data URL" : "Base64"}\nasync function encodeFile(file) {\n  const bytes = new Uint8Array(await file.arrayBuffer());\n  let binary = "";\n  for (let i = 0; i < bytes.length; i += 0x8000) {\n    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));\n  }\n  let base64 = btoa(binary);${encodeOptions.alphabet === "url-safe" ? '\n  base64 = base64.replaceAll("+", "-").replaceAll("/", "_");' : ""}${encodeOptions.removePadding ? '\n  base64 = base64.replace(/=+$/g, "");' : ""}\n  return ${encodeOptions.outputKind === "data-url" ? "`data:${file.type || \"application/octet-stream\"};base64,${base64}`" : "base64"};\n}\n`;
  }

  if (mode === "encode") {
    return `// Browser: UTF-8 text to Base64\nfunction encodeUtf8(value) {\n  const bytes = new TextEncoder().encode(value);\n  let binary = "";\n  for (const byte of bytes) binary += String.fromCharCode(byte);\n  let base64 = btoa(binary);${encodeOptions.alphabet === "url-safe" ? '\n  base64 = base64.replaceAll("+", "-").replaceAll("/", "_");' : ""}${encodeOptions.removePadding ? '\n  base64 = base64.replace(/=+$/g, "");' : ""}\n  return base64;\n}\n`;
  }

  return `// Browser: Base64 or Base64URL to bytes and UTF-8 text\nfunction decodeBase64(value) {\n  const payload = value.includes(",") && value.startsWith("data:")\n    ? value.slice(value.indexOf(",") + 1)\n    : value;\n  const compact = payload.replace(/\\s+/g, "").replaceAll("-", "+").replaceAll("_", "/");\n  const padded = compact + "=".repeat((4 - (compact.length % 4)) % 4);\n  const binary = atob(padded);\n  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));\n  return { bytes, text: new TextDecoder().decode(bytes) };\n}\n`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}
