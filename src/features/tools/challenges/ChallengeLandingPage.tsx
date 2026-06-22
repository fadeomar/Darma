import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { ToolGrid } from "@/features/tools/components/ToolGrid";
import type { ToolDefinition } from "@/features/tools/domain/tool";

type ChallengeProfile = {
  icon: string;
  accent: "primary" | "accent" | "warning";
  quickLabel: string;
  scoreLabel: string;
  microcopy: string;
  bestFor: string;
  rhythm: string;
};

const DEFAULT_PROFILE: ChallengeProfile = {
  icon: "✦",
  accent: "primary",
  quickLabel: "Start challenge",
  scoreLabel: "Live score",
  microcopy: "Fast browser challenge with local history and instant feedback.",
  bestFor: "Quick break",
  rhythm: "Warm-up",
};

const CHALLENGE_PROFILES: Record<string, ChallengeProfile> = {
  "mouse-scroll-test": {
    icon: "↕",
    accent: "primary",
    quickLabel: "Start 10s wheel sprint",
    scoreLabel: "px/s",
    microcopy: "Scroll inside the arena and watch distance, burst speed, and smoothness update live.",
    bestFor: "Mouse & touchpad",
    rhythm: "Sprint",
  },
  "click-speed-test": {
    icon: "•",
    accent: "warning",
    quickLabel: "Start 5s CPS sprint",
    scoreLabel: "CPS",
    microcopy: "Tap the target as fast as possible and compare total clicks, bursts, and consistency.",
    bestFor: "Mouse speed",
    rhythm: "Tap rush",
  },
  "spacebar-counter": {
    icon: "␣",
    accent: "accent",
    quickLabel: "Start keyboard sprint",
    scoreLabel: "PPS",
    microcopy: "Press Space without holding it down. Repeat-safe counting keeps the result fair.",
    bestFor: "Keyboard warm-up",
    rhythm: "Key rhythm",
  },
  "reaction-time-test": {
    icon: "⚡",
    accent: "primary",
    quickLabel: "Start reflex rounds",
    scoreLabel: "ms",
    microcopy: "Wait for the green signal, then react. Early taps are tracked as false starts.",
    bestFor: "Reflex check",
    rhythm: "Wait → react",
  },
};

function sortByPinned(tools: ToolDefinition[]) {
  return [...tools].sort(
    (a, b) =>
      (a.pinned ?? 999) - (b.pinned ?? 999) || a.title.localeCompare(b.title),
  );
}

function formatCategory(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugifyCategory(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function profileFor(tool: ToolDefinition) {
  return CHALLENGE_PROFILES[tool.id] ?? DEFAULT_PROFILE;
}

function accentClasses(profile: ChallengeProfile) {
  if (profile.accent === "accent") {
    return "from-[var(--color-accent-soft)] to-transparent text-[var(--color-accent)] border-[var(--color-accent-border)]";
  }
  if (profile.accent === "warning") {
    return "from-[var(--color-warning-bg)] to-transparent text-[var(--color-warning-text)] border-[var(--color-warning-border)]";
  }
  return "from-[var(--color-primary-soft)] to-transparent text-[var(--color-primary)] border-[var(--color-primary-border)]";
}

function ChallengeMiniCard({ tool, index }: { tool: ToolDefinition; index: number }) {
  const profile = profileFor(tool);
  const tags = (tool.tags ?? [])
    .filter((tag) => tag !== "browser" && tag !== "challenge" && tag !== "fun")
    .slice(0, 3);

  return (
    <Link
      href={tool.href}
      className="group block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]"
    >
      <Card
        as="article"
        variant="interactive"
        padding="md"
        className="relative flex h-full overflow-hidden border-[var(--color-primary-border)] bg-[radial-gradient(circle_at_0%_0%,var(--color-primary-soft),transparent_34%),radial-gradient(circle_at_100%_100%,var(--color-accent-soft),transparent_32%),linear-gradient(145deg,var(--color-surface-raised),var(--color-surface-base))]"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-primary-soft)] opacity-70 blur-2xl transition duration-300 group-hover:scale-125 motion-reduce:transition-none" />
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />
        <div className="relative flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border bg-gradient-to-br text-xl font-black shadow-[var(--shadow-xs)] ${accentClasses(profile)}`}
                aria-hidden
              >
                {profile.icon}
              </span>
              <div>
                <Badge variant="warning">Challenge</Badge>
                <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {profile.rhythm}
                </p>
              </div>
            </div>
            <span className="rounded-[var(--radius-full)] border border-white/60 bg-white/75 px-2.5 py-1 font-mono text-[10px] font-black text-[var(--color-primary)] shadow-[var(--shadow-xs)] dark:border-white/10 dark:bg-white/10">
              0{index + 1}
            </span>
          </div>

          <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            {tool.title}
          </h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            {profile.microcopy}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-md)] border border-white/55 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Score
              </p>
              <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">
                {profile.scoreLabel}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-white/55 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Best for
              </p>
              <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">
                {profile.bestFor}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
          <span className="mt-auto pt-5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]">
            {profile.quickLabel} →
          </span>
        </div>
      </Card>
    </Link>
  );
}

