import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("text-cleaner");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const TextCleanerClient = dynamic(() => import("./TextCleanerClient"), {
  loading: () => (
    <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function TextCleanerPage() {
  const tool = getToolRegistry().getById("text-cleaner");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      eyebrow="Local text workflow studio"
      headerSize="compact"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
          Clean copied documents, normalize Arabic text, extract structured
          values, format lists, and convert case with ordered browser-local
          workflows. Compare what changed, review production checks, import
          reusable workflow JSON, and export cleaned text with reports or a ZIP
          pack.
        </p>
      }
      article={
        <ToolContentCard
          title="Text cleanup workflows, ordering, privacy, and exports"
          description="How to combine transformations safely and review the result before replacing source text."
        >
          <Article />
        </ToolContentCard>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolContentCard
        title="Text Cleaner Studio"
        description="Ordered cleanup pipelines, Arabic normalization, extraction, diff-aware metrics, validated workflow import, and local production exports."
      >
        <TextCleanerClient tool={{ id: tool.id, title: tool.title }} />
      </ToolContentCard>
    </ToolPage>
  );
}
