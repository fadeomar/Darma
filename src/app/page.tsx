import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { MotionSection, SplitTextReveal } from "@/components/motion";
import { Badge } from "@/components/ui";
import { DarmaSymbol, type DarmaSymbolName } from "@/components/visuals";
import { ConnectedAtlasVisual, DarmaHeroExperience, LandingIntentNavigator, LandingProofWorkflow, LandingSectionRail, LandingWorkbenchDemo, ModernWebRadar, ToolPreviewArtwork } from "@/components/landing";
import { getPublicTools } from "@/features/tools";
import { getEditorialPagesByKind } from "@/features/editorial";
import { getLearningPaths } from "@/features/learning-paths";
import { getResourceCatalog } from "@/features/resources";
import { getGames } from "@/features/games";
import { GameThumbnail } from "@/features/games/components/GameThumbnail";
import { absoluteUrl } from "@/features/tools/seo";
import "@/features/games/styles/games-theme.css";

export const metadata: Metadata = {
  title: { absolute: "Darma | useful browser tools and a connected technology atlas" },
  description: "Use free browser tools, follow practical learning paths, compare technology choices, explore careers, and play focused browser games without creating an account.",
  alternates: { canonical: "/" },
};

const trustItems: Array<{ symbol: DarmaSymbolName; title: string; description: string }> = [
  {
    symbol: "secure",
    title: "Browser-first by default",
    description: "Most tools process inputs on your device. Privacy notes explain when local storage or a server is involved.",
  },
  {
    symbol: "source",
    title: "Sources before summaries",
    description: "The Atlas prioritizes official documentation and durable references, then adds practical context around them.",
  },
  {
    symbol: "accessible",
    title: "Readable in light and dark",
    description: "Text, controls, previews, results, borders, and focus states are designed as one accessible visual system.",
  },
  {
    symbol: "route",
    title: "Open to correction",
    description: "Darma is open source. Missing, outdated, or unclear content can be reviewed through a visible contribution flow.",
  },
];

const FEATURED_TOOL_IDS = ["css-gradient-generator", "json-formatter", "gpa-calculator", "image-compressor-resizer"];

