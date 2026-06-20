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
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
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
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Calculate your Body Mass Index from metric or imperial measurements, see your category, and
          find a healthy weight range for your height — all in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About BMI">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Calculate your BMI" description="Body Mass Index, category, and healthy weight range from metric or imperial units — calculated in your browser with no data sent to a server.">
        <BmiCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
