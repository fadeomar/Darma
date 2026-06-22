import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("spacebar-counter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const SpacebarCounterClient = dynamic(() => import("./SpacebarCounterClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function SpacebarCounterPage() {
  const tool = getToolRegistry().getById("spacebar-counter");
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
            A Darma fun tool for testing spacebar tapping speed with countdown, timed modes, live PPS, best burst, repeat detection, score copy, and local personal best.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="soft">Keyboard Sprint</Badge>
            <Badge variant="accent">Fun Tools Phase 5</Badge>
            <Badge variant="outline">No upload</Badge>
            <Badge variant="outline">Repeat-safe</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard title="About Spacebar Counter" description="How the challenge measures spacebar speed, keyboard rhythm, repeat detection, and why browser results can vary.">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpacebarCounterClient />
    </ToolPage>
  );
}
