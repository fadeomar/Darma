import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("color-palette-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ColorPaletteClient = dynamic(() => import("./ColorPaletteClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function ColorPaletteGeneratorPage() {
  const tool = getToolRegistry().getById("color-palette-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Generate accessible color palettes, harmony sets, CSS variables, and design tokens locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About color palette generation">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Color Palette Generator" description="Create harmony palettes, inspect contrast, lock swatches, and export CSS-ready color tokens.">
        <ColorPaletteClient />
      </ToolContentCard>
    </ToolPage>
  );
}
