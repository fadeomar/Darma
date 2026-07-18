import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("bmi-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const BmiCalculatorClient = dynamic(() => import("./BmiCalculatorClient"), {
  loading: () => (
    <div className="h-[520px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function BmiCalculatorPage() {
  const tool = getToolRegistry().getById("bmi-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Calculate an adult BMI screening snapshot, add optional waist and
          target context, verify whether standard adult interpretation is
          applicable, preserve measurements when changing units, and export a
          private report pack locally.
        </p>
      }
      article={
        <ToolContentCard title="BMI screening method, limits, and privacy">
          <Article />
        </ToolContentCard>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolContentCard
        title="BMI Screening Studio"
        description="Adult BMI, waist-to-height context, applicability checks, local history, validated JSON import, and private report exports."
      >
        <BmiCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
