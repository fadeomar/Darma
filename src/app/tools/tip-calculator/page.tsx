import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("tip-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const TipCalculatorClient = dynamic(() => import("./TipCalculatorClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function TipCalculatorPage() {
  const tool = getToolRegistry().getById("tip-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Model the full receipt, choose the tip basis, split equally or by guest weight, compare common
          tip rates, and export a transparent payment plan—all locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About tip calculation and bill splitting">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Analyze the receipt and split the total" description="Tax, service charge, tip basis, weighted guests, rounding, scenarios, checks, and practical exports in one compact workflow.">
        <TipCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
