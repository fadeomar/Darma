import { Badge, Card } from "@/components/ui";
import type { CollectionDefinition, CollectionItemBase } from "../domain/collection";
import { getCollectionHealth } from "../lib/collectionAdapters";

export function CollectionHealthPanel({
  collection,
  items,
}: {
  collection: CollectionDefinition;
  items: CollectionItemBase[];
}) {
  const health = getCollectionHealth(items);
  const stats = [
    { label: "Items", value: health.total },
    { label: "Featured", value: health.featured },
    { label: "Popular", value: health.popular },
    { label: "New", value: health.newest },
    { label: "Categories", value: health.categories },
    { label: "Tags", value: health.tags },
  ];

  return (
    <Card as="section" className="mt-6" aria-labelledby="collection-health-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Collection readiness</p>
          <h2 id="collection-health-title" className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {collection.title} content health
          </h2>
        </div>
        <Badge variant={health.hasEnoughFeatured && health.hasEnoughCategories ? "success" : "warning"}>
          {health.hasEnoughFeatured && health.hasEnoughCategories ? "Healthy" : "Needs more curation"}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
