import Link from "next/link";
import PageSection from "@/components/ui/PageSection";
import { getToolRegistry } from "@/features/tools";

const featureCards = [
  {
    title: "Explore front-end ideas",
    description:
      "Browse reusable UI patterns, mini projects, effects, and code experiments built with HTML, CSS, and JavaScript.",
    href: "/explore",
    cta: "Browse projects",
  },
  {
    title: "Use free one-page tools",
    description:
      "Open practical tools that help you generate, preview, and copy code quickly without signup or setup.",
    href: "/tools",
    cta: "Open tools",
  },
  {
    title: "Find by category",
    description:
      "Jump straight into topics like CSS, design ideas, utilities, and experiments that match what you need right now.",
    href: "/categories",
    cta: "View categories",
  },
];

export default function LandingPage() {
  const featuredTools = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public" && tool.featured)
    .slice(0, 4);

  return (
    <div className="pb-16">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-700">
            Front-end showcase + tools hub
          </p>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-[color:var(--textColor)] sm:text-5xl lg:text-6xl">
            Darma helps people discover useful front-end ideas and get work done faster.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
            It combines a growing library of HTML, CSS, and JavaScript projects with lightweight online tools for developers, designers, students, and creators.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="rounded-full bg-[color:var(--textColor)] px-6 py-3 text-sm font-bold text-[color:var(--textColorOpposite)] transition hover:opacity-90">
              Explore projects
            </Link>
            <Link href="/tools" className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow">
              Try the tools
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Why it matters</p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Instead of random snippets, Darma is growing into one place for inspiration, learning, and quick browser-based utilities.
            </p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Built for speed</p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Open a tool, tweak a few inputs, preview the result, and copy what you need. No signup. No unnecessary steps.
            </p>
          </div>
        </div>
      </section>

      <PageSection
        eyebrow="Start here"
        title="Choose the fastest path"
        description="Use Darma as a product showcase, a learning playground, or a practical utilities site depending on what you need today."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {featureCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{card.description}</p>
              <span className="mt-5 inline-flex text-sm font-bold text-slate-900">{card.cta} →</span>
            </Link>
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Featured tools"
        title="The most useful tools right now"
        description="These are the tools that best represent the direction of the platform today."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{tool.audiences?.[0] ?? "tool"}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{tool.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{tool.description}</p>
            </Link>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
