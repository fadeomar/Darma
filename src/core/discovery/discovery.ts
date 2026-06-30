import type { CoreEntity } from "../registry";

export type CoreDiscoverySection<TEntity extends CoreEntity = CoreEntity> = {
  id: string;
  title: string;
  description?: string;
  items: TEntity[];
};

export const buildCoreDiscoverySections = <TEntity extends CoreEntity>(items: readonly TEntity[]) => {
  const featured = items.filter((item) => item.featured).slice(0, 8);
  const popular = items.filter((item) => item.popular).slice(0, 8);
  const newest = [...items]
    .filter((item) => item.isNew || item.createdAt)
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, 8);

  return [
    {
      id: "featured",
      title: "Featured",
      description: "Curated picks that deserve attention.",
      items: featured,
    },
    {
      id: "popular",
      title: "Popular",
      description: "Frequently used, played, or opened items.",
      items: popular,
    },
    {
      id: "newest",
      title: "Recently added",
      description: "Fresh additions across Darma.",
      items: newest,
    },
  ].filter((section) => section.items.length > 0) satisfies CoreDiscoverySection<TEntity>[];
};

export const pickDeterministicCoreEntity = <TEntity extends CoreEntity>(items: readonly TEntity[], seed = new Date().toISOString().slice(0, 10)) => {
  if (items.length === 0) return undefined;

  const score = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return items[score % items.length];
};
