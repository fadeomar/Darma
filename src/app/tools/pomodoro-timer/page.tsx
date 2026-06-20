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
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function PomodoroTimerPage() {
  const tool = getToolRegistry().getById("pomodoro-timer");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          A focus timer with Pomodoro presets and custom countdowns — it beeps when time is up and
          runs entirely in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About the Pomodoro timer">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Focus timer" description="Pomodoro focus blocks and breaks, or a custom countdown — running in your browser with a sound when time is up.">
        <PomodoroTimerClient />
      </ToolContentCard>
    </ToolPage>
  );
}
