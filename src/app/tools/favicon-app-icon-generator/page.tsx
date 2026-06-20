import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("favicon-app-icon-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const FaviconAppIconClient = dynamic(() => import("./FaviconAppIconClient"), {
  loading: () => <div className="h-[920px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function FaviconAppIconGeneratorPage() {
  const tool = getToolRegistry().getById("favicon-app-icon-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Generate favicons, Apple touch icons, PWA icons, maskable previews, web manifests, Next.js setup files, and validation checks locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About favicons and app icons">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Favicon & App Icon Generator" description="Create a complete launch-ready favicon package from an image, SVG, initials, or emoji.">
        <FaviconAppIconClient />
      </ToolContentCard>
    </ToolPage>
  );
}
