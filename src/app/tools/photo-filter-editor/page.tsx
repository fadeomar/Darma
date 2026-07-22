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
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function PhotoFilterEditorPage() {
  const tool = getToolRegistry().getById("photo-filter-editor");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Improve, crop, compare, resize, and export photos locally — or generate reusable CSS filter code for the browser.
        </p>
      }
      article={<ToolContentCard title="About the Photo Filter & Adjustment Studio"><Article /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Photo Filter & Adjustment Studio"
        description="A privacy-first visual workspace for adjustments, before-and-after comparison, non-destructive crop, resize, project settings, CSS output, and PNG, JPEG, or WebP export."
      >
        <PhotoFilterEditorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
