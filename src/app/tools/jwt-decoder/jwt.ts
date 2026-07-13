import type {
  JwtCheck,
  JwtClaimAnalysis,
  JwtClaimInsight,
  JwtDecodeIssue,
  JwtDecodeResult,
  JwtDecodedSection,
  JwtSampleDefinition,
  JwtVerificationInput,
  JwtVerificationResult,
} from "./types";

export const JWT_INPUT_LIMIT = 50_000;
const RECOMMENDED_TOKEN_BYTES = 4_096;
const SENSITIVE_CLAIM_PATTERN = /(password|passwd|secret|api[_-]?key|access[_-]?key|private[_-]?key|credit[_-]?card|ssn)/i;
const SUPPORTED_ALGORITHMS = new Set(["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512", "EdDSA"]);

function emptyAnalysis(): JwtClaimAnalysis {
  return {
    insights: [],
    isExpired: null,
    isNotYetValid: null,
    expiresAt: null,
    expiresIn: null,
    issuedAt: null,
    notBefore: null,
  };
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

function createInvalidResult(token: string, issues: JwtDecodeIssue[], segments: string[] = []): JwtDecodeResult {
  return {
    status: token.trim() ? "invalid" : "empty",
    issues,
    token,
    tokenBytes: utf8Bytes(token),
    segments,
    header: null,
    payload: null,
    signature: segments[2] ?? "",
    decodedJson: "",
    algorithm: null,
    tokenType: null,
    headerClaimCount: 0,
    payloadClaimCount: 0,
    claimAnalysis: emptyAnalysis(),
  };
}

function addBase64Padding(value: string): string {
  const remainder = value.length % 4;
  return remainder === 0 ? value : `${value}${"=".repeat(4 - remainder)}`;
}

export function base64UrlDecode(segment: string): string {
  if (!segment) return "";
  const normalized = addBase64Padding(segment.replace(/-/g, "+").replace(/_/g, "/"));
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function encodeJwtSample(sample: Pick<JwtSampleDefinition, "header" | "payload" | "signature">): string {
  return [
    base64UrlEncode(JSON.stringify(sample.header)),
    base64UrlEncode(JSON.stringify(sample.payload)),
    sample.signature ?? "demo-signature-not-verified",
  ].join(".");
}

export function parseJwtJson(segment: string): unknown {
  return JSON.parse(base64UrlDecode(segment));
}

function decodeSection(segment: string): JwtDecodedSection {
  const decoded = base64UrlDecode(segment);
  const parsed = JSON.parse(decoded) as unknown;
  return { raw: segment, decoded, parsed, pretty: JSON.stringify(parsed, null, 2) };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function formatRelative(target: Date, now: Date): string {
  const seconds = Math.round((target.getTime() - now.getTime()) / 1000);
  const absolute = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (absolute < 60) return formatter.format(seconds, "second");
  if (absolute < 3_600) return formatter.format(Math.round(seconds / 60), "minute");
  if (absolute < 86_400) return formatter.format(Math.round(seconds / 3_600), "hour");
  return formatter.format(Math.round(seconds / 86_400), "day");
}

function formatNumericDate(value: unknown, now: Date): { seconds: number; date: Date; label: string; relative: string } | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return { seconds: value, date, label: date.toLocaleString(), relative: formatRelative(date, now) };
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

  const exp = formatNumericDate(payload.exp, now);
  if (exp) {
    isExpired = exp.date.getTime() <= nowMs;
    insights.push({ key: "exp", label: "Expiration", value: `${exp.label} · ${exp.relative}`, rawValue: payload.exp, status: isExpired ? "danger" : "success", description: isExpired ? "The expiration time is in the past; a verifier should reject this token." : "The token has not reached its declared expiration time." });
  }

  const iat = formatNumericDate(payload.iat, now);
  if (iat) {
    const future = iat.date.getTime() > nowMs + 60_000;
    insights.push({ key: "iat", label: "Issued at", value: `${iat.label} · ${iat.relative}`, rawValue: payload.iat, status: future ? "warning" : "info", description: future ? "The issued-at time is unexpectedly in the future." : "When the issuer says the token was created." });
  }

  const nbf = formatNumericDate(payload.nbf, now);
  if (nbf) {
    isNotYetValid = nbf.date.getTime() > nowMs;
    insights.push({ key: "nbf", label: "Not before", value: `${nbf.label} · ${nbf.relative}`, rawValue: payload.nbf, status: isNotYetValid ? "warning" : "success", description: isNotYetValid ? "The not-before time has not arrived; a verifier should reject this token for now." : "The token is past its not-before time." });
  }

  const registered = [
    ["iss", "Issuer", "Identifies the system that issued the token."],
    ["sub", "Subject", "Identifies the principal or resource described by the token."],
    ["aud", "Audience", "Identifies the service or client intended to accept the token."],
    ["jti", "JWT ID", "A unique token identifier that can support replay protection."],
  ] as const;

  registered.forEach(([key, label, description]) => {
    if (payload[key] !== undefined) insights.push({ key, label, value: readableValue(payload[key]), rawValue: payload[key], status: "info", description });
  });

  return {
    insights,
    isExpired,
    isNotYetValid,
    expiresAt: exp?.label ?? null,
    expiresIn: exp?.relative ?? null,
    issuedAt: iat?.label ?? null,
    notBefore: nbf?.label ?? null,
  };
}

export function decodeJwt(token: string, now = new Date()): JwtDecodeResult {
  const trimmed = token.trim();
  if (!trimmed) return createInvalidResult("", [{ level: "info", message: "Paste a JWT or choose a preset to inspect it." }]);
  if (trimmed.length > JWT_INPUT_LIMIT) return createInvalidResult(trimmed, [{ level: "error", message: `JWT input is too large. Keep it under ${JWT_INPUT_LIMIT.toLocaleString()} characters.` }]);

  const segments = trimmed.split(".");
  const issues: JwtDecodeIssue[] = [];
  if (segments.length !== 3) return createInvalidResult(trimmed, [{ level: "error", message: "A signed JWT must contain exactly three dot-separated segments: header.payload.signature." }], segments);
  if (!segments[0] || !segments[1]) return createInvalidResult(trimmed, [{ level: "error", message: "The header and payload segments are required." }], segments);
  if (!segments[2]) issues.push({ level: "warning", message: "The signature segment is empty. The token is unsigned or incomplete." });

  let header: JwtDecodedSection;
  let payload: JwtDecodedSection;
  try { header = decodeSection(segments[0]); } catch (error) {
    return createInvalidResult(trimmed, [{ level: "error", message: `Could not decode the JWT header: ${error instanceof Error ? error.message : "invalid JSON or Base64URL"}` }], segments);
  }
  try { payload = decodeSection(segments[1]); } catch (error) {
    return createInvalidResult(trimmed, [{ level: "error", message: `Could not decode the JWT payload: ${error instanceof Error ? error.message : "invalid JSON or Base64URL"}` }], segments);
  }

  const headerRecord = asRecord(header.parsed);
  const payloadRecord = asRecord(payload.parsed);
  if (!headerRecord) issues.push({ level: "warning", message: "The decoded header is not a JSON object." });
  if (!payloadRecord) issues.push({ level: "warning", message: "The decoded payload is not a JSON object, so claim analysis is limited." });

  const algorithm = typeof headerRecord?.alg === "string" ? headerRecord.alg : null;
  const tokenType = typeof headerRecord?.typ === "string" ? headerRecord.typ : null;
  if (algorithm === "none") issues.push({ level: "warning", message: "The header declares alg none. Normal applications should reject unsecured JWTs." });
  else if (!algorithm) issues.push({ level: "warning", message: "No alg value was found in the JWT header." });

  const claimAnalysis = payloadRecord ? analyzeJwtClaims(payloadRecord, now) : emptyAnalysis();
  const decodedJson = JSON.stringify({ header: header.parsed, payload: payload.parsed, signature: segments[2] }, null, 2);
  const status = claimAnalysis.isExpired ? "expired" : claimAnalysis.isNotYetValid ? "not-yet-valid" : issues.some((issue) => issue.level === "warning") ? "warning" : "decoded";

  return {
    status,
    issues,
    token: trimmed,
    tokenBytes: utf8Bytes(trimmed),
    segments,
    header,
    payload,
    signature: segments[2],
    decodedJson,
    algorithm,
    tokenType,
    headerClaimCount: headerRecord ? Object.keys(headerRecord).length : 0,
    payloadClaimCount: payloadRecord ? Object.keys(payloadRecord).length : 0,
    claimAnalysis,
  };
}

export function buildJwtChecks(result: JwtDecodeResult): JwtCheck[] {
  if (result.status === "empty") return [{ id: "empty", severity: "info", title: "Ready for a token", message: "Paste a JWT or load a practical preset." }];
  if (result.status === "invalid") return [{ id: "structure", severity: "danger", title: "JWT could not be decoded", message: result.issues[0]?.message ?? "Check the token structure and Base64URL JSON." }];

  const checks: JwtCheck[] = [];
  const header = asRecord(result.header?.parsed);
  const payload = asRecord(result.payload?.parsed);
  const algorithm = result.algorithm;

  checks.push({ id: "structure", severity: "success", title: "Three readable segments", message: "The header and payload are valid Base64URL-encoded JSON. This does not verify authenticity." });
  checks.push(algorithm === "none"
    ? { id: "algorithm", severity: "danger", title: "Unsecured algorithm", message: "alg none removes signature protection and should normally be rejected." }
    : algorithm && SUPPORTED_ALGORITHMS.has(algorithm)
      ? { id: "algorithm", severity: "success", title: `Declared algorithm: ${algorithm}`, message: "Allowlist this algorithm during verification instead of trusting the header automatically." }
      : { id: "algorithm", severity: "warning", title: algorithm ? `Review algorithm: ${algorithm}` : "Missing algorithm", message: "Use an explicit server-side algorithm allowlist." });

  checks.push(result.signature
    ? { id: "signature", severity: "info", title: "Signature present, not yet verified", message: "Run verification below with the expected key and claims before trusting the token." }
    : { id: "signature", severity: "danger", title: "No signature data", message: "The third segment is empty." });

  checks.push(result.claimAnalysis.isExpired
    ? { id: "exp", severity: "danger", title: "Token is expired", message: `The exp claim passed ${result.claimAnalysis.expiresIn ?? "already"}.` }
    : result.claimAnalysis.expiresAt
      ? { id: "exp", severity: "success", title: "Expiration claim present", message: `Declared expiration: ${result.claimAnalysis.expiresAt}.` }
      : { id: "exp", severity: "warning", title: "No expiration claim", message: "Long-lived bearer tokens increase replay risk. Decide whether exp is mandatory for your use case." });

  checks.push(result.claimAnalysis.isNotYetValid
    ? { id: "nbf", severity: "warning", title: "Token is not valid yet", message: `The nbf claim is ${result.claimAnalysis.notBefore}.` }
    : { id: "nbf", severity: "success", title: "No active not-before block", message: "The token is not currently blocked by its nbf claim." });

  checks.push(payload?.iss !== undefined
    ? { id: "issuer", severity: "success", title: "Issuer claim available", message: "Compare iss against an exact trusted value during verification." }
    : { id: "issuer", severity: "info", title: "Issuer claim absent", message: "Some token profiles require iss; enforce it when your architecture expects one." });

  checks.push(payload?.aud !== undefined
    ? { id: "audience", severity: "success", title: "Audience claim available", message: "Verify aud against the exact API or client that receives this token." }
    : { id: "audience", severity: "info", title: "Audience claim absent", message: "Require aud when tokens can be consumed by multiple services." });

  const sensitiveKeys = payload ? Object.keys(payload).filter((key) => SENSITIVE_CLAIM_PATTERN.test(key)) : [];
  checks.push(sensitiveKeys.length
    ? { id: "sensitive", severity: "danger", title: "Sensitive-looking claims detected", message: `${sensitiveKeys.join(", ")} should not contain secrets because JWT payloads are readable, not encrypted.` }
    : { id: "sensitive", severity: "success", title: "No obvious secret claim names", message: "Still review all custom claims for personal or confidential data." });

  if (header?.jku || header?.x5u) checks.push({ id: "remote-key", severity: "warning", title: "Remote key URL declared", message: "jku/x5u must be tightly allowlisted to prevent untrusted key fetching or SSRF behavior." });
  if (header?.crit) checks.push({ id: "critical", severity: "warning", title: "Critical header extensions", message: "Reject the token unless every crit extension is explicitly understood." });

  checks.push(result.tokenBytes > RECOMMENDED_TOKEN_BYTES
    ? { id: "size", severity: "warning", title: "Large token", message: `${result.tokenBytes.toLocaleString()} bytes may exceed proxy, cookie, or header budgets.` }
    : { id: "size", severity: "success", title: "Reasonable token size", message: `${result.tokenBytes.toLocaleString()} bytes is below the ${RECOMMENDED_TOKEN_BYTES.toLocaleString()}-byte review threshold.` });

  return checks;
}

export async function verifyJwtSignature(input: JwtVerificationInput): Promise<JwtVerificationResult> {
  try {
    const { importJWK, jwtVerify } = await import("jose");
    const decoded = decodeJwt(input.token);
    if (!decoded.algorithm) throw new Error("The token does not declare an algorithm.");
    if (decoded.algorithm === "none") throw new Error("Unsecured alg none tokens cannot be verified.");

    const options = {
      algorithms: [decoded.algorithm],
      ...(input.issuer?.trim() ? { issuer: input.issuer.trim() } : {}),
      ...(input.audience?.trim() ? { audience: input.audience.trim() } : {}),
    };

    let verifiedPayload: Record<string, unknown>;
    let verifiedHeader: Record<string, unknown> & { alg?: string };
    if (input.mode === "secret") {
      if (!input.secret) throw new Error("Enter the expected HMAC secret.");
      if (!decoded.algorithm.startsWith("HS")) throw new Error(`${decoded.algorithm} uses an asymmetric key, not a shared secret.`);
      const key = new TextEncoder().encode(input.secret);
      const verified = await jwtVerify(input.token.trim(), key, options);
      verifiedPayload = verified.payload as Record<string, unknown>;
      verifiedHeader = verified.protectedHeader as Record<string, unknown> & { alg?: string };
    } else {
      if (!input.jwk?.trim()) throw new Error("Paste the expected public JWK.");
      const parsed = JSON.parse(input.jwk);
      const key = await importJWK(parsed, decoded.algorithm);
      const verified = await jwtVerify(input.token.trim(), key, options);
      verifiedPayload = verified.payload as Record<string, unknown>;
      verifiedHeader = verified.protectedHeader as Record<string, unknown> & { alg?: string };
    }
    return {
      status: "verified",
      message: "Signature and configured claim expectations passed.",
      verifiedAt: new Date().toISOString(),
      algorithm: verifiedHeader.alg ?? decoded.algorithm,
      payload: verifiedPayload,
      header: verifiedHeader,
    };
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Verification failed.",
      verifiedAt: new Date().toISOString(),
      algorithm: null,
      payload: null,
      header: null,
    };
  }
}

export function buildVerificationSnippet(mode: "secret" | "jwk", algorithm: string | null, issuer: string, audience: string): string {
  const expected = [
    `algorithms: [${JSON.stringify(algorithm || "RS256")}]`,
    issuer.trim() ? `issuer: ${JSON.stringify(issuer.trim())}` : null,
    audience.trim() ? `audience: ${JSON.stringify(audience.trim())}` : null,
  ].filter(Boolean).join(",\n    ");

  if (mode === "secret") {
    return `import { jwtVerify } from "jose";\n\nconst secret = new TextEncoder().encode(process.env.JWT_SECRET);\nconst { payload, protectedHeader } = await jwtVerify(token, secret, {\n    ${expected}\n});\n\n// Trust claims only after jwtVerify succeeds.\nconsole.log(protectedHeader.alg, payload.sub);`;
  }

  return `import { importJWK, jwtVerify } from "jose";\n\nconst publicJwk = JSON.parse(process.env.JWT_PUBLIC_JWK);\nconst key = await importJWK(publicJwk, ${JSON.stringify(algorithm || "RS256")});\nconst { payload, protectedHeader } = await jwtVerify(token, key, {\n    ${expected}\n});\n\n// Trust claims only after jwtVerify succeeds.\nconsole.log(protectedHeader.alg, payload.sub);`;
}
