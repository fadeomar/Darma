import type {
  UuidAuditReport,
  UuidCheck,
  UuidFormat,
  UuidGenerationConfig,
  UuidInspection,
  UuidOutputStyle,
  UuidVersion,
} from "./types";

const MAX_UUID_BATCH_SIZE = 500;
const UUID_HEX_RE = /^[0-9a-f]{32}$/i;
const CANONICAL_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const MAX_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

let lastV7Timestamp = -1;
let lastV7Sequence = -1;

function cryptoApi(): Crypto | null {
  return typeof globalThis.crypto === "object" ? globalThis.crypto : null;
}

export function hasSecureRandomSupport(): boolean {
  const crypto = cryptoApi();
  return Boolean(crypto && (typeof crypto.getRandomValues === "function" || typeof crypto.randomUUID === "function"));
}

export function hasSecureUuidSupport(): boolean {
  return hasSecureRandomSupport();
}

function secureRandomBytes(length: number): Uint8Array {
  const crypto = cryptoApi();
  if (!crypto) {
    throw new Error("Secure browser randomness is unavailable. Open this tool in a modern secure browser context.");
  }

  const bytes = new Uint8Array(length);
  if (typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
    return bytes;
  }

  if (typeof crypto.randomUUID === "function") {
    let offset = 0;
    while (offset < length) {
      const chunk = crypto.randomUUID().replaceAll("-", "");
      for (let index = 0; index < chunk.length && offset < length; index += 2) {
        bytes[offset] = Number.parseInt(chunk.slice(index, index + 2), 16);
        offset += 1;
      }
    }
    return bytes;
  }

  throw new Error("Secure browser randomness is unavailable. Open this tool in a modern secure browser context.");
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateUuidV4(): string {
  const crypto = cryptoApi();
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID().toLowerCase();
  }

  const bytes = secureRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

function nextV7State(requestedTimestamp: number): { timestamp: number; sequence: number } {
  let timestamp = Math.max(0, Math.min(0xffffffffffff, Math.floor(requestedTimestamp)));

  if (timestamp > lastV7Timestamp) {
    const seed = secureRandomBytes(2);
    lastV7Timestamp = timestamp;
    lastV7Sequence = ((seed[0] << 8) | seed[1]) & 0x0fff;
  } else {
    timestamp = lastV7Timestamp;
    lastV7Sequence += 1;
    if (lastV7Sequence > 0x0fff) {
      lastV7Timestamp = Math.min(0xffffffffffff, lastV7Timestamp + 1);
      timestamp = lastV7Timestamp;
      const seed = secureRandomBytes(2);
      lastV7Sequence = ((seed[0] << 8) | seed[1]) & 0x0fff;
    }
  }

  return { timestamp, sequence: lastV7Sequence };
}

export function generateUuidV7(now = Date.now()): string {
  if (!Number.isFinite(now)) throw new Error("UUID v7 requires a finite Unix timestamp in milliseconds.");

  const { timestamp, sequence } = nextV7State(now);
  const bytes = secureRandomBytes(16);

  bytes[0] = Math.floor(timestamp / 2 ** 40) % 256;
  bytes[1] = Math.floor(timestamp / 2 ** 32) % 256;
  bytes[2] = Math.floor(timestamp / 2 ** 24) % 256;
  bytes[3] = Math.floor(timestamp / 2 ** 16) % 256;
  bytes[4] = Math.floor(timestamp / 2 ** 8) % 256;
  bytes[5] = timestamp % 256;
  bytes[6] = 0x70 | ((sequence >> 8) & 0x0f);
  bytes[7] = sequence & 0xff;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuid(bytes);
}

export function resetUuidV7StateForTests(): void {
  lastV7Timestamp = -1;
  lastV7Sequence = -1;
}

export function generateUuid(version: UuidVersion = "v4"): string {
  return version === "v7" ? generateUuidV7() : generateUuidV4();
}

function canonicalFromHex(hex: string): string {
  const lower = hex.toLowerCase();
  return `${lower.slice(0, 8)}-${lower.slice(8, 12)}-${lower.slice(12, 16)}-${lower.slice(16, 20)}-${lower.slice(20)}`;
}

export function normalizeUuid(value: string): string | null {
  let normalized = value.trim();
  if (/^urn:uuid:/i.test(normalized)) normalized = normalized.slice(9);
  if (normalized.startsWith("{") && normalized.endsWith("}")) normalized = normalized.slice(1, -1);
  const compact = normalized.replaceAll("-", "");
  return UUID_HEX_RE.test(compact) ? canonicalFromHex(compact) : null;
}

export function formatUuid(uuid: string, format: UuidFormat): string {
  const canonical = normalizeUuid(uuid);
  if (!canonical) throw new Error("Cannot format an invalid UUID value.");

  switch (format) {
    case "uppercase":
      return canonical.toUpperCase();
    case "no-hyphens":
      return canonical.replaceAll("-", "");
    case "urn":
      return `urn:uuid:${canonical}`;
    case "braces":
      return `{${canonical}}`;
    case "standard":
    default:
      return canonical;
  }
}

export function normalizeUuidCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(MAX_UUID_BATCH_SIZE, Math.max(1, Math.floor(count)));
}

