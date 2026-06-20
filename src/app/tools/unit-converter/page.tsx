import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("unit-converter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const UnitConverterClient = dynamic(() => import("./UnitConverterClient"), {
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function UnitConverterPage() {
  const tool = getToolRegistry().getById("unit-converter");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Convert between metric and imperial units for length, weight, temperature, volume, area,
          speed, digital storage, and time — instantly and locally in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About unit conversion">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Convert between units" description="Length, weight, temperature, volume, area, speed, digital storage, and time — calculated in your browser with no data sent to a server.">
        <UnitConverterClient />
      </ToolContentCard>
    </ToolPage>
  );
}
