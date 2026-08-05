import { cn } from "@/lib/cn";
import type { ContainerBreakpoint } from "../types";
import { formatContainerCondition } from "../containerQuery";

export function BreakpointTimeline({ breakpoints, activeIds, width, onSelect }: { breakpoints: ContainerBreakpoint[]; activeIds: string[]; width: number; onSelect: (id: string) => void }) {
  const maxWidth = Math.max(960, width, ...breakpoints.map((item) => item.maxWidth ?? item.minWidth ?? 0));
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--color-text-soft)]"><span>Breakpoint timeline</span><span>{width}px</span></div>
      <div className="relative h-3 rounded-full bg-[var(--color-bg-soft)]">
        {breakpoints.map((breakpoint) => {
          const marker = breakpoint.conditionType === "max-width" ? breakpoint.maxWidth ?? 0 : breakpoint.minWidth ?? 0;
          return <span key={breakpoint.id} className={cn("absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full", activeIds.includes(breakpoint.id) ? "bg-[var(--color-accent)]" : "bg-[var(--color-border-strong)]")} style={{ left: `${Math.min(100, (marker / maxWidth) * 100)}%` }} />;
        })}
        <span className="absolute top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-full bg-[var(--color-primary)] shadow-sm" style={{ left: `${Math.min(100, (width / maxWidth) * 100)}%` }} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {breakpoints.map((breakpoint) => {
          const active = activeIds.includes(breakpoint.id);
          return <button key={breakpoint.id} type="button" onClick={() => onSelect(breakpoint.id)} className={cn("min-w-0 rounded-[var(--radius-sm)] border p-2 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]", active ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "border-[var(--color-border)] bg-[var(--color-surface-strong)]")}><span className="flex items-center justify-between gap-2"><strong className="truncate text-[var(--color-text)]">{breakpoint.name}</strong>{active ? <span className="shrink-0 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-black text-white">ON</span> : null}</span><span className="mt-1 block truncate font-mono text-xs text-[var(--color-text-soft)]">{formatContainerCondition(breakpoint)}</span></button>;
        })}
      </div>
    </div>
  );
}