export function generateUuidBatch(count: number, format: UuidFormat, version: UuidVersion = "v4"): string[] {
  const safeCount = normalizeUuidCount(count);
  return Array.from({ length: safeCount }, () => formatUuid(generateUuid(version), format));
}

export function serializeUuids(values: string[], outputStyle: UuidOutputStyle): string {
  switch (outputStyle) {
    case "json":
      return `${JSON.stringify(values, null, 2)}\n`;
    case "csv":
      return `uuid\n${values.map((value) => `"${value.replaceAll('"', '""')}"`).join("\n")}\n`;
    case "lines":
    default:
      return values.length ? `${values.join("\n")}\n` : "";
  }
}

function variantName(nibble: number): { label: string; compatible: boolean } {
  if (nibble <= 0x7) return { label: "NCS compatibility", compatible: false };
  if (nibble <= 0xb) return { label: "RFC 4122 / RFC 9562", compatible: true };
  if (nibble <= 0xd) return { label: "Microsoft compatibility", compatible: false };
  return { label: "Reserved for future use", compatible: false };
}

function versionName(version: number | null): string {
  if (version === 4) return "UUID v4 (random)";
  if (version === 7) return "UUID v7 (Unix time ordered)";
  if (version === null) return "Not available";
  return `UUID v${version}`;
}

export function inspectUuid(input: string): UuidInspection {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      input,
      normalized: null,
      valid: false,
      canonical: false,
      version: null,
      versionLabel: "Not available",
      variant: "Not available",
      variantCompatible: false,
      isNil: false,
      isMax: false,
      timestampMs: null,
      timestampIso: null,
      error: "Enter a UUID to inspect.",
    };
  }

  const normalized = normalizeUuid(trimmed);
  if (!normalized) {
    return {
      input,
      normalized: null,
      valid: false,
      canonical: false,
      version: null,
      versionLabel: "Not available",
      variant: "Not available",
      variantCompatible: false,
      isNil: false,
      isMax: false,
      timestampMs: null,
      timestampIso: null,
      error: "Expected 32 hexadecimal digits, optionally using standard hyphens, braces, or the urn:uuid prefix.",
    };
  }

  const isNil = normalized === NIL_UUID;
  const isMax = normalized === MAX_UUID;
  const version = isNil || isMax ? null : Number.parseInt(normalized[14], 16);
  const variantNibble = Number.parseInt(normalized[19], 16);
  const variant = variantName(variantNibble);
  let timestampMs: number | null = null;
  let timestampIso: string | null = null;

  if (version === 7) {
    timestampMs = Number.parseInt(normalized.slice(0, 8) + normalized.slice(9, 13), 16);
    timestampIso = new Date(timestampMs).toISOString();
  }

  return {
    input,
    normalized,
    valid: true,
    canonical: CANONICAL_UUID_RE.test(trimmed),
    version,
    versionLabel: versionName(version),
    variant: variant.label,
    variantCompatible: variant.compatible,
    isNil,
    isMax,
    timestampMs,
    timestampIso,
    error: null,
  };
}

export function approximateCollisionProbability(count: number, version: UuidVersion): number {
  const safeCount = normalizeUuidCount(count);
  const randomBits = version === "v7" ? 74 : 122;
  return (safeCount * (safeCount - 1)) / (2 * 2 ** randomBits);
}

export function formatProbability(probability: number): string {
  if (!Number.isFinite(probability) || probability <= 0) return "0";
  if (probability >= 0.001) return `${(probability * 100).toFixed(4)}%`;
  return probability.toExponential(2);
}

