import Link from "next/link";
import { ArrowRight, GitBranch, ListChecks, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { WayOfWorking } from "../schema";

const KIND_LABELS: Record<WayOfWorking["kind"], string> = {
  principles: "Principles",
  framework: "Framework",
  method: "Method",
  lifecycle: "Lifecycle",
  "design-process": "Design process",
  "predictive-model": "Predictive model",
  hybrid: "Hybrid",
};

export function WayCard({ way }: { way: WayOfWorking }) {
  return (
    <Card variant="interactive" padding="lg" className="flex h-full flex-col">
      <div className="flex flex-wrap gap-2"><Badge variant="soft">{KIND_LABELS[way.kind]}</Badge>{way.featured ? <Badge variant="success">Core reference</Badge> : null}</div>
      <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]"><GitBranch className="h-5 w-5" aria-hidden /></div>
      <h3 className="mt-4 text-2xl font-black tracking-[-0.025em] text-[var(--color-text-primary)]">{way.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{way.summary}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[var(--color-text-tertiary)]"><span className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" aria-hidden />{way.flow.length} flow stages</span><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{way.relatedRoleSlugs.length} related roles</span></div>
      <Link href={`/ways-of-working/${way.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary-text-strong)] transition hover:gap-3">Understand the workflow <ArrowRight className="h-4 w-4" aria-hidden /></Link>
    </Card>
  );
}
