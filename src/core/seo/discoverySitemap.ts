import type { MetadataRoute } from "next";
import type { CoreEntity, CoreEntityKind } from "../registry";

export function coreDiscoverySitemapEntries(
  entities: readonly CoreEntity[],
  kinds: readonly CoreEntityKind[],
  fallbackDate: Date,
): MetadataRoute.Sitemap {
  const allowed = new Set(kinds);
  return entities
    .filter((entity) => allowed.has(entity.kind))
    .filter((entity) => entity.status !== "planned" && entity.status !== "deprecated")
    .map((entity) => ({
      url: entity.href,
      lastModified: entity.updatedAt ?? entity.createdAt ?? fallbackDate,
      changeFrequency: "monthly" as const,
      priority: entity.kind === "workflow" ? 0.78 : 0.68,
    }));
}
