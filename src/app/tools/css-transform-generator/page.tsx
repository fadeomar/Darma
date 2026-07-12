import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("css-transform-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const CssTransformGeneratorClient = dynamic(() => import("./CssTransformGeneratorClient"), {
  loading: () => <div className="h-[860px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] dark:bg-[var(--color-code-surface)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function CssTransformGeneratorPage() {
  const tool = getToolRegistry().getById("css-transform-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Build production-ready CSS transforms with 2D/3D controls, transform-origin, hover states, entrance motion, preview checks, reduced-motion guards, and copy-ready exports.
        </p>
      }
      article={
        <ToolContentCard title="About CSS transforms, origin, motion, and exports">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSS Transform Generator" description="Tune translate, rotate, scale, skew, 3D perspective, origin, transitions, hover states, production checks, and export copy-ready code.">
        <CssTransformGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
