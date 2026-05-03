import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolMetadata } from "@/features/tools/seo";
import "./style.css";

const svgPathEditorTool = getToolRegistry().getById("svg-path-editor");

export const metadata: Metadata = svgPathEditorTool
  ? buildToolMetadata(svgPathEditorTool)
  : {
      title: "SVG Path Editor | Darma Tools",
      description:
        "Edit, transform, optimize, preview, copy, and download SVG path data visually in your browser.",
    };

const SvgPathEditorClient = dynamic(() => import("./SvgPathEditorClient"), {
  loading: () => (
    <div className="min-h-[620px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]" />
  ),
});

export default function SvgPathEditorPage() {
  const tool = svgPathEditorTool;
  if (!tool) return null;

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Client-side</Badge>
          <Badge variant="soft">No upload needed</Badge>
          <Badge variant="soft">Apache-2.0 attribution preserved</Badge>
        </div>
      }
    >
      <SvgPathEditorClient />
    </ToolPage>
  );
}
