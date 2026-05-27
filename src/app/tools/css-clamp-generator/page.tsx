import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("css-clamp-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const CssClampClient = dynamic(() => import("./CssClampClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function CssClampGeneratorPage() {
  const tool = getToolRegistry().getById("css-clamp-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Generate responsive CSS <code>clamp()</code> values for fluid typography, spacing, widths, and design token systems.
        </p>
      }
      article={
        <ToolContentCard title="About CSS clamp() and fluid sizing">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSS Clamp Generator" description="Calculate fluid CSS values locally and export ready-to-use declarations or token sets.">
        <CssClampClient />
      </ToolContentCard>
    </ToolPage>
  );
}
