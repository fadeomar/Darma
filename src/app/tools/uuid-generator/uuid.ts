import type { UuidFormat, UuidOutputStyle } from "./types";

const MAX_UUID_BATCH_SIZE = 100;

export function hasSecureUuidSupport(): boolean {
  return typeof globalThis.crypto?.randomUUID === "function";
}

export function generateUuid(): string {
  if (!hasSecureUuidSupport()) {
    throw new Error(
      "Your browser does not expose crypto.randomUUID(). Please use a modern secure browser to generate UUIDs.",
    );
  }

  return globalThis.crypto.randomUUID();
}

export function formatUuid(uuid: string, format: UuidFormat): string {
  const normalized = uuid.toLowerCase();

  switch (format) {
    case "uppercase":
      return normalized.toUpperCase();
    case "no-hyphens":
      return normalized.replaceAll("-", "");
    case "urn":
      return `urn:uuid:${normalized}`;
    case "standard":
    default:
      return normalized;
  }
}

export function normalizeUuidCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(MAX_UUID_BATCH_SIZE, Math.max(1, Math.floor(count)));
}

export function generateUuidBatch(count: number, format: UuidFormat): string[] {
  const safeCount = normalizeUuidCount(count);
  return Array.from({ length: safeCount }, () => formatUuid(generateUuid(), format));
}

export function serializeUuids(values: string[], outputStyle: UuidOutputStyle): string {
  switch (outputStyle) {
    case "json":
      return JSON.stringify(values, null, 2);
    case "csv":
      return values.map((value) => `"${value.replaceAll('"', '""')}"`).join("\n");
    case "lines":
    default:
      return values.join("\n");
  }
}

export const UUID_MAX_BATCH_SIZE = MAX_UUID_BATCH_SIZE;
