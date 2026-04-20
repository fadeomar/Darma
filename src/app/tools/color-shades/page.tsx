import dynamic from "next/dynamic";
import { generateShades } from "@/utils/color-shades";
import type { ColorShadesParams } from "@/types";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

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
  const initialShades = generateShades(DEFAULT_PARAMS);

  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Generate smooth transitions between two colors, inspect the shades instantly, and click any swatch to copy the value.
        </p>
      }
      sidebar={
        <SurfaceCard>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Great for
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <li>Gradient and palette exploration</li>
            <li>Design systems and brand shades</li>
            <li>Quick visual inspiration</li>
            <li>Copying color tokens fast</li>
          </ul>
        </SurfaceCard>
      }
    >
      <ToolContentCard
        title="Generate your shades"
        description="Pick the start and end colors, choose how many steps you want, and review the generated shades instantly."
      >
        <ColorShadesClient
          initialParams={DEFAULT_PARAMS}
          initialShades={initialShades}
        />
      </ToolContentCard>

      <ToolContentCard
        title="Color inspiration"
        description="Use a curated suggestion as a starting point and the generator will apply it immediately."
      >
        <SuggestionsSection />
      </ToolContentCard>

      <ToolContentCard title="Learn more">
        <ColorShadesArticle />
      </ToolContentCard>
    </ToolPageShell>
  );
}
