"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Command, Gamepad2, Layers3, Search, Sparkles, Wrench, X } from "lucide-react";
import { Badge } from "@/components/ui";
import { CoreEmptyState, CoreSearchInput, type CoreEntity, type CoreEntityKind } from "@/core";
import { cn } from "@/lib/cn";
import { searchUnifiedEntities } from "../lib";
import "../styles/global-search.css";

type GlobalSearchContextValue = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
};

type GlobalSearchProviderProps = {
  entities: readonly CoreEntity[];
  children: ReactNode;
};

type RecentItem = {
  href: string;
  title: string;
  kind: CoreEntityKind;
  visitedAt: number;
};

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);
const RECENT_ITEMS_KEY = "darma:global-search:recent-items";
const RECENT_QUERIES_KEY = "darma:global-search:recent-queries";

const KIND_LABELS: Record<CoreEntityKind, string> = {
  tool: "Tool",
  game: "Game",
  collection: "Collection",
  template: "Template",
  component: "Component",
  resource: "Resource",
  ai: "AI",
  learning: "Learning",
};

const KIND_ICONS: Record<CoreEntityKind, typeof Search> = {
  tool: Wrench,
  game: Gamepad2,
  collection: Layers3,
  template: Sparkles,
  component: Layers3,
  resource: Layers3,
  ai: Sparkles,
  learning: Sparkles,
};

const FEATURED_QUERIES = ["image", "css", "puzzle", "calculator", "color", "classic"];

function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: readonly T[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors. Search should remain fully usable without persistence.
  }
}

function normaliseRecentItems(items: readonly RecentItem[]) {
  const byHref = new Map<string, RecentItem>();

  for (const item of items) {
    if (!item.href || !item.title || !item.kind) continue;
    const previous = byHref.get(item.href);
    if (!previous || item.visitedAt > previous.visitedAt) byHref.set(item.href, item);
  }

  return [...byHref.values()].sort((a, b) => b.visitedAt - a.visitedAt).slice(0, 6);
}

function getEntitySubtitle(entity: CoreEntity) {
  return [entity.categories?.[0], entity.tags?.[0]].filter(Boolean).join(" • ") || KIND_LABELS[entity.kind] || entity.kind;
}

function getShortcutLabel() {
  if (typeof navigator === "undefined") return "Ctrl K";
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘ K" : "Ctrl K";
}

function GlobalSearchResult({ entity, active, onSelect }: { entity: CoreEntity; active: boolean; onSelect: (entity: CoreEntity) => void }) {
  const Icon = KIND_ICONS[entity.kind] ?? Search;

  return (
    <button
      type="button"
      onClick={() => onSelect(entity)}
      className={cn(
        "global-search-result group flex w-full items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card)]"
          : "border-transparent hover:border-[var(--color-border-default)] hover:bg-[var(--color-surface-raised)]",
      )}
      aria-current={active ? "true" : undefined}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-control-track)] text-[var(--color-text-primary)]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-black text-[var(--color-text-primary)]">{entity.title}</span>
          {entity.featured ? <Badge variant="accent">Featured</Badge> : null}
          {entity.isNew ? <Badge variant="soft">New</Badge> : null}
        </span>
        <span className="mt-1 line-clamp-1 text-xs font-semibold text-[var(--color-text-tertiary)]">{entity.description}</span>
        <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{getEntitySubtitle(entity)}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden />
    </button>
  );
}

