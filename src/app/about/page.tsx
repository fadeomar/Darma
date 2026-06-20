import type { Metadata } from "next";
import Link from "next/link";
import GoodLinks from "@/sections/GoodLinks";
import { Badge, Card, CopyButton } from "@/components/ui";
import { getToolRegistry } from "@/features/tools";
import { toolWorkflows } from "@/features/tools/workflows";
import {
  AUDIENCE_GROUPS,
  AUDIENCE_LABELS,
  countByPrivacy,
  HELP_AREAS,
  pickDaily,
  PRINCIPLES,
  PRIVACY_META,
  PRIVACY_ORDER,
  selectGroupTools,
  SNIPPETS,
} from "./aboutContent";
import { ContinuePanel } from "./ContinuePanel";
import { FavoritesPanel } from "./FavoritesPanel";

const SUGGEST_TOOL_URL =
  "https://github.com/fadeomar/Darma/issues/new?labels=tool-suggestion&title=Tool%20suggestion%3A%20";

// Regenerate at most hourly so "Darma Today" stays current without per-request cost.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Darma — your daily online toolbox",
  description:
    "Darma is a daily online toolbox for useful tasks: count and clean text, convert images, generate passwords and QR codes, design with CSS, format data, and more — for students, creators, designers, developers, and everyday users.",
};

const primaryLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]";
const secondaryLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]";
const sectionClass = "mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8";
const eyebrowClass = "font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]";

export default function AboutPage() {
  const registry = getToolRegistry();
  const publicTools = registry.list().filter((tool) => tool.visibility === "public");
  const featuredTools = publicTools.filter((tool) => tool.featured);

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

  return (
    <main className="pb-16">
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-4xl">
            <Badge variant="soft">About Darma</Badge>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Your daily online toolbox for useful tasks.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              Darma brings together practical tools for writing, studying, designing, converting, and building — so anyone can finish small digital tasks faster, without installing anything.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tools" className={primaryLinkClass}>Explore all tools</Link>
              <Link href="/workflows" className={secondaryLinkClass}>Browse workflows</Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">Made for</span>
              {AUDIENCE_LABELS.map((audience) => (
                <Badge key={audience.id} variant="outline">{audience.label}</Badge>
              ))}
            </div>
          </div>

          <Card padding="lg" className="self-start">
            <p className={eyebrowClass}>Darma at a glance</p>
            <dl className="mt-4 space-y-3">
              {[
                { label: "Browser-based tools", value: `${publicTools.length}` },
                { label: "Guided workflows", value: `${toolWorkflows.length}` },
                { label: "Account required", value: "No" },
                { label: "Runs in your browser", value: "Yes" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3 last:border-0 last:pb-0">
                  <dt className="text-sm text-[var(--color-text-secondary)]">{row.label}</dt>
                  <dd className="font-mono text-sm font-bold text-[var(--color-text-primary)]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>

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
          {HELP_AREAS.map((area) => (
            <Card key={area.title} padding="lg" className="h-full">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{area.title}</h3>
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
            One useful tool, one guided workflow, and one copy-ready snippet — picked automatically each day.
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
                Open workflow · {todayWorkflow.toolIds.length} tools
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
            Darma is not just for developers. Start from a task and open the tool you need.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {AUDIENCE_GROUPS.map((group) => {
            const tools = selectGroupTools(publicTools, group);
            if (tools.length === 0) return null;
            return (
              <Card key={group.id} padding="lg" className="flex h-full flex-col">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{group.description}</p>
                <ul className="mt-4 flex-1 space-y-1.5">
                  {tools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={tool.href}
                        className="group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-transparent px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-default)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]"
                      >
                        <span className="min-w-0 truncate font-medium">{tool.title}</span>
                        <span className="text-[var(--color-text-tertiary)] transition group-hover:text-[var(--color-primary)]">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/tools" className="mt-4 inline-flex text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]">
                  Browse all tools
                </Link>
              </Card>
            );
          })}
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
                  <Badge variant="outline">{workflow.toolIds.length} tools</Badge>
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
                Darma grows from real needs. Tell us what would save you time — for studying, writing, designing, or building — and it may become the next tool.
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

      <GoodLinks />
    </main>
  );
}
