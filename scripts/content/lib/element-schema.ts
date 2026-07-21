/**
 * Canonical column definition for the Explorer `Element` table.
 *
 * The order below is the physical column order in PostgreSQL
 * (information_schema.columns.ordinal_position), which is also the key order
 * emitted by `row_to_json` on the server. Keeping this order stable makes the
 * generated per-item JSON deterministic across runs.
 *
 * NOTE: ordinal position 15 is intentionally absent in the live database (a
 * historically dropped column); `slug` occupies ordinal position 16. We do NOT
 * try to reproduce the ordinal gap — we only reproduce the live column set.
 */
export const COLUMN_ORDER = [
  "id",
  "title",
  "description",
  "shortDescription",
  "html",
  "css",
  "js",
  "tags",
  "mainCategory",
  "secondaryCategory",
  "deleted",
  "createdAt",
  "updatedAt",
  "reviewed",
  "slug",
] as const;

export type ColumnName = (typeof COLUMN_ORDER)[number];

/**
 * Map from live DB column -> Prisma model field. For the Element model these
 * are identical, but we keep the map explicit so a future rename is visible.
 */
export const PRISMA_FIELD_MAP: Record<string, string | null> = {
  id: "id",
  title: "title",
  description: "description",
  shortDescription: "shortDescription",
  html: "html",
  css: "css",
  js: "js",
  tags: "tags",
  mainCategory: "mainCategory",
  secondaryCategory: "secondaryCategory",
  deleted: "deleted",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  reviewed: "reviewed",
  slug: "slug",
};

/** The single new field this migration is permitted to add. */
export const SCHEMA_VERSION = 1;

/** Fully-qualified source table. */
export const SOURCE_TABLE = 'public."Element"';

export type ElementRecord = Record<string, unknown>;

/** Reorder a raw record into a fresh object with a deterministic key order. */
export function orderRecord(record: ElementRecord): ElementRecord {
  const out: ElementRecord = {};
  for (const key of COLUMN_ORDER) {
    // Preserve the exact value, including `null` and `undefined`-as-missing.
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      out[key] = record[key];
    }
  }
  // Surface any unexpected extra columns so validation can flag them, rather
  // than silently dropping data.
  for (const key of Object.keys(record)) {
    if (!(COLUMN_ORDER as readonly string[]).includes(key)) {
      out[key] = record[key];
    }
  }
  return out;
}

/** Reject ids that would be unsafe as a filesystem path segment. */
export function isFilesafeId(id: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(id) && id !== "." && id !== "..";
}
