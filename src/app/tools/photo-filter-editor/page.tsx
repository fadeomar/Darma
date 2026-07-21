import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("photo-filter-editor");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const PhotoFilterEditorClient = dynamic(() => import("./PhotoFilterEditorClient"), {
  loading: () => (
    <div className="h-[640px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function PhotoFilterEditorPage() {
  const tool = getToolRegistry().getById("photo-filter-editor");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Adjust brightness, contrast, saturation, and creative filters, then export a real filtered image —
          all locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About CSS photo filters">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Photo Filter Editor"
        description="Apply CSS filters and orientation to an image with live preview, presets, and a baked PNG, JPEG, or WebP export."
      >
        <PhotoFilterEditorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
