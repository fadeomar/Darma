import type { CoreEntity, CoreEntityKind } from "../registry";

const DEFAULT_KINDS: readonly CoreEntityKind[] = ["tool", "game", "project", "workflow", "resource", "learning"];

function eligible(entity: CoreEntity) {
  return entity.status !== "planned" && entity.status !== "deprecated";
}

function byPopularity(a: CoreEntity, b: CoreEntity) {
  if ((a.pinned ?? 0) !== (b.pinned ?? 0)) return (b.pinned ?? 0) - (a.pinned ?? 0);
  if (Boolean(a.featured) !== Boolean(b.featured)) return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  return a.title.localeCompare(b.title);
}

export function selectPopularDiscoveryEntities(
  entities: readonly CoreEntity[],
  limit = 8,
  kinds: readonly CoreEntityKind[] = DEFAULT_KINDS,
) {
  const allowed = new Set(kinds);
  const candidates = entities
    .filter(eligible)
    .filter((entity) => allowed.has(entity.kind))
    .filter((entity) => entity.featured || entity.popular || entity.pinned)
    .sort(byPopularity);

  const kindCounts = new Map<CoreEntityKind, number>();
  const selected: CoreEntity[] = [];
  const softCap = Math.max(2, Math.ceil(limit / 3));
  for (const candidate of candidates) {
    const count = kindCounts.get(candidate.kind) ?? 0;
    if (count >= softCap && candidates.some((item) => item.kind !== candidate.kind && !selected.includes(item))) continue;
    selected.push(candidate);
    kindCounts.set(candidate.kind, count + 1);
    if (selected.length >= limit) break;
  }
  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }
  return selected;
}

export function selectRecentlyImprovedEntities(entities: readonly CoreEntity[], limit = 6) {
  return entities
    .filter(eligible)
    .filter((entity) => Boolean(entity.updatedAt || entity.isNew))
    .sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
    })
    .slice(0, limit);
}
