import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import CodePreviewTool from "@/sections/CodePreviewTool";
import Article from "./Article";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("code-preview-tool");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function Page() {
  const tool = getToolRegistry().getById("code-preview-tool");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Build, audit, save, reopen, and export responsive HTML, CSS, and JavaScript projects in a compact browser-local studio with sandboxed device previews and production handoff files.
        </p>
      }
      article={
        <ToolContentCard title="How to use the Code Preview Studio">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CodePreviewTool />
    </ToolPage>
  );
}
