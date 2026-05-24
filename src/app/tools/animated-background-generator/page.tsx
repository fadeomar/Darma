import { notFound } from "next/navigation";
import AnimatedBackgroundClient from "./AnimatedBackgroundClient";
import Article from "./Article";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

const tool = getToolRegistry().getById("animated-background-generator");

export const metadata = tool ? buildToolMetadata(tool) : {};

export default function AnimatedBackgroundPage() {
  if (!tool) notFound();

  return (
    <ToolPage
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">
          Build polished CSS backgrounds visually, preview motion live, and copy CSS, Tailwind-friendly, or React snippets for landing pages and product UI.
        </p>
      }
      article={<Article />}
      maxWidth="wide"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ToolContentCard
          title="Build and preview"
          description="Choose a preset, tune the animation controls, and copy the generated code when it looks right."
        >
          <AnimatedBackgroundClient />
        </ToolContentCard>
        <aside className="space-y-6">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Best for</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
              <li>Landing page hero sections</li>
              <li>Creative portfolio backgrounds</li>
              <li>Dashboard empty states</li>
              <li>Fast CSS animation prototyping</li>
            </ul>
          </SurfaceCard>
        </aside>
      </div>
    </ToolPage>
  );
}
