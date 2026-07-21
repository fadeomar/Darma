import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("paint-canvas");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const PaintCanvasClient = dynamic(() => import("./PaintCanvasClient"), {
  loading: () => (
    <div className="h-[640px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function PaintCanvasPage() {
  const tool = getToolRegistry().getById("paint-canvas");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          A quick drawing canvas with brush, shapes, colors, undo/redo, and PNG or JPEG export — works with
          mouse, touch, and pen, all in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About the paint canvas">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Paint Canvas"
        description="Draw freehand and shapes on a canvas with colors, brush sizes, fill, undo/redo, and image export."
      >
        <PaintCanvasClient />
      </ToolContentCard>
    </ToolPage>
  );
}
