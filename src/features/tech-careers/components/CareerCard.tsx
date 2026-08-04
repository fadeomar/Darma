import Link from "next/link";
import { ArrowRight, Network, Route } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { CareerArtwork } from "@/components/visuals";
import type { TechCareer } from "../schema";

const CATEGORY_LABELS: Record<TechCareer["category"], string> = {
  engineering: "Engineering",
  "quality-security": "Quality & security",
  "design-research": "Design & research",
  "product-delivery": "Product & delivery",
  leadership: "Leadership",
  "operations-growth": "Operations & growth",
};

export function CareerCard({ career }: { career: TechCareer }) {
  return (
    <Link href={`/tech-careers/${career.slug}`} className="group block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
      <Card variant="interactive" padding="none" className="flex h-full overflow-hidden flex-col">
        <CareerArtwork category={career.category} collaborators={career.collaboratesWith.length} />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">{CATEGORY_LABELS[career.category]}</Badge>
            {career.featured ? <Badge variant="success">Core role</Badge> : <Badge variant="outline">{career.focus}</Badge>}
          </div>

          <h3 className="darma-balanced-heading mt-4 text-xl font-black tracking-[-0.025em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary-text-strong)]">{career.title}</h3>
          <p className="darma-pretty-copy mt-3 line-clamp-4 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{career.summary}</p>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[var(--color-text-tertiary)]">
            <span className="flex items-center gap-1.5"><Network className="h-4 w-4" aria-hidden />{career.collaboratesWith.length} related roles</span>
            <span className="flex items-center gap-1.5"><Route className="h-4 w-4" aria-hidden />{career.learningPathSlugs.length || "No"} linked paths</span>
          </div>

          <span className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-black text-[var(--color-primary-text-strong)]">
            Explore the role <ArrowRight className="darma-link-arrow h-[18px] w-[18px]" aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}
