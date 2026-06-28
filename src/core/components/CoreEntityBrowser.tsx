"use client";

import { useMemo, useState } from "react";
import { filterCoreEntities, rankCoreEntities } from "../search";
import type { CoreEntity } from "../registry";
import { CoreCategoryChips } from "./CoreCategoryChips";
import { CoreEmptyState } from "./CoreEmptyState";
import { CoreEntityCard } from "./CoreEntityCard";
import { CoreSearchInput } from "./CoreSearchInput";

type CoreEntityBrowserProps<TEntity extends CoreEntity = CoreEntity> = {
  entities: readonly TEntity[];
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  allLabel?: string;
};

export function CoreEntityBrowser<TEntity extends CoreEntity = CoreEntity>({
  entities,
  title = "Browse",
  description = "Search and filter items using the shared Darma Core UI pattern.",
  searchPlaceholder = "Search Darma…",
  allLabel = "All",
}: CoreEntityBrowserProps<TEntity>) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allLabel);

  const categories = useMemo(() => {
    return [...new Set(entities.flatMap((entity) => entity.categories ?? []))].sort((a, b) => a.localeCompare(b));
  }, [entities]);

  const filtered = useMemo(() => {
    const next = filterCoreEntities(entities, {
      query,
      categories: category === allLabel ? [] : [category],
    });

    return rankCoreEntities(next, query);
  }, [allLabel, category, entities, query]);

  const reset = () => {
    setQuery("");
    setCategory(allLabel);
  };

  return (
    <section className="space-y-5" aria-labelledby="core-entity-browser-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Darma Core</p>
          <h2 id="core-entity-browser-title" className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
        </div>
        <CoreSearchInput value={query} onChange={setQuery} placeholder={searchPlaceholder} className="w-full lg:max-w-sm" />
      </div>

      <CoreCategoryChips categories={categories} activeCategory={category} onCategoryChange={setCategory} allLabel={allLabel} />

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entity) => (
            <CoreEntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      ) : (
        <CoreEmptyState actionLabel="Reset filters" onAction={reset} />
      )}
    </section>
  );
}
