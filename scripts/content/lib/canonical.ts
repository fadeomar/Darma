import { createHash } from "node:crypto";
import { COLUMN_ORDER, SCHEMA_VERSION, type ElementRecord } from "./element-schema";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Hash a single value in a type-faithful way.
 *
 * A leading tag byte guarantees that distinct JSON shapes can never collide:
 *   - `null`            -> tag "N"
 *   - string            -> tag "S" + the raw UTF-8 bytes
 *   - everything else   -> tag "J" + canonical JSON
 *
 * This is what makes `null` hash differently from `""` (empty string), as the
 * migration spec requires.
 */
export function valueHash(value: unknown): string {
  let payload: Buffer;
  if (value === null || value === undefined) {
    payload = Buffer.from("N");
  } else if (typeof value === "string") {
    payload = Buffer.concat([Buffer.from("S"), Buffer.from(value, "utf8")]);
  } else {
    payload = Buffer.concat([Buffer.from("J"), Buffer.from(canonicalScalar(value), "utf8")]);
  }
  return "sha256:" + sha256Hex(payload);
}

/** Deterministic, whitespace-free encoding of a single (possibly array) value. */
function canonicalScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalScalar).join(",") + "]";
  // Fallback for unexpected nested objects: sort keys for stability.
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalScalar(obj[k])).join(",") + "}";
}

/**
 * Canonical, pretty-print-independent encoding of a full record. `schemaVersion`
 * is excluded so the hash reflects only original database columns. Column order
 * is fixed (COLUMN_ORDER) then any unexpected keys, sorted, so it is stable.
 */
export function canonicalRecordString(record: ElementRecord): string {
  const keys = orderedKeys(record);
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalScalar(record[k])).join(",") + "}";
}

export function recordHash(record: ElementRecord): string {
  return "sha256:" + sha256Hex(Buffer.from(canonicalRecordString(record), "utf8"));
}

function orderedKeys(record: ElementRecord): string[] {
  const keys: string[] = [];
  for (const k of COLUMN_ORDER) {
    if (k === ("schemaVersion" as unknown)) continue;
    if (Object.prototype.hasOwnProperty.call(record, k)) keys.push(k);
  }
  const extras = Object.keys(record)
    .filter((k) => k !== "schemaVersion" && !(COLUMN_ORDER as readonly string[]).includes(k))
    .sort();
  return [...keys, ...extras];
}

/**
 * Serialize a per-item file exactly as it must be written to disk:
 *   - `schemaVersion` first, then all DB columns in COLUMN_ORDER
 *   - 2-space indentation, UTF-8, trailing newline
 * The result round-trips: JSON.parse(serialize(x)) deep-equals x's data.
 */
export function serializeItemFile(record: ElementRecord): string {
  const ordered: ElementRecord = { schemaVersion: SCHEMA_VERSION };
  for (const k of COLUMN_ORDER) {
    if (Object.prototype.hasOwnProperty.call(record, k)) ordered[k] = record[k];
  }
  for (const k of Object.keys(record)) {
    if (k !== "schemaVersion" && !(COLUMN_ORDER as readonly string[]).includes(k)) {
      ordered[k] = record[k];
    }
  }
  return JSON.stringify(ordered, null, 2) + "\n";
}

/** Strict deep equality that distinguishes null, "", [], false and missing. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao);
    const bk = Object.keys(bo);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!Object.prototype.hasOwnProperty.call(bo, k)) return false;
      if (!deepEqual(ao[k], bo[k])) return false;
    }
    return true;
  }
  return false;
}
