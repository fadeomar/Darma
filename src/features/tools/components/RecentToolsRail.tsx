"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { useRecentTools } from "@/features/tools/hooks/useRecentTools";
import type { ToolDefinition } from "@/features/tools/domain/tool";

export function RecentToolsRail({ tools }: { tools: ToolDefinition[] }) {
  const { recentTools } = useRecentTools();
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const items = recentTools
    .map((recent) => {
      const tool = byId.get(recent.toolId);
      return tool ? { recent, tool } : null;
    })
    .filter((item): item is { recent: (typeof recentTools)[number]; tool: ToolDefinition } => Boolean(item))
    .slice(0, 10);

  if (!items.length) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="soft">Recent</Badge>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Recently used tools</h2>
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Stored on this device</p>
      </div>
      {/*
        Horizontal rail: the scroll container clips vertically, so cards here use
        border, background, and shadow emphasis instead of the shared
        interactive card's lift — a `-translate-y` would push the top border out
        of the clipped box on hover. The 6px padding keeps the global 4px
        focus-visible ring inside the scroll box.
      */}
      <div className="-mx-1.5 flex gap-3 overflow-x-auto px-1.5 pb-3 pt-1.5">
        {items.map(({ recent, tool }) => (
          <Link key={tool.id} href={tool.href} className="group min-w-[240px] max-w-[280px] flex-1 rounded-[var(--radius-lg)]">
            <Card
              as="article"
              variant="elevated"
              padding="md"
              className="h-full transition duration-[var(--duration-fast)] group-hover:border-[var(--color-primary-border)] group-hover:bg-[var(--color-control-hover)] group-hover:shadow-[0_0_0_1px_var(--color-primary-border)] group-focus-visible:border-[var(--color-primary-border)] group-focus-visible:bg-[var(--color-control-hover)] group-focus-visible:shadow-[0_0_0_1px_var(--color-primary-border)]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <Clock className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden />
                <Badge variant="outline">{recent.useCount} use{recent.useCount === 1 ? "" : "s"}</Badge>
              </div>
              <h3 className="text-base font-black leading-tight text-[var(--color-text-primary)]">{tool.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{tool.shortDescription ?? tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
