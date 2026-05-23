import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("flexbox-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const FlexboxGeneratorClient = dynamic(() => import("./FlexboxGeneratorClient"), {
  loading: () => <div className="h-[860px] animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" />,
});
const Article = dynamic(() => import("./Article"));

export default function FlexboxGeneratorPage() {
  const tool = getToolRegistry().getById("flexbox-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Design flexible row and column layouts visually, tune alignment and item sizing, preview wrapping behavior, and copy clean CSS, HTML, React, or Tailwind-style starter code.
        </p>
      }
      article={
        <ToolContentCard title="About Flexbox layouts">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Flexbox Generator" description="Build one-dimensional CSS layouts with presets, axis overlays, item sizing controls, responsive behavior, warnings, and copy-ready code.">
        <FlexboxGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
