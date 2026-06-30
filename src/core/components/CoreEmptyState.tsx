import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type CoreEmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function CoreEmptyState({
  title = "Nothing found",
  description = "Try adjusting your search or filters.",
  actionLabel,
  onAction,
}: CoreEmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <SearchX className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" variant="soft" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
