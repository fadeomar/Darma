"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { readRecentTools, type RecentTool } from "@/features/tools/recentTools";

const sectionClass = "mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8";
const eyebrowClass = "font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]";

export function ContinuePanel() {
  // null = not yet read (SSR / before hydration); [] = read, nothing stored.
  const [tools, setTools] = useState<RecentTool[] | null>(null);

  useEffect(() => {
    setTools(readRecentTools());
  }, []);

  // Render nothing for first-time visitors so the page never shows a dead
  // section. The panel appears once the user has opened a tool.
  if (!tools || tools.length === 0) return null;

  const recent = tools.slice(0, 5);

  return (
    <section className={sectionClass}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-3xl">
          <p className={eyebrowClass}>Continue where you left off</p>
          <h2 className="mt-2 flex items-center gap-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
            <History className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
            Pick up your recent tools.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Saved only on this browser — no account needed.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {recent.map((tool) => (
          <Card key={tool.id} as="article" variant="interactive" padding="md" className="flex h-full flex-col">
            <Badge variant="outline">Recent</Badge>
            <h3 className="mt-3 flex-1 text-lg font-bold text-[var(--color-text-primary)]">{tool.title}</h3>
            <Link
              href={tool.href}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
            >
              Open again
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
