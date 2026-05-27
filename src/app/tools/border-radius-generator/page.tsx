import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("border-radius-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const BorderRadiusGeneratorClient = dynamic(() => import("./BorderRadiusGeneratorClient"), {
  loading: () => <div className="h-[860px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function BorderRadiusGeneratorPage() {
  const tool = getToolRegistry().getById("border-radius-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Design rounded corners, elliptical border-radius shapes, organic blobs, image masks, and animated UI decorations with copy-ready CSS.
        </p>
      }
      article={
        <ToolContentCard title="About CSS border-radius and blob shapes">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSS Border Radius Generator" description="Create normal rounded corners, advanced slash syntax, organic blobs, image masks, animation keyframes, and exportable code.">
        <BorderRadiusGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
