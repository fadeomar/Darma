"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
import { Badge, Card, EmptyState } from "@/components/ui";
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
  all: "All tools",
  developer: "Developer",
  designer: "Designer",
  creator: "Creator",
  general: "Utility",
  student: "Student",
};

function layoutLabel(layoutType?: ToolDefinition["layoutType"]) {
  if (layoutType === "text-workbench") return "Text";
  if (layoutType === "visual-generator") return "Visual";
  if (layoutType === "fullscreen-studio") return "Studio";
  if (layoutType === "single-utility") return "Utility";
  return "Tool";
}

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = ICONS[tool.icon ?? "code"] ?? FaWandMagicSparkles;

  return (
    <ToolCardLink href={tool.href} toolName={tool.title}>
      <Card as="article" variant="interactive" padding="md" className="h-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-text)]">
            <Icon className="text-xl" />
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {tool.featured ? <Badge variant="warning">Featured</Badge> : null}
            <Badge variant="soft">{layoutLabel(tool.layoutType)}</Badge>
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
  const [audience, setAudience] = useState("all");

  const featured = useMemo(
    () => tools.filter((tool) => tool.featured).sort((a, b) => (a.pinned ?? 999) - (b.pinned ?? 999)).slice(0, 6),
    [tools],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const audienceMatch = audience === "all" || (tool.audiences ?? []).includes(audience as ToolAudience);
      if (!audienceMatch) return false;
      if (!q) return true;
      return [
        tool.title,
        tool.description,
        ...(tool.tags ?? []),
        ...(tool.audiences ?? []),
        ...(tool.secondaryCategory ?? []),
        tool.layoutType ?? "",
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [audience, query, tools]);

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
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search tools</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-soft)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools, tags, or use cases"
              className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-12 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(audienceLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAudience(key)}
                className={cn(
                  "min-h-10 rounded-[var(--radius-full)] border px-4 text-sm font-semibold transition",
                  audience === key
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {label}
              </button>
            ))}
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
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-[var(--color-text)]">All tools</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{filtered.length} tool{filtered.length === 1 ? "" : "s"}</p>
        </div>
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        ) : (
          <EmptyState title="No tools matched your search." description="Try a different keyword, audience, or tool type." />
        )}
      </section>
    </div>
  );
}
