import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ExternalLink, GraduationCap, Network, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { DetailHero, DetailSectionNav, type DetailSectionNavItem } from "@/components/details";
import { absoluteUrl } from "@/features/tools/seo";
import { getLearningPath } from "@/features/learning-paths";
import { getResourcesByIds } from "@/features/resources";
import { getTechCareer, getTechCareers, getTechCareersBySlugs } from "@/features/tech-careers";
import { CareerCard } from "@/features/tech-careers/components";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return getTechCareers().map((career) => ({ slug: career.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const career = getTechCareer(slug); if (!career) return {}; return { title: `${career.title}: responsibilities, skills, and career levels | Darma`, description: career.summary, keywords: career.tags, alternates: { canonical: `/tech-careers/${career.slug}` }, openGraph: { title: career.title, description: career.summary, url: absoluteUrl(`/tech-careers/${career.slug}`), type: "article" } }; }

const CATEGORY: Record<string, string> = { engineering: "Engineering", "quality-security": "Quality & security", "design-research": "Design & research", "product-delivery": "Product & delivery", leadership: "Leadership", "operations-growth": "Operations & growth" };

export default async function CareerPage({ params }: Props) {
  const { slug } = await params;
  const career = getTechCareer(slug);
  if (!career) notFound();
  const collaborators = getTechCareersBySlugs(career.collaboratesWith);
  const paths = career.learningPathSlugs.map((pathSlug) => getLearningPath(pathSlug)).filter(Boolean);
  const resources = getResourcesByIds(career.resourceIds);
  const data = { "@context": "https://schema.org", "@graph": [{ "@type": "Occupation", name: career.title, description: career.whatTheyDo, skills: [...career.skills.technical, ...career.skills.human].join(", "), url: absoluteUrl(`/tech-careers/${career.slug}`) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Tech Careers", item: absoluteUrl("/tech-careers") }, { "@type": "ListItem", position: 3, name: career.title, item: absoluteUrl(`/tech-careers/${career.slug}`) }] }] };
  return <div className="pb-16"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
    <DetailHero
      variant="career"
      backHref="/tech-careers"
      backLabel="All technology careers"
      eyebrow="Understand the work behind the title"
      badges={[
        { label: CATEGORY[career.category], tone: "soft" },
        { label: career.focus, tone: "outline" },
        ...(career.featured ? [{ label: "Core role", tone: "success" as const }] : []),
      ]}
      title={career.title}
      description={career.whatTheyDo}
      metrics={[
        { value: career.collaboratesWith.length, label: "collaborators" },
        { value: paths.length, label: "learning paths" },
        { value: career.references.length, label: "references" },
        { value: career.tools.length, label: "common tools" },
      ]}
      actions={[
        { href: "#responsibilities", label: "See the real work", tone: "primary" },
        { href: "#start", label: "Build a starting plan", tone: "secondary" },
      ]}
      signals={[
        { label: "Category", value: CATEGORY[career.category] },
        { label: "Primary focus", value: career.focus },
        { label: "Growth model", value: "Junior to senior" },
        { label: "Evidence", value: `${career.references.length} reviewed references` },
      ]}
      asideTitle="Typical outputs"
      asideItems={career.deliverables}
    />

    <DetailSectionNav
      items={[
        { id: "responsibilities", label: "Responsibilities" },
        { id: "skills", label: "Skills" },
        { id: "scope", label: "Scope" },
        { id: "start", label: "How to start" },
        ...((paths.length || resources.length) ? [{ id: "role-resources", label: "Learning and sources" }] : []),
        ...(collaborators.length ? [{ id: "related-roles", label: "Related roles" }] : []),
        { id: "role-references", label: "References" },
      ] satisfies DetailSectionNavItem[]}
      label={`${career.shortTitle} guide sections`}
    />

    <section id="responsibilities" className="mx-auto max-w-[var(--container-wide)] scroll-mt-32 px-4 py-10 sm:px-6 lg:px-8"><div className="grid gap-5 lg:grid-cols-2"><Card padding="lg"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">A typical day may include</h2><ul className="mt-5 space-y-3">{career.typicalDay.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />{item}</li>)}</ul></Card><Card padding="lg"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Core responsibilities</h2><ul className="mt-5 space-y-3">{career.responsibilities.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />{item}</li>)}</ul></Card></div></section>

    <section id="skills" className="mx-auto max-w-[var(--container-wide)] scroll-mt-32 px-4 pb-10 sm:px-6 lg:px-8"><div className="grid gap-5 xl:grid-cols-3"><Card padding="lg"><Wrench className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /><h2 className="mt-4 text-xl font-black text-[var(--color-text-primary)]">Technical or professional skills</h2><ul className="mt-4 space-y-2">{career.skills.technical.map((skill) => <li key={skill} className="text-sm leading-6 text-[var(--color-text-secondary)]">• {skill}</li>)}</ul></Card><Card padding="lg"><Network className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /><h2 className="mt-4 text-xl font-black text-[var(--color-text-primary)]">Human skills</h2><ul className="mt-4 space-y-2">{career.skills.human.map((skill) => <li key={skill} className="text-sm leading-6 text-[var(--color-text-secondary)]">• {skill}</li>)}</ul></Card><Card padding="lg"><Sparkles className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /><h2 className="mt-4 text-xl font-black text-[var(--color-text-primary)]">Common outputs and tools</h2><p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Deliverables</p><ul className="mt-2 space-y-1">{career.deliverables.map((item) => <li key={item} className="text-sm text-[var(--color-text-secondary)]">• {item}</li>)}</ul><p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Common tools</p><div className="mt-2 flex flex-wrap gap-2">{career.tools.map((tool) => <Badge key={tool} variant="outline">{tool}</Badge>)}</div></Card></div></section>

    <section id="scope" className="mx-auto max-w-[var(--container-wide)] scroll-mt-32 px-4 pb-10 sm:px-6 lg:px-8"><div className="mb-5"><Badge variant="soft">Responsibility grows with scope</Badge><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">How the scope grows</h2></div><div className="grid gap-5 lg:grid-cols-3">{Object.entries(career.levels).map(([key, level]) => <Card key={key} padding="lg"><Badge variant={key === "senior" ? "success" : "outline"}>{level.label}</Badge><p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">{level.scope}</p><ul className="mt-4 space-y-2">{level.evidence.map((item) => <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />{item}</li>)}</ul></Card>)}</div></section>

    <section id="start" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><div className="grid gap-5 lg:grid-cols-2"><Card padding="lg" className="border-[var(--color-primary-border)]"><GraduationCap className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /><h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">How to start</h2><ol className="mt-5 space-y-4">{career.howToStart.map((step, index) => <li key={step} className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-secondary)]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-mono text-xs font-bold text-[var(--color-primary-text)]">{index + 1}</span>{step}</li>)}</ol></Card><Card padding="lg"><ShieldAlert className="h-5 w-5 text-[var(--color-warning-text)]" aria-hidden /><h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">Common misconceptions</h2><ul className="mt-5 space-y-4">{career.misconceptions.map((item) => <li key={item} className="rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4 text-sm leading-6 text-[var(--color-text-primary)]">{item}</li>)}</ul></Card></div></section>

    {paths.length || resources.length ? <section id="role-resources" className="mx-auto max-w-[var(--container-wide)] scroll-mt-32 px-4 pb-10 sm:px-6 lg:px-8"><div className={`grid gap-5 ${paths.length && resources.length ? "lg:grid-cols-2" : ""}`}>{paths.length ? <Card padding="lg"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Learning paths that support this role</h2><div className="mt-5 space-y-3">{paths.map((path) => path ? <Link key={path.slug} href={`/learning-paths/${path.slug}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">{path.title}<ArrowRight className="h-4 w-4" aria-hidden /></Link> : null)}</div></Card> : null}{resources.length ? <Card padding="lg"><h2 className="text-2xl font-black text-[var(--color-text-primary)]">Starting references</h2><div className="mt-5 space-y-3">{resources.map((resource) => <Link key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">{resource.name}<ExternalLink className="h-4 w-4" aria-hidden /></Link>)}</div></Card> : null}</div></section> : null}

    {collaborators.length ? <section id="related-roles" className="mx-auto max-w-[var(--container-wide)] scroll-mt-32 px-4 pb-10 sm:px-6 lg:px-8"><Badge variant="soft">Team collaboration</Badge><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">Roles this person commonly works with</h2><div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">{collaborators.slice(0, 6).map((item) => <CareerCard key={item.slug} career={item} />)}</div></section> : null}

    <section id="role-references" className="mx-auto max-w-[var(--container-wide)] scroll-mt-32 px-4 sm:px-6 lg:px-8"><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">References used for this guide</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Job titles vary between organizations. These references support the role and responsibility model, while Darma adds practical explanations and connected next steps.</p><div className="mt-5 flex flex-wrap gap-3">{career.references.map((reference) => <Link key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">{reference.name}<ExternalLink className="h-4 w-4" aria-hidden /></Link>)}</div></Card></section>
  </div>;
}
