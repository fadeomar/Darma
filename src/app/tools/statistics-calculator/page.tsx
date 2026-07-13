import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("statistics-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const StatisticsCalculatorClient = dynamic(() => import("./StatisticsCalculatorClient"), {
  loading: () => <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function StatisticsCalculatorPage() {
  const tool = getToolRegistry().getById("statistics-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Analyze numeric data with mean, median, quartiles, percentiles, sample and population spread, histogram, box plot, IQR outliers, parser diagnostics, and production-ready exports — entirely in your browser.
        </p>
      }
      article={
        <ToolContentCard title="How to review descriptive statistics responsibly">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Statistics Analysis Studio" description="Paste or import a compact data set, inspect its distribution and data quality, then export a reproducible analysis pack.">
        <StatisticsCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
