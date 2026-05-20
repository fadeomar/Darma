import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import FakeScreenClient from "./FakeScreenClient";
import Article from "./Article";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("fake-screen");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function FakeScreenPage() {
  const tool = getToolRegistry().getById("fake-screen");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} maxWidth="wide" article={<Article />}>
      <Suspense fallback={<div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-sm font-bold text-[var(--color-text-muted)]">Loading Fake Screen…</div>}>
        <FakeScreenClient />
      </Suspense>
    </ToolPage>
  );
}
