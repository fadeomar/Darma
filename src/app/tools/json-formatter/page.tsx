import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("json-formatter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const JsonFormatterClient = dynamic(() => import("./JsonFormatterClient"), {
  loading: () => <div className="h-[560px] animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface-strong)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function JsonFormatterPage() {
  const tool = getToolRegistry().getById("json-formatter");
  if (!tool) notFound();

  return (
    <ToolPage tool={tool} article={<Article />}>
      <JsonFormatterClient />
    </ToolPage>
  );
}
