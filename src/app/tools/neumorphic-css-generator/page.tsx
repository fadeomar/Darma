import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import NeumorphismArticle from "./NeumorphismArticle";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("neumorphic-css-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const NeumorphicCssGeneratorClient = dynamic(() => import("./NeumorphicCssGeneratorClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});

export default function NeumorphicCssGeneratorPage() {
  const tool = getToolRegistry().getById("neumorphic-css-generator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={<p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">Create soft neumorphic cards, buttons, and dashboard widgets with production checks, accessible text contrast, and copy-ready CSS exports.</p>}
      article={<ToolContentCard title="About neumorphic CSS"><NeumorphismArticle /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Neumorphic CSS Generator" description="Tune surface color, shape, radius, soft shadow depth, light direction, and export-ready tokens in one compact workspace.">
        <NeumorphicCssGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
