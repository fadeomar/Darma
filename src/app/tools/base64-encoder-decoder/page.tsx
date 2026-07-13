import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("base64-encoder-decoder");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const Base64Client = dynamic(() => import("./Base64Client"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function Base64EncoderDecoderPage() {
  const tool = getToolRegistry().getById("base64-encoder-decoder");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Encode Unicode text or raw files, decode Base64 and Base64URL into text or binary bytes, inspect Data URLs and MIME signatures, and export a production handoff pack — entirely in your browser.
        </p>
      }
      article={
        <ToolContentCard title="How to use Base64 safely in production">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Base64 File & Text Studio" description="Transform text or binary files, validate payload structure, inspect decoded bytes, and export reusable implementation artifacts.">
        <Base64Client />
      </ToolContentCard>
    </ToolPage>
  );
}
