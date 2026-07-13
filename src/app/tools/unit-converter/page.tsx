import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("unit-converter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const UnitConverterClient = dynamic(() => import("./UnitConverterClient"), {
  loading: () => <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function UnitConverterPage() {
  const tool = getToolRegistry().getById("unit-converter");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Convert metric, US customary, imperial, SI decimal, and IEC binary units with clear formulas,
          batch processing, standard warnings, precision controls, and production-ready exports.
        </p>
      }
      article={
        <ToolContentCard title="Unit systems, precision, and conversion standards">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <UnitConverterClient />
    </ToolPage>
  );
}
