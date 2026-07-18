import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("json-formatter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const JsonFormatterClient = dynamic(() => import("./JsonFormatterClient"), {
  loading: () => (
    <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function JsonFormatterPage() {
  const tool = getToolRegistry().getById("json-formatter");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      eyebrow="Local JSON production studio"
      headerSize="compact"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
          Format, validate, conservatively repair, inspect, and audit JSON in
          your browser. Detect unsafe large integers and risky key names, import
          reusable formatter profiles, and export JSON, JavaScript, TypeScript,
          metrics, reports, or a complete ZIP pack.
        </p>
      }
      article={
        <ToolContentCard
          title="JSON syntax, number precision, inspection, and safe exports"
          description="How to review JSON beyond syntax and avoid common production mistakes."
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
        title="JSON Formatter Production Studio"
        description="Formatting, validation, repair, structured inspection, precision checks, reusable profiles, and developer-ready exports."
      >
        <JsonFormatterClient />
      </ToolContentCard>
    </ToolPage>
  );
}
