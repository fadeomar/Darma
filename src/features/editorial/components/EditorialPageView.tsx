import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, ExternalLink, GitCompareArrows, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { MotionSection } from "@/components/motion";
import { DetailHero, DetailSectionNav, type DetailSectionNavItem } from "@/components/details";
import { getLearningPath } from "@/features/learning-paths";
import { getResourcesByIds } from "@/features/resources";
import { getTechCareer } from "@/features/tech-careers";
import { getWayOfWorking } from "@/features/ways-of-working";
import { absoluteUrl } from "@/features/tools/seo";
import type { EditorialPage } from "../schema";

const sectionClass = "mx-auto max-w-[var(--container-wide)] px-4 pb-10 sm:px-6 lg:px-8";
const primaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

export function EditorialPageView({ page }: { page: EditorialPage }) {
  const basePath = page.kind === "guide" ? "/guides" : "/comparisons";
  const pageUrl = `${basePath}/${page.slug}`;
  const paths = page.relatedPathSlugs.map(getLearningPath).filter(Boolean);
  const careers = page.relatedCareerSlugs.map(getTechCareer).filter(Boolean);
  const ways = page.relatedWaySlugs.map(getWayOfWorking).filter(Boolean);
  const resources = getResourcesByIds(page.resourceIds);
  const KindIcon = page.kind === "guide" ? BookOpen : GitCompareArrows;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${absoluteUrl(pageUrl)}#article`,
        headline: page.title,
        description: page.summary,
        url: absoluteUrl(pageUrl),
        datePublished: page.publishedAt,
        dateModified: page.updatedAt,
        mainEntityOfPage: absoluteUrl(pageUrl),
        articleSection: page.kind === "guide" ? "Technology guides" : "Technology comparisons",
        keywords: [page.primaryKeyword, ...page.secondaryKeywords].join(", "),
        author: { "@type": "Organization", name: page.author.name, url: absoluteUrl(page.author.href) },
        reviewedBy: { "@type": "Organization", name: page.reviewer.name, url: absoluteUrl(page.reviewer.href) },
        publisher: { "@type": "Organization", name: "Darma", url: absoluteUrl("/") },
        isPartOf: { "@type": "WebSite", name: "Darma Tech Atlas", url: absoluteUrl("/") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: page.kind === "guide" ? "Guides" : "Comparisons", item: absoluteUrl(basePath) },
          { "@type": "ListItem", position: 3, name: page.shortTitle, item: absoluteUrl(pageUrl) },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <DetailHero
        variant={page.kind === "guide" ? "guide" : "comparison"}
        backHref={basePath}
        backLabel={`All ${page.kind === "guide" ? "guides" : "comparisons"}`}
        eyebrow={page.kind === "guide" ? "Understand the system, then use it" : "Compare from constraints, not popularity"}
        badges={[
          { label: page.kind === "guide" ? "Practical technology guide" : "Decision comparison", tone: "soft" },
          { label: `${page.readingMinutes} minute read`, tone: "outline" },
          { label: "Reviewed", tone: "success" },
        ]}
        title={page.title}
        description={page.description}
        metrics={[
          { value: page.sections.length, label: "sections" },
          { value: page.readingMinutes, label: "minutes" },
          { value: page.references.length + resources.length, label: "sources" },
          { value: page.faqs.length, label: "questions" },
        ]}
        actions={[
          { href: "#quick-answer", label: "Read the quick answer", tone: "primary" },
          { href: `#${page.sections[0]?.id ?? "questions"}`, label: "Explore the reasoning", tone: "secondary" },
          { href: "/editorial-policy", label: "Review method", tone: "quiet" },
        ]}
        signals={[
          { label: "Updated", value: formatDate(page.updatedAt) },
          { label: "Author", value: page.author.name },
          { label: "Reviewed by", value: page.reviewer.name },
          { label: "Primary topic", value: page.primaryKeyword },
        ]}
        asideTitle="Keep these decisions in view"
        asideItems={page.keyTakeaways}
      />

      <DetailSectionNav
        items={[
          { id: "quick-answer", label: "Quick answer" },
          ...page.sections.map((section) => ({ id: section.id, label: section.title })),
          ...(page.comparisonTable ? [{ id: "comparison-table", label: "Comparison table" }] : []),
          ...(page.decisionFramework ? [{ id: "decision-guide", label: "Decision guide" }] : []),
          { id: "questions", label: "Questions" },
          ...((paths.length || careers.length || ways.length) ? [{ id: "continue-atlas", label: "Next actions" }] : []),
          { id: "sources-next", label: "Sources" },
        ] satisfies DetailSectionNavItem[]}
        label={`${page.shortTitle} sections`}
      />

      <section id="quick-answer" className={`${sectionClass} scroll-mt-28`}>
        <Card padding="lg" className="visual-grid-bg border-[var(--color-primary-border)]">
          <div className="flex items-center gap-2 text-[var(--color-primary-text-strong)]"><KindIcon className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Quick answer</span></div>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--color-text-primary)] sm:text-lg">{page.quickAnswer}</p>
        </Card>
      </section>

      <section className={sectionClass}>
        <div className="grid gap-4 md:grid-cols-3">
          {page.keyTakeaways.map((item) => <Card key={item} padding="md" className="visual-card h-full"><CheckCircle2 className="h-5 w-5 text-[var(--color-success-text)]" aria-hidden /><p className="mt-3 text-sm font-semibold leading-7 text-[var(--color-text-primary)]">{item}</p></Card>)}
        </div>
      </section>

      <article>
        {page.sections.map((section, index) => (
          <MotionSection as="section" id={section.id} key={section.id} className={`${sectionClass} scroll-mt-28`} distance={18}>
            <div className="detail-editorial-section grid gap-6 lg:grid-cols-[minmax(260px,0.38fr)_minmax(0,760px)] lg:justify-between">
              <div><span className="font-mono text-xs font-black text-[var(--color-primary-text-strong)]">{String(index + 1).padStart(2, "0")}</span><h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">{section.title}</h2></div>
              <div>
                <div className="space-y-5">{section.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-[var(--color-text-secondary)]">{paragraph}</p>)}</div>
                {section.bullets?.length ? <ul className="mt-6 grid gap-3 sm:grid-cols-2">{section.bullets.map((item) => <li key={item} className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-sm leading-6 text-[var(--color-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]" aria-hidden />{item}</li>)}</ul> : null}
                {section.note ? <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-5 text-sm leading-7 text-[var(--color-text-primary)]"><strong>Keep in mind:</strong> {section.note}</div> : null}
              </div>
            </div>
          </MotionSection>
        ))}
      </article>

      {page.comparisonTable ? (
        <section id="comparison-table" className={`${sectionClass} scroll-mt-28`}>
          <div className="mb-5"><Badge variant="soft">Side-by-side</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Compare the practical differences</h2></div>
          <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)]">
            <table className="min-w-[760px] w-full border-collapse text-left">
              <thead><tr className="bg-[var(--color-surface-subtle)]"><th className="p-4 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Decision area</th>{page.comparisonTable.columns.map((column) => <th key={column} className="p-4 text-sm font-black text-[var(--color-text-primary)]">{column}</th>)}</tr></thead>
              <tbody>{page.comparisonTable.rows.map((row) => <tr key={row.label} className="border-t border-[var(--color-border-subtle)]"><th className="p-4 align-top text-sm font-black text-[var(--color-text-primary)]">{row.label}</th>{row.values.map((value, index) => <td key={`${row.label}-${index}`} className="p-4 align-top text-sm leading-6 text-[var(--color-text-secondary)]">{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>
      ) : null}

      {page.decisionFramework?.length ? (
        <section id="decision-guide" className={`${sectionClass} scroll-mt-28`}>
          <div className="mb-5"><Badge variant="soft">Decision guide</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Choose from your real constraints</h2></div>
          <div className="grid gap-4 md:grid-cols-2">{page.decisionFramework.map((item, index) => <Card key={item.label} padding="lg" className="h-full"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] font-mono text-xs font-black text-[var(--color-primary-text)]">{index + 1}</span><h3 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{item.label}</h3><p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{item.guidance}</p></Card>)}</div>
        </section>
      ) : null}

      <section id="questions" className={`${sectionClass} scroll-mt-28`}>
        <div className="mb-5"><Badge variant="soft">Common questions</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Questions people ask before choosing</h2></div>
        <div className="space-y-3">
          {page.faqs.map((item) => (
            <details key={item.question} className="editorial-faq group rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] open:border-[var(--color-primary-border)] open:bg-[var(--color-surface-raised)] open:shadow-[var(--shadow-card)]">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-base font-black text-[var(--color-text-primary)] focus-visible:shadow-[var(--focus-ring)]">
                <span>{item.question}</span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-control-track)] text-[var(--color-text-secondary)] transition group-open:rotate-180 group-open:border-[var(--color-primary-border)] group-open:bg-[var(--color-primary-soft)] group-open:text-[var(--color-primary-text-strong)] motion-reduce:transition-none">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </summary>
              <div className="border-t border-[var(--color-border-subtle)] px-5 pb-5 pt-4">
                <p className="max-w-4xl text-sm leading-7 text-[var(--color-text-secondary)]">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {(paths.length || careers.length || ways.length) ? (
        <section id="continue-atlas" className={`${sectionClass} scroll-mt-28`}>
          <div className="mb-5"><Badge variant="soft">Continue in the Atlas</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Turn the explanation into the next action</h2></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paths.map((item) => <Link key={item!.slug} href={`/learning-paths/${item!.slug}`} className="block h-full"><Card variant="interactive" padding="lg" className="h-full"><Badge variant="outline">Learning path</Badge><h3 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{item!.shortTitle}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item!.summary}</p></Card></Link>)}
            {careers.slice(0, 4).map((item) => <Link key={item!.slug} href={`/tech-careers/${item!.slug}`} className="block h-full"><Card variant="interactive" padding="lg" className="h-full"><Badge variant="outline">Career guide</Badge><h3 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{item!.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item!.summary}</p></Card></Link>)}
            {ways.slice(0, 4).map((item) => <Link key={item!.slug} href={`/ways-of-working/${item!.slug}`} className="block h-full"><Card variant="interactive" padding="lg" className="h-full"><Badge variant="outline">Way of working</Badge><h3 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{item!.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item!.summary}</p></Card></Link>)}
          </div>
        </section>
      ) : null}

      <section id="sources-next" className={`${sectionClass} scroll-mt-28`}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
          <Card padding="lg" className="border-[var(--color-primary-border)]">
            <div className="flex items-center gap-2 text-[var(--color-primary-text-strong)]"><Sparkles className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Next step</span></div>
            <h2 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">{page.cta.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{page.cta.text}</p>
            <Link href={page.cta.href} className={`mt-5 ${primaryClass}`}>{page.cta.label} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </Card>
          <Card padding="lg">
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">Sources and further reading</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Darma prioritizes primary and official references, then adds clearly labelled standards, research, or community material.</p>
            <div className="mt-5 space-y-2">
              {[...page.references.map((item) => ({ name: item.name, url: item.url, label: item.type })), ...resources.map((item) => ({ name: item.name, url: item.url, label: item.publisherType }))]
                .filter((item, index, all) => all.findIndex((candidate) => candidate.url === item.url) === index)
                .map((item) => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary-text-strong)]"><span><span className="block">{item.name}</span><span className="mt-1 block font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{item.label}</span></span><ExternalLink className="h-4 w-4 shrink-0" aria-hidden /></a>)}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
