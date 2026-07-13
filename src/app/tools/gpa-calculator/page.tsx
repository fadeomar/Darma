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
          Calculate semester and cumulative GPA, inspect course-level impact, and plan the grades needed to reach a target — privately in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About GPA analysis and target planning">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="GPA Analysis Studio" description="Model semester grades, projected cumulative GPA, course impact, and target scenarios on a common 4.0 scale.">
        <GpaCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
