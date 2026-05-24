import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import Article from "./Article";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("box-shadows-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const BoxShadowsGeneratorClient = dynamic(() => import("./BoxShadowsGeneratorClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" />,
});

export default function BoxShadowsGeneratorPage() {
  const tool = getToolRegistry().getById("box-shadows-generator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={<p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">Build multi-layer CSS box shadows with a live preview, compact layer editor, presets, and copy-ready output.</p>}
      article={<ToolContentCard title="About CSS box-shadow"><Article /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Box Shadows Generator" description="Tune layered shadows, preview radius, surface color, and export CSS or Tailwind-style snippets.">
        <BoxShadowsGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
