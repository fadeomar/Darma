import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("markdown-previewer");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const MarkdownPreviewerClient = dynamic(() => import("./MarkdownPreviewerClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function MarkdownPreviewerPage() {
  const tool = getToolRegistry().getById("markdown-previewer");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Write or import Markdown, inspect a sanitized responsive preview, review document quality checks, and export Markdown, standalone HTML, or a JSON report without uploading your content.
        </p>
      }
      article={
        <ToolContentCard title="Markdown previewing and production checks">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Markdown Previewer Studio" description="A compact browser-local workspace for writing, previewing, checking, and exporting Markdown documents.">
        <MarkdownPreviewerClient />
      </ToolContentCard>
    </ToolPage>
  );
}
