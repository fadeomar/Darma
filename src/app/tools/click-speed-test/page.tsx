import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("click-speed-test");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ClickSpeedTestClient = dynamic(() => import("./ClickSpeedTestClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function ClickSpeedTestPage() {
  const tool = getToolRegistry().getById("click-speed-test");
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
            A Darma fun tool for testing click speed with a reusable challenge UI system, countdown, timed modes, live CPS, best burst, score copy, and local personal best.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="soft">Click Sprint</Badge>
            <Badge variant="accent">Fun Tools Phase 4</Badge>
            <Badge variant="outline">No upload</Badge>
            <Badge variant="outline">Personal best</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard title="About Click Speed Test" description="How the challenge measures CPS, click rhythm, input method, and why browser results can vary.">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ClickSpeedTestClient />
    </ToolPage>
  );
}
