import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("spacebar-counter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const SpacebarCounterClient = dynamic(() => import("./SpacebarCounterClient"), {
  loading: () => (
    <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function SpacebarCounterPage() {
  const tool = getToolRegistry().getById("spacebar-counter");
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
            Measure PPS across timed or manual keyboard sprints, preserve
            per-press evidence, audit comparison quality, restore local backups,
            and export Markdown, CSV, JSON, or ZIP reports.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="soft">Keyboard Sprint</Badge>
            <Badge variant="accent">Phase 37 production studio</Badge>
            <Badge variant="outline">No upload</Badge>
            <Badge variant="outline">Per-press CSV</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard
          title="About Spacebar Counter"
          description="How PPS, per-press evidence, hold-repeat detection, quality checks, local backups, and production exports work."
        >
          <Article />
        </ToolContentCard>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpacebarCounterClient />
    </ToolPage>
  );
}
