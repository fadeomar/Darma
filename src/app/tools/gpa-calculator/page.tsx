import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("gpa-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const GpaCalculatorClient = dynamic(() => import("./GpaCalculatorClient"), {
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function GpaCalculatorPage() {
  const tool = getToolRegistry().getById("gpa-calculator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Calculate your grade point average on the 4.0 scale from your courses, letter grades, and
          credit hours — instantly and privately in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About GPA calculation">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Calculate your GPA" description="Add your courses, grades, and credit hours to get a credit-weighted GPA on the 4.0 scale — calculated in your browser.">
        <GpaCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
