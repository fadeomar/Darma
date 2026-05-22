import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("meta-tag-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const MetaTagClient = dynamic(() => import("./MetaTagClient"), {
  loading: () => <div className="h-[780px] animate-pulse rounded-3xl bg-slate-100" />,
});
const Article = dynamic(() => import("./Article"));

export default function MetaTagGeneratorPage() {
  const tool = getToolRegistry().getById("meta-tag-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Generate SEO, Open Graph, and Twitter/X card tags with live previews for search snippets and social sharing cards.
        </p>
      }
      article={
        <ToolContentCard title="About SEO and Open Graph meta tags">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Meta Tag Generator" description="Create copy-ready head tags locally, preview social cards, and validate common SEO issues.">
        <MetaTagClient />
      </ToolContentCard>
    </ToolPage>
  );
}
