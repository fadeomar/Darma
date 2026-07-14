import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import "./style.css";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("svg-path-editor");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const SvgPathEditorClient = dynamic(() => import("./SvgPathEditorClient"), {
  loading: () => (
    <div className="min-h-[620px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function SvgPathEditorPage() {
  const tool = getToolRegistry().getById("svg-path-editor");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      eyebrow="Vector production workbench"
      headerSize="compact"
      intro={
        <div className="space-y-3">
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
            Edit SVG path commands visually, import local SVG files, inspect geometry,
            run production checks, and export SVG, React, CSS mask, JSON, or a complete ZIP pack.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="soft">Client-side</Badge>
            <Badge variant="soft">SVG file import</Badge>
            <Badge variant="soft">Production exports</Badge>
            <Badge variant="soft">Apache-2.0 attribution preserved</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard title="SVG path workflow and production guidance">
          <Article />
        </ToolContentCard>
      }
      related={
        <NextToolSuggestions toolIds={["css-transform-generator", "image-converter", "favicon-app-icon-generator", "code-preview-tool"]} />
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SvgPathEditorClient />
    </ToolPage>
  );
}
