"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { IconType } from "react-icons";
import {
  FaCode,
  FaCube,
  FaFilm,
  FaImage,
  FaPaintbrush,
  FaPalette,
  FaQrcode,
  FaWandMagic,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import ToolCardLink from "@/components/analytics/ToolCardLink";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { FavoriteToolButton } from "@/features/tools/components/FavoriteToolButton";
import { ToolPreviewArtwork } from "@/components/landing";
import { RecentToolsRail } from "@/features/tools/components/RecentToolsRail";
import type { ToolAudience, ToolDefinition } from "@/features/tools";
import { useFavoriteTools } from "@/features/tools/hooks/useFavoriteTools";
import { toolWorkflows } from "@/features/tools/workflows";
import { cn } from "@/lib/cn";

const ICONS: Record<string, IconType> = {
  code: FaCode,
  paint: FaPaintbrush,
  magic: FaWandMagic,
  qrcode: FaQrcode,
  film: FaFilm,
  palette: FaPalette,
  cube: FaCube,
  image: FaImage,
};

const audienceLabels: Record<string, string> = {
  all: "All",
  developer: "Developer",
  designer: "Designer",
  creator: "Creator",
  general: "General",
  student: "Student",
  business: "Business",
};

/** Height of the sticky site header, matching the other in-page sticky bars. */
const STICKY_TOP = 72;

type ToolSort = "featured" | "recent" | "az" | "category";
type ToolTypeFilter = "all" | NonNullable<ToolDefinition["layoutType"]>;

const toolTypeLabels: Record<ToolTypeFilter, string> = {
  all: "All types",
  "visual-generator": "Visual generators",
  "text-workbench": "Text workbenches",
  "single-utility": "Utilities",
  "fullscreen-studio": "Fullscreen studios",
  "interactive-challenge": "Interactive challenges",
  directory: "Directories",
};

function layoutLabel(layoutType?: ToolDefinition["layoutType"]) {
  if (layoutType === "text-workbench") return "Text";
  if (layoutType === "visual-generator") return "Visual";
  if (layoutType === "fullscreen-studio") return "Studio";
  if (layoutType === "single-utility") return "Utility";
  if (layoutType === "interactive-challenge") return "Challenge";
  if (layoutType === "directory") return "Directory";
  return "Tool";
}

function privacyLabel(privacy?: ToolDefinition["privacy"]) {
  if (privacy === "client-only") return "Browser-only";
  if (privacy === "local-storage") return "Local storage";
  if (privacy === "server-assisted") return "Server assisted";
  if (privacy === "external-api") return "External API";
  return null;
}

function searchableText(tool: ToolDefinition) {
  return [
    tool.title,
    tool.description,
    tool.shortDescription ?? "",
    ...(tool.tags ?? []),
    ...(tool.audiences ?? []),
    ...(tool.mainCategory ?? []),
    ...(tool.secondaryCategory ?? []),
    ...(tool.useCases ?? []),
    ...(tool.benefits ?? []),
    ...(tool.examples ?? []),
    tool.layoutType ?? "",
    tool.toolCategory ?? "",
    tool.privacy ?? "",
    ...(tool.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function formatCategory(category: string) {
  return category.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortTools(tools: ToolDefinition[], sort: ToolSort) {
  return [...tools].sort((a, b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "category") {
      const categoryCompare = (a.secondaryCategory?.[0] ?? "").localeCompare(b.secondaryCategory?.[0] ?? "");
      return categoryCompare || a.title.localeCompare(b.title);
    }
    if (sort === "recent") {
      const aDate = a.updatedAt?.getTime?.() ?? a.createdAt?.getTime?.() ?? 0;
      const bDate = b.updatedAt?.getTime?.() ?? b.createdAt?.getTime?.() ?? 0;
      return bDate - aDate || a.title.localeCompare(b.title);
    }

    const featuredCompare = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    return featuredCompare || (a.pinned ?? 999) - (b.pinned ?? 999) || a.title.localeCompare(b.title);
  });
}

function ToolCard({ tool, compact = false }: { tool: ToolDefinition; compact?: boolean }) {
  const Icon = ICONS[tool.icon ?? "code"] ?? FaWandMagicSparkles;
  const primaryTags = (tool.tags ?? []).slice(0, 2);
  const privacy = privacyLabel(tool.privacy);
  const category = tool.secondaryCategory?.[0] ?? tool.mainCategory?.[0];

  return (
    <Card as="article" variant="interactive" padding="none" className="landing-directory-tool-card flex h-full flex-col overflow-hidden">
      <ToolCardLink href={tool.href} toolName={tool.title}>
        <div className="relative">
          <ToolPreviewArtwork tool={tool} />
          <span className="landing-directory-tool-icon">
            <Icon className="text-base" aria-hidden />
          </span>
        </div>
      </ToolCardLink>

      {/*
        Tool catalog card body. The regions run in one fixed order — badges and
        favourite, title, description, tags, CTA — and each is clamped rather
        than given a reserved height, so a short description no longer leaves a
        blank band above the CTA. `mt-auto` plus the stretched grid row is what
        keeps the CTAs of a row on one baseline (F-12). The full title stays
        available to assistive tech via the link's accessible name and to
        pointer users via `title`, so the two-line clamp is presentational only.
      */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={tool.featured ? "soft" : "outline"}>{tool.featured ? "Featured" : layoutLabel(tool.layoutType)}</Badge>
            {!compact && privacy ? <Badge variant="accent">{privacy}</Badge> : null}
          </div>
          <FavoriteToolButton toolId={tool.id} toolTitle={tool.title} showLabel={false} />
        </div>

        <ToolCardLink href={tool.href} toolName={tool.title} title={tool.title} className="group flex flex-1 flex-col gap-2">
          <h3 className="line-clamp-2 text-base font-black leading-snug tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-lg">
            {tool.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{tool.shortDescription ?? tool.description}</p>

          {!compact && (tool.useCases ?? []).length > 0 ? (
            <ul className="grid gap-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
              {(tool.useCases ?? []).slice(0, 2).map((useCase) => (
                <li key={useCase} className="flex gap-2"><span className="text-[var(--color-primary-text-strong)]" aria-hidden>✦</span><span className="line-clamp-1">{useCase}</span></li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap content-start gap-2">
            {category ? <Badge variant="outline">{formatCategory(category)}</Badge> : null}
            {primaryTags.map((tag) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>

          <span className="mt-auto inline-flex min-h-10 items-center gap-2 pt-2 text-sm font-bold text-[var(--color-primary-text-strong)]">
            Open tool <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
          </span>
        </ToolCardLink>
      </div>
    </Card>
  );
}

/*
 * The three catalog selects plus "Clear filters". One component, one set of
 * handlers: the in-page panel, the compact sticky toolbar, and the mobile
 * drawer all render this, so there is no second copy of the filter logic to
 * keep in sync. `dense` only changes presentation — visible field labels become
 * screen-reader labels, and the clear action is hidden until it does something.
 */
type ToolFilterControlsProps = {
  dense?: boolean;
  toolType: ToolTypeFilter;
  setToolType: (value: ToolTypeFilter) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  sort: ToolSort;
  setSort: (value: ToolSort) => void;
  hasFilters: boolean;
  clearFilters: () => void;
};

function ToolFilterControls({
  dense = false,
  toolType,
  setToolType,
  category,
  setCategory,
  categories,
  sort,
  setSort,
  hasFilters,
  clearFilters,
}: ToolFilterControlsProps) {
  const fieldClass = dense
    ? "grid w-[10.5rem] shrink-0 gap-0"
    : "grid gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]";
  const labelClass = dense ? "sr-only" : undefined;

  return (
    <>
      <label className={fieldClass}>
        <span className={labelClass}>Tool type</span>
        <Select value={toolType} onChange={(event) => setToolType(event.target.value as ToolTypeFilter)} size="sm">
          {Object.entries(toolTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>Category</span>
        <Select value={category} onChange={(event) => setCategory(event.target.value)} size="sm">
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{formatCategory(item)}</option>)}
        </Select>
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>Sort</span>
        <Select value={sort} onChange={(event) => setSort(event.target.value as ToolSort)} size="sm">
          <option value="featured">Featured first</option>
          <option value="recent">Recently updated</option>
          <option value="az">A to Z</option>
          <option value="category">Category</option>
        </Select>
      </label>
      {dense && !hasFilters ? null : (
        <Button
          variant="secondary"
          size="sm"
          onClick={clearFilters}
          disabled={!hasFilters}
          leftIcon={hasFilters ? <X className="h-4 w-4" aria-hidden /> : <SlidersHorizontal className="h-4 w-4" aria-hidden />}
        >
          Clear filters
        </Button>
      )}
    </>
  );
}

function WorkflowCard({ workflow }: { workflow: (typeof toolWorkflows)[number] }) {
  return (
    <Link href={`/workflows/${workflow.id}`} className="block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
      <Card as="article" variant="interactive" padding="md" className="flex h-full flex-col">
        <div className="mb-4 flex flex-wrap gap-2">
          {(workflow.audience ?? []).slice(0, 2).map((audience) => (
            <Badge key={audience} variant="soft">{audience}</Badge>
          ))}
        </div>
        <h3 className="text-lg font-black leading-tight tracking-[-0.02em] text-[var(--color-text-primary)]">{workflow.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{workflow.description}</p>
        {workflow.steps?.length ? (
          <ol className="mt-4 grid gap-1.5 text-xs leading-5 text-[var(--color-text-tertiary)]">
            {workflow.steps.slice(0, 3).map((step, index) => (
              <li key={step.id}>
                <span className="font-bold text-[var(--color-text-secondary)]">{index + 1}.</span> {step.title}
              </li>
            ))}
          </ol>
        ) : null}
        <div className="mt-auto pt-5">
          <span className="group inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary-text-strong)]">
            {workflow.steps.length} connected steps <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function ToolLayoutDirectory({ tools }: { tools: ToolDefinition[] }) {
  const { favoriteToolIds } = useFavoriteTools();
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("all");
  const [toolType, setToolType] = useState<ToolTypeFilter>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<ToolSort>("featured");
  const [visibleCount, setVisibleCount] = useState(18);
  // Sticky compact toolbar: shown only once the full panel has scrolled past.
  const [panelPassed, setPanelPassed] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(tools.flatMap((tool) => tool.secondaryCategory ?? []))).sort();
  }, [tools]);

  const featured = useMemo(
    () => sortTools(tools.filter((tool) => tool.featured), "featured").slice(0, 6),
    [tools],
  );

  const challengeTools = useMemo(
    () => sortTools(tools.filter((tool) => tool.layoutType === "interactive-challenge"), "featured"),
    [tools],
  );


  const favoriteTools = useMemo(() => {
    const byId = new Map(tools.map((tool) => [tool.id, tool]));
    return favoriteToolIds.map((id) => byId.get(id)).filter((tool): tool is ToolDefinition => Boolean(tool));
  }, [favoriteToolIds, tools]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = tools.filter((tool) => {
      const audienceMatch = audience === "all" || (tool.audiences ?? []).includes(audience as ToolAudience);
      const typeMatch = toolType === "all" || tool.layoutType === toolType;
      const categoryMatch = category === "all" || (tool.secondaryCategory ?? []).includes(category);
      const queryMatch = !q || searchableText(tool).includes(q);
      return audienceMatch && typeMatch && categoryMatch && queryMatch;
    });

    return sortTools(matches, sort);
  }, [audience, category, query, sort, toolType, tools]);

  useEffect(() => {
    setVisibleCount(18);
  }, [query, audience, toolType, category, sort]);

  /*
   * A zero-height sentinel below the full panel drives the compact toolbar. The
   * toolbar itself is fixed rather than sticky, so switching it on never adds
   * or removes flow height and the catalog underneath cannot jump.
   */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setPanelPassed(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: `-${STICKY_TOP}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    mobilePanelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFiltersOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileFiltersOpen]);

  const visibleTools = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const hasFilters = query.trim().length > 0 || audience !== "all" || toolType !== "all" || category !== "all" || sort !== "featured";
  const showDashboardSections = !query.trim() && audience === "all" && toolType === "all" && category === "all" && sort === "featured";

  const exploreChallenges = () => {
    setQuery("");
    setAudience("all");
    setToolType("interactive-challenge");
    setCategory("all");
    setSort("featured");
  };

  const clearFilters = () => {
    setQuery("");
    setAudience("all");
    setToolType("all");
    setCategory("all");
    setSort("featured");
  };

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-14">
      <section id="tool-directory-filters" aria-label="Tool search and filters" className="mt-4 scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-card)] sm:p-5">
          {/*
            Three rows, in this order: search, then audience chips beside the
            shortcut actions, then the selects. The audience row is a
            `minmax(0, 1fr) auto` grid so the chips keep the whole remaining
            line instead of wrapping two orphans under a half-empty panel, and
            the chip strip itself scrolls horizontally rather than stacking.
          */}
          <div className="space-y-3">
            <label className="relative block">
              <span className="sr-only">Search tools</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools, tags, workflows, or use cases"
                size="lg"
                className="pl-10"
              />
            </label>

            <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-3">
              <div className="darma-scroll-strip -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 py-0.5" aria-label="Audience filters">
                {Object.entries(audienceLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={audience === key}
                    onClick={() => setAudience(key)}
                    className={cn(
                      "min-h-9 shrink-0 rounded-[var(--radius-full)] border px-3.5 font-mono text-xs font-bold uppercase tracking-[0.08em] transition focus:outline-none focus:shadow-[var(--focus-ring)]",
                      audience === key
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-control-bg)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="darma-scroll-strip -mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 py-0.5">
                <button
                  type="button"
                  onClick={exploreChallenges}
                  className={cn(
                    "min-h-9 shrink-0 rounded-[var(--radius-full)] border px-3.5 font-mono text-xs font-bold uppercase tracking-[0.08em] transition focus:outline-none focus:shadow-[var(--focus-ring)]",
                    toolType === "interactive-challenge"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]"
                      : "border-[var(--color-primary-border)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  Challenges
                </button>
                <Link
                  href="/tools/fun"
                  className="group inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                >
                  Fun hub <ArrowRight className="darma-link-arrow h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <ToolFilterControls
                toolType={toolType}
                setToolType={setToolType}
                category={category}
                setCategory={setCategory}
                categories={categories}
                sort={sort}
                setSort={setSort}
                hasFilters={hasFilters}
                clearFilters={clearFilters}
              />
            </div>
          </div>
      </section>
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {/* Compact scrolling state. Fixed, one row on desktop, and reduced to a
          search field plus a Filters button on small screens. */}
      <div
        className={cn(
          "fixed inset-x-0 z-30 border-b border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)] transition-opacity duration-150",
          panelPassed ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{ top: STICKY_TOP }}
        aria-hidden={!panelPassed}
      >
        <div className="mx-auto flex max-w-[var(--container-wide)] flex-wrap items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <label className="relative block min-w-0 flex-1 md:w-[15rem] md:flex-none">
            <span className="sr-only">Search tools</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools"
              size="sm"
              className="pl-9"
              tabIndex={panelPassed ? undefined : -1}
            />
          </label>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            tabIndex={panelPassed ? undefined : -1}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filters
            {hasFilters ? <span className="rounded-[var(--radius-full)] bg-[var(--color-primary)] px-1.5 text-xs font-black text-[var(--color-primary-text)]">On</span> : null}
          </button>

          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <ToolFilterControls
              dense
              toolType={toolType}
              setToolType={setToolType}
              category={category}
              setCategory={setCategory}
              categories={categories}
              sort={sort}
              setSort={setSort}
              hasFilters={hasFilters}
              clearFilters={clearFilters}
            />
          </div>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 bg-[rgba(0,0,0,.45)]" />
          <div
            ref={mobilePanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Tool filters"
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[var(--radius-lg)] border-t border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-lg)] focus:outline-none"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-[var(--color-text-primary)]">Filter tools</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-3 text-sm font-bold text-[var(--color-text-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                <X className="h-4 w-4" aria-hidden /> Close
              </button>
            </div>
            <div className="grid gap-3">
              <ToolFilterControls
                toolType={toolType}
                setToolType={setToolType}
                category={category}
                setCategory={setCategory}
                categories={categories}
                sort={sort}
                setSort={setSort}
                hasFilters={hasFilters}
                clearFilters={clearFilters}
              />
            </div>
          </div>
        </div>
      ) : null}


      {showDashboardSections ? <RecentToolsRail tools={tools} /> : null}


      {showDashboardSections && favoriteTools.length > 0 ? (
        <section className="mt-10 lg:mt-14">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="soft">Favorites</Badge>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Favorite tools</h2>
            </div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Saved locally</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favoriteTools.slice(0, 6).map((tool) => <ToolCard key={tool.id} tool={tool} compact />)}
          </div>
        </section>
      ) : null}

      {featured.length > 0 && showDashboardSections ? (
        <section className="mt-10 lg:mt-14">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <Badge variant="soft">Curated</Badge>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Featured tools</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/tools/css-loaders" className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-primary-text-strong)] hover:text-[var(--color-text-primary)]">
                CSS loaders gallery
              </Link>
              <Link href="/workflows" className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                Try a workflow
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </section>
      ) : null}


      {showDashboardSections && toolWorkflows.length > 0 ? (
        <section className="mt-10 lg:mt-14">
          <div className="mb-4">
            <Badge variant="soft">Workflows</Badge>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Guided workflows</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {toolWorkflows.slice(0, 4).map((workflow) => <WorkflowCard key={workflow.id} workflow={workflow} />)}
          </div>
        </section>
      ) : null}


      <section className="mt-10 lg:mt-14">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline">Catalog</Badge>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">All tools</h2>
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]" aria-live="polite">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} matching tool{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        {filtered.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTools.map((tool) => <ToolCard key={tool.id} tool={tool} compact />)}
            </div>
            {hasMore ? (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" size="lg" onClick={() => setVisibleCount((count) => count + 18)} rightIcon={<ArrowRight className="h-4 w-4 rotate-90" aria-hidden />}>
                  Load 18 more tools
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState title="No tools matched your filters." description="Try clearing filters or searching for a broader keyword such as CSS, JSON, color, SEO, or utility." />
        )}
      </section>
    </div>
  );
}
