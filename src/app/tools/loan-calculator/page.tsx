import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> { const tool = getToolRegistry().getById("loan-calculator"); return tool ? buildToolMetadata(tool) : {}; }
const LoanCalculatorClient = dynamic(() => import("./LoanCalculatorClient"), { loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" /> });
const Article = dynamic(() => import("./Article"));

export default function LoanCalculatorPage() {
  const tool = getToolRegistry().getById("loan-calculator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);
  return <ToolPage tool={tool} maxWidth="wide" intro={<p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">Estimate fixed-rate loan payments, total interest, and annual amortization locally in your browser.</p>} article={<ToolContentCard title="About loan payments"><Article /></ToolContentCard>}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><ToolContentCard title="Loan Calculator" description="Enter a loan amount, fixed interest rate, and term to see the full repayment estimate."><LoanCalculatorClient /></ToolContentCard></ToolPage>;
}
