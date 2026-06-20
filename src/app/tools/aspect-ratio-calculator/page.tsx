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
          Solve a missing width or height from an aspect ratio, and reduce any pixel size to its
          simplest ratio — for video, images, and social posts, all in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About aspect ratios">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Calculate an aspect ratio" description="Pick a ratio, enter one dimension, and the other is solved — plus the simplified ratio of any pixel size, calculated in your browser.">
        <AspectRatioCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
