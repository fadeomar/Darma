import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("robots-txt-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const RobotsTxtClient = dynamic(() => import("./RobotsTxtClient"), {
  loading: () => <div className="h-[820px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function RobotsTxtGeneratorPage() {
  const tool = getToolRegistry().getById("robots-txt-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Build multi-crawler robots.txt policies, test URL paths, import an existing file, run production checks, and export plain text, Next.js, JSON, or a deployment pack — entirely in your browser.
        </p>
      }
      article={
        <ToolContentCard title="Robots.txt deployment guide">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Robots.txt Policy Studio" description="Create auditable crawler groups with route testing, import, production checks, and framework-ready exports.">
        <RobotsTxtClient />
      </ToolContentCard>
    </ToolPage>
  );
}
