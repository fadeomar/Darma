import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, Compass, GitCompareArrows, Route, Search, Sparkles, Wrench } from "lucide-react";
import { AtlasHeroScene, MotionSection, SplitTextReveal } from "@/components/motion";
import PageSection from "@/components/ui/PageSection";
import { Badge, Card } from "@/components/ui";
import { getPublicTools } from "@/features/tools";
import { getEditorialPagesByKind, getResourceHubs } from "@/features/editorial";
import { getLearningPaths } from "@/features/learning-paths";
import { getResourceCatalog } from "@/features/resources";
import { absoluteUrl } from "@/features/tools/seo";

export const metadata: Metadata = {
  title: { absolute: "Darma — open developer tools and a connected technology atlas" },
  description: "Use free browser tools, explore trusted developer resources, follow learning paths, understand technology careers, and compare frameworks and software workflows.",
  alternates: { canonical: "/" },
};

const featureCards = [
  { icon: Wrench, symbol: "01", title: "Solve a task", description: "Open focused browser tools for code, design, content, images, calculations, and everyday digital work.", href: "/tools", cta: "Use the tools" },
  { icon: Route, symbol: "02", title: "Learn in order", description: "Follow structured paths with trusted sources, checkpoints, projects, and locally saved progress.", href: "/learning-paths", cta: "Choose a learning path" },
  { icon: GitCompareArrows, symbol: "03", title: "Make a technology decision", description: "Read reviewed roadmaps and side-by-side comparisons connected to careers, methods, and primary references.", href: "/comparisons", cta: "Compare your options" },
  { icon: Compass, symbol: "04", title: "Explore a career direction", description: "Use a practical Pathfinder, then inspect the daily work, skills, scope, and evidence behind each role.", href: "/career-pathfinder", cta: "Try the Pathfinder" },
];

