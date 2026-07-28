import { createHash } from "node:crypto";

import type { Element } from "../../domain/element";
import {
  toElementDomainFromJson,
  type ElementJsonRecord,
} from "./elementJson.mapper";

export const EXPLORER_SCHEMA_VERSION = 1;
export const EXPLORER_MANIFEST_PATH = "content/explorer/manifest.json";
export const EXPLORER_CATALOG_PATH = "content/explorer/catalog.json";
export const EXPLORER_ITEMS_ROOT = "content/explorer/items";

export type ExplorerManifestItem = {
  id: string;
  slug: string | null;
  filename: string;
  reviewed: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  title: string;
  checksum: string;
};

export type ExplorerManifest = {
  schemaVersion: number;
  exportedAt?: string;
  contentUpdatedAt?: string;
  source?: string;
  table?: string;
  total: number;
  counts: {
    publicApproved: number;
    pending: number;
    deleted: number;
    reviewedAndDeleted: number;
  };
  items: ExplorerManifestItem[];
  [key: string]: unknown;
};

export type ExplorerCatalog = {
  schemaVersion: number;
  total: number;
  items: ElementJsonRecord[];
};

const RECORD_KEYS = [
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

function canonicalScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalScalar).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalScalar(record[key])}`)
    .join(",")}}`;
}

function recordChecksum(record: ElementJsonRecord): string {
  const payload = `{${RECORD_KEYS.map(
    (key) => `${JSON.stringify(key)}:${canonicalScalar(record[key])}`,
  ).join(",")}}`;
  return `sha256:${createHash("sha256").update(payload).digest("hex")}`;
}

function parseJsonObject(source: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${label}: ${message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

function formatExplorerDate(value: Date): string {
  return value.toISOString().replace(/Z$/, "");
}

export function elementToJsonRecord(element: Element): ElementJsonRecord {
  return {
    schemaVersion: EXPLORER_SCHEMA_VERSION,
    id: element.id,
    title: element.title,
    description: element.description,
    shortDescription: element.shortDescription,
    html: element.html,
    css: element.css,
    js: element.js,
    tags: [...element.tags],
    mainCategory: [...element.mainCategory],
    secondaryCategory: [...element.secondaryCategory],
    deleted: element.deleted,
    createdAt: formatExplorerDate(element.createdAt),
    updatedAt: formatExplorerDate(element.updatedAt),
    reviewed: element.reviewed,
    slug: element.slug ?? null,
  };
}

export function serializeElementRecord(element: Element): string {
  return `${JSON.stringify(elementToJsonRecord(element), null, 2)}\n`;
}

export function parseExplorerManifest(source: string): ExplorerManifest {
  const manifest = parseJsonObject(source, "Explorer manifest");
  if (!Number.isInteger(manifest.total) || (manifest.total as number) < 0) {
    throw new Error("Explorer manifest has an invalid total");
  }
  if (!Array.isArray(manifest.items)) {
    throw new Error("Explorer manifest has an invalid items list");
  }
  if (!manifest.counts || typeof manifest.counts !== "object") {
    throw new Error("Explorer manifest has invalid counts");
  }
  return manifest as ExplorerManifest;
}

export function parseExplorerCatalog(source: string): Element[] {
  const catalog = parseJsonObject(source, "Explorer catalog");
  if (!Number.isInteger(catalog.total) || (catalog.total as number) < 0) {
    throw new Error("Explorer catalog has an invalid total");
  }
  if (!Array.isArray(catalog.items)) {
    throw new Error("Explorer catalog has an invalid items list");
  }
  if (catalog.items.length !== catalog.total) {
    throw new Error(
      `Explorer catalog total mismatch: expected ${catalog.total}, loaded ${catalog.items.length}`,
    );
  }
  return catalog.items.map((record, index) =>
    toElementDomainFromJson(record, `catalog.json#items[${index}]`),
  );
}

function classify(elements: readonly Element[]) {
  let publicApproved = 0;
  let pending = 0;
  let deleted = 0;
  let reviewedAndDeleted = 0;

  for (const element of elements) {
    if (element.deleted) deleted += 1;
    if (element.reviewed && !element.deleted) publicApproved += 1;
    if (!element.reviewed && !element.deleted) pending += 1;
    if (element.reviewed && element.deleted) reviewedAndDeleted += 1;
  }

  return { publicApproved, pending, deleted, reviewedAndDeleted };
}

export function buildExplorerManifest(
  previous: ExplorerManifest,
  elements: readonly Element[],
  contentUpdatedAt: Date,
  changedIds?: ReadonlySet<string>,
): ExplorerManifest {
  const counts = classify(elements);
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const items = elements.map((element) => {
    const existing = previousById.get(element.id);
    if (existing && changedIds && !changedIds.has(element.id)) return existing;

    const record = elementToJsonRecord(element);
    return {
      id: element.id,
      slug: element.slug ?? null,
      filename: `items/${element.id}.json`,
      reviewed: element.reviewed,
      deleted: element.deleted,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      title: element.title,
      checksum: recordChecksum(record),
    } satisfies ExplorerManifestItem;
  });

  return {
    ...previous,
    schemaVersion: EXPLORER_SCHEMA_VERSION,
    contentUpdatedAt: contentUpdatedAt.toISOString(),
    total: elements.length,
    counts,
    items,
  };
}

export function serializeExplorerManifest(manifest: ExplorerManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function serializeExplorerCatalog(elements: readonly Element[]): string {
  const catalog: ExplorerCatalog = {
    schemaVersion: EXPLORER_SCHEMA_VERSION,
    total: elements.length,
    items: elements.map(elementToJsonRecord),
  };
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

export function assertManifestCatalogParity(
  manifest: ExplorerManifest,
  elements: readonly Element[],
): void {
  if (manifest.total !== elements.length) {
    throw new Error(
      `Explorer manifest/catalog mismatch: manifest=${manifest.total}, catalog=${elements.length}`,
    );
  }

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    const item = manifest.items[index];
    if (!item || item.id !== element.id) {
      throw new Error(
        `Explorer manifest/catalog order mismatch at index ${index}: manifest=${item?.id ?? "missing"}, catalog=${element.id}`,
      );
    }
  }
}
