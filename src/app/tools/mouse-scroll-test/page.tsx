import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";
import { ToolPage } from "@/features/tools/layouts/ToolPage";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("mouse-scroll-test");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const MouseScrollTestClient = dynamic(() => import("./MouseScrollTestClient"), {
  loading: () => (
    <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function MouseScrollTestPage() {
  const tool = getToolRegistry().getById("mouse-scroll-test");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      eyebrow="Interactive challenge"
      maxWidth="wide"
      headerAlign="center"
      intro={
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          <p className="text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
            Measure wheel or touch scrolling across timed and manual sprints,
            preserve per-event movement evidence, audit comparison quality,
            restore local backups, and export Markdown, CSV, JSON, or ZIP.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="soft">Scroll Sprint</Badge>
            <Badge variant="accent">Phase 36 production studio</Badge>
            <Badge variant="outline">No upload</Badge>
            <Badge variant="outline">Per-event CSV</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard
          title="About Mouse Scroll Test"
          description="How scroll deltas, event evidence, quality checks, local backups, and production exports work."
        >
          <Article />
        </ToolContentCard>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MouseScrollTestClient />
    </ToolPage>
  );
}
