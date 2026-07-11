import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Free Color Converter - HEX, RGB, HSL, HWB, CMYK, LAB and OKLCH",
  description:
    "Convert HEX, RGB, HSL, RGBA, HSLA, CSS names, HWB, CMYK, LAB, and OKLCH colors, preview accessibility, generate shade scales, and copy developer-ready tokens.",
  keywords: [
    "color converter",
    "hex to rgb",
    "rgb to hex",
    "hex to hsl",
    "hsl to rgb",
    "rgba converter",
    "oklch converter",
    "lab color converter",
    "cmyk converter",
    "css color converter",
    "design token color tool",
  ],
  openGraph: {
    title: "Free Color Converter — HEX, RGB, HSL, LAB and OKLCH",
    description:
      "Convert colors, check accessibility, generate shade scales, and copy CSS, Tailwind, JSON, and SCSS tokens in your browser.",
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
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Convert color values across practical CSS and design formats, validate black or white text contrast, generate an accessible shade scale, and copy ready-to-use design tokens without leaving the browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Best for
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
              <li>Converting colors between CSS, design, and print-friendly formats.</li>
              <li>Checking whether black or white text is safer on a color.</li>
              <li>Creating a quick accessible shade scale from one color.</li>
              <li>Exporting CSS variables, Tailwind tokens, JSON, or SCSS maps.</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Supported input
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              <li><code className="font-mono text-xs">#3b82f6</code></li>
              <li><code className="font-mono text-xs">#3b82f680</code></li>
              <li><code className="font-mono text-xs">rgb(59 130 246 / .8)</code></li>
              <li><code className="font-mono text-xs">rgba(59, 130, 246, .8)</code></li>
              <li><code className="font-mono text-xs">hsl(217 91% 60%)</code></li>
              <li><code className="font-mono text-xs">rebeccapurple</code></li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              All conversion, contrast checks, shade generation, and exports run locally in your browser.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Color Converter"
        description="Enter a color once and get production-ready conversions, contrast checks, shade scales, and exports."
      >
        <ColorConverterClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
