import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import "./style.css";

export const metadata: Metadata = {
  title: "SVG Path Editor | Darma Tools",
  description:
    "Edit, transform, optimize, preview, copy, and download SVG path data visually in your browser.",
  keywords: [
    "svg path editor",
    "svg editor",
    "svg path optimizer",
    "vector editor",
    "path data",
    "developer tool",
    "designer tool",
  ],
};

const SvgPathEditorClient = dynamic(() => import("./SvgPathEditorClient"), {
  loading: () => (
    <div className="min-h-[620px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]" />
  ),
});

export default function SvgPathEditorPage() {
  const tool = getToolRegistry().getById("svg-path-editor");
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
