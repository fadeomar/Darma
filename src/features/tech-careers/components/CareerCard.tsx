import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Network, Route } from "lucide-react";
import { Badge, Card } from "@/components/ui";
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
    <Card variant="interactive" padding="lg" className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="soft">{CATEGORY_LABELS[career.category]}</Badge>
        <Badge variant="outline">{career.focus}</Badge>
        {career.featured ? <Badge variant="success">Core role</Badge> : null}
      </div>
      <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <BriefcaseBusiness className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-2xl font-black tracking-[-0.025em] text-[var(--color-text-primary)]">{career.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{career.summary}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
        <span className="flex items-center gap-1.5"><Network className="h-3.5 w-3.5" aria-hidden />{career.collaboratesWith.length} related roles</span>
        <span className="flex items-center gap-1.5"><Route className="h-3.5 w-3.5" aria-hidden />{career.learningPathSlugs.length || "No"} linked paths</span>
      </div>
      <Link href={`/tech-careers/${career.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] transition hover:gap-3">
        Explore the role <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </Card>
  );
}
