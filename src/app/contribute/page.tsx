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
    request: "A URL, suggested category, and a short explanation of why the source is useful.",
    review: "Source identity, relevance, maintenance health, and duplication.",
    href: `${ISSUE_BASE}resource-suggestion.yml`,
    action: "Open resource form",
  },
  {
    id: "broken-links",
    icon: Link2Off,
    eyebrow: "Content health",
    title: "Report a broken or outdated source",
    text: "Flag a dead link, wrong redirect, outdated description, pricing change, classification problem, or broken source identity.",
    request: "The affected page, what changed, and a replacement link when one is known.",
    review: "The failure is reproduced before a source is changed or removed.",
    href: `${ISSUE_BASE}broken-resource.yml`,
    action: "Report a resource problem",
  },
  {
    id: "learning-paths",
    icon: Route,
    eyebrow: "Learning paths",
    title: "Improve a learning journey",
    text: "Suggest a missing stage, a stronger primary reference, a clearer checkpoint, or a more useful project outcome.",
    request: "The path and stage, the learner problem, and the proposed improvement.",
    review: "Sequence, evidence, learning value, and links to connected content.",
    href: `${ISSUE_BASE}learning-path-improvement.yml`,
    action: "Improve a path",
  },
  {
    id: "atlas-content",
    icon: BriefcaseBusiness,
    eyebrow: "Careers and work",
    title: "Correct an Atlas explanation",
    text: "Improve a career guide, way of working, team model, delivery stage, or glossary definition with practical wording and supporting sources.",
    request: "The exact claim or section, a proposed correction, and supporting references.",
    review: "Accuracy, balance, clarity, and consistency across related Atlas pages.",
    href: `${ISSUE_BASE}atlas-content-correction.yml`,
    action: "Submit a correction",
  },
];

const REVIEW_STEPS = [
  {
    icon: SearchCheck,
    title: "Check scope and duplicates",
    text: "A maintainer confirms the user need and checks whether the same change is already covered.",
  },
  {
    icon: ShieldCheck,
    title: "Verify facts and provenance",
    text: "Primary sources are preferred, and verified facts are kept separate from interpretation or company-specific practice.",
  },
  {
    icon: FileCheck2,
    title: "Validate structure",
    text: "Automated audits check schemas, IDs, URLs, cross-references, governance files, and contribution workflow health.",
  },
  {
    icon: GitPullRequest,
    title: "Review the user-facing result",
    text: "The final pass checks clarity, accessibility, usefulness, duplication, and long-term maintenance cost.",
  },
];

