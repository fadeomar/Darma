import Link from "next/link";
import PageSection from "@/components/ui/PageSection";
import { Badge, Card } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";

const featureCards = [
  {
    title: "Explore front-end ideas",
    description:
      "Browse reusable UI patterns, mini projects, effects, and code experiments built with HTML, CSS, and JavaScript.",
    href: "/explore",
    cta: "Browse projects",
  },
  {
    title: "Use practical browser tools",
    description:
      "Open focused generators, formatters, and preview tools that keep controls close to the result.",
    href: "/tools",
    cta: "Open tools",
  },
  {
    title: "Find by workflow",
    description:
      "Jump into curated groups for CSS design, SEO launches, API debugging, image prep, and more.",
    href: "/workflows",
    cta: "View workflows",
  },
];

export default function LandingPage() {
  const registry = getToolRegistry();
  const publicTools = registry.list().filter((tool) => tool.visibility === "public");
  const featuredTools = publicTools.filter((tool) => tool.featured).slice(0, 4);
  const categories = new Set(publicTools.flatMap((tool) => tool.secondaryCategory ?? []));

  return (
    <main className="pb-16">
      <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-16">
        <div className="max-w-4xl">
          <Badge variant="soft">Developer workshop</Badge>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
            Practical front-end tools and code ideas in one calm workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
            Darma combines a growing project library with lightweight browser tools for developers, designers, students, and creators who want to preview, tweak, and copy faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tools" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]">
              Try the tools
            </Link>
            <Link href="/explore" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]">
              Explore projects
            </Link>
          </div>
        </div>

        <Card padding="lg" className="self-start">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
            Platform snapshot
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <dt className="text-sm text-[var(--color-text-secondary)]">Public tools</dt>
              <dd className="mt-1 text-3xl font-black text-[var(--color-text-primary)]">{publicTools.length}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <dt className="text-sm text-[var(--color-text-secondary)]">Workflow categories</dt>
              <dd className="mt-1 text-3xl font-black text-[var(--color-text-primary)]">{categories.size}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <dt className="text-sm text-[var(--color-text-secondary)]">Privacy model</dt>
              <dd className="mt-1 text-base font-bold text-[var(--color-text-primary)]">Browser-first</dd>
            </div>
          </dl>
        </Card>
      </section>

      <PageSection
        eyebrow="Start here"
        title="Choose the fastest path"
        description="Use Darma as a product showcase, a learning playground, or a practical utilities site depending on what you need today."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {featureCards.map((card) => (
            <Link key={card.title} href={card.href} className="block h-full">
              <Card variant="interactive" padding="lg" className="h-full">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{card.description}</p>
                <span className="mt-5 inline-flex text-sm font-bold text-[var(--color-primary)]">{card.cta} →</span>
              </Card>
            </Link>
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Featured tools"
        title="The most useful tools right now"
        description="These tools best represent Darma’s direction: practical controls, quick previews, and copy-ready output."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredTools.map((tool) => (
            <Link key={tool.id} href={tool.href} className="block h-full">
              <Card variant="interactive" padding="md" className="h-full">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{tool.audiences?.[0] ?? "tool"}</Badge>
                  <Badge variant={tool.privacy === "client-only" ? "accent" : "soft"}>{tool.privacy ?? "browser"}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{tool.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </PageSection>
    </main>
  );
}
