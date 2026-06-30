"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gamepad2, Layers3, Search, Wrench } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { CoreCategoryChips, CoreEmptyState, CoreEntityCard, CoreSearchInput, CoreSectionHeader, type CoreEntity, type CoreEntityKind } from "@/core";
import { cn } from "@/lib/cn";
import { getUnifiedSearchSummary, searchUnifiedEntities, type UnifiedSearchKind } from "../lib";
import "../styles/unified-search.css";

type UnifiedSearchClientProps = {
  entities: readonly CoreEntity[];
  initialQuery?: string;
};

const KIND_FILTERS: { value: UnifiedSearchKind; label: string; icon: typeof Search }[] = [
  { value: "all", label: "All", icon: Search },
  { value: "tool", label: "Tools", icon: Wrench },
  { value: "game", label: "Games", icon: Gamepad2 },
  { value: "collection", label: "Collections", icon: Layers3 },
];

const KIND_LABELS: Record<CoreEntityKind, string> = {
  tool: "Tools",
  game: "Games",
  collection: "Collections",
  template: "Templates",
  component: "Components",
  resource: "Resources",
  ai: "AI",
  learning: "Learning",
};

function getSuggestedQueries(entities: readonly CoreEntity[]) {
  const terms = ["image", "css", "puzzle", "calculator", "classic", "color", "productivity", "browser"];
  return terms.filter((term) => searchUnifiedEntities({ entities, query: term }).length > 0).slice(0, 6);
}

export function UnifiedSearchClient({ entities, initialQuery = "" }: UnifiedSearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<UnifiedSearchKind>("all");
  const [category, setCategory] = useState("All");

  const summary = useMemo(() => getUnifiedSearchSummary(entities), [entities]);
  const suggestedQueries = useMemo(() => getSuggestedQueries(entities), [entities]);
  const categories = useMemo(() => summary.categories.slice(0, 24), [summary.categories]);

  const results = useMemo(() => searchUnifiedEntities({ entities, query, kind, category }), [category, entities, kind, query]);
  const featuredResults = useMemo(() => results.filter((entity) => entity.featured || entity.popular).slice(0, 6), [results]);
  const topResults = results.slice(0, query.trim() ? 18 : 12);

  const reset = () => {
    setQuery("");
    setKind("all");
    setCategory("All");
  };

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="unified-search-hero rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge variant="accent">Darma Core</Badge>
              <Badge variant="outline">Unified search</Badge>
              <Badge variant="soft">Tools + Games + Collections</Badge>
            </div>
            <h1 className="text-3xl font-black tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Search everything Darma can do.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
              One fast discovery layer across tools, games, and collections — powered by the shared CoreEntity registry.
            </p>

            <div className="mt-6 max-w-2xl">
              <CoreSearchInput value={query} onChange={setQuery} placeholder="Search tools, games, collections…" label="Search Darma" />
            </div>

            {suggestedQueries.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Try</span>
                {suggestedQueries.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="unified-search-stats-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Card className="unified-search-stat-card">
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{summary.total}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">Searchable entities</p>
            </Card>
            <Card className="unified-search-stat-card">
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{summary.live}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">Live pages</p>
            </Card>
            <Card className="unified-search-stat-card">
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{summary.featured}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">Featured picks</p>
            </Card>
            <Card className="unified-search-stat-card">
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{summary.kinds.length}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">Connected kinds</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-4" aria-label="Search filters">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {KIND_FILTERS.map((item) => {
            const Icon = item.icon;
            const active = kind === item.value;
            const count = item.value === "all" ? summary.total : summary.kinds.find((entry) => entry.kind === item.value)?.count ?? 0;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setKind(item.value)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-full)] border px-4 py-2 text-sm font-bold transition focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)] shadow-sm"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] motion-reduce:hover:translate-y-0",
                )}
                aria-pressed={active}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", active ? "bg-white/20" : "bg-[var(--color-control-track)]")}>{count}</span>
              </button>
            );
          })}
        </div>

        <CoreCategoryChips categories={categories} activeCategory={category} onCategoryChange={setCategory} allLabel="All" />
      </section>

      <section className="mt-8" aria-labelledby="search-results-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CoreSectionHeader
            eyebrow="Unified results"
            title={query.trim() ? `Results for “${query.trim()}”` : "Top Darma results"}
            description={`${results.length} matching item${results.length === 1 ? "" : "s"}. Filter by section or category to narrow the result set.`}
          />
          {query || kind !== "all" || category !== "All" ? (
            <button type="button" onClick={reset} className="self-start text-sm font-bold text-[var(--color-primary)] hover:underline focus-visible:shadow-[var(--focus-ring)] sm:self-auto">
              Reset search
            </button>
          ) : null}
        </div>

        {results.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topResults.map((entity) => (
              <CoreEntityCard key={`${entity.kind}-${entity.id}`} entity={entity} eyebrow={KIND_LABELS[entity.kind] ?? entity.kind} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <CoreEmptyState title="No Darma results found" description="Try a different keyword, choose another kind, or reset the category filter." actionLabel="Reset search" onAction={reset} />
          </div>
        )}
      </section>

      {featuredResults.length ? (
        <section className="mt-10" aria-labelledby="search-featured-title">
          <CoreSectionHeader eyebrow="Recommended" title="Featured matches" description="High-confidence results from the shared registry." />
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredResults.map((entity) => (
              <CoreEntityCard key={`featured-${entity.kind}-${entity.id}`} entity={entity} compact eyebrow={KIND_LABELS[entity.kind] ?? entity.kind} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Core migration</p>
            <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Unified search is now the bridge across Darma.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              This page proves Tools, Games, and Collections can share one searchable entity layer before deeper migration work.
            </p>
          </div>
          <Link href="/collections" className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 py-2 text-sm font-bold text-[var(--color-text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            View collections <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
