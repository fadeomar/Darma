import Link from "next/link";
import { ArrowRight, Clock3, Layers3, Signal } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { LearningPathArtwork } from "@/components/visuals";
import type { LearningPath } from "../schema";

const TRACK_LABELS: Record<LearningPath["track"], string> = {
  web: "Web development",
  mobile: "Mobile development",
  design: "Product design",
  devops: "DevOps & delivery",
};

export function LearningPathCard({ path }: { path: LearningPath }) {
  return (
    <Link href={`/learning-paths/${path.slug}`} className="group block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
      <Card as="article" variant="interactive" padding="none" className="flex h-full overflow-hidden flex-col">
        <LearningPathArtwork track={path.track} stages={path.stages.length} />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="soft">{TRACK_LABELS[path.track]}</Badge>
            <Badge variant="outline">{path.difficulty}</Badge>
          </div>
          <h2 className="darma-balanced-heading mt-5 text-2xl font-black tracking-[-0.025em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">{path.title}</h2>
          <p className="darma-pretty-copy mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{path.summary}</p>
          <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-[var(--color-border-subtle)] py-4 text-center">
            <div><dt className="flex justify-center text-[var(--color-text-tertiary)]"><Layers3 className="h-4 w-4" aria-hidden /></dt><dd className="mt-1 text-xs font-bold text-[var(--color-text-primary)]">{path.stages.length} stages</dd></div>
            <div><dt className="flex justify-center text-[var(--color-text-tertiary)]"><Clock3 className="h-4 w-4" aria-hidden /></dt><dd className="mt-1 text-xs font-bold text-[var(--color-text-primary)]">{path.estimatedWeeks}</dd></div>
            <div><dt className="flex justify-center text-[var(--color-text-tertiary)]"><Signal className="h-4 w-4" aria-hidden /></dt><dd className="mt-1 text-xs font-bold capitalize text-[var(--color-text-primary)]">{path.difficulty}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">{path.tags.slice(0, 4).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
          <span className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-black text-[var(--color-primary)]">
            Open this path <ArrowRight className="darma-link-arrow h-[18px] w-[18px]" aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}
