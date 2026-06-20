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
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
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
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Calculate the tip and split a bill between any number of people, with optional rounding —
          instantly and locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About tipping and splitting bills">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Calculate the tip and split the bill" description="Tip amount, total, and per-person share for any group — calculated in your browser with no data sent to a server.">
        <TipCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
