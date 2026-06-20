import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("date-difference-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const DateDifferenceClient = dynamic(() => import("./DateDifferenceClient"), {
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function DateDifferenceCalculatorPage() {
  const tool = getToolRegistry().getById("date-difference-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Find the difference between two dates in years, months, and days, or calculate an age from a birth date. Everything runs locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About date and age calculations">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Calculate the difference between two dates" description="Years, months, days, total weeks, and weekdays — calculated in your browser with no data sent to a server.">
        <DateDifferenceClient />
      </ToolContentCard>
    </ToolPage>
  );
}
