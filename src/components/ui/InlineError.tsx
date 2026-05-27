import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function InlineError({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn("flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm font-semibold leading-6 text-[var(--color-danger-text)]", className)}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
