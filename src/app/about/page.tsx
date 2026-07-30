import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ResourcePreview } from "@/features/resources/components";
import { getFeaturedLearningPaths, getLearningPaths } from "@/features/learning-paths";
import { LearningPathCard } from "@/features/learning-paths/components";
import { getTechCareers } from "@/features/tech-careers";
import { getWaysOfWorking } from "@/features/ways-of-working";
import { getGlossaryTerms } from "@/features/tech-glossary";
import { getTeamModels } from "@/features/tech-teams";
import { getEditorialPagesByKind, getResourceHubs } from "@/features/editorial";
import { absoluteUrl } from "@/features/tools/seo";
import { Badge, Card, CopyButton } from "@/components/ui";
import { AtlasHeroScene, AtlasScrollStory, MotionSection, SplitTextReveal } from "@/components/motion";
import { getPublicTools } from "@/features/tools";
import { toolWorkflows } from "@/features/tools/workflows";
import {
  AUDIENCE_LABELS,
  countByPrivacy,
  HELP_AREAS,
  pickDaily,
  PRINCIPLES,
  PRIVACY_META,
  PRIVACY_ORDER,
  selectAudienceToolGroups,
  SNIPPETS,
} from "./aboutContent";
import { ContinuePanel } from "./ContinuePanel";
import { FavoritesPanel } from "./FavoritesPanel";

const SUGGEST_TOOL_URL =
  "https://github.com/fadeomar/Darma/issues/new?labels=tool-suggestion&title=Tool%20suggestion%3A%20";

// Regenerate at most hourly so "Darma Today" stays current without per-request cost.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Darma | Open tools and a practical technology atlas",
  description:
    "Learn how Darma combines free browser tools with trusted resources, learning paths, technology careers, team workflows, organization maps, and practical terminology.",
  alternates: { canonical: "/about" },
};

const primaryLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]";
const secondaryLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]";
const sectionClass = "mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8";
const eyebrowClass = "font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]";

