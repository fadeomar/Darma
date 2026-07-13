import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("pomodoro-timer");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const PomodoroTimerClient = dynamic(() => import("./PomodoroTimerClient"), {
  loading: () => <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function PomodoroTimerPage() {
  const tool = getToolRegistry().getById("pomodoro-timer");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Run accurate focus cycles with practical presets, task and daily-target planning,
          configurable auto-start behavior, local session statistics, production checks, and
          exportable reports — entirely in your browser.
        </p>
      }
      article={
        <ToolContentCard title="Pomodoro focus workflow guide">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Pomodoro Focus Studio" description="Plan, run, inspect, and export drift-resistant focus cycles with browser-local history.">
        <PomodoroTimerClient />
      </ToolContentCard>
    </ToolPage>
  );
}
