import type { Element } from "../../domain/element";

export type ElementJsonRecord = {
  schemaVersion: unknown;
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  shortDescription: string | null;
  html: string;
  css: string;
  js: string | null;
  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];
  reviewed: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

function assertRecord(value: unknown, filename: string): ElementJsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Explorer record "${filename}" must be a JSON object`);
  }

  const record = value as Record<string, unknown>;

  const requireString = (field: string): string => {
    const fieldValue = record[field];
    if (typeof fieldValue !== "string") {
      throw new Error(
        `Explorer record "${filename}" has invalid string field "${field}"`,
      );
    }
    return fieldValue;
  };

  const requireNullableString = (field: string): string | null => {
    const fieldValue = record[field];
    if (fieldValue !== null && typeof fieldValue !== "string") {
      throw new Error(
        `Explorer record "${filename}" has invalid nullable string field "${field}"`,
      );
    }
    return fieldValue as string | null;
  };

  const requireStringArray = (field: string): string[] => {
    const fieldValue = record[field];
    if (
      !Array.isArray(fieldValue) ||
      fieldValue.some((item) => typeof item !== "string")
    ) {
      throw new Error(
        `Explorer record "${filename}" has invalid string-array field "${field}"`,
      );
    }
    return fieldValue;
  };

  const requireBoolean = (field: string): boolean => {
    const fieldValue = record[field];
    if (typeof fieldValue !== "boolean") {
      throw new Error(
        `Explorer record "${filename}" has invalid boolean field "${field}"`,
      );
    }
    return fieldValue;
  };

  return {
    schemaVersion: record.schemaVersion,
    id: requireString("id"),
    slug: requireNullableString("slug"),
    title: requireString("title"),
    description: requireNullableString("description"),
    shortDescription: requireNullableString("shortDescription"),
    html: requireString("html"),
    css: requireString("css"),
    js: requireNullableString("js"),
    tags: requireStringArray("tags"),
    mainCategory: requireStringArray("mainCategory"),
    secondaryCategory: requireStringArray("secondaryCategory"),
    reviewed: requireBoolean("reviewed"),
    deleted: requireBoolean("deleted"),
    createdAt: requireString("createdAt"),
    updatedAt: requireString("updatedAt"),
  };
}

function parseDate(value: string, field: string, filename: string): Date {
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  const parsed = new Date(hasTimezone ? value : `${value}Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `Explorer record "${filename}" has invalid date field "${field}"`,
    );
  }

  return parsed;
}

export function toElementDomainFromJson(
  value: unknown,
  filename: string,
): Element {
  const record = assertRecord(value, filename);
  const { schemaVersion: _schemaVersion, ...elementRecord } = record;

  return {
    id: elementRecord.id,
    slug: elementRecord.slug,
    title: elementRecord.title,
    description: elementRecord.description,
    shortDescription: elementRecord.shortDescription,
    html: elementRecord.html,
    css: elementRecord.css,
    js: elementRecord.js,
    tags: elementRecord.tags,
    mainCategory: elementRecord.mainCategory,
    secondaryCategory: elementRecord.secondaryCategory,
    reviewed: elementRecord.reviewed,
    deleted: elementRecord.deleted,
    createdAt: parseDate(elementRecord.createdAt, "createdAt", filename),
    updatedAt: parseDate(elementRecord.updatedAt, "updatedAt", filename),
  };
}
