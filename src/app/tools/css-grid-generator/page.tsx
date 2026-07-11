import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("css-grid-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const CssGridGeneratorClient = dynamic(() => import("./CssGridGeneratorClient"), {
  loading: () => <div className="h-[860px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function CssGridGeneratorPage() {
  const tool = getToolRegistry().getById("css-grid-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Design responsive CSS Grid layouts visually, tune track templates, switch between line placement and named areas, preview breakpoints, and export CSS, HTML, React, Tailwind starters, variables, and design tokens.
        </p>
      }
      article={
        <ToolContentCard title="About production CSS Grid layouts">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSS Grid Generator" description="Build production-ready grid layouts with presets, selectable items, template editing, responsive rules, validation, and copy-ready exports.">
        <CssGridGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
