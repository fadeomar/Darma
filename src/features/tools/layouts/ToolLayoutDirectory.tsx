"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
import { Badge, Card, EmptyState } from "@/components/ui";
import type { ToolAudience, ToolDefinition, ToolLayoutType, ToolPrivacy } from "@/features/tools";
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

const audienceLabels: Record<"all" | ToolAudience, string> = {
  all: "All tools",
  developer: "Developer",
  designer: "Designer",
  creator: "Creator",
  general: "Utility",
  student: "Student",
};

const layoutLabels: Record<"all" | ToolLayoutType, string> = {
  all: "All types",
  "text-workbench": "Text",
  "visual-generator": "Visual",
  "fullscreen-studio": "Studio",
  "single-utility": "Utility",
  directory: "Directory",
};

const privacyLabels: Record<"all" | ToolPrivacy, string> = {
  all: "All privacy",
  "client-only": "Client-only",
  "local-storage": "Local storage",
  "server-assisted": "Server-assisted",
  "external-api": "External API",
};

function layoutLabel(layoutType?: ToolDefinition["layoutType"]) {
  if (!layoutType) return "Tool";
  return layoutLabels[layoutType] ?? "Tool";
}

function privacyLabel(privacy?: ToolPrivacy) {
  if (!privacy) return "Privacy clear";
  return privacyLabels[privacy] ?? privacy;
}

function matchesQuery(tool: ToolDefinition, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    tool.id,
    tool.title,
    tool.description,
    tool.href,
    tool.layoutType ?? "",
    tool.privacy ?? "",
    tool.status ?? "",
    ...(tool.tags ?? []),
    ...(tool.keywords ?? []),
    ...(tool.audiences ?? []),
    ...(tool.mainCategory ?? []),
    ...(tool.secondaryCategory ?? []),
    ...(tool.relatedTools ?? []),
  ].some((value) => value.toLowerCase().includes(q));
}

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = ICONS[tool.icon ?? "code"] ?? FaWandMagicSparkles;

  return (
    <ToolCardLink href={tool.href} toolName={tool.title}>
      <Card as="article" variant="interactive" padding="md" className="h-full">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-text)]">
            <Icon className="text-xl" />
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {tool.featured ? <Badge variant="warning">Featured</Badge> : null}
            <Badge variant="soft">{layoutLabel(tool.layoutType)}</Badge>
            <Badge variant={tool.privacy === "server-assisted" ? "warning" : "outline"}>
              {privacyLabel(tool.privacy)}
            </Badge>
          </div>
        </div>
        <h3 className="text-xl font-black text-[var(--color-text)]">{tool.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{tool.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(tool.tags ?? []).slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline">#{tag}</Badge>
          ))}
        </div>
      </Card>
    </ToolCardLink>
  );
}

export function ToolLayoutDirectory({ tools }: { tools: ToolDefinition[] }) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<"all" | ToolAudience>("all");
  const [layoutType, setLayoutType] = useState<"all" | ToolLayoutType>("all");
  const [privacy, setPrivacy] = useState<"all" | ToolPrivacy>("all");

  const sortedTools = useMemo(
    () =>
      [...tools].sort((a, b) => {
        const pinned = (a.pinned ?? 999) - (b.pinned ?? 999);
        if (pinned !== 0) return pinned;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.title.localeCompare(b.title);
      }),
    [tools],
  );

  const featured = useMemo(
    () => sortedTools.filter((tool) => tool.featured).slice(0, 6),
    [sortedTools],
  );

  const filtered = useMemo(() => {
    return sortedTools.filter((tool) => {
      if (audience !== "all" && !(tool.audiences ?? []).includes(audience)) return false;
      if (layoutType !== "all" && tool.layoutType !== layoutType) return false;
      if (privacy !== "all" && tool.privacy !== privacy) return false;
      return matchesQuery(tool, query);
    });
  }, [audience, layoutType, privacy, query, sortedTools]);

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-8">
        <Badge variant="soft">Tools</Badge>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[var(--leading-tight)] text-[var(--color-text)] sm:text-5xl">
          Free browser tools for real front-end work
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
          Darma tools are focused one-page utilities for styling, code previews, UI experiments, and quick content generation without signup friction.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <label className="relative block">
            <span className="sr-only">Search tools</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-soft)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools, tags, privacy, or use cases"
              className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-12 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)]"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[560px]">
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as "all" | ToolAudience)}
              className="min-h-12 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 text-sm font-semibold text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
              aria-label="Filter by audience"
            >
              {Object.entries(audienceLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={layoutType}
              onChange={(event) => setLayoutType(event.target.value as "all" | ToolLayoutType)}
              className="min-h-12 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 text-sm font-semibold text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
              aria-label="Filter by tool type"
            >
              {Object.entries(layoutLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={privacy}
              onChange={(event) => setPrivacy(event.target.value as "all" | ToolPrivacy)}
              className="min-h-12 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 text-sm font-semibold text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
              aria-label="Filter by privacy model"
            >
              {Object.entries(privacyLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-[var(--color-text)]">Featured tools</h2>
            <Link href="/explore" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Browse projects
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
          <p className="text-sm text-[var(--color-text-muted)]">{filtered.length} tool{filtered.length === 1 ? "" : "s"}</p>
        </div>
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        ) : (
          <EmptyState title="No tools matched your search." description="Try a different keyword, audience, privacy setting, or tool type." />
        )}
      </section>
    </div>
  );
}
