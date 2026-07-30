import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Compass, GitBranch, Route, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { absoluteUrl } from "@/features/tools/seo";
import { getLearningPaths } from "@/features/learning-paths";
import { LearningPathExplorer } from "@/features/learning-paths/components";

export const metadata: Metadata = {
  title: "Technology Learning Paths — web, JavaScript, mobile, design, and DevOps | Darma",
  description: "Follow practical, project-based learning paths for web foundations, frontend JavaScript, full-stack Node.js, React Native, UI/UX design, and DevOps.",
  keywords: ["developer learning paths", "web development roadmap", "JavaScript learning path", "React learning path", "React Native roadmap", "UI UX learning path", "DevOps for developers"],
  alternates: { canonical: "/learning-paths" },
  openGraph: {
    title: "Darma Technology Learning Paths",
    description: "Structured, project-based guides that connect skills, checkpoints, practical projects, and trusted technical resources.",
    url: absoluteUrl("/learning-paths"),
    type: "website",
  },
};

const PRINCIPLES = [
  { icon: Route, title: "Ordered, not overwhelming", text: "Each guide tells you what to learn now, what comes later, and what proof of understanding to create before moving on." },
  { icon: BookOpenCheck, title: "Practice at every stage", text: "Every stage includes a checkpoint and a small project so progress is based on demonstrated skill, not consumed content." },
  { icon: ShieldCheck, title: "Trusted starting sources", text: "The paths prioritize official documentation and clearly reviewed references while keeping unverified claims out of the guidance." },
];

function learningPathsJsonLd() {
  const paths = getLearningPaths();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl("/learning-paths")}#collection`,
        name: "Darma Technology Learning Paths",
        url: absoluteUrl("/learning-paths"),
        description: "Structured learning paths for web development, JavaScript, mobile development, product design, and DevOps.",
        mainEntity: { "@id": `${absoluteUrl("/learning-paths")}#paths` },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl("/learning-paths")}#paths`,
        numberOfItems: paths.length,
        itemListElement: paths.map((path, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: path.title,
          url: absoluteUrl(`/learning-paths/${path.slug}`),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Learning Paths", item: absoluteUrl("/learning-paths") },
        ],
      },
    ],
  };
}

export default function LearningPathsPage() {
  const paths = getLearningPaths();
  const jsonLd = learningPathsJsonLd();
  const stageCount = paths.reduce((total, path) => total + path.stages.length, 0);

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2"><Badge variant="soft">Darma Tech Atlas</Badge><Badge variant="outline">Project-based guides</Badge></div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">Choose a goal. Follow a clear path. Build proof that you learned it.</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">Darma Learning Paths connect essential concepts, official references, practical checkpoints, and portfolio-ready projects without pretending that one roadmap fits every learner.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#learning-path-explorer-title" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]">Choose your path <ArrowRight className="h-4 w-4" aria-hidden /></a>
              <Link href="/resources" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-subtle)]">Search all resources</Link>
            </div>
          </div>
          <Card padding="lg">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><Compass className="h-5 w-5" aria-hidden /></div><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Available now</p><p className="text-lg font-black text-[var(--color-text-primary)]">Six guided directions</p></div></div>
            <dl className="mt-5 space-y-3">{[["Learning paths", paths.length], ["Practical stages", stageCount], ["Progress account", "Not required"], ["Primary stack", "JavaScript-first"]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3 last:border-0 last:pb-0"><dt className="text-sm text-[var(--color-text-secondary)]">{label}</dt><dd className="font-mono text-sm font-bold text-[var(--color-text-primary)]">{value}</dd></div>)}</dl>
          </Card>
        </div>
      </section>
      <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-10 sm:px-6 lg:px-8" aria-label="Learning path principles"><div className="grid gap-4 md:grid-cols-3">{PRINCIPLES.map((principle) => { const Icon = principle.icon; return <Card key={principle.title} padding="md" className="h-full"><Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /><h2 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">{principle.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{principle.text}</p></Card>; })}</div></section>
      <LearningPathExplorer paths={paths} />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8"><Card padding="lg" className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-[var(--color-primary)]"><GitBranch className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Open source guidance</span></div><h2 className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">Found a missing stage or a stronger official source?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">The paths are deliberately reviewable and expandable. Suggestions should explain who benefits, where the item belongs, and why the source is trustworthy.</p></div><Link href="/contribute#learning-paths" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">Suggest an improvement</Link></Card></section>
    </div>
  );
}
