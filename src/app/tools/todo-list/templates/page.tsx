import type { Metadata } from "next";
import Link from "next/link";
import { SEED_TEMPLATES, getTemplateCategories, getTemplatesByCategory } from "@/features/todo/data/seedTemplates";

export const metadata: Metadata = {
  title: "Free To-Do List Templates | Darma Tasks",
  description: "Browse ready-made to-do list templates for students, work, design, developers, teachers, NGOs, travel, and home planning.",
};

export default function TodoTemplatesPage() {
  const categories = getTemplateCategories();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">Darma Tasks templates</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--color-text-primary)] md:text-5xl">
          Free to-do list templates for real workflows
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)]">
          Start faster with reusable checklists for study, work, design, development, teaching, NGO proposals, content creation, travel, and home life. Every template can be previewed here and used inside the Darma Tasks workspace.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tools/todo-list" className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white">
            Open Darma Tasks
          </Link>
          <a href="#templates" className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-text-primary)]">
            Browse templates
          </a>
        </div>
      </div>

      <section id="templates" className="mt-10 space-y-10">
        {categories.map((category) => {
          const templates = getTemplatesByCategory(category);
          return (
            <div key={category}>
              <h2 className="text-2xl font-black text-[var(--color-text-primary)]">{category}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/tools/todo-list/templates/${template.id}`}
                    className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-3 rounded-full" style={{ background: template.color ?? "var(--color-accent)" }} aria-hidden />
                      <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{template.defaultView} view</p>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">{template.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{template.description}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      {template.tasks.length} tasks · {template.category}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-12 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6">
        <h2 className="text-2xl font-black text-[var(--color-text-primary)]">Why template pages matter</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          These pages make Darma Tasks useful before a user even opens the app. They also give search engines crawlable pages for specific intents like student planner, developer release checklist, proposal submission checklist, and printable travel packing list.
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Total templates: {SEED_TEMPLATES.length}</p>
      </section>
    </main>
  );
}
