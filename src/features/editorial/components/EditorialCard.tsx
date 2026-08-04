import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { EditorialArtwork } from "@/components/visuals";
import type { EditorialPage } from "../schema";

export function EditorialCard({ page }: { page: EditorialPage }) {
  const href = `/${page.kind === "guide" ? "guides" : "comparisons"}/${page.slug}`;
  const comparisonSubjects = page.kind === "comparison"
    ? page.shortTitle.split(/\s+vs\.?\s+/i).map((item) => item.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <Link href={href} className="group block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
      <Card variant="interactive" padding="none" className="flex h-full overflow-hidden flex-col">
        <EditorialArtwork kind={page.kind} subjects={comparisonSubjects} />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={page.kind === "guide" ? "soft" : "outline"}>
              {page.kind === "guide" ? "Practical guide" : "Comparison"}
            </Badge>
            <span className="text-xs font-bold text-[var(--color-text-tertiary)]">{page.readingMinutes} min read</span>
          </div>

          {comparisonSubjects.length > 1 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Comparison options">
              {comparisonSubjects.map((subject, index) => (
                <span key={subject} className="inline-flex items-center gap-2">
                  {index > 0 ? <span className="font-mono text-xs font-black text-[var(--color-primary-text-strong)]">VS</span> : null}
                  <span className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1.5 text-xs font-black text-[var(--color-text-primary)]">{subject}</span>
                </span>
              ))}
            </div>
          ) : null}

          <h2 className="darma-balanced-heading mt-5 text-xl font-black tracking-[-0.035em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary-text-strong)]">{page.shortTitle}</h2>
          <p className="darma-pretty-copy mt-3 line-clamp-4 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{page.summary}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {/* Editorial keywords are full phrases, so they must wrap instead of
                being clipped by the card at narrow viewports. */}
            {page.secondaryKeywords.slice(0, 2).map((keyword) => (
              <Badge key={keyword} variant="outline" className="max-w-full whitespace-normal text-center leading-tight">
                {keyword}
              </Badge>
            ))}
          </div>

          <span className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-black text-[var(--color-primary-text-strong)]">
            Read the {page.kind}
            <ArrowRight className="darma-link-arrow h-[18px] w-[18px]" aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}
