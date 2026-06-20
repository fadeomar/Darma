"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
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
  const primaryTags = (tool.tags ?? []).slice(0, compact ? 2 : 3);
  const privacy = privacyLabel(tool.privacy);
  const category = tool.secondaryCategory?.[0] ?? tool.mainCategory?.[0];

  return (
    <Card as="article" variant="interactive" padding={compact ? "md" : "lg"} className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <ToolCardLink href={tool.href} toolName={tool.title}>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] sm:h-11 sm:w-11">
            <Icon className="text-lg" aria-hidden />
          </span>
        </ToolCardLink>
        <div className="flex flex-wrap justify-end gap-2">
          <FavoriteToolButton toolId={tool.id} toolTitle={tool.title} showLabel={false} />
          <Badge variant="soft">{layoutLabel(tool.layoutType)}</Badge>
          {privacy && !compact ? <Badge variant="accent">{privacy}</Badge> : null}
          {!compact && tool.featured ? <Badge variant="warning">Featured</Badge> : null}
        </div>
      </div>

      <ToolCardLink href={tool.href} toolName={tool.title}>
        <div className="flex h-full flex-col">
          <h3 className="text-lg font-black leading-tight tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-xl">{tool.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{tool.shortDescription ?? tool.description}</p>

          {!compact && tool.useCases?.length ? (
            <ul className="mt-4 grid gap-1.5 text-xs leading-5 text-[var(--color-text-tertiary)]">
              {tool.useCases.slice(0, 2).map((useCase) => (
                <li key={useCase}>{useCase}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {category ? <Badge variant="outline">{formatCategory(category)}</Badge> : null}
            {primaryTags.map((tag) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>

          <div className="mt-auto pt-5">
            <span className="inline-flex font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Open tool -&gt;
            </span>
          </div>
        </div>
      </ToolCardLink>
    </Card>
  );
}

function WorkflowCard({ workflow }: { workflow: (typeof toolWorkflows)[number] }) {
  return (
    <Link href={`/tools/workflows/${workflow.id}`} className="block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
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
              <li key={step}>
                <span className="font-bold text-[var(--color-text-secondary)]">{index + 1}.</span> {step}
              </li>
            ))}
          </ol>
        ) : null}
        <div className="mt-auto pt-5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{workflow.toolIds.length} linked tools -&gt;</span>
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

  const categories = useMemo(() => {
    return Array.from(new Set(tools.flatMap((tool) => tool.secondaryCategory ?? []))).sort();
  }, [tools]);

  const featured = useMemo(
    () => sortTools(tools.filter((tool) => tool.featured), "featured").slice(0, 6),
    [tools],
  );

  const topDailyTools = useMemo(
    () => [...tools].sort((a, b) => (b.dailyUseScore ?? 0) - (a.dailyUseScore ?? 0) || a.title.localeCompare(b.title)).slice(0, 6),
    [tools],
  );

  const favoriteTools = useMemo(() => {
    const byId = new Map(tools.map((tool) => [tool.id, tool]));
    return favoriteToolIds.map((id) => byId.get(id)).filter((tool): tool is ToolDefinition => Boolean(tool));
  }, [favoriteToolIds, tools]);

  const audienceSections = useMemo(() => {
    const sections: Array<{ key: ToolAudience; title: string }> = [
      { key: "general", title: "Everyday users" },
      { key: "student", title: "Students" },
      { key: "creator", title: "Creators" },
      { key: "designer", title: "Designers" },
      { key: "developer", title: "Developers" },
    ];

    return sections
      .map((section) => ({
        ...section,
        tools: sortTools(
          tools.filter((tool) => (tool.audiences ?? []).includes(section.key)),
          "featured",
        ).slice(0, 3),
      }))
      .filter((section) => section.tools.length > 0);
  }, [tools]);

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
  const showDashboardSections = !query.trim() && audience === "all" && toolType === "all" && category === "all";

  const clearFilters = () => {
    setQuery("");
    setAudience("all");
    setToolType("all");
    setCategory("all");
    setSort("featured");
  };

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">Tools</Badge>
              <Badge variant="accent">Browser-first</Badge>
              <Link href="/workflows" className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
                Browse workflows
              </Link>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[var(--leading-tight)] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Fast browser tools for text, images, code, design, and everyday tasks.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
              No signup. Local-first. Copy-ready results.
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Catalog status</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-2xl font-black text-[var(--color-text-primary)]">{tools.length}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Tools</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--color-text-primary)]">{featured.length}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Featured</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-4 sm:p-5">
          <div className="space-y-4">
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

            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible" aria-label="Audience filters">
              {Object.entries(audienceLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={audience === key}
                  onClick={() => setAudience(key)}
                  className={cn(
                    "min-h-9 shrink-0 rounded-[var(--radius-full)] border px-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition focus:outline-none focus:shadow-[var(--focus-ring)]",
                    audience === key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                      : "border-[var(--color-border-default)] bg-[var(--color-control-bg)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
              <label className="grid gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Tool type
                <Select value={toolType} onChange={(event) => setToolType(event.target.value as ToolTypeFilter)} size="sm">
                  {Object.entries(toolTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Category
                <Select value={category} onChange={(event) => setCategory(event.target.value)} size="sm">
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{formatCategory(item)}</option>)}
                </Select>
              </label>
              <label className="grid gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
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
        </div>
      </section>

      {showDashboardSections ? <RecentToolsRail tools={tools} /> : null}

      {showDashboardSections && favoriteTools.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="soft">Favorites</Badge>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Favorite tools</h2>
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Saved locally</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favoriteTools.slice(0, 6).map((tool) => <ToolCard key={tool.id} tool={tool} compact />)}
          </div>
        </section>
      ) : null}

      {showDashboardSections && toolWorkflows.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4">
            <Badge variant="soft">Workflows</Badge>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Popular workflows</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {toolWorkflows.slice(0, 4).map((workflow) => <WorkflowCard key={workflow.id} workflow={workflow} />)}
          </div>
        </section>
      ) : null}

      {featured.length > 0 && showDashboardSections ? (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <Badge variant="soft">Curated</Badge>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Featured tools</h2>
            </div>
            <Link href="/workflows" className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
              Try a workflow
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </section>
      ) : null}

      {showDashboardSections && topDailyTools.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4">
            <Badge variant="soft">Daily-use</Badge>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Useful every day</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topDailyTools.map((tool) => <ToolCard key={tool.id} tool={tool} compact />)}
          </div>
        </section>
      ) : null}

      {showDashboardSections && audienceSections.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4">
            <Badge variant="outline">By audience</Badge>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Pick tools by task</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {audienceSections.map((section) => (
              <div key={section.key} className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
                <h3 className="text-lg font-black text-[var(--color-text-primary)]">{section.title}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {section.tools.map((tool) => (
                    <Link key={tool.id} href={tool.href} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]">
                      <span className="block text-sm font-black text-[var(--color-text-primary)]">{tool.title}</span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--color-text-secondary)]">{tool.shortDescription ?? tool.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline">Catalog</Badge>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">All tools</h2>
          </div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]" aria-live="polite">
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
