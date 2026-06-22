import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChallengeTone = "primary" | "accent" | "success" | "warning" | "danger" | "muted";

export type ChallengeScoreBadge = {
  label: string;
  value: ReactNode;
  tone?: ChallengeTone;
  icon?: ReactNode;
};

const toneClasses: Record<ChallengeTone, { text: string; border: string; bg: string; glow: string; rail: string; dot: string }> = {
  primary: {
    text: "text-[var(--color-primary)]",
    border: "border-[var(--color-primary-border)]",
    bg: "bg-[var(--color-primary-soft)]",
    glow: "bg-[var(--color-primary-soft)]",
    rail: "bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent),var(--color-primary))]",
    dot: "bg-[var(--color-primary)]",
  },
  accent: {
    text: "text-[var(--color-accent)]",
    border: "border-[var(--color-accent-border)]",
    bg: "bg-[var(--color-accent-soft)]",
    glow: "bg-[var(--color-accent-soft)]",
    rail: "bg-[linear-gradient(90deg,var(--color-accent),var(--color-primary),var(--color-accent))]",
    dot: "bg-[var(--color-accent)]",
  },
  success: {
    text: "text-[var(--color-success-text)]",
    border: "border-[var(--color-success-border)]",
    bg: "bg-[var(--color-success-bg)]",
    glow: "bg-[var(--color-success-bg)]",
    rail: "bg-[linear-gradient(90deg,var(--color-success-text),var(--color-accent),var(--color-primary))]",
    dot: "bg-[var(--color-success-text)]",
  },
  warning: {
    text: "text-[var(--color-warning-text)]",
    border: "border-[var(--color-warning-border)]",
    bg: "bg-[var(--color-warning-bg)]",
    glow: "bg-[var(--color-warning-bg)]",
    rail: "bg-[linear-gradient(90deg,var(--color-warning-text),var(--color-primary),var(--color-accent))]",
    dot: "bg-[var(--color-warning-text)]",
  },
  danger: {
    text: "text-[var(--color-danger-text)]",
    border: "border-[var(--color-danger-border)]",
    bg: "bg-[var(--color-danger-bg)]",
    glow: "bg-[var(--color-danger-bg)]",
    rail: "bg-[linear-gradient(90deg,var(--color-danger-text),var(--color-primary),var(--color-accent))]",
    dot: "bg-[var(--color-danger-text)]",
  },
  muted: {
    text: "text-[var(--color-text-secondary)]",
    border: "border-[var(--color-border-default)]",
    bg: "bg-[var(--color-surface-base)]",
    glow: "bg-[var(--color-surface-subtle)]",
    rail: "bg-[linear-gradient(90deg,var(--color-text-tertiary),var(--color-primary),var(--color-accent))]",
    dot: "bg-[var(--color-text-tertiary)]",
  },
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function ChallengeProgressRail({
  value,
  label = "Progress",
  active,
  tone = "primary",
  className,
  floating = true,
}: {
  value: number;
  label?: string;
  active?: boolean;
  tone?: ChallengeTone;
  className?: string;
  floating?: boolean;
}) {
  const safeValue = clampPercent(value);
  const toneClass = toneClasses[tone];

  return (
    <div
      className={cn("pointer-events-none z-10 h-1 overflow-hidden", floating ? "absolute inset-x-0 top-0" : "relative w-full", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
    >
      <div className="absolute inset-0 bg-white/28 dark:bg-white/10" />
      <div
        className={cn(
          "relative h-full rounded-r-[var(--radius-full)] shadow-[0_0_24px_rgba(255,166,74,0.34)] transition-[width] duration-150 ease-out",
          toneClass.rail,
        )}
        style={{ width: `${safeValue}%` }}
      >
        {active ? <span className="absolute inset-0 bg-white/24 motion-safe:animate-pulse" /> : null}
      </div>
    </div>
  );
}

export function ChallengeStatusPill({
  label,
  tone = "muted",
  pulse,
  className,
}: {
  label: ReactNode;
  tone?: ChallengeTone;
  pulse?: boolean;
  className?: string;
}) {
  const toneClass = toneClasses[tone];

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-[var(--radius-full)] border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] shadow-[var(--shadow-xs)] backdrop-blur",
        toneClass.border,
        toneClass.bg,
        toneClass.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", toneClass.dot, pulse && "motion-safe:animate-pulse")} aria-hidden />
      {label}
    </span>
  );
}

export function ChallengeResultHighlight({
  eyebrow = "Result saved",
  title,
  description,
  metricLabel,
  metricValue,
  icon,
  badges,
  celebrate,
  tone = "primary",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  metricLabel?: string;
  metricValue?: ReactNode;
  icon?: ReactNode;
  badges?: ChallengeScoreBadge[];
  celebrate?: boolean;
  tone?: ChallengeTone;
  className?: string;
  floating?: boolean;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div
      className={cn(
        "relative mx-auto mt-5 w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border bg-white/62 p-4 text-left shadow-[0_18px_54px_rgba(80,55,30,0.12)] backdrop-blur dark:bg-white/10",
        toneClass.border,
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full opacity-70 blur-2xl", toneClass.glow)} />
      {celebrate ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <span className="absolute left-[10%] top-4 h-2 w-2 rounded-full bg-[var(--color-primary)] opacity-70 motion-safe:animate-bounce" />
          <span className="absolute right-[18%] top-8 h-2.5 w-2.5 rotate-45 rounded-[3px] bg-[var(--color-accent)] opacity-70 motion-safe:animate-pulse" />
          <span className="absolute bottom-5 left-[22%] h-1.5 w-1.5 rounded-full bg-[var(--color-warning-text)] opacity-60 motion-safe:animate-ping" />
          <span className="absolute bottom-8 right-[12%] h-2 w-5 -rotate-12 rounded-full bg-[var(--color-primary)] opacity-40" />
        </div>
      ) : null}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">{eyebrow}</p>
          <h3 className="mt-1 flex items-center gap-2 text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {icon}
            {title}
          </h3>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
          {badges?.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {badges.map((badge) => {
                const badgeTone = toneClasses[badge.tone ?? tone];
                return (
                  <div
                    key={badge.label}
                    className={cn(
                      "rounded-[var(--radius-sm)] border bg-white/58 px-3 py-2 shadow-[var(--shadow-xs)] backdrop-blur dark:bg-white/10",
                      badgeTone.border,
                    )}
                  >
                    <p className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
                      {badge.icon}
                      {badge.label}
                    </p>
                    <p className={cn("mt-1 text-sm font-black text-[var(--color-text-primary)]", badgeTone.text)}>{badge.value}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        {metricValue ? (
          <div className="shrink-0 rounded-[var(--radius-md)] border border-white/60 bg-white/70 px-4 py-3 text-right shadow-[var(--shadow-xs)] dark:border-white/10 dark:bg-white/10">
            {metricLabel ? <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{metricLabel}</p> : null}
            <p className={cn("mt-1 text-2xl font-black tracking-[-0.04em]", toneClass.text)}>{metricValue}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}


export function ChallengeEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--color-primary-border)] bg-[linear-gradient(135deg,var(--color-surface-base),var(--color-primary-soft))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]",
        className,
      )}
    >
      <div className="flex gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-white/65 text-[var(--color-primary)] shadow-[var(--shadow-xs)] dark:bg-white/10">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
