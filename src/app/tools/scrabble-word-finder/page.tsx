import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("scrabble-word-finder");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ScrabbleWordFinderClient = dynamic(() => import("./ScrabbleWordFinderClient"), {
  loading: () => (
    <div className="h-[560px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function ScrabbleWordFinderPage() {
  const tool = getToolRegistry().getById("scrabble-word-finder");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Find every word you can play from your rack, scored with standard Scrabble values. Supports blank
          tiles and your own dictionary — all in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About the Scrabble word finder">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Scrabble Word Finder"
        description="Enter your rack (use ? for blanks) to find scored, playable words with filters, sorting, and optional custom dictionaries."
      >
        <ScrabbleWordFinderClient />
      </ToolContentCard>
    </ToolPage>
  );
}
