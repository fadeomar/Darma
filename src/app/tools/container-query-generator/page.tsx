import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("container-query-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ContainerQueryGeneratorClient = dynamic(() => import("./ContainerQueryGeneratorClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function ContainerQueryGeneratorPage() {
  const tool = getToolRegistry().getById("container-query-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Design production-ready CSS container queries with presets, active breakpoint previews, fallback CSS, framework starters, tokens, and implementation checks in one compact workspace.
        </p>
      }
      article={
        <ToolContentCard title="About CSS container queries">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSS Container Query Generator" description="Create reusable responsive components that adapt to parent size instead of viewport size.">
        <ContainerQueryGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
