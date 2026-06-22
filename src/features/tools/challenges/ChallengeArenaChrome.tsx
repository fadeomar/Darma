import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ChallengeArenaChrome({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[var(--color-primary-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,240,215,0.46),rgba(216,245,240,0.38))] p-2 shadow-[0_24px_80px_rgba(94,63,32,0.16)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,164,72,0.08),rgba(72,220,210,0.08))] sm:p-2.5",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.92),transparent)]" />
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[var(--color-primary-soft)] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-64 w-64 rounded-full bg-[var(--color-accent-soft)] opacity-60 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}