export function GlobalSearchProvider({ entities, children }: GlobalSearchProviderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const shortcutLabel = useMemo(() => getShortcutLabel(), []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);

  useEffect(() => {
    setRecentItems(normaliseRecentItems(readJsonArray<RecentItem>(RECENT_ITEMS_KEY)));
    setRecentQueries(readJsonArray<string>(RECENT_QUERIES_KEY).filter(Boolean).slice(0, 6));
  }, []);

  const contextValue = useMemo(() => ({ open, close, toggle, isOpen }), [close, isOpen, open, toggle]);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return entities.filter((entity) => entity.featured || entity.popular || entity.pinned).slice(0, 8);
    }
    return searchUnifiedEntities({ entities, query: trimmed }).slice(0, 10);
  }, [entities, query]);

  const featuredQueries = useMemo(() => FEATURED_QUERIES.filter((term) => searchUnifiedEntities({ entities, query: term }).length > 0).slice(0, 6), [entities]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      const wantsCommandPalette = (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) || (!isTyping && event.key === "/");

      if (wantsCommandPalette) {
        event.preventDefault();
        open();
        return;
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    };

    const onOpenRequest = () => open();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("darma:open-global-search", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("darma:open-global-search", onOpenRequest);
    };
  }, [close, isOpen, open]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 25);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const persistQuery = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    setRecentQueries((current) => {
      const next = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      writeJsonArray(RECENT_QUERIES_KEY, next);
      return next;
    });
  }, []);

  const selectEntity = useCallback(
    (entity: CoreEntity) => {
      persistQuery(query);
      const item: RecentItem = { href: entity.href, title: entity.title, kind: entity.kind, visitedAt: Date.now() };
      const nextRecent = normaliseRecentItems([item, ...recentItems]);
      setRecentItems(nextRecent);
      writeJsonArray(RECENT_ITEMS_KEY, nextRecent);
      close();
      router.push(entity.href);
    },
    [close, persistQuery, query, recentItems, router],
  );

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      selectEntity(results[activeIndex]);
    }

    if (event.key === "Tab") {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const applyQuery = (value: string) => {
    setQuery(value);
    open();
  };

  return (
    <GlobalSearchContext.Provider value={contextValue}>
      {children}
      {isOpen ? (
        <div className="global-search-overlay fixed inset-0 z-[calc(var(--z-header)+20)]" role="presentation">
          <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-sm" onClick={close} aria-label="Close Darma search" />
          <div className="pointer-events-none fixed inset-x-0 top-4 mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl px-3 sm:top-10 sm:px-4">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="global-search-title"
              className="global-search-panel pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-2xl"
              onKeyDown={onDialogKeyDown}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] p-4 sm:p-5">
                <div>
                  <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                    <Command className="h-3.5 w-3.5" aria-hidden /> Darma command palette
                  </p>
                  <h2 id="global-search-title" className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-2xl">
                    Search or jump anywhere
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={close}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="border-b border-[var(--color-border-subtle)] p-4 sm:p-5">
                <CoreSearchInput value={query} onChange={setQuery} placeholder="Search tools, games, collections…" label="Search Darma" autoFocus />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
                  <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] px-2 py-1">{shortcutLabel}</span>
                  <span>Open search</span>
                  <span aria-hidden>•</span>
                  <span>↑ ↓ navigate</span>
                  <span aria-hidden>•</span>
                  <span>Enter open</span>
                  <span aria-hidden>•</span>
                  <span>Esc close</span>
                </div>
              </div>

              <div className="global-search-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {!query.trim() && recentItems.length ? (
                  <section className="mb-5" aria-labelledby="global-search-recent-title">
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      <h3 id="global-search-recent-title">Recently opened</h3>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {recentItems.slice(0, 4).map((item) => {
                        const entity = entities.find((candidate) => candidate.href === item.href);
                        if (!entity) return null;
                        return <GlobalSearchResult key={`recent-${item.href}`} entity={entity} active={false} onSelect={selectEntity} />;
                      })}
                    </div>
                  </section>
                ) : null}

                {!query.trim() && (featuredQueries.length || recentQueries.length) ? (
                  <section className="mb-5" aria-label="Suggested searches">
                    <div className="flex flex-wrap gap-2">
                      {[...recentQueries, ...featuredQueries].slice(0, 8).map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => applyQuery(term)}
                          className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                {results.length ? (
                  <section aria-labelledby="global-search-results-title">
                    <h3 id="global-search-results-title" className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                      {query.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Recommended jumps"}
                    </h3>
                    <div className="space-y-2" role="listbox" aria-label="Darma search results">
                      {results.map((entity, index) => (
                        <GlobalSearchResult key={`${entity.kind}-${entity.id}`} entity={entity} active={index === activeIndex} onSelect={selectEntity} />
                      ))}
                    </div>
                  </section>
                ) : (
                  <CoreEmptyState
                    title="No matching Darma result"
                    description="Try a broader keyword like image, css, game, color, calculator, or puzzle."
                    actionLabel="Clear search"
                    onAction={() => setQuery("")}
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span>Powered by Darma Core unified registry.</span>
                <button type="button" onClick={() => { close(); router.push(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`); }} className="self-start font-bold text-[var(--color-primary)] hover:underline focus-visible:shadow-[var(--focus-ring)] sm:self-auto">
                  Open full search page
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch must be used inside GlobalSearchProvider");
  }
  return context;
}

export function GlobalSearchButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { open } = useGlobalSearch();
  const shortcutLabel = useMemo(() => getShortcutLabel(), []);

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
      aria-label="Open Darma command palette"
    >
      <Search className="h-4 w-4" aria-hidden />
      <span>{compact ? "Search" : "Search Darma"}</span>
      {!compact ? <span className="rounded-[var(--radius-full)] bg-[var(--color-control-track)] px-2 py-0.5 text-[11px] text-[var(--color-text-tertiary)]">{shortcutLabel}</span> : null}
    </button>
  );
}
