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
  loading: () => <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function DateDifferenceCalculatorPage() {
  const tool = getToolRegistry().getById("date-difference-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      eyebrow="Calendar and scheduling utility"
      headerSize="compact"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Compare calendar dates or fixed-offset date-times, calculate inclusive and working-day totals,
          inspect milestones, and export a complete local audit without uploading your schedule.
        </p>
      }
      article={
        <ToolContentCard title="About date, duration, and workday calculations">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DateDifferenceClient />
    </ToolPage>
  );
}
