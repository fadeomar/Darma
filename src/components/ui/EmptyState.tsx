import { type ReactNode } from "react";
import { SearchX } from "lucide-react";
import { Card } from "./Card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card variant="default" padding="lg" className="text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)]">
        <SearchX className="h-5 w-5 text-[var(--color-text-tertiary)]" aria-hidden />
      </div>
      <h3 className="mt-3 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
