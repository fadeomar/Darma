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
  loading: () => <div className="h-[860px] animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" />,
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
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Build responsive components with CSS container queries, visual breakpoints, active query badges, and copy-ready CSS, HTML, React JSX, or explanation output.
        </p>
      }
      article={
        <ToolContentCard title="About CSS container queries">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSS Container Query Generator" description="Design parent-size responsive components with container settings, breakpoints, live preview, style rules, warnings, and generated code.">
        <ContainerQueryGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
