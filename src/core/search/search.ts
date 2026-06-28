import type { CoreEntity } from "../registry";

export type CoreSearchOptions = {
  query?: string;
  categories?: readonly string[];
  tags?: readonly string[];
  kind?: CoreEntity["kind"];
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
};

const normalise = (value: string) => value.trim().toLowerCase();

const getSearchHaystack = (item: CoreEntity) =>
  [item.title, item.description, item.slug, ...(item.categories ?? []), ...(item.tags ?? []), ...(item.keywords ?? [])]
    .join(" ")
    .toLowerCase();

export const filterCoreEntities = <TEntity extends CoreEntity>(
  items: readonly TEntity[],
  options: CoreSearchOptions,
): TEntity[] => {
  const query = normalise(options.query ?? "");
  const categories = new Set((options.categories ?? []).map(normalise));
  const tags = new Set((options.tags ?? []).map(normalise));

  return items.filter((item) => {
    if (options.kind && item.kind !== options.kind) return false;
    if (typeof options.featured === "boolean" && Boolean(item.featured) !== options.featured) return false;
    if (typeof options.popular === "boolean" && Boolean(item.popular) !== options.popular) return false;
    if (typeof options.isNew === "boolean" && Boolean(item.isNew) !== options.isNew) return false;

    if (categories.size > 0) {
      const itemCategories = new Set((item.categories ?? []).map(normalise));
      if (![...categories].some((category) => itemCategories.has(category))) return false;
    }

    if (tags.size > 0) {
      const itemTags = new Set((item.tags ?? []).map(normalise));
      if (![...tags].some((tag) => itemTags.has(tag))) return false;
    }

    return query.length === 0 || getSearchHaystack(item).includes(query);
  });
};

export const rankCoreEntities = <TEntity extends CoreEntity>(items: readonly TEntity[], query?: string): TEntity[] => {
  const q = normalise(query ?? "");

  return [...items].sort((a, b) => {
    const pinnedA = a.pinned ?? Number.MAX_SAFE_INTEGER;
    const pinnedB = b.pinned ?? Number.MAX_SAFE_INTEGER;
    if (pinnedA !== pinnedB) return pinnedA - pinnedB;

    if (q) {
      const aTitle = normalise(a.title).includes(q) ? 0 : 1;
      const bTitle = normalise(b.title).includes(q) ? 0 : 1;
      if (aTitle !== bTitle) return aTitle - bTitle;
    }

    const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featuredDelta !== 0) return featuredDelta;

    return a.title.localeCompare(b.title);
  });
};
