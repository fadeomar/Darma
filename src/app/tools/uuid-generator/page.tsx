import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("uuid-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const UuidGeneratorClient = dynamic(() => import("./UuidGeneratorClient"), {
  loading: () => <div className="h-[520px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function UuidGeneratorPage() {
  const tool = getToolRegistry().getById("uuid-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Create one UUID or a batch of secure v4 UUIDs for development workflows. Everything runs locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About UUIDs and v4 generation">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Generate UUIDs" description="Generate, format, copy, and download secure v4 UUIDs without sending data to a server.">
        <UuidGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
