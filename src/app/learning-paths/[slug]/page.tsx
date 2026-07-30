import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, ExternalLink, Flag, Layers3, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";
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
      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link href="/learning-paths" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"><ArrowLeft className="h-4 w-4" aria-hidden />All learning paths</Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2"><Badge variant="soft">{path.track} path</Badge><Badge variant="outline">{path.difficulty}</Badge><Badge variant="outline">JavaScript-first atlas</Badge></div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">{path.title}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">{path.description}</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[var(--color-text-secondary)]"><span className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />{path.stages.length} stages</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />{path.estimatedWeeks}</span><span className="flex items-center gap-2"><Users className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />{path.weeklyCommitment} weekly</span></div>
          </div>
          <Card padding="lg">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Before you start</p>
            <h2 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">Prerequisites</h2>
            <ul className="mt-4 space-y-3">{path.prerequisites.map((prerequisite) => <li key={prerequisite} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />{prerequisite}</li>)}</ul>
            <a href="#path-stages" className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]">Start with stage one <ArrowRight className="h-4 w-4" aria-hidden /></a>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-10 sm:px-6 lg:px-8"><div className="grid gap-5 lg:grid-cols-2"><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">Who this path is for</h2><ul className="mt-4 space-y-3">{path.audience.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><Users className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />{item}</li>)}</ul></Card><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">What you should be able to do</h2><ul className="mt-4 space-y-3">{path.outcomes.map((outcome) => <li key={outcome} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />{outcome}</li>)}</ul></Card></div></section>

      <section id="path-stages" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-12 sm:px-6 lg:px-8"><div className="mb-6"><Badge variant="soft">Path stages</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Learn, build, check, then continue.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">Mark a stage complete only when you can meet its checkpoint and explain the decisions in its practical project. Reading every link is not the goal.</p></div><LearningPathTimeline path={path} stages={stages} /></section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-10 sm:px-6 lg:px-8"><Card padding="lg" className="border-[var(--color-primary-border)]"><div className="flex items-center gap-2 text-[var(--color-primary)]"><Flag className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Final project</span></div><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">{path.finalProject.title}</h2><p className="mt-3 max-w-4xl text-base leading-7 text-[var(--color-text-secondary)]">{path.finalProject.brief}</p><ul className="mt-5 grid gap-2 md:grid-cols-2">{path.finalProject.deliverables.map((deliverable) => <li key={deliverable} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />{deliverable}</li>)}</ul></Card></section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-10 sm:px-6 lg:px-8"><Card padding="lg"><h2 className="text-xl font-black text-[var(--color-text-primary)]">Primary references used to shape this path</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">These links provide official or project-maintained foundations. Darma adds the ordering, checkpoints, projects, and cross-topic guidance.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{path.references.map((reference) => <Link key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">{reference.name}<ExternalLink className="h-4 w-4 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></Link>)}</div></Card></section>

      {relatedCareers.length ? <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-10 sm:px-6 lg:px-8"><Badge variant="soft">Where these skills are used</Badge><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">Technology careers connected to this path</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">Open a role guide to understand its daily work, responsibilities, collaborators, deliverables, and evidence of growing seniority.</p><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{relatedCareers.map((career) => <CareerCard key={career.slug} career={career} />)}</div></section> : null}

      {nextPaths.length ? <section className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8"><Badge variant="soft">Continue learning</Badge><h2 className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">Recommended next paths</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{nextPaths.map((nextPath) => <LearningPathCard key={nextPath.slug} path={nextPath} />)}</div></section> : null}
    </div>
  );
}
