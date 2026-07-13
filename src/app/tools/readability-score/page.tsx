import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("readability-score");
  return tool ? buildToolMetadata(tool) : {};
}

const ReadabilityClient = dynamic(() => import("./ReadabilityClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function ReadabilityPage() {
  const tool = getToolRegistry().getById("readability-score");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={<p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">Audit English prose against a chosen audience target, inspect difficult sentences and complex words, and export an editorial report without uploading your draft.</p>}
      article={<ToolContentCard title="Readability scoring and editorial review"><Article /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Readability Audit Studio" description="Compare five readability measures, locate the sentences driving the score, and prepare a production-ready editing report.">
        <ReadabilityClient />
      </ToolContentCard>
    </ToolPage>
  );
}
