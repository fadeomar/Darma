import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Compass } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getLiveCollections, getPlannedCollections } from "@/features/collections";
import "@/features/collections/styles/collections-theme.css";

export const metadata: Metadata = {
  title: "Collections | Darma",
  description: "Explore Darma collections: tools, games, templates, AI, resources, learning, and future open-source sections.",
};

export default function CollectionsPage() {
  const liveCollections = getLiveCollections();
  const plannedCollections = getPlannedCollections();

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="collection-framework-card collection-accent-violet rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="accent">Darma framework</Badge>
            <Badge variant="outline">Open source</Badge>
            <Badge variant="soft">Scalable sections</Badge>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">
            One discovery system for every Darma collection.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
            Collections are the shared foundation behind Darma sections like Tools and Games, and the future home for Templates, AI, Components, Resources, and Learning.
          </p>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="live-collections-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Available now</p>
            <h2 id="live-collections-title" className="text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Live collections</h2>
          </div>
          <Badge variant="success">{liveCollections.length} live</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {liveCollections.map((collection) => {
            const Icon = collection.icon;
            return (
              <Link key={collection.id} href={collection.href} className="group block rounded-[var(--radius-lg)] focus-visible:shadow-[var(--focus-ring)]">
                <Card className={`collection-framework-card collection-accent-${collection.accent} h-full transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--collection-accent,var(--color-primary))]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-[var(--color-success-text)]" aria-hidden />
                  </div>
                  <h3 className="text-xl font-black text-[var(--color-text-primary)]">{collection.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{collection.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {collection.badges.map((badge) => <Badge key={badge} variant="outline">{badge}</Badge>)}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
                    Open collection <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="planned-collections-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Roadmap</p>
            <h2 id="planned-collections-title" className="text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Planned collections</h2>
          </div>
          <Badge variant="warning">{plannedCollections.length} planned</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plannedCollections.map((collection) => {
            const Icon = collection.icon;
            return (
              <Card key={collection.id} className={`collection-framework-card collection-accent-${collection.accent}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--collection-accent,var(--color-primary))]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <Clock3 className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden />
                </div>
                <h3 className="text-lg font-black text-[var(--color-text-primary)]">{collection.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{collection.description}</p>
                <div className="collection-roadmap-line mt-5 h-px" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {collection.sections.slice(0, 4).map((section) => <Badge key={section} variant="outline">{section}</Badge>)}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="framework-principles-title">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <Compass className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            <h2 id="framework-principles-title" className="text-xl font-black text-[var(--color-text-primary)]">Framework principles</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["One pattern", "Hero, discovery, cards, search, filters, rails, and details can be shared."],
              ["Custom plugins", "Each collection can still add special sections like Games activity or Tools favorites."],
              ["Darma identity", "Every section keeps one design system while getting its own accent and tone."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                <h3 className="font-black text-[var(--color-text-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{text}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
