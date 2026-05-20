import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Free CSS Gradient Generator - Create Linear and Radial Gradients",
  description:
    "Create CSS linear and radial gradients, adjust color stops, preview the result, and copy clean CSS background code in your browser.",
  keywords: [
    "css gradient generator",
    "linear gradient generator",
    "radial gradient generator",
    "css background generator",
    "gradient css",
    "color stops",
    "frontend tool",
    "design tool",
  ],
  openGraph: {
    title: "Free CSS Gradient Generator — Linear and Radial Gradients",
    description:
      "Design gradients visually, tune color stops and angles, then copy clean CSS instantly in your browser.",
  },
};

const CssGradientGeneratorClient = dynamic(() => import("./CssGradientGeneratorClient"), {
  loading: () => <div className="h-[640px] animate-pulse rounded-3xl bg-slate-100" />,
});

const Article = dynamic(() => import("./Article"));

export default function CssGradientGeneratorPage() {
  const tool = getToolRegistry().getById("css-gradient-generator");
  if (!tool) notFound();

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Create CSS linear and radial gradients, adjust color stops, preview the
          result live, and copy clean CSS background code. Everything runs
          locally in your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              What you can do
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Create linear and radial CSS gradients.</li>
              <li>Adjust angle, shape, colors, and stop positions.</li>
              <li>Use presets, random gradients, and reverse stops.</li>
              <li>Copy CSS background code or a full CSS class.</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Good for
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <li>Hero backgrounds</li>
              <li>Cards and banners</li>
              <li>Buttons and UI surfaces</li>
              <li>Frontend prototypes</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              The gradient is generated in your browser. No colors or CSS are
              sent to a server.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="CSS Gradient Generator"
        description="Design a gradient visually and copy the generated CSS instantly."
      >
        <CssGradientGeneratorClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
