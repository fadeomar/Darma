import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import NeumorphismArticle from "./NeumorphismArticle";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("neumorphic-css-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const NeumorphicCssGeneratorClient = dynamic(() => import("./NeumorphicCssGeneratorClient"), {
  loading: () => <div className="h-[760px] animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" />,
});

export default function NeumorphicCssGeneratorPage() {
  const tool = getToolRegistry().getById("neumorphic-css-generator");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={<p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">Create soft neumorphic surfaces with scoped preview styles, compact controls, and copy-ready CSS.</p>}
      article={<ToolContentCard title="About neumorphic CSS"><NeumorphismArticle /></ToolContentCard>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="Neumorphic CSS Generator" description="Tune surface color, radius, size, shadow distance, light direction, and inset/outset depth.">
        <NeumorphicCssGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
