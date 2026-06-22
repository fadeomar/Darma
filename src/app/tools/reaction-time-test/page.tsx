import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("reaction-time-test");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ReactionTimeTestClient = dynamic(() => import("./ReactionTimeTestClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});
const Article = dynamic(() => import("./Article"));

export default function ReactionTimeTestPage() {
  const tool = getToolRegistry().getById("reaction-time-test");
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
            A Darma fun tool for testing reflex speed with random wait signals, false-start handling, keyboard/touch/mouse input, score copy, and local personal best.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="soft">Reflex Challenge</Badge>
            <Badge variant="accent">Fun Tools Phase 6</Badge>
            <Badge variant="outline">No upload</Badge>
            <Badge variant="outline">False-start safe</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard title="About Reaction Time Test" description="How the challenge measures reflex speed, false starts, consistency, and why browser results can vary.">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReactionTimeTestClient />
    </ToolPage>
  );
}
