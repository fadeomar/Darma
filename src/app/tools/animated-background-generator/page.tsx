import type { Metadata } from "next";
import AnimatedBackgroundClient from "./AnimatedBackgroundClient";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";

export const metadata: Metadata = {
  title: "Animated Background Generator | Darma Tools",
  description:
    "Create beautiful animated CSS backgrounds — mesh gradients, aurora, particle fields, cyber grids, and more — for hero sections, dashboards, portfolios, and landing pages.",
};

export default function AnimatedBackgroundPage() {
  const tool = getToolRegistry().getById("animated-background-generator");

  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Start from a professional preset, preview it behind a real hero, cards, or dashboard, fine-tune the colors and motion, then copy production-ready code.
        </p>
      }
    >
      <AnimatedBackgroundClient />
    </ToolPageShell>
  );
}
