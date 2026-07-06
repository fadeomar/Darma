import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Color Name Finder — Identify, Match, and Export Colors",
  description: "Find the closest human color name, source-specific names, framework matches, OKLCH, production checks, color-vision previews, semantic role guidance, accessible shade scales, and developer tokens from HEX, RGB, RGBA, HSL, HSLA, or known color names.",
};

const ColorNameFinderClient = dynamic(() => import("./ColorNameFinderClient"), {
  loading: () => <div className="h-[520px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});

export default function ColorNameFinderPage() {
  const tool = getToolRegistry().getById("color-name-finder");
  if (!tool) return null;
  return <ToolPageShell
    tool={tool}
    intro={<p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">Paste any HEX, RGB, RGBA, HSL, HSLA, or known color name and get a practical color identity: human-friendly names, source-specific matches, UI framework tokens, production checks, semantic role guidance, color-vision previews, accessible shades, and export-ready design tokens in a compact tabbed interface.</p>}
    sidebar={<div className="flex flex-col gap-5">
      <SurfaceCard><h2 className="text-lg font-bold text-[var(--color-text-primary)]">Best for</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]"><li>Naming brand and UI colors.</li><li>Comparing human, CSS, XKCD, and design names.</li><li>Finding nearby Tailwind, Bootstrap, and Material tokens.</li><li>Creating accessible shade scales and exports.</li><li>Checking production readiness before using a color in UI.</li></ul></SurfaceCard>
      <SurfaceCard><h2 className="text-lg font-bold text-[var(--color-text-primary)]">Supported input</h2><p className="mt-2 font-mono text-xs leading-6 text-[var(--color-text-secondary)]">#800020<br />#800020cc<br />rgb(128 0 32 / .8)<br />rgba(128, 0, 32, .8)<br />hsl(345 100% 25%)<br />Burgundy</p></SurfaceCard>
      <SurfaceCard><h2 className="text-lg font-bold text-[var(--color-text-primary)]">Exports</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Copy CSS variables, JSON tokens, shade maps, accessibility maps, Tailwind config snippets, and SCSS maps directly from the page.</p></SurfaceCard>
      <SurfaceCard><h2 className="text-lg font-bold text-[var(--color-text-primary)]">Privacy</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">All matching and conversion runs locally in the browser.</p></SurfaceCard>
    </div>}
  >
    <ToolContentCard title="Color Name Finder" description="Instant color identity, framework matching, compact tabbed production checks, color-vision previews, accessible shades, and developer exports without dead controls.">
      <ColorNameFinderClient />
    </ToolContentCard>
  </ToolPageShell>;
}
