import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
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

export default function SvgPathEditorPage() {
  const tool = getToolRegistry().getById("svg-path-editor");
  if (!tool) notFound();

  return (
    <ToolPage tool={tool} maxWidth="full">
      <SvgPathEditorClient />
    </ToolPage>
  );
}
