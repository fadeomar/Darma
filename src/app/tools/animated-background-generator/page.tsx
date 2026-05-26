import type { Metadata } from "next";
import AnimatedBackgroundClient from "./AnimatedBackgroundClient";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Animated Background Generator | Darma Tools",
  description:
    "Generate animated CSS backgrounds with particles, bubbles, and explosion-style motion for websites, demos, and landing pages.",
};

export default function AnimatedBackgroundPage() {
  const tool = getToolRegistry().getById("animated-background-generator");

  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Build motion-heavy backgrounds visually, preview the result live, and copy the generated HTML and CSS into your project.
        </p>
      }
      sidebar={
        <SurfaceCard>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Best for
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            <li>Landing page hero sections</li>
            <li>Creative portfolio backgrounds</li>
            <li>Demo pages and motion experiments</li>
            <li>Fast CSS animation prototyping</li>
          </ul>
        </SurfaceCard>
      }
    >
      <ToolContentCard
        title="Build and preview"
        description="Choose a background variant, tweak the animation settings, and copy the generated code when it looks right."
      >
        <AnimatedBackgroundClient />
      </ToolContentCard>
    </ToolPageShell>
  );
}
