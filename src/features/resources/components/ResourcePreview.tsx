import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getFeaturedResources, RESOURCE_CATALOG } from "../catalog";
import { ResourceLogo } from "./ResourceLogo";

export function ResourcePreview() {
  const resources = getFeaturedResources(6);
  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="about-resource-library">
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="soft">Open tech reference</Badge>
            <h2 id="about-resource-library" className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Discover reliable places to learn, build, and verify.</h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
              Darma now organizes {RESOURCE_CATALOG.length} unique developer and design resources by task, type, level, and category — with duplicates merged and uncertain metadata clearly marked for review.
            </p>
          </div>
          <Link href="/resources" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]">
            Open resource explorer <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} as="article" padding="md" className="flex items-start gap-3">
              <ResourceLogo resource={resource} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="truncate text-sm font-bold text-[var(--color-text-primary)]">{resource.name}</h3><p className="mt-0.5 truncate font-mono text-[10px] text-[var(--color-text-tertiary)]">{resource.domain}</p></div>
                  <Link href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.name}`} className="shrink-0 text-[var(--color-text-tertiary)] transition hover:text-[var(--color-primary)]"><ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{resource.summary}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
