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
  loading: () => <div className="h-[520px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function WordCounterPage() {
  const tool = getToolRegistry().getById("word-counter");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Count words, characters, sentences, and paragraphs in real time, check platform length limits, and estimate reading time. Everything runs locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About counting words and characters">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Count words and characters" description="Live word, character, sentence, and paragraph counts with reading time and length limits — without sending text to a server.">
        <WordCounterClient />
      </ToolContentCard>
    </ToolPage>
  );
}
