import type { CoreEntity, CoreEntityKind } from "@/core/registry";
import { filterCoreEntities, rankCoreEntities } from "@/core/search";

export type UnifiedSearchKind = CoreEntityKind | "all";

export type UnifiedSearchSummary = {
  total: number;
  live: number;
  kinds: { kind: CoreEntityKind; count: number }[];
  featured: number;
  popular: number;
  newItems: number;
  categories: string[];
};

const KIND_ORDER: CoreEntityKind[] = ["tool", "game", "project", "workflow", "collection", "template", "component", "resource", "ai", "learning"];

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];

export function getUnifiedSearchSummary(entities: readonly CoreEntity[]): UnifiedSearchSummary {
  const kinds = KIND_ORDER.map((kind) => ({ kind, count: entities.filter((entity) => entity.kind === kind).length })).filter((item) => item.count > 0);
  const categories = unique(entities.flatMap((entity) => entity.categories ?? [])).sort((a, b) => a.localeCompare(b));

  return {
    total: entities.length,
    live: entities.filter((entity) => entity.status === "live").length,
    kinds,
    featured: entities.filter((entity) => entity.featured).length,
    popular: entities.filter((entity) => entity.popular).length,
    newItems: entities.filter((entity) => entity.isNew).length,
    categories,
  };
}

export function searchUnifiedEntities({
  entities,
  query,
  kind = "all",
  category,
}: {
  entities: readonly CoreEntity[];
  query?: string;
  kind?: UnifiedSearchKind;
  category?: string;
}) {
  const filtered = filterCoreEntities(entities, {
    query,
    kind: kind === "all" ? undefined : kind,
    categories: category && category !== "All" ? [category] : [],
  });

  return rankCoreEntities(filtered, query);
}
