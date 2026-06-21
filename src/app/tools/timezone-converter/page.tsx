import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> { const tool = getToolRegistry().getById("timezone-converter"); return tool ? buildToolMetadata(tool) : {}; }
const TimezoneConverterClient = dynamic(() => import("./TimezoneConverterClient"), { loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" /> });
const Article = dynamic(() => import("./Article"));

export default function TimezoneConverterPage() {
  const tool = getToolRegistry().getById("timezone-converter");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);
  return <ToolPage tool={tool} maxWidth="wide" intro={<p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">Compare one moment across multiple cities with daylight-saving-aware browser formatting.</p>} article={<ToolContentCard title="About time zone conversion"><Article /></ToolContentCard>}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><ToolContentCard title="Time Zone Converter" description="Choose a source moment and compare it across the time zones that matter to you."><TimezoneConverterClient /></ToolContentCard></ToolPage>;
}
