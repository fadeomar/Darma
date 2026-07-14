import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("fake-screen");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const FakeScreenClient = dynamic(() => import("./FakeScreenClient"), {
  loading: () => (
    <div className="min-h-[680px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function FakeScreenPage() {
  const tool = getToolRegistry().getById("fake-screen");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      eyebrow="Fullscreen visual production studio"
      headerSize="compact"
      intro={
        <div className="space-y-3">
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
            Build safe fullscreen color tests, update simulations, error scenes,
            screensavers, and animated backgrounds. Preview instantly, run production
            checks, preserve complete share links, and export a portable browser pack.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="soft">Client-side</Badge>
            <Badge variant="soft">JSON import</Badge>
            <Badge variant="soft">Standalone HTML</Badge>
            <Badge variant="soft">Responsible-use audit</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard title="Fake Screen workflow, exports, and responsible use">
          <Article />
        </ToolContentCard>
      }
      related={
        <NextToolSuggestions toolIds={["animated-background-generator", "color-shades", "og-image-generator", "qr-code"]} />
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={<div className="min-h-[680px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]" />}>
        <FakeScreenClient />
      </Suspense>
    </ToolPage>
  );
}
