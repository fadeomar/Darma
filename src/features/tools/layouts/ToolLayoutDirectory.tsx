"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { IconType } from "react-icons";
import {
  FaCode,
  FaCube,
  FaFilm,
  FaPaintbrush,
  FaPalette,
  FaQrcode,
  FaWandMagic,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import ToolCardLink from "@/components/analytics/ToolCardLink";
import { Badge, Button, Card, EmptyState, Select } from "@/components/ui";
import type { ToolAudience, ToolDefinition } from "@/features/tools";
import { cn } from "@/lib/cn";

const ICONS: Record<string, IconType> = {
  code: FaCode,
  paint: FaPaintbrush,
  magic: FaWandMagic,
  qrcode: FaQrcode,
  film: FaFilm,
  palette: FaPalette,
  cube: FaCube,
};

const audienceLabels: Record<string, string> = {
  all: "All",
  developer: "Developer",
  designer: "Designer",
  creator: "Creator",
  general: "General",
  student: "Student",
};

type ToolSort = "featured" | "recent" | "az" | "category";
type ToolTypeFilter = "all" | NonNullable<ToolDefinition["layoutType"]>;

const toolTypeLabels: Record<ToolTypeFilter, string> = {
  all: "All types",
  "visual-generator": "Visual generators",
  "text-workbench": "Text workbenches",
  "single-utility": "Utilities",
  "fullscreen-studio": "Fullscreen studios",
  directory: "Directories",
};

function layoutLabel(layoutType?: ToolDefinition["layoutType"]) {
  if (layoutType === "text-workbench") return "Text";
  if (layoutType === "visual-generator") return "Visual";
  if (layoutType === "fullscreen-studio") return "Studio";
  if (layoutType === "single-utility") return "Utility";
  return "Tool";
}

function searchableText(tool: ToolDefinition) {
  return [
    tool.title,
    tool.description,
    ...(tool.tags ?? []),
    ...(tool.audiences ?? []),
    ...(tool.mainCategory ?? []),
    ...(tool.secondaryCategory ?? []),
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
  const primaryTags = (tool.tags ?? []).slice(0, compact ? 2 : 3);

  return (
    <ToolCardLink href={tool.href} toolName={tool.title}>
      <Card as="article" variant="interactive" padding={compact ? "md" : "lg"} className="h-full">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-text)]">
            <Icon className="text-lg" aria-hidden />
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="soft">{layoutLabel(tool.layoutType)}</Badge>
            {!compact && tool.featured ? <Badge variant="warning">Featured</Badge> : null}
          </div>
        </div>
        <h3 className="text-xl font-black text-[var(--color-text)]">{tool.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">{tool.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {primaryTags.map((tag) => (
            <Badge key={tag} variant="outline">#{tag}</Badge>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-soft)]">
          {(tool.secondaryCategory?.[0] && formatCategory(tool.secondaryCategory[0])) || "Darma tool"}
        </p>
      </Card>
    </ToolCardLink>
  );
}

export function ToolLayoutDirectory({ tools }: { tools: ToolDefinition[] }) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("all");
  const [toolType, setToolType] = useState<ToolTypeFilter>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<ToolSort>("featured");

  const categories = useMemo(() => {
    return Array.from(new Set(tools.flatMap((tool) => tool.secondaryCategory ?? []))).sort();
  }, [tools]);

  const featured = useMemo(
    () => sortTools(tools.filter((tool) => tool.featured), "featured").slice(0, 6),
    [tools],
  );

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

  const hasFilters = query.trim().length > 0 || audience !== "all" || toolType !== "all" || category !== "all" || sort !== "featured";

  const clearFilters = () => {
    setQuery("");
    setAudience("all");
    setToolType("all");
    setCategory("all");
    setSort("featured");
  };

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">Tools</Badge>
          <Link href="/workflows" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            Browse workflows
          </Link>
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[var(--leading-tight)] text-[var(--color-text)] sm:text-5xl">
          Free browser tools for real front-end work
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
          Darma tools are focused one-page utilities for styling, code previews, UI experiments, SEO, and quick content generation without signup friction.
        </p>

        <div className="mt-6 space-y-4">
          <label className="relative block">
            <span className="sr-only">Search tools</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-soft)]" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools, tags, workflows, or use cases"
              className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-12 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible" aria-label="Audience filters">
            {Object.entries(audienceLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={audience === key}
                onClick={() => setAudience(key)}
                className={cn(
                  "min-h-10 shrink-0 rounded-[var(--radius-full)] border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                  audience === key
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-soft)]">
              Tool type
              <Select value={toolType} onChange={(event) => setToolType(event.target.value as ToolTypeFilter)} size="sm">
                {Object.entries(toolTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-soft)]">
              Category
              <Select value={category} onChange={(event) => setCategory(event.target.value)} size="sm">
                <option value="all">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{formatCategory(item)}</option>)}
              </Select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-soft)]">
              Sort
              <Select value={sort} onChange={(event) => setSort(event.target.value as ToolSort)} size="sm">
                <option value="featured">Featured first</option>
                <option value="recent">Recently updated</option>
                <option value="az">A to Z</option>
                <option value="category">Category</option>
              </Select>
            </label>
            <Button variant="secondary" size="sm" onClick={clearFilters} disabled={!hasFilters} leftIcon={hasFilters ? <X className="h-4 w-4" aria-hidden /> : <SlidersHorizontal className="h-4 w-4" aria-hidden />}>
              Clear filters
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 && !query.trim() ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-[var(--color-text)]">Featured tools</h2>
            <Link href="/workflows" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Try a workflow
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-[var(--color-text)]">All tools</h2>
          <p className="text-sm text-[var(--color-text-muted)]" aria-live="polite">
            {filtered.length} of {tools.length} tool{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => <ToolCard key={tool.id} tool={tool} compact />)}
          </div>
        ) : (
          <EmptyState title="No tools matched your filters." description="Try clearing filters or searching for a broader keyword such as CSS, JSON, color, SEO, or utility." />
        )}
      </section>
    </div>
  );
}
