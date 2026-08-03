import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, GitBranch, Route, ShieldCheck } from "lucide-react";
import { PortalHero } from "@/components/portals";
import { Card } from "@/components/ui";
import { absoluteUrl } from "@/features/tools/seo";
import { getLearningPaths } from "@/features/learning-paths";
import { LearningPathExplorer } from "@/features/learning-paths/components";

export const metadata: Metadata = {
  title: "Technology Learning Paths | web, JavaScript, mobile, design, and DevOps | Darma",
  description: "Follow practical, project-based learning paths for web foundations, frontend JavaScript, full-stack Node.js, React Native, UI/UX design, and DevOps.",
  keywords: ["developer learning paths", "web development roadmap", "JavaScript learning path", "React learning path", "React Native roadmap", "UI UX learning path", "DevOps for developers"],
  alternates: { canonical: "/learning-paths" },
  openGraph: {
    title: "Darma Technology Learning Paths",
    description: "Structured, project-based guides that connect skills, checkpoints, practical projects, and cataloged technical resources.",
    url: absoluteUrl("/learning-paths"),
    type: "website",
  },
};

const PRINCIPLES = [
  { icon: Route, title: "Ordered, not overwhelming", text: "Each guide tells you what to learn now, what comes later, and what proof of understanding to create before moving on." },
  { icon: BookOpenCheck, title: "Practice at every stage", text: "Every stage includes a checkpoint and a small project so progress is based on demonstrated skill, not consumed content." },
  { icon: ShieldCheck, title: "Official starting sources", text: "The paths prioritize official documentation and show each source's review state instead of implying every reference has been verified." },
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
  const projectCount = paths.reduce((total, path) => total + path.stages.filter((stage) => Boolean(stage.project)).length, 0);

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PortalHero
        variant="learning"
        eyebrow="Darma structured learning"
        badges={["Project-based", "Official sources", "No progress account"]}
        title="Choose a direction, build evidence, and know why the next stage comes next."
        description="Darma Learning Paths connect foundations, cataloged references, practical checkpoints, and portfolio-ready projects without pretending that one roadmap fits every learner."
        actions={[
          { href: "#learning-path-explorer-title", label: "Choose a learning path", icon: "route", tone: "primary" },
          { href: "/resources", label: "Search official resources", icon: "resources", tone: "secondary" },
          { href: "/career-pathfinder", label: "Match a career direction", icon: "atlas", tone: "quiet" },
        ]}
        metrics={[
          { value: paths.length, label: "guided directions" },
          { value: stageCount, label: "practical stages" },
          { value: projectCount, label: "project checkpoints" },
          { value: "0", label: "accounts required" },
        ]}
        signals={[
          { label: "Start", value: "Foundations first" },
          { label: "Practice", value: "Checkpoint per stage" },
          { label: "Evidence", value: "Projects and outputs" },
          { label: "Sources", value: "Cataloged references" },
        ]}
      />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8" aria-label="Learning path principles">
        <div className="portal-principle-grid">
          {PRINCIPLES.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <Card key={principle.title} padding="md" className="portal-principle-card h-full">
                <span className="portal-principle-index">0{index + 1}</span>
                <span className="portal-principle-icon"><Icon className="h-5 w-5" aria-hidden /></span>
                <h2>{principle.title}</h2>
                <p>{principle.text}</p>
              </Card>
            );
          })}
        </div>
      </section>
      <LearningPathExplorer paths={paths} />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8">
        <Card padding="lg" className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-primary)]"><GitBranch className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Open source guidance</span></div>
            <h2 className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">Found a missing stage or a stronger official source?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">The paths are deliberately reviewable and expandable. Suggestions should explain who benefits, where the item belongs, and why the source is trustworthy.</p>
          </div>
          <Link href="/contribute#learning-paths" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">Suggest an improvement</Link>
        </Card>
      </section>
    </div>
  );
}
