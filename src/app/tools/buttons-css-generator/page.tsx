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
  loading: () => <div className="h-[760px] animate-pulse rounded-3xl bg-[var(--color-control-track)]" />,
});

export default function ButtonsCssGeneratorPage() {
  const tool = getToolRegistry().getById("buttons-css-generator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={<p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">Generate polished CSS buttons with live preview states, compact controls, presets, and copy-ready CSS, HTML, React JSX, and Tailwind-style output.</p>}
      article={<ToolContentCard title="About CSS button design"><ButtonCSSGeneratorArticle /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Buttons CSS Generator" description="Design button size, shape, color, shadow, interaction, and export code in a consistent Darma tool studio.">
        <ButtonsCssGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
