import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, BriefcaseBusiness, Compass, GitBranch, HeartHandshake, Library, Network, Route, Search } from "lucide-react";
import { MotionSection } from "@/components/motion";
import { PortalHero } from "@/components/portals";
import { Badge, Card } from "@/components/ui";
import { AtlasSectionArtwork } from "@/components/visuals";
import { getLearningPaths } from "@/features/learning-paths";
import { getResourceCatalog } from "@/features/resources";
import { getGlossaryTerms } from "@/features/tech-glossary";
import { getTechCareers } from "@/features/tech-careers";
import { getTeamModels } from "@/features/tech-teams";
import { absoluteUrl } from "@/features/tools/seo";
import { getWaysOfWorking } from "@/features/ways-of-working";
import { getEditorialPagesByKind } from "@/features/editorial";

export const metadata: Metadata = {
  title: "Darma Tech Atlas | resources, learning paths, careers, teams, and workflows",
  description: "A free open-source technology reference connecting trusted resources, practical learning paths, career roles, ways of working, team structures, and technical vocabulary.",
  keywords: ["technology reference", "developer resources", "technology careers", "learning paths", "software methodologies", "technology glossary", "tech team structure"],
  alternates: { canonical: "/tech-atlas" },
  openGraph: { title: "Darma Tech Atlas", description: "Find a resource, follow a path, understand a role, compare a workflow, or learn how a technology company works.", url: absoluteUrl("/tech-atlas"), type: "website" },
};

