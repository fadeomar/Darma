import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("mouse-scroll-test");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const MouseScrollTestClient = dynamic(() => import("./MouseScrollTestClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function MouseScrollTestPage() {
  const tool = getToolRegistry().getById("mouse-scroll-test");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      eyebrow="Interactive challenge"
      maxWidth="wide"
      headerAlign="center"
      intro={
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          <p className="text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
            A polished Darma fun tool for testing mouse wheel, touchpad, or touch scroll speed with the shared challenge UI system, live arena, countdown, timed modes, score copy, and local personal best.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="soft">Wheel Sprint</Badge>
            <Badge variant="accent">Fun Tools System</Badge>
            <Badge variant="outline">No upload</Badge>
            <Badge variant="outline">Personal best</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard title="About Mouse Scroll Test" description="How the challenge measures scroll speed, touch movement, and why browser results can vary.">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MouseScrollTestClient />
    </ToolPage>
  );
}
