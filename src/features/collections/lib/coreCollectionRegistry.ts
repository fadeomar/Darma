import { createCoreRegistryIndex, type CoreEntity, type CoreRegistry } from "@/core";
import type { CollectionDefinition } from "../domain/collection";
import { COLLECTIONS } from "../registry/collectionRegistry";

/**
 * A CoreEntity always carries a required `href`, so every entity produced here is
 * treated as navigable by rails, browsers, and unified search.
 *
 * Planned collections point at routes that do not exist yet, so they are excluded
 * at the mapping boundary rather than filtered by each consumer. This keeps a new
 * planned collection from silently becoming a dead link the moment it is added.
 */
export const isNavigableCollection = (collection: CollectionDefinition) => collection.status === "live";

export const navigableCollections = COLLECTIONS.filter(isNavigableCollection);

export const collectionCoreRegistry: CoreRegistry<CoreEntity> = {
  id: "collections",
  title: "Darma Collections",
  description: "Shared registry entries for Darma top-level collections.",
  items: navigableCollections.map((collection) => ({
    id: collection.id,
    slug: collection.id,
    kind: "collection",
    title: collection.title,
    description: collection.description,
    href: collection.href,
    status: collection.status,
    categories: [collection.tone, collection.status],
    tags: collection.badges,
    featured: collection.status === "live",
    popular: collection.id === "tools" || collection.id === "games",
    isNew: collection.id === "games",
    accent: collection.accent,
    primaryAction: collection.primaryAction,
    metrics: collection.metrics,
    metadata: {
      navLabel: collection.navLabel,
      eyebrow: collection.eyebrow,
      searchPlaceholder: collection.searchPlaceholder,
      sections: collection.sections,
    },
  })),
};

export const collectionCoreIndex = createCoreRegistryIndex([collectionCoreRegistry]);

export const getCollectionCoreEntities = () => collectionCoreIndex.items;