export default function TechAtlasPage() {
  const resources = getResourceCatalog();
  const paths = getLearningPaths();
  const careers = getTechCareers();
  const ways = getWaysOfWorking();
  const terms = getGlossaryTerms();
  const teams = getTeamModels();
  const guides = getEditorialPagesByKind("guide");
  const comparisons = getEditorialPagesByKind("comparison");
  const sections = [
    { href: "/resources", icon: Library, eyebrow: `${resources.length} references`, title: "Resource Explorer", text: "Search official documentation, courses, design references, generators, developer tools, and community resources by task and context.", cta: "Find a resource", accent: "✦" },
    { href: "/learning-paths", icon: Route, eyebrow: `${paths.length} structured paths`, title: "Learning Paths", text: "Move from foundations to practical projects through ordered stages, checkpoints, verified sources, and portfolio-ready outcomes.", cta: "Choose a learning path", accent: "↗" },
    { href: "/career-pathfinder", icon: Compass, eyebrow: "Interactive discovery", title: "Career Pathfinder", text: "Answer six practical questions, explore three strong starting directions, and open the role guides and learning paths behind them.", cta: "Try the Pathfinder", accent: "◎" },
    { href: "/guides", icon: BookOpenText, eyebrow: `${guides.length} reviewed guides`, title: "Practical Guides", text: "Follow rich roadmaps for web, frontend, full stack, mobile, UI/UX, DevOps, technology careers, and development methodologies.", cta: "Read the guides", accent: "⌁" },
    { href: "/comparisons", icon: GitBranch, eyebrow: `${comparisons.length} decision pages`, title: "Technology Comparisons", text: "Compare roles, frameworks, career levels, mobile stacks, design disciplines, and ways of working through real constraints.", cta: "Compare choices", accent: "⇄" },
    { href: "/tech-careers", icon: BriefcaseBusiness, eyebrow: `${careers.length} role guides`, title: "Tech Careers", text: "Understand daily work, deliverables, skills, collaborators, misconceptions, and how responsibility grows from junior to senior.", cta: "Explore careers", accent: "◈" },
    { href: "/ways-of-working", icon: GitBranch, eyebrow: `${ways.length} approaches`, title: "Ways of Working", text: "Compare Agile, Scrum, Kanban, Waterfall, DevOps, Double Diamond, Shape Up, and other systems through their actual operating logic.", cta: "Compare workflows", accent: "∞" },
    { href: "/tech-teams", icon: Network, eyebrow: `${teams.length} team models`, title: "Technology Teams", text: "See common organization structures and follow a product need through discovery, design, development, release, and learning.", cta: "See how teams work", accent: "⬡" },
    { href: "/tech-glossary", icon: BookOpenText, eyebrow: `${terms.length} connected terms`, title: "Tech Glossary", text: "Translate the language of engineering, product, design, delivery, operations, and business into practical meaning and examples.", cta: "Look up a term", accent: "Aa" },
    { href: "/contribute", icon: HeartHandshake, eyebrow: "Structured contribution", title: "Contribute", text: "Suggest a resource, improve a learning path, report outdated content, or submit a focused pull request through a reviewable open-source workflow.", cta: "Help improve Darma", accent: "+" },
  ];
  const data = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Darma Tech Atlas", url: absoluteUrl("/tech-atlas"), description: "An open technology reference connecting resources, learning paths, careers, methods, teams, and terminology.", hasPart: sections.map((section) => ({ "@type": "CollectionPage", name: section.title, url: absoluteUrl(section.href), description: section.text })) };

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <PortalHero
        variant="atlas"
        eyebrow="The connected Darma Tech Atlas"
        badges={["Open source", "No account required", "Learning and work reference"]}
        title="Understand technology as a connected system, not a collection of isolated pages."
        description="Darma connects what to learn, where to verify it, which roles use it, how teams organize the work, and what the language means in practice."
        actions={[
          { href: "/resources", label: "Search trusted resources", icon: "search", tone: "primary" },
          { href: "/career-pathfinder", label: "Find a career direction", icon: "atlas", tone: "secondary" },
          { href: "/learning-paths", label: "Choose a learning route", icon: "route", tone: "quiet" },
        ]}
        metrics={[
          { value: resources.length, label: "reviewed references" },
          { value: careers.length, label: "career guides" },
          { value: ways.length, label: "working methods" },
          { value: terms.length, label: "connected terms" },
        ]}
        signals={[
          { label: "Learn", value: `${paths.length} structured paths` },
          { label: "Decide", value: `${comparisons.length} comparisons` },
          { label: "Work", value: `${teams.length} team models` },
          { label: "Read", value: `${guides.length} practical guides` },
        ]}
      />

      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7 max-w-3xl"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">Explore the map</p><h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-4xl">Choose the doorway that matches your question.</h2><p className="mt-3 text-base leading-8 text-[var(--color-text-secondary)]">The sections stay connected. A resource can lead to a path, a path to a role, a role to a team, and a team to the method and language it uses.</p></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <MotionSection key={section.href} delay={(index % 3) * .05} distance={22}>
                <Link href={section.href} className="group block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
                  <Card variant="interactive" padding="none" className="visual-card flex h-full overflow-hidden flex-col">
                    <AtlasSectionArtwork icon={Icon} index={index} label={section.title} />
                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-primary)]">{section.eyebrow}</p>
                        <span className="text-2xl font-black text-[var(--color-primary)] opacity-55" aria-hidden>{section.accent}</span>
                      </div>
                      <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">{section.title}</h2>
                      <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-text-secondary)]">{section.text}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary)]">{section.cta}<ArrowRight className="darma-link-arrow h-[18px] w-[18px]" aria-hidden /></span>
                    </div>
                  </Card>
                </Link>
              </MotionSection>
            );
          })}
        </div>
      </section>

      <MotionSection as="section" className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8" distance={20}>
        <Card padding="lg" className="visual-grid-bg grid gap-7 border-[var(--color-primary-border)] lg:grid-cols-[1fr_auto] lg:items-center"><div><Badge variant="soft">A practical starting flow</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">You do not need to know the right terminology before you begin.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">Start from a goal. Pick a learning path, open the role it leads toward, use the linked references, then explore how that role collaborates inside real team and delivery systems.</p></div><Link href="/learning-paths" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-black text-[var(--color-primary-text)]">Start from a goal <ArrowRight className="h-4 w-4" aria-hidden /></Link></Card>
      </MotionSection>
    </div>
  );
}
