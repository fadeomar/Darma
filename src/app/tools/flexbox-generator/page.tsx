import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("flexbox-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const FlexboxGeneratorClient = dynamic(() => import("./FlexboxGeneratorClient"), {
  loading: () => <div className="h-[860px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function FlexboxGeneratorPage() {
  const tool = getToolRegistry().getById("flexbox-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Build responsive Flexbox layouts visually, check wrapping and alignment behavior, then export production CSS, variables, HTML, React, Tailwind starter code, and design tokens.
        </p>
      }
      article={
        <ToolContentCard title="About Flexbox layouts">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Flexbox Generator" description="Design one-dimensional layouts with presets, quick actions, selected-item controls, responsive rules, production checks, and copy-ready code exports.">
        <FlexboxGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
