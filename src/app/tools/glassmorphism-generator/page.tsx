import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("glassmorphism-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const GlassmorphismGeneratorClient = dynamic(() => import("./GlassmorphismGeneratorClient"), {
  loading: () => <div className="h-[860px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function GlassmorphismGeneratorPage() {
  const tool = getToolRegistry().getById("glassmorphism-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Build production-ready glass UI with backdrop blur, tint, border, shadow, animated scenes, readability checks, fallbacks, and copy-ready CSS or React exports.
        </p>
      }
      article={
        <ToolContentCard title="About glassmorphism and backdrop-filter">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Glassmorphism CSS Generator" description="Tune the frosted glass effect, preview it over real scenes, and export CSS, variables, fallbacks, React styles, Tailwind starters, and design tokens.">
        <GlassmorphismGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
