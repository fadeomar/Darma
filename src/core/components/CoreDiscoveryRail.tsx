import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CoreEntity } from "../registry";
import { CoreEntityCard } from "./CoreEntityCard";

type CoreDiscoveryRailProps<TEntity extends CoreEntity = CoreEntity> = {
  title: string;
  description?: string;
  entities: readonly TEntity[];
  href?: string;
  ctaLabel?: string;
  compactCards?: boolean;
  className?: string;
};

export function CoreDiscoveryRail<TEntity extends CoreEntity = CoreEntity>({
  title,
  description,
  entities,
  href,
  ctaLabel = "View all",
  compactCards = true,
  className,
}: CoreDiscoveryRailProps<TEntity>) {
  if (!entities.length) return null;

  return (
    <section className={cn("space-y-4", className)} aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`} className="text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">
            {title}
          </h2>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="hidden items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:underline sm:inline-flex">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="core-scroll-row -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {entities.map((entity) => (
          <CoreEntityCard
            key={entity.id}
            entity={entity}
            compact={compactCards}
            className="min-w-[270px] snap-start sm:min-w-[300px] lg:min-w-[320px]"
          />
        ))}
      </div>
    </section>
  );
}
