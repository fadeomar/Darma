import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("percentage-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const PercentageCalculatorClient = dynamic(() => import("./PercentageCalculatorClient"), {
  loading: () => <div className="h-[680px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function PercentageCalculatorPage() {
  const tool = getToolRegistry().getById("percentage-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Calculate percentage amounts, ratios, growth, reverse changes, discounts, markup, and margin
          with formula steps, what-if scenarios, production checks, and practical exports.
        </p>
      }
      article={
        <ToolContentCard title="Percentage formulas, denominators, and business use">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PercentageCalculatorClient />
    </ToolPage>
  );
}
