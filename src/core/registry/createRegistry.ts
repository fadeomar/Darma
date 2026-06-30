import type { CoreEntity, CoreEntityKind, CoreRegistry, CoreRegistryIndex } from "./types";

const byPinnedThenTitle = (a: CoreEntity, b: CoreEntity) => {
  const pinnedA = a.pinned ?? Number.MAX_SAFE_INTEGER;
  const pinnedB = b.pinned ?? Number.MAX_SAFE_INTEGER;

  if (pinnedA !== pinnedB) {
    return pinnedA - pinnedB;
  }

  return a.title.localeCompare(b.title);
};

export const createCoreRegistryIndex = <TEntity extends CoreEntity>(
  registries: readonly CoreRegistry<TEntity>[],
): CoreRegistryIndex<TEntity> => {
  const items = registries.flatMap((registry) => registry.items).slice().sort(byPinnedThenTitle) as TEntity[];
  const byId = new Map<string, TEntity>();
  const bySlug = new Map<string, TEntity>();
  const byKind = new Map<CoreEntityKind, TEntity[]>();

  for (const item of items) {
    byId.set(item.id, item);
    bySlug.set(item.slug, item);
    byKind.set(item.kind, [...(byKind.get(item.kind) ?? []), item]);
  }

  return {
    registries,
    items,
    byId,
    bySlug,
    byKind,
  };
};

export const getRegistryItemsByKind = <TEntity extends CoreEntity>(
  index: CoreRegistryIndex<TEntity>,
  kind: CoreEntityKind,
): TEntity[] => index.byKind.get(kind) ?? [];

export const getRegistryItemBySlug = <TEntity extends CoreEntity>(
  index: CoreRegistryIndex<TEntity>,
  slug: string,
): TEntity | undefined => index.bySlug.get(slug);
