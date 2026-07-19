import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("app-screenshot-mockup-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const AppScreenshotMockupClient = dynamic(() => import("./AppScreenshotMockupClient"), {
  loading: () => <div className="h-[920px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function AppScreenshotMockupGeneratorPage() {
  const tool = getToolRegistry().getById("app-screenshot-mockup-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Turn product screenshots into polished device mockups, save and reopen settings, detect stale export packs, audit production readiness, and package PNGs, code snippets, reports, metrics, and design tokens entirely in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About screenshot mockups">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="App Screenshot Mockup Studio" description="Upload a screenshot, design a responsive device mockup, save reopenable settings, audit package freshness, and export verified PNG, code, report, token, CSV, and ZIP handoffs.">
        <AppScreenshotMockupClient />
      </ToolContentCard>
    </ToolPage>
  );
}
