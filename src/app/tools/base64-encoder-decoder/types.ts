export type Base64Mode = "encode" | "decode";
export type Base64SourceKind = "text" | "file";
export type Base64Alphabet = "standard" | "url-safe";
export type Base64DecodeAlphabet = "auto" | Base64Alphabet;
export type Base64OutputKind = "base64" | "data-url";
export type Base64LineWrap = 0 | 64 | 76;
export type Base64Status = "empty" | "ready" | "valid" | "invalid";
export type Base64CheckLevel = "success" | "info" | "warning" | "danger";

export type Base64DecodeErrorCode =
  | "invalid-characters"
  | "invalid-padding"
  | "invalid-length"
  | "mixed-alphabet"
  | "alphabet-mismatch"
  | "data-url-not-base64"
  | "unable-to-decode";

export interface Base64EncodeOptions {
  alphabet: Base64Alphabet;
  removePadding: boolean;
  lineWrap: Base64LineWrap;
  outputKind: Base64OutputKind;
  mimeType: string;
}

export interface Base64DecodeOptions {
  alphabet: Base64DecodeAlphabet;
  strict: boolean;
}

export interface Base64EncodeResult {
  ok: true;
  status: "empty" | "ready";
  output: string;
  payload: string;
  sourceBytes: Uint8Array;
  mimeType: string;
  paddingCharacters: number;
  lineCount: number;
}

export interface Base64DecodeResult {
  ok: boolean;
  status: Base64Status;
  output: string;
  bytes: Uint8Array;
  text: string | null;
  mimeType: string;
  fileName: string;
  isDataUrl: boolean;
  normalizedPayload: string;
  detectedAlphabet: Base64Alphabet | "neutral" | "mixed";
  hadWhitespace: boolean;
  addedPadding: number;
  error?: {
    code: Base64DecodeErrorCode;
    message: string;
  };
}

export interface Base64Stats {
  sourceBytes: number;
  encodedCharacters: number;
  decodedBytes: number;
  lineCount: number;
  paddingCharacters: number;
  overheadPercent: number;
}

export interface Base64Check {
  id: string;
  level: Base64CheckLevel;
  title: string;
  message: string;
}

export interface Base64Preset {
  id: string;
  label: string;
  description: string;
  mode: Base64Mode;
  value: string;
  alphabet?: Base64DecodeAlphabet;
  strict?: boolean;
  outputKind?: Base64OutputKind;
  mimeType?: string;
}

export interface Base64Report {
  generatedAt: string;
  mode: Base64Mode;
  sourceKind: Base64SourceKind;
  file?: {
    name: string;
    type: string;
    size: number;
  };
  options: {
    alphabet: Base64DecodeAlphabet;
    removePadding: boolean;
    lineWrap: Base64LineWrap;
    outputKind: Base64OutputKind;
    strictDecode: boolean;
    mimeType: string;
  };
  result: {
    status: Base64Status;
    outputCharacters: number;
    sourceBytes: number;
    decodedBytes: number;
    detectedMimeType: string | null;
    detectedAlphabet: Base64DecodeResult["detectedAlphabet"] | null;
    textDecoded: boolean | null;
    dataUrl: boolean;
  };
  stats: Base64Stats;
  checks: Base64Check[];
}
