import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

const tool = getToolRegistry().getById("contrast-checker")!;
export const metadata = buildToolMetadata(tool);
const ContrastCheckerClient = dynamic(() => import("./ContrastCheckerClient"), {
  loading: () => <div className="min-h-[650px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" aria-label="Loading contrast checker" />,
});
export default function ContrastCheckerPage() {
  return <ToolPageShell tool={tool} description="Find out what’s readable. Make it better." eyebrow={null}>
    <ContrastCheckerClient />
    <ToolContentCard title="A little more clarity"><div className="grid gap-6 text-sm leading-7 text-[var(--color-text-secondary)] md:grid-cols-2">
      <div><h2 className="font-bold text-[var(--color-text-primary)]">What do the results mean?</h2><p>Normal text needs 4.5:1 for AA or 7:1 for AAA. Large text needs 3:1 for AA or 4.5:1 for AAA. Large means at least 24 CSS pixels, or 14 points (about 18.67 CSS pixels) in bold.</p><p className="mt-3">Meaningful graphics and visual information needed to identify interface controls or states require 3:1 against adjacent colors under WCAG 1.4.11. There is no separate AAA threshold for that criterion.</p></div>
      <div><h2 className="font-bold text-[var(--color-text-primary)]">Small details make a difference.</h2><p>Results use the full calculated ratio, not the rounded display. Text opacity is blended over your opaque background before calculating contrast. Preview headline styling does not automatically select a different target.</p><p className="mt-3">Use the original CSS colors when available. Gradients, images, interaction states, and using color alone need additional review. These checks do not certify a page as accessible.</p><p className="mt-3"><a className="underline underline-offset-4" href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html">WCAG text contrast guidance</a> · <a className="underline underline-offset-4" href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html">Non-text contrast guidance</a></p></div>
    </div></ToolContentCard>
  </ToolPageShell>;
}
