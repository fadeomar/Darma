import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { CoreEntity } from "../registry";

type CoreEntityCardProps<TEntity extends CoreEntity = CoreEntity> = {
  entity: TEntity;
  eyebrow?: string;
  compact?: boolean;
  showMetrics?: boolean;
  className?: string;
};

const coreAccentBackground: Record<string, string> = {
  orange: "linear-gradient(90deg, #f05a28, #f8b24a)",
  teal: "linear-gradient(90deg, #13b8a6, #67e8f9)",
  violet: "linear-gradient(90deg, #7c3aed, #f0abfc)",
  blue: "linear-gradient(90deg, #315cf6, #93c5fd)",
  emerald: "linear-gradient(90deg, #10b981, #86efac)",
  amber: "linear-gradient(90deg, #f59e0b, #fde68a)",
  rose: "linear-gradient(90deg, #f43f5e, #fda4af)",
};

const getAccentBackground = (accent?: string) => {
  if (!accent) return "linear-gradient(90deg, var(--color-primary), var(--color-accent))";
  if (accent.includes("gradient") || accent.includes("#") || accent.startsWith("rgb") || accent.startsWith("var(")) return accent;
  return coreAccentBackground[accent] ?? "linear-gradient(90deg, var(--color-primary), var(--color-accent))";
};

const statusVariant: Record<NonNullable<CoreEntity["status"]>, "success" | "info" | "warning" | "danger"> = {
  live: "success",
  planned: "info",
  experimental: "warning",
  deprecated: "danger",
};

export function CoreEntityCard<TEntity extends CoreEntity = CoreEntity>({
  entity,
  eyebrow,
  compact = false,
  showMetrics = true,
  className,
}: CoreEntityCardProps<TEntity>) {
  const visibleTags = [...(entity.categories ?? []), ...(entity.tags ?? [])].slice(0, compact ? 2 : 4);
  const isExternal = entity.href.startsWith("http");

  return (
    <Card
      as="article"
      variant="interactive"
      padding="none"
      className={cn(
        "group/core-card relative isolate flex h-full min-h-[220px] overflow-hidden focus-within:shadow-[var(--focus-ring)]",
        compact && "min-h-[176px]",
        className,
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-90"
        style={{ background: getAccentBackground(entity.accent) }}
        aria-hidden
      />
      <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-[var(--color-primary-soft)] blur-2xl transition duration-300 group-hover/core-card:scale-125" aria-hidden />

      <div className="relative flex h-full w-full flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {eyebrow ?? entity.kind}
            </p>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight tracking-[-0.03em] text-[var(--color-text-primary)]">
              <Link
                href={entity.href}
                className="outline-none after:absolute after:inset-0 focus-visible:shadow-[var(--focus-ring)]"
                aria-label={`Open ${entity.title}`}
              >
                {entity.title}
              </Link>
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {entity.isNew ? <Badge variant="accent">New</Badge> : null}
            {entity.status ? <Badge variant={statusVariant[entity.status]}>{entity.status}</Badge> : null}
          </div>
        </div>

        <p className={cn("line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]", compact && "line-clamp-2")}>
          {entity.description}
        </p>

        {visibleTags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span
                key={`${entity.id}-${tag}`}
                className="relative z-10 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          {showMetrics && entity.metrics?.length ? (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {entity.metrics.slice(0, 2).map((metric) => (
                <div key={metric.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-2.5">
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">{metric.value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{metric.label}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 text-sm font-bold text-[var(--color-primary)]">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" aria-hidden />
              {entity.primaryAction?.label ?? "Open"}
            </span>
            {isExternal ? <ExternalLink className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4 transition group-hover/core-card:translate-x-1" aria-hidden />}
          </div>
        </div>
      </div>
    </Card>
  );
}
