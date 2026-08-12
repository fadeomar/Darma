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
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Draw and highlight, annotate screenshots, blur or pixelate sensitive regions, add editable text and arrows,
          import images, draw with stabilized pressure-aware brush presets, multi-select and group editable objects, align
          annotations, use canvas presets, recover local autosaves, save editable project files, and export locally as PNG, JPEG, or WebP.
        </p>
      }
      article={
        <ToolContentCard title="About Paint & Annotate">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Paint & Annotate"
        description="A privacy-first browser workspace for pressure-aware drawing, screenshot annotation, multi-select layout, local autosave, editable projects and objects, privacy effects, canvas presets, and local image exports."
      >
        <PaintCanvasClient />
      </ToolContentCard>
    </ToolPage>
  );
}
