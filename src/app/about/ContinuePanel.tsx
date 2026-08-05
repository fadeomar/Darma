"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, History, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { clearRecentTools, readRecentTools, type RecentTool } from "@/features/tools/recentTools";

const sectionClass = "mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8";
const eyebrowClass = "font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]";
const RECENTS_EVENT = "darma:recent-tools-change";

export function ContinuePanel() {
  // null = not yet read (SSR / before hydration); [] = read, nothing stored.
  const [tools, setTools] = useState<RecentTool[] | null>(null);

  useEffect(() => {
    const sync = () => setTools(readRecentTools());
    sync();
    // Stay in sync when history changes here or in another tab.
    window.addEventListener(RECENTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleClear = useCallback(() => {
    clearRecentTools();
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
            <History className="h-6 w-6 text-[var(--color-primary-text-strong)]" aria-hidden />
            Pick up your recent tools.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Your recent tools stay in this browser. No account is required.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClear}
          leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
        >
          Clear history
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        {recent.map((tool) => (
          <Card key={tool.id} as="article" variant="interactive" padding="md" className="flex min-h-[180px] w-full flex-col sm:w-[280px]">
            <Badge variant="outline">Recent</Badge>
            <h3 className="mt-3 flex-1 text-lg font-bold text-[var(--color-text-primary)]">{tool.title}</h3>
            <Link
              href={tool.href}
              className="group mt-4 inline-flex min-h-10 items-center gap-2 self-start text-sm font-bold text-[var(--color-primary-text-strong)] transition hover:text-[var(--color-primary-hover)]"
            >
              Open again
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
