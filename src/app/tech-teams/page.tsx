import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Network,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { absoluteUrl } from "@/features/tools/seo";
import { getGlossaryTermsBySlugs } from "@/features/tech-glossary";
import { getTechCareersBySlugs } from "@/features/tech-careers";
import { getDeliveryFlow, getTeamModels } from "@/features/tech-teams";

export const metadata: Metadata = {
  title: "Technology Teams — structures, roles, and end-to-end delivery flow | Darma",
  description:
    "Compare technology organization models and follow how a real product need moves through discovery, design, delivery, release, operation, and learning.",
  keywords: [
    "technology team structure",
    "cross functional product team",
    "functional organization",
    "matrix organization",
    "team topologies",
    "software delivery flow",
  ],
  alternates: { canonical: "/tech-teams" },
  openGraph: {
    title: "Darma Technology Team Map",
    description: "See how technology organizations structure teams and how roles collaborate from need to learning.",
    url: absoluteUrl("/tech-teams"),
    type: "website",
  },
};

function jsonLd() {
  const models = getTeamModels();
  const flow = getDeliveryFlow();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Darma Technology Team Map",
        url: absoluteUrl("/tech-teams"),
        description: "Technology organization models and a practical end-to-end product delivery flow.",
      },
      {
        "@type": "ItemList",
        name: "Technology team models",
        numberOfItems: models.length,
        itemListElement: models.map((model, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: model.title,
        })),
      },
      {
        "@type": "HowTo",
        name: "End-to-end technology product delivery flow",
        step: flow.map((stage, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: stage.title,
          text: stage.description,
        })),
      },
    ],
  };
}

export default function TechTeamsPage() {
  const models = getTeamModels();
  const flow = getDeliveryFlow();
  const data = jsonLd();

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
      />

      <section className="darma-section-shell darma-section-warm">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">Darma Tech Atlas</Badge>
              <Badge variant="outline">Team and delivery map</Badge>
            </div>
            <h1 className="darma-balanced-heading mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              See where roles belong and how a feature travels through a company.
            </h1>
            <p className="darma-pretty-copy mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              Technology companies do not share one universal org chart. Compare common structures, then follow one end-to-end flow from a need or signal to release, operation, and improvement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#team-models" className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)]">
                Compare team models <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
              </a>
              <a href="#delivery-flow" className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-text-strong)]">
                <Network className="h-4 w-4" aria-hidden /> Follow delivery flow
              </a>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-[72px] z-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]/95 backdrop-blur-xl" aria-label="Page sections">
        <div className="mx-auto flex max-w-[var(--container-wide)] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8 darma-scroll-strip">
          <a href="#team-models" className="min-h-10 shrink-0 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 py-2 text-sm font-bold text-[var(--color-text-primary)]">Team models</a>
          <a href="#delivery-flow" className="min-h-10 shrink-0 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 py-2 text-sm font-bold text-[var(--color-text-primary)]">Delivery flow</a>
          <Link href="/tech-careers" className="min-h-10 shrink-0 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 py-2 text-sm font-bold text-[var(--color-text-primary)]">Role guides</Link>
        </div>
      </nav>

      <section id="team-models" className="mx-auto max-w-[var(--container-wide)] scroll-mt-32 px-4 py-12 sm:px-6 lg:px-8">
        <Badge variant="soft">Organization models</Badge>
        <h2 className="darma-balanced-heading mt-3 text-3xl font-black text-[var(--color-text-primary)]">Different structures optimize different needs.</h2>
        <p className="darma-pretty-copy mt-3 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
          A model is healthy only when ownership, decisions, communication, professional development, and cross-team dependencies are explicit.
        </p>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {models.map((model) => {
            const roles = getTechCareersBySlugs(model.typicalRoleSlugs);
            return (
              <article key={model.slug} className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="darma-balanced-heading text-2xl font-black text-[var(--color-text-primary)]">{model.title}</h3>
                    <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{model.description}</p>
                  </div>
                  <span className="atlas-symbol h-11 w-11 shrink-0 rounded-[var(--radius-md)]"><Users className="h-5 w-5" aria-hidden /></span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {roles.slice(0, 5).map((role) => (
                    <Link key={role.slug} href={`/tech-careers/${role.slug}`} className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary-text-strong)]">
                      {role.shortTitle}
                    </Link>
                  ))}
                </div>

                <p className="mt-5 border-l-2 border-[var(--color-primary)] pl-4 text-sm italic leading-7 text-[var(--color-text-secondary)]">{model.example}</p>

                <details className="group mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-black text-[var(--color-text-primary)]">
                    View strengths, risks, and decision flow
                    <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-primary-text-strong)] transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-[var(--color-border-subtle)] p-4">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-success-text)]">Useful when</p>
                        <ul className="mt-3 space-y-2">
                          {model.usefulWhen.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-warning-text)]">Watch for</p>
                        <ul className="mt-3 space-y-2">
                          {model.watchOutFor.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                              <ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-[var(--color-warning-text)]" aria-hidden />{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 border-t border-[var(--color-border-subtle)] pt-5 md:grid-cols-2">
                      <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">How decisions move</p>
                        <p className="darma-pretty-copy mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{model.decisionPattern}</p>
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">How communication moves</p>
                        <p className="darma-pretty-copy mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{model.communicationPattern}</p>
                      </div>
                    </div>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </section>

      <section id="delivery-flow" className="darma-section-shell darma-section-mint scroll-mt-32">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8">
          <Badge variant="soft">End-to-end delivery</Badge>
          <h2 className="darma-balanced-heading mt-3 text-3xl font-black text-[var(--color-text-primary)]">One need, many professional contributions.</h2>
          <p className="darma-pretty-copy mt-3 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
            Real work loops backward and forward. This map shows the questions, roles, outputs, and vocabulary a product change encounters as it moves through the organization.
          </p>

          <ol className="relative mt-8 space-y-4 before:absolute before:bottom-8 before:left-[23px] before:top-8 before:w-px before:bg-[var(--color-border-default)]">
            {flow.map((stage, index) => {
              const roles = getTechCareersBySlugs(stage.roleSlugs);
              const terms = getGlossaryTermsBySlugs(stage.glossaryTerms);
              return (
                <li key={stage.id} className="relative grid gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:grid-cols-[48px_minmax(0,1fr)_minmax(220px,.48fr)] sm:p-6">
                  <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] font-mono text-sm font-black text-[var(--color-primary-text)] shadow-[0_0_0_6px_var(--color-section-mint)]">{index + 1}</span>
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.13em] text-[var(--color-primary-text-strong)]">{stage.question}</p>
                    <h3 className="darma-balanced-heading mt-2 text-xl font-black text-[var(--color-text-primary)] sm:text-2xl">{stage.title}</h3>
                    <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{stage.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <Link key={role.slug} href={`/tech-careers/${role.slug}`} className="rounded-[var(--radius-full)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-text-strong)]">
                          {role.shortTitle}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Typical outputs</p>
                    <ul className="mt-3 space-y-2">
                      {stage.outputs.map((output) => (
                        <li key={output} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]" aria-hidden />{output}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Terms</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {terms.map((term) => (
                        <Link key={term.slug} href={`/tech-glossary#${term.slug}`} className="text-xs font-bold text-[var(--color-primary-text-strong)]">{term.term}</Link>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
