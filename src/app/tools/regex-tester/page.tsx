import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("regex-tester");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const RegexTesterClient = dynamic(() => import("./RegexTesterClient"), {
  loading: () => <div className="h-[680px] animate-pulse rounded-3xl bg-slate-100" />,
});
const Article = dynamic(() => import("./Article"));

export default function RegexTesterPage() {
  const tool = getToolRegistry().getById("regex-tester");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Test JavaScript regular expressions with live match highlighting, capture group details, flags, and replacement previews. Everything runs locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About JavaScript regular expressions">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Regex Tester" description="Build, test, debug, and preview JavaScript regex replacements without sending text to a server.">
        <RegexTesterClient />
      </ToolContentCard>
    </ToolPage>
  );
}
