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
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function PercentageCalculatorPage() {
  const tool = getToolRegistry().getById("percentage-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Work out percentages, percentage change, discounts, and tips with four simple modes —
          instantly and locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About percentage calculations">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Calculate a percentage" description="Percent of a number, percentage change, and increase or decrease — calculated in your browser with no data sent to a server.">
        <PercentageCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