export default function LandingPage() {
  const publicTools = getPublicTools();
  const featuredTools = FEATURED_TOOL_IDS.map((id) => publicTools.find((tool) => tool.id === id)).filter(Boolean);
  const guides = getEditorialPagesByKind("guide");
  const comparisons = getEditorialPagesByKind("comparison");
  const paths = getLearningPaths();
  const resources = getResourceCatalog();
  const games = getGames();
  const featuredGames = games.filter((game) => game.featured || game.popular).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Darma",
    description: metadata.description,
    url: absoluteUrl("/"),
    primaryImageOfPage: absoluteUrl("/opengraph-image"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Browser tools", url: absoluteUrl("/tools") },
        { "@type": "ListItem", position: 2, name: "Technology atlas", url: absoluteUrl("/tech-atlas") },
        { "@type": "ListItem", position: 3, name: "Learning paths", url: absoluteUrl("/learning-paths") },
        { "@type": "ListItem", position: 4, name: "Browser games", url: absoluteUrl("/games") },
        { "@type": "ListItem", position: 5, name: "Career Pathfinder", url: absoluteUrl("/career-pathfinder") },
      ],
    },
  };

  return (
    <div className="pb-24">
      <LandingSectionRail />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section id="start" className="landing-hero scroll-mt-24">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[minmax(0,.94fr)_minmax(500px,1.06fr)] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
          <div className="landing-hero-copy">
            <div className="landing-hero-eyebrow">
              <span aria-hidden>✦</span>
              Open technology workspace
            </div>
            <SplitTextReveal
              text="Use the tool. Understand the system. Keep moving."
              className="landing-hero-title"
            />
            <p className="landing-hero-description">
              Darma brings practical browser tools, a connected Tech Atlas, learning routes, career guidance, and focused games into one place. Start with what you need to do, then see the wider system around it.
            </p>
            <div className="landing-hero-actions">
              <Link href="/tools" className="landing-hero-action-primary">
                <Wrench className="h-4 w-4" aria-hidden />
                Open browser tools
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/tech-atlas" className="landing-hero-action-secondary">
                <Compass className="h-4 w-4" aria-hidden />
                Explore the Tech Atlas
              </Link>
              <Link href="/search" className="landing-hero-action-search">
                <Search className="h-4 w-4" aria-hidden />
                Search everything
                <span className="font-mono text-xs opacity-75">Ctrl K</span>
              </Link>
            </div>
            <div className="landing-hero-proof" aria-label="Darma product principles">
              <span><i><Check className="h-3 w-3" aria-hidden /></i>No signup for core tools</span>
              <span><i><Check className="h-3 w-3" aria-hidden /></i>Open source</span>
              <span><i><Check className="h-3 w-3" aria-hidden /></i>Built for light and dark mode</span>
            </div>
          </div>

          <DarmaHeroExperience
            metrics={[
              `${publicTools.length} tools`,
              `${games.length} games`,
              `${resources.length} references`,
              `${paths.length} learning paths`,
            ]}
          />
        </div>
      </section>

      <section id="choose" className="landing-intent-section scroll-mt-24">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-eyebrow">Start with the task in front of you</span>
              <h2>Choose what you need to finish. Darma will reveal the route around it.</h2>
              <p>You do not need to know the correct category first. Pick an outcome, inspect the recommended workspaces, and see what a useful result should contain before you begin.</p>
            </div>
            <div className="landing-intent-counts" aria-label="Darma catalog totals">
              <span><strong>{publicTools.length}</strong> tools</span>
              <span><strong>{resources.length}</strong> references</span>
              <span><strong>{guides.length + comparisons.length}</strong> guides</span>
              <span><strong>{games.length}</strong> games</span>
            </div>
          </div>
          <LandingIntentNavigator />
        </div>
      </section>

      <section id="workbench" className="landing-workbench-section scroll-mt-24">
        <div className="relative mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-eyebrow">See the interaction model</span>
              <h2>Controls and results belong in the same conversation.</h2>
              <p>Every Darma tool follows one workspace pattern. Your input stays visible, the preview responds as you type, and the next useful action is always in reach.</p>
            </div>
          </div>
          <MotionSection className="mt-10" distance={24}>
            <LandingWorkbenchDemo />
          </MotionSection>
        </div>
      </section>

      <section id="featured" className="scroll-mt-24 border-y border-[var(--color-border-subtle)] bg-[var(--color-page-bg-soft)]">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-eyebrow">Featured workspaces</span>
              <h2>See what a tool does before opening it.</h2>
              <p>Each card previews the real output of the tool behind it, so you can tell whether a workspace fits your task before you open it.</p>
            </div>
            <Link href="/tools">View all tools <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <div className="landing-tool-grid mt-10">
            {featuredTools.map((tool, index) => tool ? (
              <MotionSection key={tool.id} delay={index * 0.04} distance={18}>
                <Link href={tool.href} className="landing-tool-card">
                  <ToolPreviewArtwork tool={tool} />
                  <div className="landing-tool-card-copy">
                    <div className="landing-tool-card-meta">
                      <Badge variant="soft">{tool.layoutType?.replaceAll("-", " ") ?? "tool"}</Badge>
                      <Badge variant="outline">{tool.privacy === "client-only" ? "Runs locally" : "Browser workspace"}</Badge>
                    </div>
                    <h3>{tool.title}</h3>
                    <p>{tool.shortDescription ?? tool.description}</p>
                    <div className="landing-tool-card-footer"><span>Open workspace</span><span><ArrowRight className="h-4 w-4" aria-hidden /></span></div>
                  </div>
                </Link>
              </MotionSection>
            ) : null)}
          </div>
        </div>
      </section>

      <section id="proof" className="landing-proof-section scroll-mt-24">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-eyebrow">From isolated tools to a complete handoff</span>
              <h2>See how separate workspaces become one practical route.</h2>
              <p>A professional workflow is more than a list of links. Each step should produce an artifact, expose a check, and hand useful context to the next step.</p>
            </div>
            <Link href="/workflows">Browse all workflows <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <LandingProofWorkflow />
        </div>
      </section>

      <section id="radar" className="landing-radar-section scroll-mt-24 border-y border-[var(--color-border-subtle)] bg-[var(--color-section-ink)] text-[var(--color-text-on-ink)]">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="landing-section-heading landing-section-heading-on-dark">
            <div>
              <span className="landing-section-eyebrow">Current web practice</span>
              <h2>Keep the workspace connected to the standards shaping real products.</h2>
              <p>Darma should not become a static shelf. This radar brings current official guidance into the visual story, then connects it to tools, learning, security, accessibility, and performance work.</p>
            </div>
            <Link href="/resources?publisher=official">Browse official references <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <ModernWebRadar />
        </div>
      </section>

      <section id="atlas" className="landing-atlas-band scroll-mt-24">
        <div className="relative z-[2] mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,.88fr)_minmax(480px,1.12fr)] lg:items-center lg:px-8 lg:py-24">
          <MotionSection distance={20}>
            <span className="landing-section-eyebrow">The connected Tech Atlas</span>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-5xl">A reference should lead somewhere useful.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)]">A guide can point to a comparison. A comparison can reveal a role. A role can connect to a learning path, team model, workflow, glossary term, and primary source. The Atlas makes those relationships visible.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/tech-atlas" className="landing-hero-action-primary">Open the Tech Atlas <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href="/learning-paths" className="landing-hero-action-secondary">Browse learning paths</Link>
            </div>
          </MotionSection>
          <MotionSection delay={0.08} distance={24}>
            <ConnectedAtlasVisual guides={guides.length} comparisons={comparisons.length} resources={resources.length} paths={paths.length} />
          </MotionSection>
        </div>
      </section>

      <section id="play" className="mx-auto max-w-[var(--container-wide)] scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="landing-section-heading">
          <div>
            <span className="landing-section-eyebrow">Play inside Darma</span>
            <h2>Take a short break without entering another platform.</h2>
            <p>Games are part of the workspace too. Open one quickly, keep progress on the device when supported, and return to the task with a clearer head.</p>
          </div>
          <Link href="/games">Browse every game <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
        <div className="landing-game-grid mt-10">
          {featuredGames.map((game, index) => (
            <MotionSection key={game.id} delay={index * 0.05} distance={18}>
              <Link href={game.href} className="landing-game-card group">
                <div className="landing-game-card-media"><GameThumbnail game={game} priority={index === 0} /></div>
                <div className="landing-game-card-body">
                  <div><h3>{game.title}</h3><span className="landing-game-card-arrow"><ArrowRight className="h-4 w-4" aria-hidden /></span></div>
                  <p>{game.description}</p>
                  <div className="landing-game-card-meta"><span>{game.difficulty}</span><span>•</span><span>{game.playTime}</span><span>•</span><span>{game.input.join(" + ")}</span></div>
                </div>
              </Link>
            </MotionSection>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--color-border-subtle)] bg-[var(--color-page-bg-soft)]">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-eyebrow">Built to earn trust</span>
              <h2>The interface should explain how the product behaves.</h2>
              <p>Privacy, sourcing, accessibility, and contribution are visible product features. They are not hidden in a footer after the important decisions have already been made.</p>
            </div>
          </div>
          <div className="landing-trust-grid mt-9">
            {trustItems.map((item, index) => (
              <MotionSection key={item.title} delay={index * 0.04} distance={16}>
                <article className="landing-trust-card"><span><DarmaSymbol name={item.symbol} className="h-6 w-6" /></span><h3>{item.title}</h3><p>{item.description}</p></article>
              </MotionSection>
            ))}
          </div>
        </div>
      </section>

      <MotionSection as="section" className="mx-auto max-w-[var(--container-page)] px-4 pt-16 sm:px-6 lg:px-8" distance={18}>
        <div className="landing-final-cta grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[#ff8b68]"><ShieldCheck className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-black uppercase tracking-[0.14em]">A living open reference</span></div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Find something missing, unclear, or outdated?</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7">Suggest a source, improve a learning path, correct a role guide, report a tool issue, or submit a focused pull request through Darma’s review workflow.</p>
          </div>
          <Link href="/contribute" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ff6a3d] px-6 text-sm font-black text-[#111110] shadow-lg">Contribute to Darma <Sparkles className="h-4 w-4" aria-hidden /></Link>
        </div>
      </MotionSection>
    </div>
  );
}
