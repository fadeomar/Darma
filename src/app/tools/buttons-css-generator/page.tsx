import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import ButtonCSSGeneratorArticle from "./ButtonCSSGeneratorArticle";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("buttons-css-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ButtonsCssGeneratorClient = dynamic(() => import("./ButtonsCssGeneratorClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-control-track)]" />,
});

export default function ButtonsCssGeneratorPage() {
  const tool = getToolRegistry().getById("buttons-css-generator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={<p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">Design, preview, validate, and export production-ready CSS buttons directly in your browser.</p>}
      article={<ToolContentCard title="About CSS button design"><ButtonCSSGeneratorArticle /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Button Studio" description="Customize the button while a live preview stays visible, then copy or export the format you need.">
        <ButtonsCssGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
