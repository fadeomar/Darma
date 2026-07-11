import type { Metadata } from "next";
import AnimatedBackgroundClient from "./AnimatedBackgroundClient";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";

export const metadata: Metadata = {
  title: "Animated Background Generator | Darma Tools",
  description:
    "Create production-ready animated CSS backgrounds with mesh gradients, particles, motion controls, real UI previews, reduced-motion support, and exportable HTML, CSS, React, Tailwind, and token snippets.",
};

export default function AnimatedBackgroundPage() {
  const tool = getToolRegistry().getById("animated-background-generator");

  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Start from a professional animated background preset, preview it behind real hero, card, or dashboard content, fine-tune performance-sensitive motion, then copy production-ready code with reduced-motion support.
        </p>
      }
    >
      <AnimatedBackgroundClient />
    </ToolPageShell>
  );
}
