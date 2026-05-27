import { ReactNode } from "react";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { cn } from "@/lib/cn";

export default function ToolContentCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={cn("p-5 sm:p-6", className)}>
      {title ? (
        <div className="mb-5 border-b border-[var(--color-border-subtle)] pb-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Tool section</p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </SurfaceCard>
  );
}
