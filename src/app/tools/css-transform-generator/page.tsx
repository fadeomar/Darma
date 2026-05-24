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
  loading: () => <div className="h-[860px] animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" />,
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
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Design 2D and 3D transforms, transform origins, hover states, entrance animations, card tilts, and reduced-motion-ready CSS in a visual Transform Studio.
        </p>
      }
      article={
        <ToolContentCard title="About CSS transforms, origin, and motion">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="CSS Transform Generator" description="Tune translate, rotate, scale, skew, 3D perspective, transform-origin, hover states, transitions, and export copy-ready code.">
        <CssTransformGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
