import { createCoreRegistryIndex, type CoreEntity, type CoreRegistry } from "@/core";
import { COLLECTIONS } from "../registry/collectionRegistry";

export const collectionCoreRegistry: CoreRegistry<CoreEntity> = {
  id: "collections",
  title: "Darma Collections",
  description: "Shared registry entries for Darma top-level collections.",
  items: COLLECTIONS.map((collection) => ({
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
