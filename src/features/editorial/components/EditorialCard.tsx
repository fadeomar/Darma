import Link from "next/link";
import { ArrowRight, BookOpen, GitCompareArrows } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { EditorialPage } from "../schema";

export function EditorialCard({ page }: { page: EditorialPage }) {
  const href = `/${page.kind === "guide" ? "guides" : "comparisons"}/${page.slug}`;
  const Icon = page.kind === "guide" ? BookOpen : GitCompareArrows;
  const symbol = page.kind === "guide" ? "↗" : "⇄";
  return (
    <Link href={href} className="block h-full">
      <Card variant="interactive" padding="lg" className="visual-card flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <Badge variant={page.kind === "guide" ? "soft" : "outline"}>{page.kind === "guide" ? "Practical guide" : "Comparison"}</Badge>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{page.readingMinutes} min</span>
        </div>
        <div className="mt-6 flex items-center justify-between"><span className="atlas-symbol"><Icon className="h-5 w-5" aria-hidden /></span><span className="text-4xl font-black text-[var(--color-primary)] opacity-40" aria-hidden>{symbol}</span></div>
        <h2 className="mt-5 text-xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">{page.shortTitle}</h2>
        <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{page.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2">{page.secondaryKeywords.slice(0, 2).map((keyword) => <span key={keyword} className="rounded-full bg-[var(--color-control-track)] px-3 py-1 text-[10px] font-bold text-[var(--color-text-tertiary)]">{keyword}</span>)}</div>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary)]">Read the {page.kind} <ArrowRight className="h-4 w-4" aria-hidden /></span>
      </Card>
    </Link>
  );
}
