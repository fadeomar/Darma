import type { Base64EncodeOptions, Base64Preset } from "./types";

export const DEFAULT_ENCODE_OPTIONS: Base64EncodeOptions = {
  alphabet: "standard",
  removePadding: false,
  lineWrap: 0,
  outputKind: "base64",
  mimeType: "text/plain;charset=utf-8",
};

export const BASE64_PRESETS: Base64Preset[] = [
  { id: "unicode-text", label: "Unicode message", description: "Confirm UTF-8 handling with Arabic, accents, and emoji.", mode: "encode", value: "Darma tools — مرحباً بالعالم — café — 🚀", mimeType: "text/plain;charset=utf-8" },
  { id: "json-payload", label: "JSON payload", description: "Encode a compact API-style object for transport testing.", mode: "encode", value: '{"project":"Darma","environment":"staging","enabled":true}', mimeType: "application/json" },
  { id: "url-safe-token", label: "URL-safe token", description: "Decode an unpadded Base64URL value commonly used in tokens.", mode: "decode", value: "eyJzdWIiOiJ1c2VyLTEyMyIsInJvbGUiOiJlZGl0b3IifQ", alphabet: "url-safe" },
  { id: "data-url-svg", label: "SVG Data URL", description: "Inspect a complete Base64 data URL and detected MIME type.", mode: "decode", value: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjNjM2NmYxIi8+PHRleHQgeD0iNjAiIHk9IjI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkRhcm1hPC90ZXh0Pjwvc3ZnPg==", alphabet: "auto" },
  { id: "wrapped-mime", label: "Wrapped MIME block", description: "Decode Base64 split across MIME-style lines.", mode: "decode", value: `VGhpcyBpcyBhIGxvbmdlciBzYW1wbGUgdGhhdCBkZW1vbnN0cmF0ZXMgaG93IEJhc2U2NCBjYW4gYmUg
d3JhcHBlZCBhY3Jvc3MgbXVsdGlwbGUgbGluZXMgd2l0aG91dCBjaGFuZ2luZyB0aGUgZGVjb2RlZCBk
YXRhLg==`, alphabet: "standard" },
    { id: "invalid-review", label: "Invalid input audit", description: "Exercise validation with illegal characters and broken padding.", mode: "decode", value: "SGVsbG8===!!", alphabet: "auto", strict: true },
  { id: "basic-auth", label: "Basic Auth credentials", description: "Encode a demo username:password pair used in HTTP Basic Auth.", mode: "encode", value: "demo-user:demo-password", mimeType: "text/plain;charset=utf-8" },
  { id: "css-inline-svg", label: "CSS inline SVG", description: "Encode a tiny SVG payload for a data URL experiment.", mode: "encode", value: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#6366f1"/></svg>', outputKind: "data-url", mimeType: "image/svg+xml" },
  { id: "webhook-body", label: "Webhook body", description: "Encode a realistic event payload when debugging transport layers.", mode: "encode", value: '{"event":"invoice.paid","id":"evt_42","amount":12900}', mimeType: "application/json" },
  { id: "pem-fragment", label: "Certificate fragment", description: "Decode a wrapped certificate-like Base64 fragment without treating it as a secret.", mode: "decode", value: "RGFybWEgZGVtbyBjZXJ0aWZpY2F0ZSBwYXlsb2FkIGZvciBmb3JtYXQgcmV2aWV3IG9ubHku", alphabet: "standard" },
  { id: "jwt-header", label: "JWT header", description: "Decode the Base64URL header portion of a sample JWT.", mode: "decode", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", alphabet: "url-safe" },
  { id: "jwt-payload", label: "JWT payload", description: "Decode a sample JWT payload to inspect readable claims.", mode: "decode", value: "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRhcm1hIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9", alphabet: "url-safe" },
  { id: "plain-hello", label: "Simple decode", description: "Start with a familiar Base64 string that decodes to readable text.", mode: "decode", value: "SGVsbG8sIERhcm1hIQ==", alphabet: "auto" },
  { id: "no-padding", label: "No-padding Base64URL", description: "Inspect an unpadded URL-safe value used in routes and APIs.", mode: "decode", value: "ZGFybWEtdG9vbHMtMjAyNg", alphabet: "url-safe" },
  { id: "unicode-decode", label: "Unicode decode", description: "Decode UTF-8 Base64 containing Arabic text.", mode: "decode", value: "2YXYsdit2KjYpyDYqNin2YTYudin2YTZhQ==", alphabet: "auto" },
  { id: "binary-warning", label: "Binary payload review", description: "Decode bytes that are not useful as plain text and inspect the byte output.", mode: "decode", value: "AAECAwQFBgcICQ==", alphabet: "standard" },
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
