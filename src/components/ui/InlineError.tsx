import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function InlineError({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn("flex items-start gap-2 text-sm font-semibold leading-6 text-[var(--color-danger)]", className)}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
