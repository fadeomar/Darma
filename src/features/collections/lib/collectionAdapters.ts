import type { CollectionItemBase } from "../domain/collection";

type GameLike = {
  id: string;
  slug: string;
  title: string;
  description: string;
  href: string;
  categories?: string[];
  tags?: string[];
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
};

export function toCollectionItems<T extends GameLike>(items: T[]): CollectionItemBase[] {
  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    href: item.href,
    categories: item.categories,
    tags: item.tags,
    featured: item.featured,
    popular: item.popular,
    isNew: item.isNew,
  }));
}

export function getCollectionHealth(items: CollectionItemBase[]) {
  const featured = items.filter((item) => item.featured).length;
  const popular = items.filter((item) => item.popular).length;
  const newest = items.filter((item) => item.isNew).length;
  const categories = new Set(items.flatMap((item) => item.categories ?? [])).size;
  const tags = new Set(items.flatMap((item) => item.tags ?? [])).size;

  return {
    total: items.length,
    featured,
    popular,
    newest,
    categories,
    tags,
    hasEnoughFeatured: featured >= 3,
    hasEnoughCategories: categories >= 4,
  };
}
