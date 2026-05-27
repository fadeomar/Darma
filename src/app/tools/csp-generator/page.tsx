import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("csp-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const CspGeneratorClient = dynamic(() => import("./CspGeneratorClient"), {
  loading: () => <div className="h-[860px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function CspGeneratorPage() {
  const tool = getToolRegistry().getById("csp-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Build Content Security Policy headers with presets, directive chips, risk warnings, import parsing, and deployment-ready snippets for modern web apps.
        </p>
      }
      article={
        <ToolContentCard title="About Content Security Policy">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSP Generator" description="Create, understand, validate, and export Content Security Policy headers with guided security warnings.">
        <CspGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
