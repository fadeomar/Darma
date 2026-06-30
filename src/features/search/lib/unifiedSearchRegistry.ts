import { createCoreRegistryIndex, filterCoreEntities, rankCoreEntities, type CoreEntity, type CoreEntityKind, type CoreRegistry } from "@/core";
import { getCollectionCoreEntities } from "@/features/collections";
import { getGames } from "@/features/games";
import { toGameCoreEntities } from "@/features/games/lib/gameCoreAdapter";
import { getToolRegistry } from "@/features/tools";
import { toToolCoreEntities } from "@/features/tools/lib/toolCoreAdapter";

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

const KIND_ORDER: CoreEntityKind[] = ["tool", "game", "collection", "template", "component", "resource", "ai", "learning"];

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];

export function getUnifiedSearchEntities(): CoreEntity[] {
  const toolEntities = toToolCoreEntities(getToolRegistry().list().filter((tool) => tool.visibility === "public"));
  const gameEntities = toGameCoreEntities(getGames().filter((game) => (game.visibility ?? "public") === "public"));
  const collectionEntities = getCollectionCoreEntities();

  return [...toolEntities, ...gameEntities, ...collectionEntities];
}

export function createUnifiedSearchRegistry(): CoreRegistry<CoreEntity> {
  return {
    id: "unified-search",
    title: "Darma Unified Search",
    description: "Search-ready CoreEntity registry combining Tools, Games, and Collections.",
    items: getUnifiedSearchEntities(),
  };
}

export function createUnifiedSearchIndex() {
  return createCoreRegistryIndex([createUnifiedSearchRegistry()]);
}

export function getUnifiedSearchSummary(entities: readonly CoreEntity[] = getUnifiedSearchEntities()): UnifiedSearchSummary {
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
  entities = getUnifiedSearchEntities(),
  query,
  kind = "all",
  category,
}: {
  entities?: readonly CoreEntity[];
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
