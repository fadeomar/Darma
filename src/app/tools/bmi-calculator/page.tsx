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
          Calculate BMI from metric or imperial measurements, add waist and target weight context, save local history, and export a private health snapshot — all in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About BMI">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Body Health Snapshot" description="BMI, adult category, visual scale, healthy range, waist-to-height ratio, target planner, and local history — calculated in your browser with no data sent to a server.">
        <BmiCalculatorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
