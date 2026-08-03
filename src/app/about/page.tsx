import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Library,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { AtlasHeroScene, AtlasScrollStory, MotionSection, SplitTextReveal } from "@/components/motion";
import { getPublicTools } from "@/features/tools";
import { getLearningPaths } from "@/features/learning-paths";
import { getTechCareers } from "@/features/tech-careers";
import { getWaysOfWorking } from "@/features/ways-of-working";
import { getGlossaryTerms } from "@/features/tech-glossary";
import { getTeamModels } from "@/features/tech-teams";
import { absoluteUrl } from "@/features/tools/seo";
import {
  AUDIENCE_LABELS,
  countByPrivacy,
  HELP_AREAS,
  PRIVACY_META,
  PRIVACY_ORDER,
  selectAudienceToolGroups,
} from "./aboutContent";
import { ContinuePanel } from "./ContinuePanel";
import { FavoritesPanel } from "./FavoritesPanel";

const SUGGEST_TOOL_URL =
  "https://github.com/fadeomar/Darma/issues/new?labels=tool-suggestion&title=Tool%20suggestion%3A%20";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Darma — open tools and a practical technology atlas",
  description:
    "Learn how Darma combines free browser tools with cataloged resources, learning paths, technology careers, team workflows, organization maps, and practical terminology.",
  alternates: { canonical: "/about" },
};

const primaryLinkClass =
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]";
const secondaryLinkClass =
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]";
const sectionClass = "mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14";
const eyebrowClass =
  "font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]";

const HELP_ICONS = [Wrench, Sparkles, Library, ShieldCheck];

