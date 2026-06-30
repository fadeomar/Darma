"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LinkIcon, Search, Sparkles } from "lucide-react";
import { Badge, Card, Input } from "@/components/ui";
import resources from "./resources.json";
import { FEATURED_REFERENCES, REFERENCE_TASKS } from "./referenceMeta";

type ResourceItem = {
  name: string;
  url: string;
  about?: string;
  description?: string;
};

type ResourceCategory = {
  category: string;
  items: ResourceItem[];
};

const categories = resources as ResourceCategory[];
const TOTAL_RESOURCES = categories.reduce((sum, c) => sum + c.items.length, 0);
const MAX_SEARCH_RESULTS = 60;

const itemBlurb = (item: ResourceItem) => item.description ?? item.about ?? "";

const externalLinkClass =
  "group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-transparent px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-default)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]";
const cardHeaderClass = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3";
const cardTitleClass = "min-w-0 text-lg font-bold text-[var(--color-text-primary)]";
const externalIconClass =
  "shrink-0 text-[var(--color-text-tertiary)] transition group-hover:text-[var(--color-primary)]";
const countBadgeClass = "min-w-7 px-2";

function ExternalTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);

  if (words.length <= 1) {
    return (
      <>
        {title}
        <ArrowUpRight
          className={`mb-0.5 ml-1 inline-block h-4 w-4 align-middle ${externalIconClass}`}
          aria-hidden
        />
      </>
    );
  }

  const lastWord = words[words.length - 1];
  const leadingWords = words.slice(0, -1).join(" ");

  return (
    <>
      {leadingWords}{" "}
      <span className="whitespace-nowrap">
        {lastWord}
        <ArrowUpRight
          className={`mb-0.5 ml-1 inline-block h-4 w-4 align-middle ${externalIconClass}`}
          aria-hidden
        />
      </span>
    </>
  );
}

function ExternalItem({ item }: { item: ResourceItem }) {
  return (
    <Link href={item.url} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
      <span className="min-w-0 truncate">{item.name}</span>
      <ArrowUpRight className={`h-3.5 w-3.5 ${externalIconClass}`} aria-hidden />
    </Link>
  );
}

function CategoryCard({ category }: { category: ResourceCategory }) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? category.items : category.items.slice(0, 8);

  return (
    <Card as="article" padding="md" className="flex h-full flex-col">
      <div className={cardHeaderClass}>
        <h3 className={`${cardTitleClass} flex items-start gap-2`}>
          <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
          <span className="min-w-0">{category.category}</span>
        </h3>
        <Badge variant="outline" className={countBadgeClass}>{category.items.length}</Badge>
      </div>

      <ul className={expanded ? "mt-4 max-h-96 space-y-1.5 overflow-y-auto pr-1" : "mt-4 space-y-1.5"}>
        {items.map((item) => (
          <li key={item.url}>
            <ExternalItem item={item} />
          </li>
        ))}
      </ul>

      {category.items.length > 8 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex self-start text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
        >
          {expanded ? "Show fewer" : `View all ${category.items.length}`}
        </button>
      ) : null}
    </Card>
  );
}

function FeaturedCard({ reference }: { reference: (typeof FEATURED_REFERENCES)[number] }) {
  return (
    <Card as="article" variant="interactive" padding="md" className="flex h-full flex-col">
      <div className={cardHeaderClass}>
        <Link
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group min-w-0 text-base font-bold leading-snug text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
        >
          <ExternalTitle title={reference.name} />
        </Link>
        {reference.official ? <Badge variant="soft">Official</Badge> : null}
      </div>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{reference.bestFor}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {reference.tags.map((tag) => (
          <Badge key={tag} variant="outline">{tag}</Badge>
        ))}
      </div>
      {reference.related ? (
        <Link
          href={reference.related.href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
        >
          Try in Darma: {reference.related.title} →
        </Link>
      ) : null}
    </Card>
  );
}

export default function GoodLinks() {
  const [query, setQuery] = useState("");
  const [activeTask, setActiveTask] = useState<string | null>(null);

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const out: Array<ResourceItem & { category: string }> = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        const haystack = `${item.name} ${itemBlurb(item)} ${cat.category}`.toLowerCase();
        if (haystack.includes(trimmed)) out.push({ ...item, category: cat.category });
        if (out.length >= MAX_SEARCH_RESULTS) break;
      }
      if (out.length >= MAX_SEARCH_RESULTS) break;
    }
    return out;
  }, [isSearching, trimmed]);

  const visibleCategories = useMemo(() => {
    if (!activeTask) return categories;
    const task = REFERENCE_TASKS.find((t) => t.id === activeTask);
    if (!task) return categories;
    return categories.filter((c) => task.categories.includes(c.category));
  }, [activeTask]);

  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl">
        <Badge variant="outline">Reference library</Badge>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
          Useful developer references
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
          A curated library of trusted docs, generators, and design resources — organized by task, so you can
          learn a concept, verify support, or grab the right tool without leaving Darma.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="soft">{TOTAL_RESOURCES} resources</Badge>
          <Badge variant="outline">{categories.length} categories</Badge>
          <Badge variant="outline">Hand-picked &amp; reviewed</Badge>
        </div>
      </div>

      {/* Search + task filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${TOTAL_RESOURCES} references…`}
            aria-label="Search references"
            className="pl-9"
          />
        </div>
        {!isSearching ? (
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" active={activeTask === null} onClick={() => setActiveTask(null)} />
            {REFERENCE_TASKS.map((task) => (
              <FilterChip
                key={task.id}
                label={task.label}
                active={activeTask === task.id}
                onClick={() => setActiveTask(task.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {isSearching ? (
        /* Search results */
        <div className="mt-6">
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
            {searchResults.length === 0
              ? `No references match “${query.trim()}”.`
              : `${searchResults.length}${searchResults.length >= MAX_SEARCH_RESULTS ? "+" : ""} result${searchResults.length === 1 ? "" : "s"} for “${query.trim()}”`}
          </p>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((item) => (
                <Link
                  key={`${item.category}-${item.url}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-text-primary)]">{item.name}</span>
                    <ArrowUpRight className={`h-3.5 w-3.5 ${externalIconClass}`} aria-hidden />
                  </div>
                  <span className="mt-1 block text-xs text-[var(--color-text-tertiary)]">{item.category}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {/* Featured (hidden while searching) */}
          {activeTask === null ? (
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  Featured references
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {FEATURED_REFERENCES.map((reference) => (
                  <FeaturedCard key={reference.url} reference={reference} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Category grid */}
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleCategories.map((category) => (
              <CategoryCard key={category.category} category={category} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex min-h-8 items-center rounded-[var(--radius-full)] border border-[var(--color-primary)] bg-[var(--color-primary)] px-3.5 text-xs font-semibold text-[var(--color-primary-text)]"
          : "inline-flex min-h-8 items-center rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
      }
    >
      {label}
    </button>
  );
}
