import { type ReactNode } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ChallengeCard({
  eyebrow,
  title,
  description,
  badge,
  children,
  className,
}: {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const hasHeader = Boolean(eyebrow || title || description || badge);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.78),transparent_34%),linear-gradient(135deg,var(--color-surface-overlay),var(--color-surface-raised))] p-5 shadow-[0_18px_45px_rgba(80,55,30,0.09)] transition duration-[var(--duration-fast)] hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-md)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.07),transparent_34%),linear-gradient(135deg,var(--color-surface-overlay),var(--color-surface-raised))] sm:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.82),transparent)]" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[var(--color-primary-soft)] opacity-0 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative">
        {hasHeader ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {eyebrow ? <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{eyebrow}</p> : null}
              {title ? <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h3> : null}
              {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
            </div>
            {badge ? <div className="shrink-0">{typeof badge === "string" ? <Badge variant="accent">{badge}</Badge> : badge}</div> : null}
          </div>
        ) : null}
        {children ? <div className={hasHeader ? "mt-5" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}
