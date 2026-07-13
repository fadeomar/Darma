import type { Base64EncodeOptions, Base64Preset } from "./types";

export const DEFAULT_ENCODE_OPTIONS: Base64EncodeOptions = {
  alphabet: "standard",
  removePadding: false,
  lineWrap: 0,
  outputKind: "base64",
  mimeType: "text/plain;charset=utf-8",
};

export const BASE64_PRESETS: Base64Preset[] = [
  {
    id: "unicode-text",
    label: "Unicode message",
    description: "Confirm UTF-8 handling with Arabic, accents, and emoji.",
    mode: "encode",
    value: "Darma tools — مرحباً بالعالم — café — 🚀",
    mimeType: "text/plain;charset=utf-8",
  },
  {
    id: "json-payload",
    label: "JSON payload",
    description: "Encode a compact API-style object for transport testing.",
    mode: "encode",
    value: '{"project":"Darma","environment":"staging","enabled":true}',
    mimeType: "application/json",
  },
  {
    id: "url-safe-token",
    label: "URL-safe token",
    description: "Decode an unpadded Base64URL value commonly used in tokens.",
    mode: "decode",
    value: "eyJzdWIiOiJ1c2VyLTEyMyIsInJvbGUiOiJlZGl0b3IifQ",
    alphabet: "url-safe",
  },
  {
    id: "data-url-svg",
    label: "SVG Data URL",
    description: "Inspect a complete Base64 data URL and its detected MIME type.",
    mode: "decode",
    value: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjNjM2NmYxIi8+PHRleHQgeD0iNjAiIHk9IjI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkRhcm1hPC90ZXh0Pjwvc3ZnPg==",
    alphabet: "auto",
  },
  {
    id: "wrapped-mime",
    label: "Wrapped MIME block",
    description: "Decode Base64 split across MIME-style 76-character lines.",
    mode: "decode",
    value: "VGhpcyBpcyBhIGxvbmdlciBzYW1wbGUgdGhhdCBkZW1vbnN0cmF0ZXMgaG93IEJhc2U2NCBjYW4gYmUg\nd3JhcHBlZCBhY3Jvc3MgbXVsdGlwbGUgbGluZXMgd2l0aG91dCBjaGFuZ2luZyB0aGUgZGVjb2RlZCBk\nYXRhLg==",
    alphabet: "standard",
  },
  {
    id: "invalid-review",
    label: "Invalid input audit",
    description: "Exercise validation with illegal characters and broken padding.",
    mode: "decode",
    value: "SGVsbG8===!!",
    alphabet: "auto",
    strict: true,
  },
];

export const MIME_TYPE_OPTIONS = [
  "text/plain;charset=utf-8",
  "application/json",
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/octet-stream",
] as const;
