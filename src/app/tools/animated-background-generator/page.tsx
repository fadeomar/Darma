import type { Metadata } from "next";
import "./style.css";
import AnimatedBackgroundClient from "./AnimatedBackgroundClient";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export const metadata: Metadata = {
  title: "Animated Background Generator | Darma Tools",
  description:
    "Design professional animated CSS backgrounds with polished presets, live website previews, and production-ready HTML/CSS export.",
};

export default function AnimatedBackgroundPage() {
  const tool = getToolRegistry().getById("animated-background-generator");

  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Start from polished animated background presets, tune the design visually, preview it inside a real hero section, and copy production-ready HTML/CSS for your project.
        </p>
      }
    >
      <ToolContentCard
        title="Build, preview, and export"
        description="Choose a polished preset, inspect it in a full-width hero preview, tune colors and motion, then copy code that matches the live result."
      >
        <AnimatedBackgroundClient />
      </ToolContentCard>
    </ToolPageShell>
  );
}
