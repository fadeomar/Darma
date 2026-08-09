import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import Article from "./Article";
import CodeVideoGeneratorClient from "./CodeVideoGeneratorClient";
import "./style.css";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("code-video-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function Page() {
  const tool = getToolRegistry().getById("code-video-generator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);
  return (
    <ToolPage tool={tool} maxWidth="full" intro={<p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">Import a finished HTML, CSS, and JavaScript project, direct a deterministic typing timeline, preview every stage, and record a clean YouTube or Shorts video without an external API.</p>} article={<ToolContentCard title="How to use Darma Code Video Generator"><Article /></ToolContentCard>}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CodeVideoGeneratorClient />
    </ToolPage>
  );
}
