import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("regex-tester");
  return tool ? buildToolMetadata(tool) : {};
}

const RegexTesterClient = dynamic(() => import("./RegexTesterClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function RegexTesterPage() {
  const tool = getToolRegistry().getById("regex-tester");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Build, reopen, and audit JavaScript regular expressions with guarded previews, capture inspection, replacement evidence, portable project files, developer modules, and a complete production ZIP.
        </p>
      }
      article={
        <ToolContentCard title="JavaScript regex testing guide">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="Regex Tester Studio"
        description="Test native JavaScript RegExp behavior locally, guard risky previews, preserve the project, and export code plus review evidence."
      >
        <RegexTesterClient />
      </ToolContentCard>
    </ToolPage>
  );
}
