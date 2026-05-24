import { cn } from "@/lib/cn";
import type { ContainerBreakpoint } from "../types";
import { formatContainerCondition } from "../containerQuery";

export function BreakpointTimeline({ breakpoints, activeIds, width, onSelect }: { breakpoints: ContainerBreakpoint[]; activeIds: string[]; width: number; onSelect: (id: string) => void }) {
  const maxWidth = Math.max(960, width, ...breakpoints.map((item) => item.maxWidth ?? item.minWidth ?? 0));
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--color-text-soft)]"><span>Breakpoint timeline</span><span>{width}px</span></div>
      <div className="relative h-3 rounded-full bg-[var(--color-bg-soft)]">
        <span className="absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[var(--color-accent)]" style={{ left: `${Math.min(100, (width / maxWidth) * 100)}%` }} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {breakpoints.map((breakpoint) => {
          const active = activeIds.includes(breakpoint.id);
          return <button key={breakpoint.id} type="button" onClick={() => onSelect(breakpoint.id)} className={cn("rounded-[var(--radius-sm)] border p-2 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]", active ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "border-[var(--color-border)] bg-[var(--color-surface-strong)]")}><strong className="block text-[var(--color-text)]">{breakpoint.name}</strong><span className="text-[var(--color-text-soft)]">{formatContainerCondition(breakpoint)}</span></button>;
        })}
      </div>
    </div>
  );
}
