import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("meta-tag-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const MetaTagClient = dynamic(() => import("./MetaTagClient"), {
  loading: () => <div className="h-[780px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function MetaTagGeneratorPage() {
  const tool = getToolRegistry().getById("meta-tag-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Build, audit, preview, save, and export SEO, Open Graph, and X/Twitter metadata with browser-local project files and production handoff formats.
        </p>
      }
      article={
        <ToolContentCard title="How to ship reliable page metadata">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Meta Tag Studio" description="Create one metadata source, audit release risks, preview copy, and export framework-ready files.">
        <MetaTagClient />
      </ToolContentCard>
    </ToolPage>
  );
}
