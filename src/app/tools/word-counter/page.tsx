import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("word-counter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const WordCounterClient = dynamic(() => import("./WordCounterClient"), {
  loading: () => <div className="h-[680px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function WordCounterPage() {
  const tool = getToolRegistry().getById("word-counter");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Count words and characters, measure reading and speaking time, inspect keyword density and document structure, compare against practical writing goals, and export a complete local audit.
        </p>
      }
      article={
        <ToolContentCard title="How to use Word Counter Studio">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Word Counter Studio"
        description="A production-ready writing audit with goals, repetition analysis, structure review, custom timing, and Markdown, JSON, CSV, or ZIP exports."
      >
        <WordCounterClient />
      </ToolContentCard>
    </ToolPage>
  );
}
