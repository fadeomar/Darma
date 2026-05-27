import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("responsive-image-srcset-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ResponsiveImageSrcsetClient = dynamic(() => import("./ResponsiveImageSrcsetClient"), {
  loading: () => <div className="h-[900px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function ResponsiveImageSrcsetGeneratorPage() {
  const tool = getToolRegistry().getById("responsive-image-srcset-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Generate responsive image markup with srcset, sizes, picture sources, and Next.js Image snippets while previewing the slot width and estimated browser candidate choice.
        </p>
      }
      article={
        <ToolContentCard title="About responsive images">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Responsive Image srcset Generator" description="Build image candidates, sizes rules, picture fallbacks, Next.js Image snippets, and CSS helpers in a browser-only Image Delivery Studio.">
        <ResponsiveImageSrcsetClient />
      </ToolContentCard>
    </ToolPage>
  );
}
