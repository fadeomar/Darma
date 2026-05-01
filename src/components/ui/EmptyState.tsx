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
      <SearchX className="mx-auto h-8 w-8 text-[var(--color-text-soft)]" aria-hidden />
      <h3 className="mt-3 text-lg font-black text-[var(--color-text)]">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