export default function LandingPage() {
  const publicTools = getPublicTools();
  const featuredTools = publicTools.filter((tool) => tool.featured).slice(0, 4);
  const guides = getEditorialPagesByKind("guide");
  const comparisons = getEditorialPagesByKind("comparison");
  const paths = getLearningPaths();
  const resources = getResourceCatalog();
  const hubs = getResourceHubs();
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: "Darma", description: metadata.description, url: absoluteUrl("/"), primaryImageOfPage: absoluteUrl("/opengraph-image"), mainEntity: { "@type": "ItemList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Developer tools", url: absoluteUrl("/tools") }, { "@type": "ListItem", position: 2, name: "Technology resources", url: absoluteUrl("/resources") }, { "@type": "ListItem", position: 3, name: "Learning paths", url: absoluteUrl("/learning-paths") }, { "@type": "ListItem", position: 4, name: "Technology guides", url: absoluteUrl("/guides") }, { "@type": "ListItem", position: 5, name: "Career Pathfinder", url: absoluteUrl("/career-pathfinder") }] } };

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="visual-grid-bg border-b border-[var(--color-border-subtle)]">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,.88fr)] lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="flex flex-wrap gap-2"><Badge variant="soft">Open technology workspace</Badge><Badge variant="outline">Open source</Badge><Badge variant="outline">No account required</Badge></div>
            <SplitTextReveal text="Build, learn, and make better technology decisions from one connected workspace." className="mt-5 max-w-5xl text-4xl font-black tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-5xl lg:text-7xl" />
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">Darma combines browser-based utilities with a reviewed Tech Atlas: resources, roadmaps, careers, team workflows, terminology, and comparisons that lead to a clear next action.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/tech-atlas" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-black text-[var(--color-primary-text)] shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] motion-reduce:transition-none">Open the Tech Atlas <ArrowRight className="h-4 w-4" aria-hidden /></Link><Link href="/tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-6 text-sm font-black text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]"><Wrench className="h-4 w-4" aria-hidden />Use browser tools</Link><Link href="/search" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-6 text-sm font-black text-[var(--color-primary)]"><Search className="h-4 w-4" aria-hidden />Search everything</Link></div>
          </div>
          <AtlasHeroScene src="/atlas/knowledge-constellation.svg" alt="A connected knowledge map showing questions, learning, verified sources, building, tools, roles, teams, and delivery" priority labels={[`${publicTools.length} tools`, `${resources.length} references`, `${paths.length} learning paths`, `${guides.length + comparisons.length} reviewed pages`]} />
        </div>
      </section>

      <MotionSection as="section" className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8" distance={18}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["Browser tools", publicTools.length], ["Reviewed resources", resources.length], ["Learning paths", paths.length], ["Guides + comparisons", guides.length + comparisons.length]].map(([label, value], index) => <Card key={String(label)} padding="lg" className="visual-stat-card"><p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">0{index + 1} • live catalog</p><p className="mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--color-text-primary)]">{value}</p><p className="mt-1 text-sm font-bold text-[var(--color-text-secondary)]">{label}</p></Card>)}
        </div>
      </MotionSection>

      <PageSection eyebrow="Choose your goal" title="Start from what you need today" description="Darma is organized around tasks and decisions rather than forcing every visitor through the same catalog.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{featureCards.map((card, index) => { const Icon = card.icon; return <MotionSection key={card.title} delay={index * .05} distance={20}><Link href={card.href} className="block h-full"><Card variant="interactive" padding="lg" className="visual-card h-full"><div className="flex items-center justify-between"><span className="atlas-symbol"><Icon className="h-5 w-5" aria-hidden /></span><span className="font-mono text-xs font-black text-[var(--color-text-tertiary)]">{card.symbol}</span></div><h2 className="mt-6 text-xl font-black text-[var(--color-text-primary)]">{card.title}</h2><p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{card.description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary)]">{card.cta} <ArrowRight className="h-4 w-4" aria-hidden /></span></Card></Link></MotionSection>; })}</div>
      </PageSection>

      <MotionSection as="section" className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8" distance={20}>
        <div className="editorial-visual-banner">
          <div><div className="flex items-center gap-2 text-[var(--color-primary)]"><BookOpenText className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-black uppercase tracking-[0.14em]">Editorial knowledge</span></div><h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-4xl">Roadmaps and comparisons that explain the decision—not only the definition.</h2><p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)]">Every reviewed page includes a direct answer, practical constraints, decision criteria, common questions, review metadata, and links to primary sources.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/guides" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--color-text-primary)] px-5 text-sm font-black text-[var(--color-surface-base)]">Browse guides <ArrowRight className="h-4 w-4" aria-hidden /></Link><Link href="/comparisons" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border-default)] px-5 text-sm font-black text-[var(--color-text-primary)]">Compare choices</Link></div></div>
          <AtlasHeroScene src="/atlas/decision-map.svg" alt="A visual decision map connecting context, comparison, options, tests, and learning" labels={[`${guides.length} guides`, `${comparisons.length} comparisons`]} />
        </div>
      </MotionSection>

      <PageSection eyebrow="Featured tools" title="Useful tools that keep work moving" description="Focused controls, visible results, and export-ready output—without turning every small task into another account or subscription.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{featuredTools.map((tool, index) => <MotionSection key={tool.id} delay={index * .04} distance={18}><Link href={tool.href} className="block h-full"><Card variant="interactive" padding="md" className="visual-card h-full"><div className="flex flex-wrap gap-2"><Badge variant="outline">{tool.audiences?.[0] ?? "tool"}</Badge><Badge variant={tool.privacy === "client-only" ? "accent" : "soft"}>{tool.privacy ?? "browser"}</Badge></div><h2 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{tool.title}</h2><p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{tool.description}</p></Card></Link></MotionSection>)}</div>
      </PageSection>

      <MotionSection as="section" className="mx-auto max-w-[var(--container-page)] px-4 pt-8 sm:px-6 lg:px-8" distance={18}>
        <Card padding="lg" className="visual-grid-bg grid gap-6 border-[var(--color-primary-border)] lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-[var(--color-primary)]"><Sparkles className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-black uppercase tracking-[0.14em]">A living open reference</span></div><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">Find something missing or outdated?</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">Suggest a source, improve a learning path, correct a role guide, or submit a focused pull request through Darma’s review workflow.</p></div><Link href="/contribute" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-black text-[var(--color-primary-text)]">Contribute to Darma <ArrowRight className="h-4 w-4" aria-hidden /></Link></Card>
      </MotionSection>
    </div>
  );
}