export default function AboutPage() {
  const publicTools = getPublicTools();
  const learningPaths = getLearningPaths();
  const featuredLearningPaths = getFeaturedLearningPaths(3);
  const techCareers = getTechCareers();
  const waysOfWorking = getWaysOfWorking();
  const glossaryTerms = getGlossaryTerms();
  const teamModels = getTeamModels();
  const guides = getEditorialPagesByKind("guide");
  const comparisons = getEditorialPagesByKind("comparison");
  const resourceHubs = getResourceHubs();
  const featuredTools = publicTools.filter((tool) => tool.featured);
  const audienceToolGroups = selectAudienceToolGroups(publicTools);

  const todayTool = pickDaily(featuredTools.length ? featuredTools : publicTools) ?? publicTools[0];
  const todayWorkflow = pickDaily(toolWorkflows, 3) ?? toolWorkflows[0];
  const todaySnippet = pickDaily(SNIPPETS, 5) ?? SNIPPETS[0];

  const privacyCounts = countByPrivacy(publicTools);
  const presentPrivacy = PRIVACY_ORDER.filter((level) => (privacyCounts.get(level) ?? 0) > 0);

  // Minimal, serializable list so the client favorites island can resolve any
  // favorited id back to a tool.
  const favoritePanelTools = publicTools.map((tool) => ({
    id: tool.id,
    title: tool.title,
    href: tool.href,
    description: tool.shortDescription ?? tool.description,
  }));

  const structuredData = { "@context": "https://schema.org", "@graph": [{ "@type": "AboutPage", "@id": `${absoluteUrl("/about")}#about`, name: "About Darma", url: absoluteUrl("/about"), description: metadata.description, mainEntity: { "@id": `${absoluteUrl("/")}#organization` }, dateModified: "2026-07-29" }, { "@type": "Organization", "@id": `${absoluteUrl("/")}#organization`, name: "Darma", url: absoluteUrl("/"), description: "An open-source technology workspace connecting practical browser tools with trusted resources, learning paths, careers, team workflows, and reviewed guides.", sameAs: ["https://github.com/fadeomar/Darma"], knowsAbout: ["Web development", "JavaScript", "Frontend development", "Mobile development", "UI and UX design", "DevOps", "Technology careers", "Software development methodologies"] }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "About Darma", item: absoluteUrl("/about") }] }] };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      {/* Hero */}
      <section className="visual-grid-bg border-b border-[var(--color-border-subtle)]">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,.88fr)] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2"><Badge variant="soft">About Darma</Badge><Badge variant="outline">Open-source knowledge workspace</Badge></div>
            <SplitTextReveal text="An open workbench and technology atlas built to turn questions into useful action." className="mt-5 text-4xl font-black tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-5xl lg:text-7xl" />
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              Darma connects practical browser tools with trusted resources, structured learning paths, technology careers, ways of working, team structures, and the language people meet inside the industry.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tech-atlas" className={primaryLinkClass}>Open the Tech Atlas</Link>
              <Link href="/career-pathfinder" className={secondaryLinkClass}>Try Career Pathfinder</Link>
              <Link href="/tools" className={secondaryLinkClass}>Explore all tools</Link>
              <Link href="/guides" className={secondaryLinkClass}>Read practical guides</Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">Made for</span>
              {AUDIENCE_LABELS.map((audience) => (<Badge key={audience.id} variant="outline">{audience.label}</Badge>))}
            </div>
          </div>
          <AtlasHeroScene src="/atlas/open-workbench.svg" alt="An open digital workbench showing code, visual tools, resources, and project cards" priority labels={[`${publicTools.length} tools`, `${learningPaths.length} learning paths`, `${techCareers.length} careers`, "Open source"]} />
        </div>
      </section>

      <MotionSection as="section" className={sectionClass} distance={18}>
        <div className="mb-7 max-w-3xl"><p className={eyebrowClass}>From question to confident action</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">A useful reference should make the next step clearer.</h2><p className="mt-3 text-base leading-8 text-[var(--color-text-secondary)]">Darma starts with a real question, checks reliable sources, connects the answer to a practical route, and helps you validate it through real work.</p></div>
        <AtlasScrollStory />
      </MotionSection>

      {/* What Darma helps you do */}
      <section className={sectionClass}>
        <div className="mb-6 max-w-3xl">
          <p className={eyebrowClass}>What Darma helps you do</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
            Finish everyday digital tasks without opening five apps.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Darma combines simple tools and guided workflows for writing, studying, creating, designing, and debugging.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {HELP_AREAS.map((area, index) => (
            <Card key={area.title} padding="lg" className="about-help-card h-full">
              <span className="font-mono text-xs font-black text-[var(--color-primary)]">0{index + 1}</span>
              <h3 className="mt-5 text-lg font-bold text-[var(--color-text-primary)]">{area.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{area.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Darma Today */}
      <section className={sectionClass}>
        <div className="mb-6 max-w-3xl">
          <p className={eyebrowClass}>Darma Today</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
            A fresh place to start every day.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Darma selects one useful tool, one guided workflow, and one copy-ready snippet each day.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {todayTool ? (
            <Card padding="lg" className="flex h-full flex-col">
              <Badge variant="soft">Today&apos;s tool</Badge>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">{todayTool.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{todayTool.description}</p>
              <Link href={todayTool.href} className={`mt-5 self-start ${primaryLinkClass}`}>Open {todayTool.title}</Link>
            </Card>
          ) : null}
          {todayWorkflow ? (
            <Card padding="lg" className="flex h-full flex-col">
              <Badge variant="soft">Today&apos;s workflow</Badge>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">{todayWorkflow.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{todayWorkflow.description}</p>
              <Link href={`/workflows/${todayWorkflow.id}`} className={`mt-5 self-start ${secondaryLinkClass}`}>
                Open workflow · {todayWorkflow.steps.length} steps
              </Link>
            </Card>
          ) : null}
          {todaySnippet ? (
            <Card padding="lg" className="flex h-full flex-col md:col-span-2 lg:col-span-1">
              <Badge variant="soft">Today&apos;s snippet</Badge>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">{todaySnippet.title}</h3>
              <pre className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 font-mono text-xs leading-6 text-[var(--color-text-primary)]">
                <code>{todaySnippet.code}</code>
              </pre>
              <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{todaySnippet.note}</p>
              <CopyButton text={todaySnippet.code} size="sm" variant="secondary" className="mt-4 self-start">
                Copy snippet
              </CopyButton>
            </Card>
          ) : null}
        </div>
      </section>

      {/* Continue where you left off — client island, hidden until there's history */}
      <ContinuePanel />

      {/* Your favorites — client island, hidden until the user stars a tool */}
      <FavoritesPanel tools={favoritePanelTools} />

      {/* Built for everyone — audience-derived groups */}
      <section className={sectionClass}>
        <div className="mb-6 max-w-3xl">
          <p className={eyebrowClass}>Built for everyone</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
            Find tools for what you actually do.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Start with the task in front of you, then open a tool that fits the work.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
          {audienceToolGroups.map(({ group, tools }, groupIndex) => (
            <Card
              key={group.id}
              padding="lg"
              className={`about-audience-card flex h-full flex-col md:col-span-1 xl:col-span-2 ${groupIndex === 3 ? "xl:col-start-2" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-primary)]">Audience 0{groupIndex + 1}</p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">{group.title}</h3>
                </div>
                <span className="grid h-9 min-w-9 place-items-center rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] font-mono text-xs font-black text-[var(--color-primary)]">{tools.length}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{group.description}</p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {tools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={tool.href}
                      className="group flex min-h-11 items-center justify-between gap-4 rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-default)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)] focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <span className="min-w-0 line-clamp-2 font-semibold leading-5">{tool.title}</span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/tools" className="group mt-4 inline-flex min-h-10 items-center gap-2 self-start text-sm font-bold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]">
                Browse all tools <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Workflows */}
      <section className={sectionClass}>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-3xl">
              <p className={eyebrowClass}>Workflows</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
                Start with the task, not the tool.
              </h2>
            </div>
            <Link href="/workflows" className="text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]">
              View all workflows
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {toolWorkflows.slice(0, 4).map((workflow) => (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="block rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{workflow.title}</h3>
                  <Badge variant="outline">{workflow.steps.length} steps</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{workflow.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Darma */}
      <section className={sectionClass}>
        <div className="mb-6 max-w-3xl">
          <p className={eyebrowClass}>Why Darma exists</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
            Small tasks should stay small.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Darma is built around fast, visual, understandable tools: preview the result, adjust the values, copy clean output, and keep moving.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((principle) => (
            <Card key={principle.title} padding="lg" className="h-full">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{principle.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{principle.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-6 max-w-3xl">
          <p className={eyebrowClass}>How Darma researches content</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">A visible editorial process, not an anonymous list of links.</h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">Every guide starts from a real user question, prefers primary sources, adds an original practical explanation, connects to existing Atlas records, and receives a separate structural and technical review.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Official source first", text: "Framework documentation, standards bodies, maintainers, and original research are preferred before secondary summaries." },
            { title: "Original practical value", text: "Darma adds decision criteria, project evidence, mistakes, alternatives, and next actions instead of rewriting documentation." },
            { title: "Cross-reference review", text: "Resources, paths, careers, methods, team models, and glossary terms are validated as one connected system." },
            { title: "Correction and maintenance", text: "Update dates stay visible, automated checks remain non-destructive, and contributors can report outdated content publicly." },
          ].map((item) => <Card key={item.title} padding="lg" className="h-full"><h3 className="text-lg font-black text-[var(--color-text-primary)]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{item.text}</p></Card>)}
        </div>
        <Link href="/editorial-policy" className="group mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[var(--color-primary)]">Read the complete editorial policy <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden /></Link>
      </section>

      <section className={sectionClass}>
        <div className="mb-6 max-w-3xl"><p className={eyebrowClass}>What Darma covers</p><h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">A connected reference across the work of building technology.</h2><p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">The goal is not to publish on every topic. Darma concentrates on areas it can connect to trustworthy sources, structured learning, real roles, practical tools, and clear decisions.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[
          ["Web and JavaScript development", "/resources/web-development"], ["Mobile application development", "/guides/mobile-development-roadmap"], ["UI, UX, and product design", "/resources/ui-ux-design"], ["Testing, accessibility, and quality", "/resources/testing-quality"], ["DevOps, delivery, and reliability", "/resources/devops-delivery"], ["Technology careers and team systems", "/tech-atlas"],
        ].map(([title, href]) => <Link key={title} href={href} className="group flex min-h-[72px] items-center justify-between gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-5 text-base font-black text-[var(--color-text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-primary)] focus-visible:shadow-[var(--focus-ring)] motion-reduce:hover:translate-y-0"><span>{title}</span><ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden /></Link>)}</div>
      </section>

      <section id="maintainers" className={`${sectionClass} scroll-mt-28`}>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card padding="lg"><p className={eyebrowClass}>Who maintains Darma</p><h2 className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">Open-source maintainers and contributors.</h2><p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">Darma is maintained in a public repository. Content changes, source additions, audits, and implementation history can be inspected and improved through focused issues and pull requests.</p><div className="mt-5 flex flex-wrap gap-3"><a href="https://github.com/fadeomar/Darma" target="_blank" rel="noopener noreferrer" className={primaryLinkClass}>View the repository</a><Link href="/contribute" className={secondaryLinkClass}>Contribute a correction</Link></div></Card>
          <Card padding="lg"><p className={eyebrowClass}>What Darma does not do</p><ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-text-secondary)]"><li>• Darma does not sell placement or call an unverified source official.</li><li>• A learning path does not guarantee a job or replace supervised experience.</li><li>• Comparisons do not declare one universal winner for every team.</li><li>• Darma does not replace primary documentation, standards, or professional advice.</li><li>• One automated network failure never removes a resource.</li></ul></Card>
        </div>
      </section>

      {/* Privacy & transparency */}
      <section className={sectionClass}>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="max-w-3xl">
            <p className={eyebrowClass}>Privacy &amp; transparency</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
              You can see what each tool does.
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
              All {publicTools.length} tools currently run fully in your browser. Each tool is labelled so you always know whether it stays local, saves settings on your device, or needs a server.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {presentPrivacy.map((level) => (
              <div key={level} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">{PRIVACY_META[level].label}</h3>
                  <Badge variant="outline">{privacyCounts.get(level)} tools</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{PRIVACY_META[level].description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suggest a tool */}
      <section className={sectionClass}>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className={eyebrowClass}>Help shape Darma</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
                Missing a tool you&apos;d use daily?
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
                Tell us which task takes too long. Your suggestion could become the next Darma tool for studying, writing, design, or development.
              </p>
            </div>
            <a
              href={SUGGEST_TOOL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${primaryLinkClass} shrink-0`}
            >
              Suggest a tool
            </a>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className={eyebrowClass}>Structured learning</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Move from useful links to a practical learning flow.</h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">Each path connects trusted references to ordered stages, checkpoints, projects, and locally saved progress.</p>
          </div>
          <Link href="/learning-paths" className={secondaryLinkClass}>Browse all learning paths</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredLearningPaths.map((path) => <LearningPathCard key={path.slug} path={path} />)}
        </div>
      </section>


      <section className={sectionClass}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className={eyebrowClass}>Technology industry reference</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Understand the work around the code.</h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">Use Darma to explore roles, compare delivery systems, decode terminology, and see how different technology team structures move one need from discovery to operation.</p>
          </div>
          <Link href="/tech-atlas" className={primaryLinkClass}>Explore the complete Tech Atlas</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/tech-careers", count: techCareers.length, label: "Career guides", title: "Who does what?", text: "Daily work, responsibilities, deliverables, skills, collaborators, and junior-to-senior scope." },
            { href: "/ways-of-working", count: waysOfWorking.length, label: "Ways of working", title: "How does work flow?", text: "Agile, Scrum, Kanban, Waterfall, DevOps, design processes, and practical comparisons." },
            { href: "/tech-teams", count: teamModels.length, label: "Team models", title: "How are companies structured?", text: "Functional, cross-functional, project, matrix, cooperative, and flow-oriented structures." },
            { href: "/tech-glossary", count: glossaryTerms.length, label: "Glossary terms", title: "What does the language mean?", text: "Clear definitions, practical meaning, realistic examples, and links to roles and methods." },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group block h-full rounded-[var(--radius-lg)] focus-visible:shadow-[var(--focus-ring)]">
              <Card padding="lg" variant="interactive" className="about-atlas-card flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="soft">{item.count} {item.label}</Badge>
                  <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden />
                </div>
                <h3 className="mt-5 text-xl font-black text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{item.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">Explore section</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <Card padding="lg" className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className={eyebrowClass}>Open-source stewardship</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Help keep the reference useful and honest.</h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">Use structured forms to suggest a source, report outdated content, improve a learning path, or correct how Darma explains careers and team workflows. Every contribution is reviewed before publication.</p>
          </div>
          <Link href="/contribute" className={primaryLinkClass}>Open contribution guide</Link>
        </Card>
      </section>

      <ResourcePreview />
    </div>
  );
}
