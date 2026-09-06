import type { CoreEntity, ResolveCoreRelationsOptions } from "@/core";
import { resolveCoreRelations } from "@/core";
import { getUnifiedSearchEntities } from "@/features/search/lib/unifiedSearchRegistry";

/*
 * Server-only: the unified registry reads the Explorer catalog from disk, so
 * this module must never enter a client bundle. Tool and project pages resolve
 * recommendations on every render, so the entity list is built once per server
 * process instead of once per page.
 */
let cachedEntities: CoreEntity[] | null = null;

function getEntities() {
  cachedEntities ??= getUnifiedSearchEntities();
  return cachedEntities;
}

export function getDiscoveryRecommendations(source: CoreEntity, options: ResolveCoreRelationsOptions = {}) {
  return resolveCoreRelations(source, getEntities(), options);
}
