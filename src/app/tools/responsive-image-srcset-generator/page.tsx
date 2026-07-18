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
          Plan, audit, save, reopen, and export responsive image delivery for HTML, picture, and Next.js workflows with live slot and DPR analysis.
        </p>
      }
      article={
        <ToolContentCard title="About responsive images">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Responsive Image Delivery Studio" description="Build candidate plans, sizes rules, picture fallbacks, loading hints, production checks, and complete browser-local delivery packs.">
        <ResponsiveImageSrcsetClient />
      </ToolContentCard>
    </ToolPage>
  );
}
