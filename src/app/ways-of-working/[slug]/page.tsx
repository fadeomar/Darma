import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, GitCompareArrows, ShieldAlert, Users, XCircle } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { DetailHero, DetailSectionNav, type DetailSectionNavItem } from "@/components/details";
import { absoluteUrl } from "@/features/tools/seo";
import { getResourcesByIds } from "@/features/resources";
import { getGlossaryTermsBySlugs } from "@/features/tech-glossary";
import { getTechCareersBySlugs } from "@/features/tech-careers";
import { CareerCard } from "@/features/tech-careers/components";
import { getWayOfWorking, getWaysBySlugs, getWaysOfWorking } from "@/features/ways-of-working";
import { WayCard } from "@/features/ways-of-working/components";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return getWaysOfWorking().map((way) => ({ slug: way.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const way = getWayOfWorking(slug); if (!way) return {}; return { title: `${way.title}: flow, roles, strengths, and risks | Darma`, description: way.summary, keywords: way.tags, alternates: { canonical: `/ways-of-working/${way.slug}` }, openGraph: { title: way.title, description: way.summary, url: absoluteUrl(`/ways-of-working/${way.slug}`), type: "article" } }; }
const KIND: Record<string, string> = { principles: "Principles", framework: "Framework", method: "Method", lifecycle: "Lifecycle", "design-process": "Design process", "predictive-model": "Predictive model", hybrid: "Hybrid" };

export default async function WayPage({ params }: Props) {
  const { slug } = await params; const way = getWayOfWorking(slug); if (!way) notFound();
  const relatedRoles = getTechCareersBySlugs(way.relatedRoleSlugs); const comparisons = getWaysBySlugs(way.compareWith); const terms = getGlossaryTermsBySlugs(way.relatedTerms); const resources = getResourcesByIds(way.resourceIds);
  const data = { "@context": "https://schema.org", "@graph": [{ "@type": "Article", headline: way.title, description: way.description, url: absoluteUrl(`/ways-of-working/${way.slug}`), author: { "@type": "Organization", name: "Darma" }, about: way.tags }, { "@type": "HowTo", name: `${way.title} working flow`, description: way.summary, step: way.flow.map((stage, index) => ({ "@type": "HowToStep", position: index + 1, name: stage.title, text: stage.description })) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Ways of Working", item: absoluteUrl("/ways-of-working") }, { "@type": "ListItem", position: 3, name: way.title, item: absoluteUrl(`/ways-of-working/${way.slug}`) }] }] };
  return <div className="pb-16"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
    <DetailHero
      variant="method"
      backHref="/ways-of-working"
      backLabel="All ways of working"
      eyebrow="Choose a method from context, not fashion"
      badges={[
        { label: KIND[way.kind], tone: "soft" },
        ...(way.featured ? [{ label: "Core reference", tone: "success" as const }] : []),
      ]}
      title={way.title}
      description={way.description}
      metrics={[
        { value: way.flow.length, label: "flow stages" },
        { value: relatedRoles.length, label: "related roles" },
        { value: way.references.length, label: "references" },
        { value: way.healthySignals.length, label: "health signals" },
      ]}
      actions={[
        { href: "#workflow", label: "See the working flow", tone: "primary" },
        { href: "#method-fit", label: "Check where it fits", tone: "secondary" },
      ]}
      signals={[
        { label: "Method type", value: KIND[way.kind] },
        { label: "Cadence", value: `${way.cadence.length} recurring signals` },
        { label: "Roles", value: `${way.roles.length} role patterns` },
        { label: "Risk model", value: `${way.risks.length} common risks` },
      ]}
      asideTitle="Core ideas"
      asideItems={way.coreIdeas}
    />

    <DetailSectionNav
      items={[
        { id: "method-fit", label: "Where it fits" },
        { id: "method-ideas", label: "Core ideas" },
        { id: "workflow", label: "Workflow" },
        { id: "method-operations", label: "Roles and risks" },
        { id: "method-signals", label: "Healthy signals" },
        ...(terms.length ? [{ id: "method-terms", label: "Terms" }] : []),
        ...(relatedRoles.length ? [{ id: "method-roles", label: "Roles" }] : []),
        ...(comparisons.length ? [{ id: "method-comparisons", label: "Compare" }] : []),
        { id: "method-references", label: "References" },
      ] satisfies DetailSectionNavItem[]}
      label={`${way.shortTitle} method sections`}
    />

    <section id="method-fit" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 py-10 sm:px-6 lg:px-8"><div className="detail-overview-grid grid gap-5 lg:grid-cols-2"><Card padding="lg" className="border-[var(--color-success-border)]"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Useful when</h2><ul className="mt-5 space-y-3">{way.bestFor.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />{item}</li>)}</ul></Card><Card padding="lg" className="border-[var(--color-warning-border)]"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Be careful when</h2><ul className="mt-5 space-y-3">{way.avoidWhen.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><XCircle className="mt-1 h-4 w-4 shrink-0 text-[var(--color-warning-text)]" aria-hidden />{item}</li>)}</ul></Card></div></section>

    <section id="method-ideas" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><Card padding="lg"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Core ideas</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{way.coreIdeas.map((idea, index) => <div key={idea} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] font-mono text-xs font-bold text-[var(--color-primary)]">{index + 1}</span><p className="text-sm leading-6 text-[var(--color-text-secondary)]">{idea}</p></div>)}</div></Card></section>

    <section id="workflow" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><Badge variant="soft">Workflow map</Badge><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">How work moves through {way.shortTitle}</h2><div className="mt-6 space-y-4">{way.flow.map((stage, index) => <Card key={stage.id} padding="lg" className="grid gap-5 md:grid-cols-[72px_minmax(0,1fr)_minmax(220px,0.55fr)]"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] font-mono text-lg font-black text-[var(--color-primary-text)]">{index + 1}</div><div><h3 className="text-xl font-black text-[var(--color-text-primary)]">{stage.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{stage.description}</p><div className="mt-4 flex flex-wrap gap-2">{stage.participants.map((person) => <Badge key={person} variant="outline">{person}</Badge>)}</div></div><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Outputs</p><ul className="mt-2 space-y-2">{stage.outputs.map((output) => <li key={output} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />{output}</li>)}</ul></div></Card>)}</div></section>

    <section id="method-operations" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><div className="grid gap-5 xl:grid-cols-3"><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">Roles and cadence</h2><p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Roles</p><ul className="mt-2 space-y-2">{way.roles.map((item) => <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">• {item}</li>)}</ul><p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Cadence</p><ul className="mt-2 space-y-2">{way.cadence.map((item) => <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">• {item}</li>)}</ul></Card><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">Strengths</h2><ul className="mt-4 space-y-3">{way.strengths.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />{item}</li>)}</ul></Card><Card padding="lg"><ShieldAlert className="h-5 w-5 text-[var(--color-warning-text)]" aria-hidden /><h2 className="mt-4 text-xl font-black text-[var(--color-text-primary)]">Common risks</h2><ul className="mt-4 space-y-3">{way.risks.map((item) => <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">• {item}</li>)}</ul></Card></div></section>

    <section id="method-signals" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><Card padding="lg" className="border-[var(--color-success-border)]"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Healthy signals</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Look for changes in behavior and outcomes, not only compliance with named events.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{way.healthySignals.map((signal) => <div key={signal} className="rounded-[var(--radius-md)] bg-[var(--color-success-bg)] p-4 text-sm leading-6 text-[var(--color-text-primary)]">{signal}</div>)}</div></Card></section>

    {terms.length ? <section id="method-terms" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Terms to understand</h2><div className="mt-4 flex flex-wrap gap-2">{terms.map((term) => <Link key={term.slug} href={`/tech-glossary#${term.slug}`} className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">{term.term}</Link>)}</div></section> : null}

    {relatedRoles.length ? <section id="method-roles" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-[var(--color-primary)]"><Users className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">People in the workflow</span></div><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">Related technology roles</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{relatedRoles.slice(0, 6).map((career) => <CareerCard key={career.slug} career={career} />)}</div></section> : null}

    {comparisons.length ? <section id="method-comparisons" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-[var(--color-primary)]"><GitCompareArrows className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Compare before choosing</span></div><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">Related approaches</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{comparisons.map((item) => <WayCard key={item.slug} way={item} />)}</div></section> : null}

    <section id="method-references" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 sm:px-6 lg:px-8"><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">Primary references</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{[...way.references.map((reference) => ({ name: reference.name, url: reference.url })), ...resources.map((resource) => ({ name: resource.name, url: resource.url }))].filter((item, index, all) => all.findIndex((candidate) => candidate.url === item.url) === index).map((reference) => <Link key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">{reference.name}<ExternalLink className="h-4 w-4" aria-hidden /></Link>)}</div></Card></section>
  </div>;
}
