import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("uuid-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const UuidGeneratorClient = dynamic(() => import("./UuidGeneratorClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function UuidGeneratorPage() {
  const tool = getToolRegistry().getById("uuid-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Generate secure UUID v4 or time-ordered UUID v7 batches, validate existing identifiers, inspect version and variant fields, and export fixture-ready JSON, CSV, SQL, TypeScript, or ZIP packs. Everything runs locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="UUID v4, UUID v7, validation, and production use">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="UUID Generator & Inspector" description="Create secure identifiers, inspect UUID fields, review production checks, and export practical developer formats.">
        <UuidGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
