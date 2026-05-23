import { cn } from "@/lib/cn";

export function HelpText({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return <p id={id} className={cn("text-xs leading-5 text-[var(--color-text-soft)]", className)}>{children}</p>;
}
