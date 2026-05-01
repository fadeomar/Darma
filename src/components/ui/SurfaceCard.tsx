import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export default function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
