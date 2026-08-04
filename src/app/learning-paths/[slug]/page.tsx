import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, Flag, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { DetailHero, DetailSectionNav, type DetailSectionNavItem } from "@/components/details";
import { absoluteUrl } from "@/features/tools/seo";
import { getLearningPath, getLearningPaths, type LearningPath } from "@/features/learning-paths";
import { LearningPathCard, LearningPathTimeline } from "@/features/learning-paths/components";
import { getResourcesByIds } from "@/features/resources";
import { getTechCareers } from "@/features/tech-careers";
import { CareerCard } from "@/features/tech-careers/components";

type LearningPathPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getLearningPaths().map((path) => ({ slug: path.slug }));
}

export async function generateMetadata({ params }: LearningPathPageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = getLearningPath(slug);
  if (!path) return {};
  return {
    title: `${path.title} Learning Path | Darma`,
    description: path.summary,
    keywords: path.tags,
    alternates: { canonical: `/learning-paths/${path.slug}` },
    openGraph: { title: `${path.title} Learning Path`, description: path.summary, url: absoluteUrl(`/learning-paths/${path.slug}`), type: "article" },
  };
}

function pathJsonLd(slug: string) {
  const path = getLearningPath(slug);
  if (!path) return null;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "@id": `${absoluteUrl(`/learning-paths/${path.slug}`)}#learning-resource`,
        name: path.title,
        description: path.description,
        url: absoluteUrl(`/learning-paths/${path.slug}`),
        educationalLevel: path.difficulty,
        teaches: path.outcomes,
        isAccessibleForFree: true,
        inLanguage: "en",
        provider: { "@type": "Organization", name: "Darma", url: absoluteUrl("/") },
        learningResourceType: "Learning path",
        hasPart: path.stages.map((stage, index) => ({ "@type": "LearningResource", position: index + 1, name: stage.title, description: stage.summary })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Learning Paths", item: absoluteUrl("/learning-paths") },
          { "@type": "ListItem", position: 3, name: path.title, item: absoluteUrl(`/learning-paths/${path.slug}`) },
        ],
      },
    ],
  };
}

export default async function LearningPathPage({ params }: LearningPathPageProps) {
  const { slug } = await params;
  const path = getLearningPath(slug);
  if (!path) notFound();
  const jsonLd = pathJsonLd(slug);
  const stages = path.stages.map((stage) => ({ ...stage, resources: getResourcesByIds(stage.resourceIds) }));
  const missingResources = stages.flatMap((stage) => stage.resourceIds.filter((id) => !stage.resources.some((resource) => resource.id === id)));
  if (missingResources.length) throw new Error(`Learning path ${path.slug} references missing resources: ${missingResources.join(", ")}`);
  const nextPaths = path.recommendedNext.map((nextSlug) => getLearningPath(nextSlug)).filter((item): item is LearningPath => Boolean(item));
  const relatedCareers = getTechCareers().filter((career) => career.learningPathSlugs.includes(path.slug));

  return (
    <div className="pb-16">
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}
      <DetailHero
        variant="learning"
        backHref="/learning-paths"
        backLabel="All learning paths"
        eyebrow="Learn in stages, prove each step"
        badges={[
          { label: `${path.track} path`, tone: "soft" },
          { label: path.difficulty, tone: "outline" },
          { label: "Project-based", tone: "success" },
        ]}
        title={path.title}
        description={path.description}
        metrics={[
          { value: path.stages.length, label: "stages" },
          { value: path.estimatedWeeks, label: "duration" },
          { value: stages.reduce((total, stage) => total + stage.resources.length, 0), label: "resources" },
          { value: relatedCareers.length, label: "career links" },
        ]}
        actions={[
          { href: "#path-stages", label: "Start with stage one", tone: "primary" },
          { href: "#final-project", label: "Preview the final project", tone: "secondary" },
        ]}
        signals={[
          { label: "Track", value: path.track },
          { label: "Level", value: path.difficulty },
          { label: "Weekly pace", value: path.weeklyCommitment },
          { label: "Final proof", value: `${path.finalProject.deliverables.length} deliverables` },
        ]}
        asideTitle="Before you start"
        asideItems={path.prerequisites.length ? path.prerequisites : ["No formal prerequisite. Start with curiosity and enough time to practice."]}
      />

      <DetailSectionNav
        items={[
          { id: "path-overview", label: "Overview" },
          { id: "path-stages", label: "Stages" },
          { id: "final-project", label: "Final project" },
          { id: "path-references", label: "References" },
          ...(relatedCareers.length ? [{ id: "related-careers", label: "Careers" }] : []),
          ...(nextPaths.length ? [{ id: "next-paths", label: "Continue" }] : []),
        ] satisfies DetailSectionNavItem[]}
        label={`${path.shortTitle} path sections`}
      />

      <section id="path-overview" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 py-10 sm:px-6 lg:px-8"><div className="detail-overview-grid grid gap-5 lg:grid-cols-2"><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">Who this path is for</h2><ul className="mt-4 space-y-3">{path.audience.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><Users className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]" aria-hidden />{item}</li>)}</ul></Card><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">What you should be able to do</h2><ul className="mt-4 space-y-3">{path.outcomes.map((outcome) => <li key={outcome} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />{outcome}</li>)}</ul></Card></div></section>

      <section id="path-stages" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-12 sm:px-6 lg:px-8"><div className="mb-6"><Badge variant="soft">Path stages</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Learn, build, check, then continue.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">Mark a stage complete only when you can meet its checkpoint and explain the decisions in its practical project. Reading every link is not the goal.</p></div><LearningPathTimeline path={path} stages={stages} /></section>

      <section id="final-project" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><Card padding="lg" className="border-[var(--color-primary-border)]"><div className="flex items-center gap-2 text-[var(--color-primary-text-strong)]"><Flag className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Final project</span></div><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">{path.finalProject.title}</h2><p className="mt-3 max-w-4xl text-base leading-7 text-[var(--color-text-secondary)]">{path.finalProject.brief}</p><ul className="mt-5 grid gap-2 md:grid-cols-2">{path.finalProject.deliverables.map((deliverable) => <li key={deliverable} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]" aria-hidden />{deliverable}</li>)}</ul></Card></section>

      <section id="path-references" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">Primary references used to shape this path</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">These links provide official or project-maintained foundations. Darma adds the ordering, checkpoints, projects, and cross-topic guidance.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{path.references.map((reference) => <Link key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary-text-strong)]">{reference.name}<ExternalLink className="h-4 w-4 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></Link>)}</div></Card></section>

      {relatedCareers.length ? <section id="related-careers" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8"><Badge variant="soft">Where these skills are used</Badge><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">Technology careers connected to this path</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">Open a role guide to understand its daily work, responsibilities, collaborators, deliverables, and evidence of growing seniority.</p><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{relatedCareers.map((career) => <CareerCard key={career.slug} career={career} />)}</div></section> : null}

      {nextPaths.length ? <section id="next-paths" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 sm:px-6 lg:px-8"><Badge variant="soft">Continue learning</Badge><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">Recommended next paths</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{nextPaths.map((nextPath) => <LearningPathCard key={nextPath.slug} path={nextPath} />)}</div></section> : null}
    </div>
  );
}
