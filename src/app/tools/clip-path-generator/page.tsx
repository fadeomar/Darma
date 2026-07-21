import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("clip-path-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ClipPathGeneratorClient = dynamic(() => import("./ClipPathGeneratorClient"), {
  loading: () => (
    <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function ClipPathGeneratorPage() {
  const tool = getToolRegistry().getById("clip-path-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Draw CSS <code>clip-path</code> polygons visually — drag points, pick presets, preview on your own image,
          and copy production-ready CSS. Everything runs locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About CSS clip-path polygons">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard
        title="CSS Clip Path Generator"
        description="Design polygon clip-path shapes with draggable points, presets, image preview, keyboard editing, and copy-ready CSS, Tailwind, or React output."
      >
        <ClipPathGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
