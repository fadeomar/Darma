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
          Edit photos with visual filters, local background removal, Spot Heal, selective HSL, tone curves, 3D LUTs,
          stacked looks, crop, batch processing with optional per-image background removal, responsive before-and-after
          comparison, and full-resolution export — free, private, and without uploading your source image.
        </p>
      }
      article={
        <ToolContentCard title="About the free photo editor">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Free Photo Filter Editor"
        description="Professional local photo filters, on-device background removal, Spot Heal, HSL, curves, .cube LUTs, custom presets, batch ZIP processing with optional batch background removal, and PNG, JPEG, or WebP export — no signup, paywall, source-image upload, or watermark."
      >
        <PhotoFilterEditorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
