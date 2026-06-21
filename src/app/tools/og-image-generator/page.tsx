import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("og-image-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const OGImageGeneratorClient = dynamic(() => import("./OGImageGeneratorClient"), {
  loading: () => <div className="h-[920px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function OGImageGeneratorPage() {
  const tool = getToolRegistry().getById("og-image-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Design Open Graph images, Twitter/X cards, LinkedIn previews, Discord/Slack unfurls, Next.js metadata snippets, and export-ready social preview packages locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About social preview images">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="OG Image / Social Preview Generator" description="Create share-ready 1200×630 preview images with platform previews, metadata snippets, validation checks, and ZIP export.">
        <OGImageGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
