import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { absoluteUrl } from "@/features/tools/seo";

export const metadata: Metadata = {
  title: "Editorial Policy — how Darma researches and reviews technology content",
  description:
    "Read how Darma selects sources, writes guides, handles comparisons, records review dates, corrects mistakes, and keeps its open-source technology reference accountable.",
  alternates: { canonical: "/editorial-policy" },
  openGraph: {
    title: "Darma Editorial Policy",
    description: "How Darma researches, reviews, cites, updates, and corrects technology content.",
    url: absoluteUrl("/editorial-policy"),
    type: "article",
  },
};

const STEPS = [
  ["Ask", "Start from a real user question", "A guide or comparison begins with a clear search and decision intent. It is not created to meet a target word count."],
  ["Research", "Prefer primary references", "Official documentation, standards bodies, framework maintainers, and original research come first. Community sources are labelled when they add useful context."],
  ["Explain", "Write an original explanation", "Darma connects definitions to projects, constraints, mistakes, alternatives, and next actions instead of copying documentation or publishing a directory of links."],
  ["Validate", "Check every connection", "Learning paths, careers, methods, glossary terms, and resources must resolve to existing records and must not contradict connected content."],
  ["Review", "Review before publication", "A separate technical review checks claims, source quality, comparison balance, structure, accessibility, metadata, and internal links."],
  ["Correct", "Record updates and corrections", "Pages expose their modified date. Significant corrections are made in the repository, and outdated sources can be reported through structured contribution forms."],
] as const;

export default function EditorialPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Darma Editorial Policy",
    description: metadata.description,
    url: absoluteUrl("/editorial-policy"),
    about: { "@type": "Organization", name: "Darma", url: absoluteUrl("/") },
    dateModified: "2026-07-30",
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="darma-section-shell darma-section-warm">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">Trust and transparency</Badge>
              <Badge variant="outline">Open-source policy</Badge>
            </div>
            <h1 className="darma-balanced-heading mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              How Darma researches, writes, reviews, and corrects technology content.
            </h1>
            <p className="darma-pretty-copy mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              Darma helps people make technical and career decisions. That requires visible sources, balanced comparisons, honest uncertainty, and a correction process that is as clear as the published page.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-page)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-primary)]">The review path</p>
          <h2 className="darma-balanced-heading mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Six visible stages from question to correction.</h2>
          <p className="darma-pretty-copy mt-3 text-base leading-7 text-[var(--color-text-secondary)]">Each stage has a different purpose. Separating them makes it easier to identify weak sources, unclear claims, missing context, and outdated guidance.</p>
        </div>

        <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[23px] before:top-8 before:w-px before:bg-[var(--color-border-default)]">
          {STEPS.map(([phase, title, text], index) => (
            <li key={title} className="relative grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:grid-cols-[48px_140px_minmax(0,1fr)] sm:items-start sm:gap-5 sm:p-6">
              <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] font-mono text-sm font-black text-[var(--color-primary-text)] shadow-[0_0_0_6px_var(--color-page-bg)]">{String(index + 1).padStart(2, "0")}</span>
              <p className="pt-1 font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-primary)]">{phase}</p>
              <div>
                <h3 className="darma-balanced-heading text-xl font-black text-[var(--color-text-primary)]">{title}</h3>
                <p className="darma-pretty-copy mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="darma-section-shell darma-section-mint">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <Card padding="lg">
            <SearchCheck className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
            <h2 className="mt-5 text-2xl font-black text-[var(--color-text-primary)]">Source hierarchy</h2>
            <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">The order below is a preference, not a shortcut. A source still has to support the specific claim being made.</p>
            <ol className="mt-6 space-y-3">
              {[
                "Official documentation and original maintainers",
                "Standards bodies and recognized public frameworks",
                "Original research and transparent datasets",
                "Community explanations with clear attribution",
                "Darma's own practical synthesis and examples",
              ].map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] font-mono text-xs font-black text-[var(--color-primary)]">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </Card>

          <div className="rounded-[var(--radius-xl)] bg-[var(--color-section-ink)] p-6 text-[var(--color-text-on-ink)] shadow-[var(--shadow-md)] sm:p-8">
            <ShieldCheck className="h-6 w-6 text-[var(--color-accent)]" aria-hidden />
            <h2 className="mt-5 text-2xl font-black">What Darma does not claim</h2>
            <ul className="mt-6 space-y-4">
              {[
                "A roadmap cannot guarantee employment or replace supervised professional experience.",
                "A comparison does not create one universal winner for every team.",
                "A verified link does not mean Darma endorses every statement or commercial offer on that site.",
                "Structured data and SEO work do not guarantee a rich result or a specific ranking.",
                "An automated link failure never removes a source without human review.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-[var(--color-text-on-ink-muted)]">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8">
        <Card padding="lg" className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <GitPullRequest className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
            <h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">Corrections are part of the system</h2>
            <p className="darma-pretty-copy mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
              Report a broken source, challenge an explanation, propose a better primary reference, or submit a focused pull request. The public repository keeps the review history visible.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contribute" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)]">Open contribution guide</Link>
            <a href="https://github.com/fadeomar/Darma" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-5 text-sm font-semibold text-[var(--color-text-primary)]">View repository <ExternalLink className="h-4 w-4" aria-hidden /></a>
          </div>
        </Card>
      </section>
    </div>
  );
}
