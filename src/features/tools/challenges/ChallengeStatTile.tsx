import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ChallengeStatTile({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-md)] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(255,255,255,0.42))] p-4 shadow-[0_14px_36px_rgba(76,55,37,0.09)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-card)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.82),transparent)]" />
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[var(--color-primary-soft)] opacity-0 blur-xl transition-opacity group-hover:opacity-80" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{label}</p>
          {icon ? <div className="rounded-[var(--radius-full)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-1.5 text-[var(--color-primary)]">{icon}</div> : null}
        </div>
        <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-3xl">{value}</div>
        {hint ? <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">{hint}</p> : null}
      </div>
    </div>
  );
}

export function ChallengeSmallMetric({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border border-white/55 bg-white/68 px-3 py-2 shadow-[0_8px_22px_rgba(76,55,37,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/10",
        className,
      )}
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
