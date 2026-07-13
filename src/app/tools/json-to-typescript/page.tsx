import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("json-to-typescript");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const JsonToTypescriptClient = dynamic(() => import("./JsonToTypescriptClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function JsonToTypescriptPage() {
  const tool = getToolRegistry().getById("json-to-typescript");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Turn representative JSON into TypeScript declarations, inspect structural inference risks, and export Zod, JSON Schema, audit reports, or a complete contract pack—all locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="From JSON samples to production contracts">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="JSON Contract Studio" description="Infer compile-time types, generate runtime-schema starters, and review the sample before production use.">
        <JsonToTypescriptClient />
      </ToolContentCard>
    </ToolPage>
  );
}
