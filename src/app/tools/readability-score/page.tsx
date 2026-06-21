import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> { const tool = getToolRegistry().getById("readability-score"); return tool ? buildToolMetadata(tool) : {}; }
const ReadabilityClient = dynamic(() => import("./ReadabilityClient"), { loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" /> });
const Article = dynamic(() => import("./Article"));

export default function ReadabilityPage() {
  const tool = getToolRegistry().getById("readability-score");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);
  return <ToolPage tool={tool} maxWidth="wide" intro={<p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">Measure reading ease, grade level, and sentence complexity without sending your writing anywhere.</p>} article={<ToolContentCard title="About readability scores"><Article /></ToolContentCard>}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><ToolContentCard title="Readability Score" description="Paste prose to calculate three established readability measures instantly in your browser."><ReadabilityClient /></ToolContentCard></ToolPage>;
}
