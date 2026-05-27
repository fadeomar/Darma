import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("html-entity-encoder-decoder");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const HtmlEntityClient = dynamic(() => import("./HtmlEntityClient"), {
  loading: () => <div className="h-[680px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function HtmlEntityEncoderDecoderPage() {
  const tool = getToolRegistry().getById("html-entity-encoder-decoder");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Encode text into HTML entities or decode escaped content back into readable text without sending your input to a server.
        </p>
      }
      article={
        <ToolContentCard title="About HTML entities">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="HTML Entity Encoder / Decoder" description="Escape HTML-sensitive characters, convert symbols to named or numeric entities, and decode entities back to text.">
        <HtmlEntityClient />
      </ToolContentCard>
    </ToolPage>
  );
}
