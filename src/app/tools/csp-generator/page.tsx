import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

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
          Build a Content Security Policy in four steps: pick a mode, tick the services you use, add your own domains, then copy the format for your stack.
        </p>
      }
      article={
        <SurfaceCard className="p-0">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6">
              <span className="min-w-0">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Reference</span>
                <span className="mt-1 block text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Learn about CSP</span>
                <span className="mt-1 block text-sm leading-6 text-[var(--color-text-secondary)]">
                  What Content Security Policy protects against, nonces vs. hashes, directives, and deployment tips.
                </span>
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-[var(--color-border-subtle)] p-5 sm:p-6">
              <Article />
            </div>
          </details>
        </SurfaceCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSP Generator" description="A simple, guided builder for Content Security Policy headers — with live output, copy buttons, and clear warnings.">
        <CspGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
