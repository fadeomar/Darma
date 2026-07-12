import dynamic from "next/dynamic";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { getToolRegistry } from "@/features/tools";
import { ToolLayoutVisualGenerator, ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import type { ColorShadesParams } from "@/types";

const DEFAULT_PARAMS: ColorShadesParams = {
  color1: "#fff1f2",
  color2: "#800020",
  steps: 9,
};

const ColorShadesClient = dynamic(() => import("./ColorShadesClient"), {
  loading: () => <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-control-track)]" />,
});

const SuggestionsSection = dynamic(() => import("./SuggestionsSection"), {
  loading: () => <div className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-control-track)]" />,
});

const ColorShadesArticle = dynamic(() => import("./ColorShadesArticle"));

export default function ColorShadesGenerator() {
  const tool = getToolRegistry().getById("color-shades");
  if (!tool) return null;

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Generate readable color scales from two colors, preview UI roles, check text contrast, and export CSS, Tailwind, JSON, SCSS, or gradient snippets.
        </p>
      }
    >
      <ToolLayoutVisualGenerator
        previewSlot={
          <div className="p-4 sm:p-5">
            <ColorShadesClient initialParams={DEFAULT_PARAMS} />
          </div>
        }
        controlsSlot={
          <div className="space-y-5">
            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Best for</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                <li>Creating brand color scales.</li>
                <li>Building Tailwind-style shade tokens.</li>
                <li>Checking readable text over every shade.</li>
                <li>Exporting CSS variables and design tokens.</li>
              </ul>
            </SurfaceCard>

            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Workflow</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                <p><strong className="text-[var(--color-text-primary)]">1.</strong> Choose start and end colors.</p>
                <p><strong className="text-[var(--color-text-primary)]">2.</strong> Pick 7, 9, 10, or 11 shades.</p>
                <p><strong className="text-[var(--color-text-primary)]">3.</strong> Check accessibility and copy exports.</p>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Supported output</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {['CSS vars', 'Tailwind', 'JSON', 'SCSS', 'Gradient', 'A11y report'].map((item) => (
                  <span key={item} className="rounded-[var(--radius-full)] bg-[var(--color-control-track)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{item}</span>
                ))}
              </div>
            </SurfaceCard>
          </div>
        }
        presetsSlot={
          <ToolContentCard title="Color inspiration" description="Choose a curated palette without adding long scrolling. The selected category stays compact and applies to the generator above.">
            <SuggestionsSection />
          </ToolContentCard>
        }
        articleSlot={<ToolContentCard title="Learn more"><ColorShadesArticle /></ToolContentCard>}
        actionsPlacement="under-preview"
      />
    </ToolPage>
  );
}
