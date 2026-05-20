import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolLayoutVisualGenerator, ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import type { ColorShadesParams } from "@/types";
import { generateShades } from "@/utils/color-shades";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("color-shades");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const DEFAULT_PARAMS: ColorShadesParams = {
  color1: "#ffffff",
  color2: "#000000",
  steps: 5,
};

const ColorShadesClient = dynamic(() => import("./ColorShadesClient"), {
  loading: () => <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />,
});

const SuggestionsSection = dynamic(() => import("./SuggestionsSection"), {
  loading: () => <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />,
});

const ColorShadesArticle = dynamic(() => import("./ColorShadesArticle"));

export default function ColorShadesGenerator() {
  const tool = getToolRegistry().getById("color-shades");
  if (!tool) notFound();
  const initialShades = generateShades(DEFAULT_PARAMS);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Generate smooth transitions between two colors, inspect the shades instantly, and click any swatch to copy the value.
        </p>
      }
    >
      <ToolLayoutVisualGenerator
        previewSlot={
          <div className="p-5">
            <ColorShadesClient initialParams={DEFAULT_PARAMS} initialShades={initialShades} />
          </div>
        }
        controlsSlot={
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Great for</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Gradient and palette exploration</li>
              <li>Design systems and brand shades</li>
              <li>Quick visual inspiration</li>
              <li>Copying color tokens fast</li>
            </ul>
          </SurfaceCard>
        }
        presetsSlot={
          <ToolContentCard title="Color inspiration" description="Use a curated suggestion as a starting point and the generator will apply it immediately.">
            <SuggestionsSection />
          </ToolContentCard>
        }
        articleSlot={<ToolContentCard title="Learn more"><ColorShadesArticle /></ToolContentCard>}
      />
    </ToolPage>
  );
}
