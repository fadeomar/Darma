import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui";
import type { CoreEntity } from "@/core";

function DiscoveryCards({ items }: { items: readonly CoreEntity[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link key={`${item.kind}:${item.id}`} href={item.href} className="group rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:shadow-[var(--focus-ring)] motion-reduce:hover:translate-y-0">
          <div className="flex flex-wrap gap-2"><Badge variant="outline">{item.kind}</Badge>{item.isNew ? <Badge variant="soft">New</Badge> : null}</div>
          <h3 className="mt-4 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{item.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-primary-text-strong)]">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden /></span>
        </Link>
      ))}
    </div>
  );
}

export function LandingDynamicDiscovery({ popular, improved }: { popular: readonly CoreEntity[]; improved: readonly CoreEntity[] }) {
  if (!popular.length && !improved.length) return null;
  return (
    <section id="discover-now" className="scroll-mt-24 border-y border-[var(--color-border-subtle)] bg-[var(--color-page-bg-soft)]">
      <div className="mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {popular.length ? <div><span className="landing-section-eyebrow">Popular right now</span><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">Discover across Darma, not just inside one collection.</h2><DiscoveryCards items={popular} /></div> : null}
        {improved.length ? <div className={popular.length ? "mt-12" : ""}><span className="landing-section-eyebrow">New and recently improved</span><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">See what changed recently.</h2><DiscoveryCards items={improved} /></div> : null}
      </div>
    </section>
  );
}
