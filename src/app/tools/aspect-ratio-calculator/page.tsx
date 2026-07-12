import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("aspect-ratio-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const AspectRatioCalculatorClient = dynamic(() => import("./AspectRatioCalculatorClient"), {
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function AspectRatioCalculatorPage() {
  const tool = getToolRegistry().getById("aspect-ratio-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          A production-focused aspect ratio studio for social posts, videos, web banners, app cards, and developer handoff: solve dimensions, preview safe zones, calculate crop loss, fit within bounds, and export clean CSS, HTML, React, and design tokens.
        </p>
      }
      article={
        <ToolContentCard title="About the aspect ratio studio">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Aspect ratio studio" description="Pick a real target size, solve dimensions, preview safe zones, calculate crop and fit sizes, then copy production-ready snippets — all locally in your browser.">
        <AspectRatioCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
