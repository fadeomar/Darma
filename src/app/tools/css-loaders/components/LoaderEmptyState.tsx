import { SearchX } from "lucide-react";
import { Button, Card } from "@/components/ui";

type LoaderEmptyStateProps = {
  onReset: () => void;
};

export default function LoaderEmptyState({ onReset }: LoaderEmptyStateProps) {
  return (
    <Card variant="default" padding="lg" className="text-center">
      <SearchX className="mx-auto h-9 w-9 text-[var(--color-text-soft)]" aria-hidden />
      <h3 className="mt-3 text-lg font-black text-[var(--color-text)]">No loaders match these filters</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
        Try a broader search, switch category chips, or reset the filters to return to the full visual gallery.
      </p>
      <Button className="mt-4" variant="secondary" size="sm" onClick={onReset}>
        Reset gallery
      </Button>
    </Card>
  );
}