export default function AboutPage() {
  const publicTools = getPublicTools();
  const learningPaths = getLearningPaths();
  const techCareers = getTechCareers();
  const waysOfWorking = getWaysOfWorking();
  const glossaryTerms = getGlossaryTerms();
  const teamModels = getTeamModels();

  const privacyCounts = countByPrivacy(publicTools);
  const presentPrivacy = PRIVACY_ORDER.filter((level) => (privacyCounts.get(level) ?? 0) > 0);
  const audienceToolGroups = selectAudienceToolGroups(publicTools, 3);

  // Minimal, serializable list so the client favorites island can resolve any
  // favorited id back to a tool.
  const favoritePanelTools = publicTools.map((tool) => ({
    id: tool.id,
    title: tool.title,
    href: tool.href,
    description: tool.shortDescription ?? tool.description,
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${absoluteUrl("/about")}#about`,
        name: "About Darma",
        url: absoluteUrl("/about"),
        description: metadata.description,
        mainEntity: { "@id": `${absoluteUrl("/")}#organization` },
        dateModified: "2026-07-30",
      },
      {
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: "Darma",
        url: absoluteUrl("/"),
        description:
          "An open-source technology workspace connecting practical browser tools with cataloged resources, learning paths, careers, team workflows, and editorial guides.",
        sameAs: ["https://github.com/fadeomar/Darma"],
      },
    ],
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <section className="visual-grid-bg border-b border-[var(--color-border-subtle)]">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,.86fr)] lg:items-center lg:px-8 lg:py-16">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">About Darma</Badge>
              <Badge variant="outline">Open-source knowledge workspace</Badge>
            </div>
            <SplitTextReveal
              text="An open workbench and technology atlas built to turn questions into useful action."
              className="darma-balanced-heading mt-5 text-4xl font-black tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl"
            />
            <p className="darma-pretty-copy mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              Darma connects practical browser tools with cataloged resources, structured learning, career guidance, team models, and clear explanations of the language used across the technology industry.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tech-atlas" className={primaryLinkClass}>
                Open the Tech Atlas <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
              </Link>
              <Link href="/tools" className={secondaryLinkClass}>
                Explore tools <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
              </Link>
              <Link href="/career-pathfinder" className={secondaryLinkClass}>
                Try Career Pathfinder
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text-tertiary)]">Made for</span>
              {AUDIENCE_LABELS.map((audience) => (
                <Badge key={audience.id} variant="outline">{audience.label}</Badge>
              ))}
            </div>
          </div>
          <AtlasHeroScene
            src="/atlas/open-workbench.svg"
            alt="An open digital workbench showing code, visual tools, resources, and project cards"
            priority
            labels={[
              `${publicTools.length} tools`,
              `${learningPaths.length} learning paths`,
              `${techCareers.length} careers`,
              "Open source",
            ]}
          />
        </div>
      </section>

      <MotionSection as="section" className={sectionClass} distance={16}>
        <div className="mb-7 max-w-3xl">
          <p className={eyebrowClass}>From question to confident action</p>
          <h2 className="darma-balanced-heading mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">
            A useful reference should help you make the next decision.
          </h2>
          <p className="darma-pretty-copy mt-3 text-base leading-8 text-[var(--color-text-secondary)]">
            Darma starts with a real question, checks reliable sources, connects the answer to a practical route, and helps you test it through real work.
          </p>
        </div>
        <AtlasScrollStory />
      </MotionSection>

      <section className="darma-section-shell darma-section-warm">
        <div className={sectionClass}>
          <div className="mb-7 max-w-3xl">
            <p className={eyebrowClass}>What Darma helps you do</p>
            <h2 className="darma-balanced-heading mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
              Finish useful work without assembling a new stack of apps.
            </h2>
            <p className="darma-pretty-copy mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
              Use a focused tool when the task is small. Follow a guided route when the decision needs more context.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {HELP_AREAS.map((area, index) => {
              const Icon = HELP_ICONS[index] ?? Sparkles;
              return (
                <article key={area.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)]">
                  <span className="atlas-symbol h-11 w-11 rounded-[var(--radius-md)]"><Icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="mt-5 text-lg font-black text-[var(--color-text-primary)]">{area.title}</h3>
                  <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{area.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Continue where you left off - client island, hidden until there's history */}
      <ContinuePanel />

      {/* Your favorites - client island, hidden until the user stars a tool */}
      <FavoritesPanel tools={favoritePanelTools} />

      <section className={sectionClass}>
        <div className="mb-7 max-w-3xl">
          <p className={eyebrowClass}>Built around real work</p>
          <h2 className="darma-balanced-heading mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
            Start from what you need to accomplish.
          </h2>
          <p className="darma-pretty-copy mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            The same workspace supports everyday users, students, creators, designers, and developers without forcing everyone through the same catalog.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {audienceToolGroups.map(({ group, tools }) => {
            if (!tools.length) return null;
            return (
              <Card key={group.id} padding="md" className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Users className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                    <h3 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{group.title}</h3>
                  </div>
                  <Badge variant="outline">{tools.length} picks</Badge>
                </div>
                <p className="darma-pretty-copy mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{group.description}</p>
                <ul className="mt-5 space-y-2">
                  {tools.map((tool) => (
                    <li key={tool.id}>
                      <Link href={tool.href} className="group flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-control-hover)] hover:text-[var(--color-primary)]">
                        <span className="line-clamp-2">{tool.title}</span>
                        <ArrowRight className="darma-link-arrow h-[18px] w-[18px] shrink-0" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/tools" className="group mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[var(--color-primary)]">
                  Browse all tools <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="darma-section-shell darma-section-mint">
        <div className={sectionClass}>
          <div className="mb-7 max-w-3xl">
            <p className={eyebrowClass}>What Darma covers</p>
            <h2 className="darma-balanced-heading mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
              A connected reference for the work of building technology.
            </h2>
            <p className="darma-pretty-copy mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
              Darma focuses on areas that can be connected to trustworthy sources, structured learning, real roles, practical tools, and clear decisions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Web and JavaScript development", "/resources/web-development", `${publicTools.length} practical tools`],
              ["Mobile application development", "/guides/mobile-development-roadmap", "Guides and roadmaps"],
              ["UI, UX, and product design", "/resources/ui-ux-design", "Design references"],
              ["Testing, accessibility, and quality", "/resources/testing-quality", "Quality practices"],
              ["DevOps, delivery, and reliability", "/resources/devops-delivery", `${waysOfWorking.length} ways of working`],
              ["Technology careers and team systems", "/tech-atlas", `${techCareers.length} roles · ${teamModels.length} team models · ${glossaryTerms.length} terms`],
            ].map(([title, href, meta]) => (
              <Link key={title} href={href} className="group flex min-h-32 flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 text-[var(--color-text-primary)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-md)]">
                <span className="text-lg font-black">{title}</span>
                <span className="mt-5 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
                  {meta}
                  <ArrowRight className="darma-link-arrow h-[18px] w-[18px] shrink-0 text-[var(--color-primary)]" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
          <Card padding="lg" className="border-[var(--color-primary-border)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
              <p className={eyebrowClass}>Editorial responsibility</p>
            </div>
            <h2 className="darma-balanced-heading mt-5 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
              Sources stay visible, and corrections are part of the system.
            </h2>
            <p className="darma-pretty-copy mt-4 text-base leading-8 text-[var(--color-text-secondary)]">
              Guides begin with a clear question, prefer primary references, add an original practical explanation, and receive a separate review before publication. Significant updates remain visible in the public repository.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/editorial-policy" className={primaryLinkClass}>
                Read the editorial policy <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
              </Link>
              <Link href="/contribute" className={secondaryLinkClass}>Report a correction</Link>
            </div>
          </Card>

          <Card padding="lg">
            <p className={eyebrowClass}>Privacy at a glance</p>
            <h2 className="darma-balanced-heading mt-4 text-2xl font-black text-[var(--color-text-primary)]">
              Each tool explains where your data goes.
            </h2>
            <div className="mt-5 space-y-3">
              {presentPrivacy.map((level) => (
                <div key={level} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success-text)]" aria-hidden />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-[var(--color-text-primary)]">{PRIVACY_META[level].label}</h3>
                      <Badge variant="outline">{privacyCounts.get(level)} tools</Badge>
                    </div>
                    <p className="darma-pretty-copy mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{PRIVACY_META[level].description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-7 max-w-3xl">
          <p className={eyebrowClass}>How Darma researches content</p>
          <h2 className="darma-balanced-heading mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
            A visible editorial process, not an anonymous list of links.
          </h2>
          <p className="darma-pretty-copy mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Every guide starts from a real user question, prefers primary sources, adds an original practical explanation, connects to existing Atlas records, and receives a separate structural and technical review.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Official source first", text: "Framework documentation, standards bodies, maintainers, and original research are preferred before secondary summaries." },
            { title: "Original practical value", text: "Darma adds decision criteria, project evidence, mistakes, alternatives, and next actions instead of rewriting documentation." },
            { title: "Cross-reference review", text: "Resources, paths, careers, methods, team models, and glossary terms are validated as one connected system." },
            { title: "Correction and maintenance", text: "Update dates stay visible, automated checks remain non-destructive, and contributors can report outdated content publicly." },
          ].map((item) => (
            <Card key={item.title} padding="lg" className="h-full">
              <h3 className="text-lg font-black text-[var(--color-text-primary)]">{item.title}</h3>
              <p className="darma-pretty-copy mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{item.text}</p>
            </Card>
          ))}
        </div>
        <Link href="/editorial-policy" className={`${primaryLinkClass} mt-6`}>
          Read the complete editorial policy <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section id="maintainers" className="darma-section-shell darma-section-ink scroll-mt-28">
        <div className={`${sectionClass} grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center`}>
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Open-source stewardship</p>
            <h2 className="darma-balanced-heading mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-on-ink)] sm:text-4xl">
              Help keep Darma useful, accurate, and open.
            </h2>
            <p className="darma-pretty-copy mt-4 text-base leading-8 text-[var(--color-text-on-ink-muted)]">
              Suggest a trustworthy source, report outdated content, propose a focused improvement, or request a tool that would save you time. Every contribution is reviewed before publication.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/contribute" className={primaryLinkClass}>
              Open contribution guide <ArrowRight className="darma-link-arrow h-4 w-4" aria-hidden />
            </Link>
            <a href="https://github.com/fadeomar/Darma" target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/20 bg-white/5 px-5 text-sm font-semibold text-[var(--color-text-on-ink)] transition hover:bg-white/10">
              View repository <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
            <a href={SUGGEST_TOOL_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/20 bg-white/5 px-5 text-sm font-semibold text-[var(--color-text-on-ink)] transition hover:bg-white/10">
              Suggest a tool <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
