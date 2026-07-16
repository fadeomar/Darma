import type { Metadata } from "next";
import AnimatedBackgroundClient from "./AnimatedBackgroundClient";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";

export const metadata: Metadata = {
  title: "Animated Background Production Studio | Darma Tools",
  description:
    "Design deterministic animated CSS backgrounds, audit motion and performance, import or export editable projects, and download HTML, CSS, React, tokens, reports, and a production ZIP.",
};

export default function AnimatedBackgroundPage() {
  const tool = getToolRegistry().getById("animated-background-generator");

  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Build deterministic animated backgrounds behind real interface previews, review motion and paint-cost checks, save a reopenable project, and export deployment-ready HTML, CSS, React, tokens, reports, or a complete production pack.
        </p>
      }
    >
      <AnimatedBackgroundClient />
    </ToolPageShell>
  );
}
