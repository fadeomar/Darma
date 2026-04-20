"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { IconType } from "react-icons";
import {
  FaCode,
  FaPaintbrush,
  FaWandMagic,
  FaQrcode,
  FaFilm,
  FaPalette,
  FaCube,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import ToolCardLink from "@/components/analytics/ToolCardLink";
import type { ToolDefinition, ToolAudience } from "@/features/tools";

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
};

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = ICONS[tool.icon ?? "code"] ?? FaWandMagicSparkles;
  return (
    <ToolCardLink href={tool.href} toolName={tool.title}>
      <article className="group h-full rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--textColor)] text-[var(--baseColor)]">
            <Icon className="text-xl" />
          </span>
          {tool.featured ? (
            <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-black">
              Featured
            </span>
          ) : null}
        </div>
        <h3 className="text-xl font-bold text-[var(--textColor)]">
          {tool.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--textColor)]/72">
          {tool.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(tool.tags ?? []).slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--baseColor)] px-3 py-1 text-xs font-semibold text-[var(--textColor)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </ToolCardLink>
  );
}

export default function ToolsDirectoryPage({
  tools,
}: {
  tools: ToolDefinition[];
}) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("all");

  const featured = useMemo(
    () =>
      tools
        .filter((tool) => tool.featured)
        .sort((a, b) => (a.pinned ?? 999) - (b.pinned ?? 999)),
    [tools],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const audienceMatch =
        audience === "all" || (tool.audiences ?? []).includes(audience as ToolAudience);
      if (!audienceMatch) return false;
      if (!q) return true;
      return [
        tool.title,
        tool.description,
        ...(tool.tags ?? []),
        ...(tool.audiences ?? []),
        tool.toolCategory ?? "",
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [audience, query, tools]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-black/10 bg-white/70 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] sm:p-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[var(--textColor)]/60">
          Tools
        </p>
        <h1 className="text-4xl font-black tracking-tight text-[var(--textColor)] sm:text-5xl">
          Free browser tools for real front-end work
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--textColor)]/75 sm:text-lg">
          Darma tools are fast one-page utilities built to help with styling,
          code previews, UI experiments, and quick content generation without
          signup friction.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--textColor)]/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, tags, or use cases"
              className="w-full rounded-2xl border border-black/10 bg-white px-12 py-4 text-sm text-[var(--textColor)] outline-none ring-0 transition focus:border-[var(--textColor)]/30"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(audienceLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setAudience(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  audience === key
                    ? "bg-[var(--textColor)] text-[var(--baseColor)]"
                    : "bg-white text-[var(--textColor)] border border-black/10"
                }`}
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
            <h2 className="text-2xl font-black text-[var(--textColor)]">
              Featured tools
            </h2>
            <Link
              href="/explore"
              className="text-sm font-semibold text-[var(--textColor)]/70 hover:text-[var(--textColor)]"
            >
              Browse projects
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-[var(--textColor)]">
            All tools
          </h2>
          <p className="text-sm text-[var(--textColor)]/65">
            {filtered.length} tool{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-black/15 bg-white/60 p-10 text-center text-[var(--textColor)]/70">
            No tools matched your search.
          </div>
        )}
      </section>
    </div>
  );
}
