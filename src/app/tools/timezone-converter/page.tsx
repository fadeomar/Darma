import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("timezone-converter");
  return tool ? buildToolMetadata(tool) : {};
}

const TimezoneConverterClient = dynamic(() => import("./TimezoneConverterClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function TimezoneConverterPage() {
  const tool = getToolRegistry().getById("timezone-converter");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Resolve local wall times with daylight-saving checks, compare international meeting windows, rank nearby overlap slots, process schedule batches, and export CSV, ICS, JSON, JavaScript, Markdown, or ZIP locally.
        </p>
      }
      article={
        <ToolContentCard title="Time-zone planning guide">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Time Zone Planning Studio"
        description="DST-aware comparison, working-hours overlap, nearby slot ranking, batch schedules, production checks, and practical exports — all processed in your browser."
      >
        <TimezoneConverterClient />
      </ToolContentCard>
    </ToolPage>
  );
}