const primaryActionClass =
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]";
const secondaryActionClass =
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]";

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

      <section className="darma-section-shell darma-section-warm">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center lg:px-8 lg:py-16">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">Open-source contribution</Badge>
              <Badge variant="outline">Evidence before publication</Badge>
              <Badge variant="outline">Beginner-friendly routes</Badge>
            </div>
            <h1 className="darma-balanced-heading mt-6 text-4xl font-black tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Help Darma stay useful, accurate, and open.
            </h1>
            <p className="darma-pretty-copy mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              A verified replacement link, a clearer checkpoint, a practical role correction, or a focused pull request can improve the Atlas. Start with the smallest change that solves a real problem.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contribution-options" className={primaryActionClass}>
                Choose a contribution <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
              </a>
              <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className={secondaryActionClass}>
                Read the contributor guide <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          <Card padding="lg" className="bg-[var(--color-surface-overlay)]">
            <div className="flex items-center gap-3">
              <span className="atlas-symbol h-11 w-11"><HeartHandshake className="h-5 w-5" aria-hidden /></span>
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Atlas today</p>
                <p className="text-lg font-black text-[var(--color-text-primary)]">Built to be maintained</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Resources", stats.resources],
                ["Learning paths", stats.paths],
                ["Career guides", stats.careers],
                ["Ways of working", stats.ways],
                ["Connected terms", stats.terms],
              ].map(([label, value], index) => (
                <div key={String(label)} className={`rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 ${index === 4 ? "col-span-2" : ""}`}>
                  <dt className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</dt>
                  <dd className="mt-1 font-mono text-xl font-black text-[var(--color-text-primary)]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>

      <section id="contribution-options" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Choose the smallest useful route</p>
          <h2 className="darma-balanced-heading mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">Structured forms make contributions easier to review.</h2>
          <p className="darma-pretty-copy mt-4 text-base leading-7 text-[var(--color-text-secondary)]">Each route asks for the evidence and placement needed for that kind of change. This keeps the discussion focused and reduces unnecessary back-and-forth.</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {CONTRIBUTION_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.id} id={item.id} className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-md)]">
                <span className="atlas-symbol h-12 w-12"><Icon className="h-6 w-6" aria-hidden /></span>
                <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">{item.eyebrow}</p>
                <h3 className="darma-balanced-heading mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{item.text}</p>
                <dl className="mt-5 space-y-3 border-t border-[var(--color-border-subtle)] pt-5 text-sm">
                  <div>
                    <dt className="font-bold text-[var(--color-text-primary)]">What you will send</dt>
                    <dd className="mt-1 leading-6 text-[var(--color-text-secondary)]">{item.request}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[var(--color-text-primary)]">What happens next</dt>
                    <dd className="mt-1 leading-6 text-[var(--color-text-secondary)]">{item.review}</dd>
                  </div>
                </dl>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 self-start text-sm font-black text-[var(--color-primary)]">
                  {item.action} <ExternalLink className="darma-link-arrow h-[18px] w-[18px]" aria-hidden />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="darma-section-shell darma-section-mint" id="review-process">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Badge variant="soft">How review works</Badge>
              <h2 className="darma-balanced-heading mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">Open contribution does not mean unreviewed publication.</h2>
              <p className="darma-pretty-copy mt-4 text-base leading-7 text-[var(--color-text-secondary)]">Factual evidence, editorial judgment, automated validation, and the final user experience are checked separately.</p>
            </div>

            <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[23px] before:top-8 before:w-px before:bg-[var(--color-border-strong)]">
              {REVIEW_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="relative grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 pl-[74px] shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto] sm:items-start">
                    <span className="absolute left-3.5 top-5 z-10 grid h-12 w-12 place-items-center rounded-full border border-[var(--color-primary-border)] bg-[var(--color-surface-raised)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]"><Icon className="h-5 w-5" aria-hidden /></span>
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Step {String(index + 1).padStart(2, "0")}</p>
                      <h3 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">{step.title}</h3>
                      <p className="darma-pretty-copy mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card padding="lg">
            <GitBranch className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
            <h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">Ready to change code or data?</h2>
            <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">Fork the repository, keep the pull request focused, run the relevant quality commands, and explain both the user-facing result and the evidence behind factual content.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`${REPO}/fork`} target="_blank" rel="noopener noreferrer" className={primaryActionClass}>Fork Darma <ExternalLink className="h-4 w-4" aria-hidden /></a>
              <a href={`${REPO}/pulls`} target="_blank" rel="noopener noreferrer" className={secondaryActionClass}>View pull requests</a>
            </div>
          </Card>
          <Card padding="lg" className="border-[var(--color-warning-border)]">
            <ShieldCheck className="h-6 w-6 text-[var(--color-warning-text)]" aria-hidden />
            <h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">Reporting a security problem?</h2>
            <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">Do not publish credentials, private user information, administrative access details, or a practical exploit in a public issue. Use the repository security channel.</p>
            <a href={`${REPO}/security/advisories/new`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-5 text-sm font-bold text-[var(--color-warning-text)]">Open private advisory <ExternalLink className="h-4 w-4" aria-hidden /></a>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-4 sm:px-6 lg:px-8">
        <div className="darma-section-ink rounded-[var(--radius-xl)] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8 lg:p-9">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-on-ink-muted)]">A transparent public record</p>
            <h2 className="darma-balanced-heading mt-3 text-2xl font-black text-[var(--color-text-on-ink)] sm:text-3xl">Keep the reference useful and honest.</h2>
            <p className="darma-pretty-copy mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-on-ink-muted)]">Contributions remain reviewable in the repository, including the reasoning, discussion, and final change.</p>
          </div>
          <Link href="/editorial-policy" className="mt-6 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-bold text-[var(--color-primary-text)] sm:mt-0">Read the review policy <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      </section>
    </div>
  );
}
