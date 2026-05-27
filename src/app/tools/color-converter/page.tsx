import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Free Color Converter - HEX, RGB, HSL and CSS Color Tool",
  description:
    "Convert HEX, RGB, and HSL colors, preview shades, check black or white text contrast, and copy clean CSS color values in your browser.",
  keywords: [
    "color converter",
    "hex to rgb",
    "rgb to hex",
    "hex to hsl",
    "hsl to rgb",
    "css color converter",
    "color palette tool",
    "frontend tool",
    "design tool",
  ],
  openGraph: {
    title: "Free Color Converter — HEX, RGB, HSL and CSS Colors",
    description:
      "Convert colors, preview shades, check text contrast, and copy CSS-ready values instantly in your browser.",
  },
};

const ColorConverterClient = dynamic(() => import("./ColorConverterClient"), {
  loading: () => <div className="h-[560px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function ColorConverterPage() {
  const tool = getToolRegistry().getById("color-converter");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Convert HEX, RGB, and HSL colors, preview the result, generate quick
          lighter and darker shades, and copy CSS-ready values. Everything runs
          locally in your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              What you can do
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
              <li>Convert HEX, RGB, and HSL color formats.</li>
              <li>Preview the color with readable black/white text.</li>
              <li>Generate lighter and darker shade suggestions.</li>
              <li>Copy CSS values and CSS custom properties.</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Supported input
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              <li><code className="font-mono text-xs">#3b82f6</code></li>
              <li><code className="font-mono text-xs">#fff</code></li>
              <li><code className="font-mono text-xs">rgb(59, 130, 246)</code></li>
              <li><code className="font-mono text-xs">hsl(217, 91%, 60%)</code></li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              The conversion happens in the browser. No color input is sent to a
              server.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Color Converter"
        description="Enter a HEX, RGB, or HSL color and copy the converted values instantly."
      >
        <ColorConverterClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