function FeaturedChallengeCard({ tool }: { tool: ToolDefinition }) {
  const profile = profileFor(tool);

  return (
    <Card
      variant="article"
      padding="md"
      className="relative overflow-hidden border-[var(--color-primary-border)] bg-[radial-gradient(circle_at_0%_0%,var(--color-primary-soft),transparent_36%),radial-gradient(circle_at_100%_100%,var(--color-accent-soft),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,246,232,0.58),rgba(255,255,255,0.74))] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,166,74,0.08),rgba(64,215,204,0.08))]"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--color-primary-soft)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/20" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="warning">Featured challenge</Badge>
            <h2 className="mt-3 text-3xl font-black leading-none tracking-[-0.05em] text-[var(--color-text-primary)]">
              {tool.title}
            </h2>
          </div>
          <span
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border bg-gradient-to-br text-3xl font-black shadow-[var(--shadow-xs)] ${accentClasses(profile)}`}
            aria-hidden
          >
            {profile.icon}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">
          {profile.microcopy}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-[var(--radius-md)] border border-white/60 bg-white/65 p-3 dark:border-white/10 dark:bg-white/10">
            <p className="text-xl font-black text-[var(--color-text-primary)]">
              {profile.scoreLabel}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Score type
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/60 bg-white/65 p-3 dark:border-white/10 dark:bg-white/10">
            <p className="text-xl font-black text-[var(--color-text-primary)]">
              Local
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              History
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/60 bg-white/65 p-3 dark:border-white/10 dark:bg-white/10">
            <p className="text-xl font-black text-[var(--color-text-primary)]">
              Zero
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Setup
            </p>
          </div>
        </div>

        <Link
          href={tool.href}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-black text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus:shadow-[var(--focus-ring)]"
        >
          {profile.quickLabel}
        </Link>
      </div>
    </Card>
  );
}

function ChallengeConsole({ toolsCount }: { toolsCount: number }) {
  return (
    <Card
      variant="article"
      padding="md"
      className="relative overflow-hidden border-[var(--color-primary-border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(255,246,232,0.5),rgba(223,247,242,0.44))] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,166,74,0.08),rgba(64,215,204,0.08))]"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--color-accent-soft)] blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            Challenge console
          </p>
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-success-text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse" />
            Live
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[var(--radius-md)] border border-white/55 bg-white/65 p-3 shadow-[var(--shadow-xs)] dark:border-white/10 dark:bg-white/10">
            <p className="text-3xl font-black tracking-[-0.05em] text-[var(--color-text-primary)]">
              {toolsCount}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Tools
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/55 bg-white/65 p-3 shadow-[var(--shadow-xs)] dark:border-white/10 dark:bg-white/10">
            <p className="text-3xl font-black tracking-[-0.05em] text-[var(--color-text-primary)]">
              4
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Modes
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/55 bg-white/65 p-3 shadow-[var(--shadow-xs)] dark:border-white/10 dark:bg-white/10">
            <p className="text-3xl font-black tracking-[-0.05em] text-[var(--color-text-primary)]">
              0
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Signup
            </p>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)]">
          <div className="h-2 w-11/12 rounded-[var(--radius-full)] bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent),var(--color-warning-text),var(--color-primary))]" />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--color-text-tertiary)]">
          Phase 10 upgrades the hub into a clearer arcade-style discovery surface with featured, quick-start, and pathway sections.
        </p>
      </div>
    </Card>
  );
}

function QuickStartStrip({ tools }: { tools: ToolDefinition[] }) {
  return (
    <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Quick start challenges">
      {tools.map((tool) => {
        const profile = profileFor(tool);
        return (
          <Link
            key={tool.id}
            href={tool.href}
            className="group rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-card)] focus:outline-none focus:shadow-[var(--focus-ring)] motion-reduce:hover:translate-y-0"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border bg-gradient-to-br text-xl font-black ${accentClasses(profile)}`}
                aria-hidden
              >
                {profile.icon}
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)]">
                Quick start →
              </span>
            </div>
            <h2 className="mt-3 text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
              {tool.title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
              {profile.quickLabel}
            </p>
          </Link>
        );
      })}
    </section>
  );
}

