export type Base64Mode = "encode" | "decode";

export type Base64Options = {
  urlSafe: boolean;
  removePadding: boolean;
};

export type Base64Status = "ready" | "valid" | "invalid" | "empty";

export type Base64DecodeErrorCode =
  | "invalid-characters"
  | "invalid-padding"
  | "unable-to-decode";

export type Base64Result = {
  ok: boolean;
  output: string;
  status: Base64Status;
  error?: {
    code: Base64DecodeErrorCode;
    message: string;
  };
};

export type Base64Stats = {
  inputChars: number;
  outputChars: number;
  inputBytes: number;
  outputBytes: number;
  mode: Base64Mode;
  sizeChangePercent: number;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_");
}

function fromUrlSafe(base64: string): string {
  return base64.replace(/-/g, "+").replace(/_/g, "/");
}

function normalizeDecodeInput(input: string, urlSafe: boolean): string {
  const compact = input.replace(/\s+/g, "");
  const base = urlSafe ? fromUrlSafe(compact) : compact;
  const remainder = base.length % 4;
  if (remainder === 0) return base;
  if (remainder === 1) return base; // impossible to pad safely, leave invalid
  return base + "=".repeat(4 - remainder);
}

function validateBase64Structure(base64: string): Base64Result | null {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    return {
      ok: false,
      output: "",
      status: "invalid",
      error: {
        code: "invalid-characters",
        message: "Invalid Base64 characters detected. Use letters, numbers, +, /, and optional = padding.",
      },
    };
  }

  if (base64.length % 4 !== 0) {
    return {
      ok: false,
      output: "",
      status: "invalid",
      error: {
        code: "invalid-padding",
        message: "Invalid Base64 length or padding. Check trailing = characters.",
      },
    };
  }

  const paddingMatch = base64.match(/=+$/);
  if (paddingMatch && paddingMatch[0].length > 2) {
    return {
      ok: false,
      output: "",
      status: "invalid",
      error: {
        code: "invalid-padding",
        message: "Invalid padding. Base64 allows at most two trailing = characters.",
      },
    };
  }

  return null;
}

export function encodeBase64(input: string, options: Base64Options): Base64Result {
  const source = input ?? "";
  if (!source.length) {
    return { ok: true, output: "", status: "empty" };
  }

  const utf8 = textEncoder.encode(source);
  let output = bytesToBase64(utf8);

  if (options.urlSafe) output = toUrlSafe(output);
  if (options.removePadding) output = output.replace(/=+$/g, "");

  return { ok: true, output, status: "ready" };
}

export function decodeBase64(input: string, options: Base64Options): Base64Result {
  const source = input ?? "";
  if (!source.trim().length) {
    return { ok: true, output: "", status: "empty" };
  }

  const normalized = normalizeDecodeInput(source, options.urlSafe);
  const validationError = validateBase64Structure(normalized);
  if (validationError) return validationError;

  try {
    const bytes = base64ToBytes(normalized);
    const output = textDecoder.decode(bytes);
    return { ok: true, output, status: "valid" };
  } catch {
    return {
      ok: false,
      output: "",
      status: "invalid",
      error: {
        code: "unable-to-decode",
        message: "Unable to decode this Base64 input. Verify the value and try again.",
      },
    };
  }
}

export function transformBase64(
  input: string,
  mode: Base64Mode,
  options: Base64Options,
): Base64Result {
  return mode === "encode"
    ? encodeBase64(input, options)
    : decodeBase64(input, options);
}

export function computeBase64Stats(
  input: string,
  output: string,
  mode: Base64Mode,
): Base64Stats {
  const safeInput = input ?? "";
  const safeOutput = output ?? "";
  const inputBytes = textEncoder.encode(safeInput).length;
  const outputBytes = textEncoder.encode(safeOutput).length;
  const sizeChangePercent =
    inputBytes > 0
      ? Math.round(((outputBytes - inputBytes) / inputBytes) * 100)
      : 0;

  return {
    inputChars: safeInput.length,
    outputChars: safeOutput.length,
    inputBytes,
    outputBytes,
    mode,
    sizeChangePercent,
  };
}
