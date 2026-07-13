import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("sitemap-xml-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const SitemapXmlClient = dynamic(() => import("./SitemapXmlClient"), {
  loading: () => <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function SitemapXmlGeneratorPage() {
  const tool = getToolRegistry().getById("sitemap-xml-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Build, validate, split, and export production-ready XML sitemaps from plain URL lists or CSV rows, entirely in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About XML sitemaps">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Sitemap XML Studio" description="Edit URL metadata, validate protocol limits, split large sets, and export XML files with a sitemap index.">
        <SitemapXmlClient />
      </ToolContentCard>
    </ToolPage>
  );
}
