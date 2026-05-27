
import Link from "next/link";
import { Badge, Card } from "@/components/ui";

type ElementUnavailableStateProps = {
  reason?: string;
};

export default function ElementUnavailableState({
  reason = "The content database is temporarily unavailable.",
}: ElementUnavailableStateProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16">
      <Card padding="lg" className="w-full text-center">
        <Badge variant="warning">Temporarily unavailable</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)] sm:text-4xl">
          This element could not be loaded
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
          {reason} Refresh the page after your database connection is restored.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/explore" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]">
            Back to Explore
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]">
            Go home
          </Link>
        </div>
      </Card>
    </section>
  );
}
