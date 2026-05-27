
"use client";

import Link from "next/link";
import GoodLinks from "@/sections/GoodLinks";
import { Badge, Card } from "@/components/ui";

const valueCards = [
  {
    title: "Preview-first tools",
    text: "Generators and utilities should show the result quickly, keep controls readable, and keep copy actions close to output.",
  },
  {
    title: "Readable code ideas",
    text: "Explore is for practical HTML, CSS, and JavaScript experiments that can be studied, edited, and reused.",
  },
  {
    title: "One design language",
    text: "Darma now uses shared workshop tokens so public pages, tools, and resource sections feel like one product.",
  },
];

const paths = [
  { title: "For developers", items: ["Open a tool", "Tune the controls", "Copy clean output"] },
  { title: "For learners", items: ["Browse examples", "Inspect the code", "Experiment safely"] },
  { title: "For creators", items: ["Generate assets", "Preview variations", "Download or copy"] },
];

export default function AboutPage() {
  return (
    <main className="pb-16">
      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <Badge variant="soft">About Darma</Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              A calm workshop for front-end tools, examples, and reusable code ideas.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              Darma is being shaped into a professional developer tools product: warm, practical, browser-first, and focused on helping people move from idea to result faster.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tools" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]">
                Open tools
              </Link>
              <Link href="/explore" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]">
                Browse examples
              </Link>
            </div>
          </div>

          <Card padding="lg" className="self-start">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              Product direction
            </p>
            <p className="mt-4 text-lg font-bold leading-7 text-[var(--color-text-primary)]">
              Warm, readable, practical, preview-first, professional, and developer-focused.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">
              This page now follows the same shared surface, border, badge, and typography language as the tools system instead of a separate marketing/resource style.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {valueCards.map((card) => (
            <Card key={card.title} padding="lg" className="h-full">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{card.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              How to use it
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
              Pick the path that matches your task.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {paths.map((path) => (
              <div key={path.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{path.title}</h3>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {path.items.map((item, index) => (
                    <li key={item} className="flex gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary-soft)] font-mono text-[10px] font-bold text-[var(--color-primary)]">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GoodLinks />
    </main>
  );
}