export function buildUuidChecks(
  config: UuidGenerationConfig,
  values: string[],
  inspection: UuidInspection | null,
): UuidCheck[] {
  const checks: UuidCheck[] = [];
  const uniqueCount = new Set(values.map((value) => normalizeUuid(value) ?? value)).size;

  checks.push(hasSecureRandomSupport()
    ? { id: "secure-random", level: "success", title: "Secure random source available", message: "Generation uses Web Crypto randomness; no Math.random fallback is used." }
    : { id: "secure-random", level: "danger", title: "Secure random source unavailable", message: "Generation is blocked because this browser context does not expose secure cryptographic randomness." });

  checks.push({
    id: "identifier-not-secret",
    level: "info",
    title: "UUIDs are identifiers, not secrets",
    message: "Do not use generated UUIDs as passwords, API keys, reset tokens, or authorization credentials.",
  });

  if (values.length > 0 && uniqueCount !== values.length) {
    checks.push({ id: "duplicates", level: "danger", title: "Duplicate values detected", message: `${values.length - uniqueCount} generated value(s) are duplicated. Regenerate before using the batch.` });
  } else if (values.length > 0) {
    checks.push({ id: "duplicates", level: "success", title: "Batch values are unique", message: `All ${values.length} generated identifiers are distinct inside this batch.` });
  }

  if (config.count > 250) {
    checks.push({ id: "large-batch", level: "warning", title: "Large browser batch", message: "Large one-off batches are fine for fixtures, but application IDs should normally be generated at creation time." });
  }

  if (config.format === "no-hyphens") {
    checks.push({ id: "compact-format", level: "warning", title: "Non-canonical compact format", message: "Some validators and database UUID columns require the standard hyphenated representation." });
  }

  if (config.version === "v7") {
    checks.push({ id: "v7-ordering", level: "info", title: "Time-ordered UUID v7", message: "The timestamp prefix improves index locality. Do not infer authorization, trust, or exact event ordering from the identifier alone." });
  }

  if (inspection) {
    if (!inspection.valid) {
      checks.push({ id: "inspection-invalid", level: "danger", title: "Inspected value is invalid", message: inspection.error ?? "The value is not a valid UUID representation." });
    } else {
      checks.push(inspection.variantCompatible
        ? { id: "variant", level: "success", title: "RFC-compatible variant", message: inspection.variant }
        : { id: "variant", level: "warning", title: "Non-standard UUID variant", message: inspection.variant });

      if (inspection.isNil || inspection.isMax) {
        checks.push({ id: "sentinel", level: "warning", title: "Sentinel UUID value", message: inspection.isNil ? "The nil UUID is often reserved as an empty or missing-value sentinel." : "The max UUID is a reserved all-ones sentinel value." });
      }

      if (inspection.valid && !inspection.canonical) {
        checks.push({ id: "canonical", level: "info", title: "Alternative representation", message: "The value is valid but not lowercase canonical 8-4-4-4-12 form." });
      }
    }
  }

  return checks;
}

function safeIdentifier(value: string, fallback: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_]/g, "_");
  if (!normalized) return fallback;
  return /^[a-zA-Z_]/.test(normalized) ? normalized : `_${normalized}`;
}

export function buildUuidSql(values: string[], tableName = "records", columnName = "id"): string {
  const table = safeIdentifier(tableName, "records");
  const column = safeIdentifier(columnName, "id");
  if (!values.length) return `-- Generate UUIDs to create SQL seed rows.\n`;
  return `INSERT INTO ${table} (${column}) VALUES\n${values.map((value) => `  ('${value.replaceAll("'", "''")}')`).join(",\n")};\n`;
}

export function buildUuidTypeScript(values: string[], constantName = "UUIDS"): string {
  const name = safeIdentifier(constantName.toUpperCase(), "UUIDS");
  return `export const ${name} = ${JSON.stringify(values, null, 2)} as const;\n\nexport type GeneratedUuid = (typeof ${name})[number];\n`;
}

export function buildUuidAuditReport(
  config: UuidGenerationConfig,
  values: string[],
  inspection: UuidInspection | null,
  checks: UuidCheck[],
): UuidAuditReport {
  const uniqueCount = new Set(values.map((value) => normalizeUuid(value) ?? value)).size;
  return {
    generatedAt: new Date().toISOString(),
    config: { ...config, count: normalizeUuidCount(config.count) },
    summary: {
      generatedCount: values.length,
      uniqueCount,
      duplicateCount: values.length - uniqueCount,
      secureRandomAvailable: hasSecureRandomSupport(),
      approximateCollisionProbability: formatProbability(approximateCollisionProbability(values.length, config.version)),
    },
    current: inspection,
    checks,
    values,
  };
}

export const UUID_MAX_BATCH_SIZE = MAX_UUID_BATCH_SIZE;
