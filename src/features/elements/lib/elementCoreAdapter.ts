import type { CoreEntity } from "@/core/registry";

export type ElementCoreSource = {
  id: string;
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  tags?: string[];
  mainCategory?: string[];
  secondaryCategory?: string[];
  deleted?: boolean;
  reviewed?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  slug?: string | null;
  html?: string;
  css?: string;
  js?: string | null;
};

const toIsoDate = (value?: string | Date) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
};

/**
 * Maps an Explorer project onto the shared discovery entity shape.
 *
 * The project source payload (`html` / `css` / `js`) is intentionally dropped:
 * these entities are serialized to the client for search, so only lightweight
 * metadata may cross that boundary.
 */
export function toElementCoreEntity(element: ElementCoreSource): CoreEntity {
  const slug = element.slug?.trim() || element.id;
  // Same canonical rule as `getElementCanonicalPath`: slug route when a slug
  // exists, id route otherwise.
  const href = element.slug?.trim() ? `/elements/${element.slug.trim()}` : `/element/${element.id}`;
  const categories = element.mainCategory ?? [];
  const secondaryCategories = element.secondaryCategory ?? [];
  const tags = [...new Set([...(element.tags ?? []), ...secondaryCategories])];
  const description = element.shortDescription?.trim() || element.description?.trim() || `Explore the ${element.title} front-end project.`;

  return {
    id: `project:${element.id}`,
    slug,
    kind: "project",
    title: element.title,
    description,
    href,
    status: "live",
    categories,
    tags,
    keywords: [...categories, ...secondaryCategories, ...tags, "explore", "project"],
    createdAt: toIsoDate(element.createdAt),
    updatedAt: toIsoDate(element.updatedAt),
    primaryAction: { label: "Open project", href },
    metadata: {
      sourceId: element.id,
      reviewed: element.reviewed ?? false,
      hasHtml: Boolean(element.html?.trim()),
      hasCss: Boolean(element.css?.trim()),
      hasJs: Boolean(element.js?.trim()),
    },
  };
}

export function toElementCoreEntities(elements: readonly ElementCoreSource[]): CoreEntity[] {
  return elements.filter((element) => !element.deleted).map(toElementCoreEntity);
}
