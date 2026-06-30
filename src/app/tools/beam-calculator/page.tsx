import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import BeamCalculatorShell from "./BeamCalculatorShell";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("beam-calculator");
  return tool ? buildToolMetadata(tool) : {};
}

const Article = dynamic(() => import("./Article"));

export default function BeamCalculatorPage() {
  const tool = getToolRegistry().getById("beam-calculator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Pick a preset or build your own beam, add point loads, distributed loads, and moments, then read the reactions
          and diagrams instantly. Everything stays in your browser.
        </p>
      }
      article={<ToolContentCard title="About Beam Calculator Studio"><Article /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BeamCalculatorShell />
    </ToolPage>
  );
}
