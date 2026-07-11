import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import Article from "./Article";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("box-shadows-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const BoxShadowsGeneratorClient = dynamic(() => import("./BoxShadowsGeneratorClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-control-track)]" />,
});

export default function BoxShadowsGeneratorPage() {
  const tool = getToolRegistry().getById("box-shadows-generator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Build production-ready layered CSS shadows with presets, live component preview, performance checks, and exports for CSS variables, Tailwind, React styles, and design tokens.
        </p>
      }
      article={<ToolContentCard title="About CSS box-shadow"><Article /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Box Shadows Generator" description="Tune layers, light direction, blur, spread, radius, surface color, and copy clean reusable shadow tokens.">
        <BoxShadowsGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
