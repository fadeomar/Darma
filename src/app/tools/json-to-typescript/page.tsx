import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("json-to-typescript");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const JsonToTypescriptClient = dynamic(() => import("./JsonToTypescriptClient"), {
  loading: () => <div className="h-[720px] animate-pulse rounded-3xl bg-slate-100" />,
});
const Article = dynamic(() => import("./Article"));

export default function JsonToTypescriptPage() {
  const tool = getToolRegistry().getById("json-to-typescript");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Convert JSON examples into TypeScript interfaces or type aliases with nested objects, arrays, optional fields, and copy-ready output.
        </p>
      }
      article={
        <ToolContentCard title="About JSON to TypeScript generation">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="JSON to TypeScript" description="Generate TypeScript declarations from JSON locally in your browser.">
        <JsonToTypescriptClient />
      </ToolContentCard>
    </ToolPage>
  );
}
