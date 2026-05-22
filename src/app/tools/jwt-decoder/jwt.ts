import type { JwtClaimAnalysis, JwtClaimInsight, JwtDecodeIssue, JwtDecodeResult, JwtDecodedSection } from "./types";

export const JWT_INPUT_LIMIT = 50_000;

function emptyAnalysis(): JwtClaimAnalysis {
  return { insights: [], isExpired: null, isNotYetValid: null };
}

function createInvalidResult(token: string, issues: JwtDecodeIssue[], segments: string[] = []): JwtDecodeResult {
  return {
    status: token.trim() ? "invalid" : "empty",
    issues,
    token,
    segments,
    header: null,
    payload: null,
    signature: segments[2] ?? "",
    decodedJson: "",
    claimAnalysis: emptyAnalysis(),
  };
}

function addBase64Padding(value: string): string {
  const remainder = value.length % 4;
  if (remainder === 0) return value;
  return `${value}${"=".repeat(4 - remainder)}`;
}

export function base64UrlDecode(segment: string): string {
  if (!segment) return "";

  const normalized = addBase64Padding(segment.replace(/-/g, "+").replace(/_/g, "/"));
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function parseJwtJson(segment: string): unknown {
  const decoded = base64UrlDecode(segment);
  return JSON.parse(decoded);
}

function decodeSection(segment: string): JwtDecodedSection {
  const decoded = base64UrlDecode(segment);
  const parsed = JSON.parse(decoded) as unknown;
  return {
    raw: segment,
    decoded,
    parsed,
    pretty: JSON.stringify(parsed, null, 2),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function formatNumericDate(value: unknown): { seconds: number; date: Date; label: string } | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return { seconds: value, date, label: `${date.toLocaleString()} (${value})` };
}

function readableValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "Not set";
  return JSON.stringify(value);
}

export function analyzeJwtClaims(payload: Record<string, unknown>, now = new Date()): JwtClaimAnalysis {
  const insights: JwtClaimInsight[] = [];
  const nowMs = now.getTime();
  let isExpired: boolean | null = null;
  let isNotYetValid: boolean | null = null;

  const exp = formatNumericDate(payload.exp);
  if (exp) {
    isExpired = exp.date.getTime() <= nowMs;
    insights.push({
      key: "exp",
      label: "Expiration",
      value: exp.label,
      status: isExpired ? "danger" : "success",
      description: isExpired ? "This token expiration time is in the past." : "This token expiration time is still in the future.",
    });
  }

  const iat = formatNumericDate(payload.iat);
  if (iat) {
    insights.push({
      key: "iat",
      label: "Issued at",
      value: iat.label,
      status: iat.date.getTime() > nowMs ? "warning" : "info",
      description: iat.date.getTime() > nowMs ? "The issued-at time is in the future." : "When the token says it was issued.",
    });
  }

  const nbf = formatNumericDate(payload.nbf);
  if (nbf) {
    isNotYetValid = nbf.date.getTime() > nowMs;
    insights.push({
      key: "nbf",
      label: "Not before",
      value: nbf.label,
      status: isNotYetValid ? "warning" : "success",
      description: isNotYetValid ? "This token is not valid yet based on its nbf claim." : "The not-before time has passed.",
    });
  }

  (["iss", "sub", "aud", "jti"] as const).forEach((key) => {
    if (payload[key] !== undefined) {
      insights.push({ key, label: key.toUpperCase(), value: readableValue(payload[key]), status: "info", description: `Registered JWT claim: ${key}.` });
    }
  });

  return { insights, isExpired, isNotYetValid };
}

export function decodeJwt(token: string): JwtDecodeResult {
  const trimmed = token.trim();

  if (!trimmed) {
    return createInvalidResult("", [{ level: "info", message: "Paste a JWT to decode its header and payload." }]);
  }

  if (trimmed.length > JWT_INPUT_LIMIT) {
    return createInvalidResult(trimmed, [{ level: "error", message: `JWT input is too large. Keep it under ${JWT_INPUT_LIMIT.toLocaleString()} characters.` }]);
  }

  const segments = trimmed.split(".");
  const issues: JwtDecodeIssue[] = [];

  if (segments.length !== 3) {
    issues.push({ level: "error", message: "A normal signed JWT should contain exactly 3 dot-separated segments: header.payload.signature." });
    return createInvalidResult(trimmed, issues, segments);
  }

  if (!segments[0] || !segments[1]) {
    issues.push({ level: "error", message: "The JWT header and payload segments are required." });
    return createInvalidResult(trimmed, issues, segments);
  }

  if (!segments[2]) {
    issues.push({ level: "warning", message: "This token has an empty signature segment. It may be unsigned or incomplete." });
  }

  let header: JwtDecodedSection;
  let payload: JwtDecodedSection;

  try {
    header = decodeSection(segments[0]);
  } catch (error) {
    return createInvalidResult(trimmed, [{ level: "error", message: `Could not decode the JWT header: ${error instanceof Error ? error.message : "invalid JSON or Base64URL"}` }], segments);
  }

  try {
    payload = decodeSection(segments[1]);
  } catch (error) {
    return createInvalidResult(trimmed, [{ level: "error", message: `Could not decode the JWT payload: ${error instanceof Error ? error.message : "invalid JSON or Base64URL"}` }], segments);
  }

  const headerRecord = asRecord(header.parsed);
  const payloadRecord = asRecord(payload.parsed);

  if (!headerRecord) issues.push({ level: "warning", message: "Decoded header is not a JSON object." });
  if (!payloadRecord) issues.push({ level: "warning", message: "Decoded payload is not a JSON object, so claim insights are limited." });

  const alg = headerRecord?.alg;
  if (alg === "none") {
    issues.push({ level: "warning", message: "Header alg is 'none'. Treat this as unsigned unless your system explicitly supports unsecured JWTs." });
  } else if (typeof alg === "string") {
    issues.push({ level: "info", message: `Algorithm declared by header: ${alg}. This decoder does not verify it.` });
  } else {
    issues.push({ level: "warning", message: "No alg value found in the JWT header." });
  }

  issues.push({ level: "warning", message: "Decoded only. Signature authenticity is not verified by this tool." });

  const claimAnalysis = payloadRecord ? analyzeJwtClaims(payloadRecord) : emptyAnalysis();
  const decodedJson = JSON.stringify({ header: header.parsed, payload: payload.parsed, signature: segments[2] }, null, 2);
  const hasErrors = issues.some((issue) => issue.level === "error");
  const hasWarnings = issues.some((issue) => issue.level === "warning");

  return {
    status: hasErrors ? "invalid" : hasWarnings ? "warning" : "valid",
    issues,
    token: trimmed,
    segments,
    header,
    payload,
    signature: segments[2],
    decodedJson,
    claimAnalysis,
  };
}
