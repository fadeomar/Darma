import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type CoreSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
};

export function CoreSectionHeader({ eyebrow, title, description, align = "start", className }: CoreSectionHeaderProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Badge variant="soft">{eyebrow}</Badge> : null}
      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">{description}</p> : null}
    </div>
  );
}
