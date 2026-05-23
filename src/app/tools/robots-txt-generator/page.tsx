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
  loading: () => <div className="h-[780px] animate-pulse rounded-3xl bg-slate-100" />,
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
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Build crawler rules, sitemap references, and safe robots.txt starter files locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About robots.txt files">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Robots.txt Generator" description="Create copy-ready crawler rules with Allow, Disallow, User-agent, and Sitemap directives.">
        <RobotsTxtClient />
      </ToolContentCard>
    </ToolPage>
  );
}
