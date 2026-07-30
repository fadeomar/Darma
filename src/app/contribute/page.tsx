import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  ExternalLink,
  FileCheck2,
  GitBranch,
  GitPullRequest,
  HeartHandshake,
  Link2Off,
  Route,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getLearningPaths } from "@/features/learning-paths";
import { getResourceCatalog } from "@/features/resources";
import { getGlossaryTerms } from "@/features/tech-glossary";
import { getTechCareers } from "@/features/tech-careers";
import { absoluteUrl } from "@/features/tools/seo";
import { getWaysOfWorking } from "@/features/ways-of-working";

const REPO = "https://github.com/fadeomar/Darma";
const ISSUE_BASE = `${REPO}/issues/new?template=`;

export const metadata: Metadata = {
  title: "Contribute to Darma — improve resources, paths, careers, and workflows",
  description:
    "Help maintain the open-source Darma Tech Atlas by suggesting trustworthy resources, correcting outdated content, improving learning paths, or contributing reviewed code.",
  keywords: [
    "contribute to open source",
    "developer resource contribution",
    "technology learning path contribution",
    "Darma open source",
    "technical content governance",
  ],
  alternates: { canonical: "/contribute" },
  openGraph: {
    title: "Contribute to the Darma Tech Atlas",
    description: "A structured contribution flow for trustworthy technical resources and practical learning content.",
    url: absoluteUrl("/contribute"),
    type: "website",
  },
};

const CONTRIBUTION_TYPES = [
  {
    id: "resources",
    icon: BookOpenCheck,
    eyebrow: "Resource library",
    title: "Suggest a trustworthy resource",
    text: "Propose official documentation, a course, a developer tool, a design reference, or another useful source with clear placement and evidence.",
    href: `${ISSUE_BASE}resource-suggestion.yml`,
    action: "Open resource form",
  },
  {
    id: "broken-links",
    icon: Link2Off,
    eyebrow: "Content health",
    title: "Report a broken or outdated source",
    text: "Flag a dead link, wrong redirect, outdated description, pricing change, classification problem, or broken source identity.",
    href: `${ISSUE_BASE}broken-resource.yml`,
    action: "Report a resource problem",
  },
  {
    id: "learning-paths",
    icon: Route,
    eyebrow: "Learning paths",
    title: "Improve a learning journey",
    text: "Suggest a missing stage, a stronger primary reference, a clearer checkpoint, or a more useful project outcome.",
    href: `${ISSUE_BASE}learning-path-improvement.yml`,
    action: "Improve a path",
  },
  {
    id: "atlas-content",
    icon: BriefcaseBusiness,
    eyebrow: "Careers and work",
    title: "Correct an Atlas explanation",
    text: "Improve a career guide, way of working, team model, delivery stage, or glossary definition with practical wording and supporting sources.",
    href: `${ISSUE_BASE}atlas-content-correction.yml`,
    action: "Submit a correction",
  },
];

const REVIEW_STEPS = [
  {
    icon: SearchCheck,
    title: "Check scope and duplicates",
    text: "Search Darma first and explain the specific user need the contribution solves.",
  },
  {
    icon: ShieldCheck,
    title: "Verify facts and provenance",
    text: "Prefer primary sources and separate verified facts from interpretation or company-specific practice.",
  },
  {
    icon: FileCheck2,
    title: "Validate structure",
    text: "Automated audits check schemas, IDs, URLs, cross-references, governance files, and contribution workflow health.",
  },
  {
    icon: GitPullRequest,
    title: "Review the user-facing result",
    text: "A maintainer reviews clarity, usefulness, accessibility, duplication, and long-term maintenance cost before merge.",
  },
];

export default function ContributePage() {
  const stats = {
    resources: getResourceCatalog().length,
    paths: getLearningPaths().length,
    careers: getTechCareers().length,
    ways: getWaysOfWorking().length,
    terms: getGlossaryTerms().length,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Contribute to the Darma Tech Atlas",
    url: absoluteUrl("/contribute"),
    description: "Structured ways to improve Darma's open technical reference.",
    isPartOf: { "@type": "WebSite", name: "Darma", url: absoluteUrl("/") },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: CONTRIBUTION_TYPES.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        url: item.href,
      })),
    },
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">Open-source contribution</Badge>
              <Badge variant="outline">Evidence before promotion</Badge>
              <Badge variant="outline">Beginner contributions welcome</Badge>
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
              Help Darma stay useful, accurate, and open.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              You do not need to redesign the project or write a large feature. A verified replacement link, a clearer checkpoint, a practical role correction, or a well-scoped pull request can improve the Atlas for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contribution-options"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)]"
              >
                Choose a contribution <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <a
                href={`${REPO}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)]"
              >
                Read the contributor guide <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          <Card padding="lg">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <HeartHandshake className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Atlas today</p>
                <p className="text-lg font-black text-[var(--color-text-primary)]">Community-maintainable</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3">
              {[
                ["Resources", stats.resources],
                ["Learning paths", stats.paths],
                ["Career guides", stats.careers],
                ["Ways of working", stats.ways],
                ["Connected terms", stats.terms],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3 last:border-0 last:pb-0">
                  <dt className="text-sm text-[var(--color-text-secondary)]">{label}</dt>
                  <dd className="font-mono text-sm font-bold text-[var(--color-text-primary)]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>

      <section id="contribution-options" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Choose the smallest useful route</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)] sm:text-4xl">Structured forms produce reviewable contributions.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">Each form asks for the evidence and placement needed for that kind of change, reducing back-and-forth and preventing vague directory submissions.</p>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {CONTRIBUTION_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} as="article" variant="interactive" padding="lg" className="flex h-full flex-col" id={item.id}>
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">{item.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{item.text}</p>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
                  {item.action} <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-14 sm:px-6 lg:px-8">
        <Card padding="lg">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Badge variant="soft">How review works</Badge>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Open contribution does not mean unreviewed publication.</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">Darma keeps factual evidence, editorial judgment, automated validation, and final user experience review as separate checks.</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {REVIEW_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                      <span className="font-mono text-xs font-bold text-[var(--color-text-tertiary)]">0{index + 1}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{step.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card padding="lg" className="flex h-full flex-col">
            <GitBranch className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
            <h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">Ready to change the code or data?</h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">Fork the repository, keep the pull request focused, run the Atlas quality command, and explain the user-facing result plus the evidence behind factual content.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`${REPO}/fork`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)]">Fork Darma <ExternalLink className="h-4 w-4" aria-hidden /></a>
              <a href={`${REPO}/pulls`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-5 text-sm font-semibold text-[var(--color-text-primary)]">View pull requests</a>
            </div>
          </Card>
          <Card padding="lg" className="flex h-full flex-col">
            <ShieldCheck className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
            <h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">Reporting a security problem?</h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">Do not publish credentials, private user information, administrative access details, or a practical exploit in a public issue. Use the private security channel.</p>
            <a href={`${REPO}/security/advisories/new`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary)]">Open private advisory <ExternalLink className="h-4 w-4" aria-hidden /></a>
          </Card>
        </div>
      </section>
    </div>
  );
}