export function ChallengeLandingPage({ tools }: { tools: ToolDefinition[] }) {
  const challengeTools = sortByPinned(
    tools.filter((tool) => tool.layoutType === "interactive-challenge"),
  );
  const categories = Array.from(
    new Set(
      challengeTools
        .flatMap((tool) => tool.secondaryCategory ?? [])
        .filter((category) => category !== "fun" && category !== "utilities"),
    ),
  ).slice(0, 8);

  const featuredTool = challengeTools[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Fun Tools and Interactive Challenges | Darma Tools",
    description:
      "Browser-only Darma challenges for clicking, scrolling, keyboard speed, reaction time, and playful input tests.",
    hasPart: challengeTools.map((tool) => ({
      "@type": "WebApplication",
      name: tool.title,
      url: tool.href,
    })),
  };

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--color-primary-border)] bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_34%),radial-gradient(circle_at_bottom_right,var(--color-accent-soft),transparent_32%),linear-gradient(135deg,var(--color-surface-overlay),var(--color-surface-raised))] p-6 shadow-[0_26px_90px_rgba(93,62,30,0.14)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(119,83,45,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(119,83,45,0.07)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-[var(--color-primary-soft)] blur-3xl" />
        <div className="relative">
          <Link
            href="/tools"
            className="inline-flex rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-text-primary)] focus:outline-none focus:shadow-[var(--focus-ring)]"
          >
            ← Back to tools
          </Link>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="warning">Fun Tools</Badge>
            <Badge variant="accent">Interactive challenges</Badge>
            <Badge variant="outline">Browser-only</Badge>
            <Badge variant="outline">Local history</Badge>
            <Badge variant="outline">Phase 10 UI</Badge>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-[var(--leading-tight)] tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
                Pick a challenge, chase a score, keep Darma calm.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
                A soft arcade layer for quick browser tests. The page stays warm and simple, while each arena adds glow, countdowns, live metrics, personal bests, and copyable score moments.
              </p>
              {featuredTool ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href={featuredTool.href}
                    className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-black text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                  >
                    Start featured challenge
                  </Link>
                  <a
                    href="#quick-start"
                    className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-5 text-sm font-black text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-primary-border)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                  >
                    Quick start grid
                  </a>
                </div>
              ) : null}
            </div>

            <ChallengeConsole toolsCount={challengeTools.length} />
          </div>
        </div>
      </section>

      <section id="quick-start" className="scroll-mt-24">
        <QuickStartStrip tools={challengeTools.slice(0, 4)} />
      </section>

      {featuredTool ? (
        <section className="mt-8 grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <FeaturedChallengeCard tool={featuredTool} />
          <Card
            variant="article"
            padding="lg"
            className="relative overflow-hidden border-[var(--color-primary-border)] bg-[linear-gradient(135deg,var(--color-surface-base),var(--color-surface-overlay))]"
          >
            <div className="pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-[var(--color-accent-soft)] blur-3xl" />
            <div className="relative">
              <Badge variant="soft">Challenge pathway</Badge>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">
                A cleaner flow for playful tools
              </h2>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  ["01", "Choose", "Pick a challenge by device, speed type, or mood."],
                  ["02", "Play", "Run the test in a focused arena with live feedback."],
                  ["03", "Beat", "Compare the local best and retry without signup friction."],
                ].map(([step, title, text]) => (
                  <div
                    key={step}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-xs)]"
                  >
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-primary)]">
                      {step}
                    </p>
                    <h3 className="mt-2 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--color-text-secondary)]">
                Phase 10 makes the hub easier to scan: a strong featured card for the first play, quick-start cards for repeat visitors, and clearer cards that explain what each challenge measures.
              </p>
            </div>
          </Card>
        </section>
      ) : null}

      <section id="challenge-grid" className="mt-8 scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="soft">Challenge grid</Badge>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
              Pick a quick test
            </h2>
          </div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Built from interactive-challenge layout
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {challengeTools.map((tool, index) => (
            <ChallengeMiniCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card variant="article" padding="lg" className="bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_38%),var(--color-surface-base)]">
          <Badge variant="accent">Design rule</Badge>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            Calm shell, energetic arena
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Fun tools keep Darma’s beige rhythm, then focus the color, motion, and score feedback inside the active challenge zone.
          </p>
        </Card>
        <Card variant="article" padding="lg" className="bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),var(--color-surface-base)]">
          <Badge variant="accent">UX rule</Badge>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            Short loops, clear reward
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Each challenge starts fast, shows live numbers, ends with a readable highlight, and encourages one more attempt.
          </p>
        </Card>
        <Card variant="article" padding="lg" className="bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_32%),radial-gradient(circle_at_bottom_right,var(--color-accent-soft),transparent_35%),var(--color-surface-base)]">
          <Badge variant="accent">Growth rule</Badge>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            Reusable challenge system
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            New fun tools can reuse the same modes, history panels, feedback chips, arena chrome, and result components.
          </p>
        </Card>
      </section>

      {categories.length ? (
        <section className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            Challenge categories
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/tools/category/${slugifyCategory(category)}`}
                className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-text-primary)] focus:outline-none focus:shadow-[var(--focus-ring)]"
              >
                {formatCategory(category)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4">
          <Badge variant="outline">All challenge tools</Badge>
        </div>
        <ToolGrid tools={challengeTools} />
      </section>
    </main>
  );
}
