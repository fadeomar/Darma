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
      intro={<p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">Generate production-ready CSS buttons with live states, accessibility checks, compact controls, and copy-ready CSS, HTML, React, Tailwind, variables, and token exports.</p>}
      article={<ToolContentCard title="About CSS button design"><ButtonCSSGeneratorArticle /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Buttons CSS Generator" description="Design button variants, states, colors, spacing, focus styles, and implementation exports in one clean Darma studio.">
        <ButtonsCssGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
