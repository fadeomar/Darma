import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CollectionDefinition } from "../domain/collection";

export function CollectionFrameworkBanner({
  collection,
  siblingCollections = [],
}: {
  collection: CollectionDefinition;
  siblingCollections?: CollectionDefinition[];
}) {
  const Icon = collection.icon;
  const nextCollections = siblingCollections.filter((item) => item.id !== collection.id).slice(0, 4);

  return (
    <Card
      as="section"
      padding="none"
      className={cn(
        "collection-framework-card mt-8 border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6",
        `collection-accent-${collection.accent}`,
      )}
      aria-labelledby="collection-framework-title"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="collection-framework-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--collection-accent,var(--color-primary))] shadow-[var(--shadow-soft)] transition duration-300 motion-reduce:transition-none">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="accent">Collection framework</Badge>
              <Badge variant="outline">Reusable engine</Badge>
              <Badge variant="soft">{collection.status}</Badge>
            </div>
            <h2 id="collection-framework-title" className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-2xl">
              {collection.title} is now mapped to Darma Collections
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
              This section keeps its custom experience, but it now has shared collection metadata for future pages like Templates, AI, Resources, Learning, and Components.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            href="/tools"
            className="inline-flex min-h-8 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 text-xs font-semibold leading-none text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)] focus-visible:shadow-[var(--focus-ring)]"
          >
            View tools <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={collection.primaryAction.href}
            className="inline-flex min-h-8 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-primary)] px-3 text-xs font-semibold leading-none text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)] focus-visible:shadow-[var(--focus-ring)]"
          >
            {collection.primaryAction.label} <Sparkles className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {nextCollections.length > 0 ? (
        <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            Future collections using the same foundation
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {nextCollections.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <ItemIcon className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden />
                    <span className="text-sm font-black text-[var(--color-text-primary)]">{item.title}</span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
