import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SEED_TEMPLATES, getTemplateById } from "@/features/todo/data/seedTemplates";

type Props = {
  params: Promise<{ templateId: string }>;
};

export function generateStaticParams() {
  return SEED_TEMPLATES.map((template) => ({ templateId: template.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { templateId } = await params;
  const template = getTemplateById(templateId);
  if (!template) return {};
  return {
    title: `${template.name} Template | Darma Tasks`,
    description: `${template.description} Use this free ${template.category.toLowerCase()} to-do list template in Darma Tasks.`,
  };
}

export default async function TodoTemplateDetailPage({ params }: Props) {
  const { templateId } = await params;
  const template = getTemplateById(templateId);
  if (!template) notFound();
  const related = SEED_TEMPLATES.filter((t) => t.category === template.category && t.id !== template.id).slice(0, 3);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--color-text-secondary)]">
        <Link href="/tools/todo-list/templates" className="font-semibold text-[var(--color-accent)]">Templates</Link>
        <span className="mx-2">/</span>
        <span>{template.name}</span>
      </nav>

      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{template.category}</span>
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{template.defaultView} view</span>
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{template.tasks.length} tasks</span>
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--color-text-primary)] md:text-5xl">{template.name}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)]">{template.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/tools/todo-list?template=${template.id}`} className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white">
            Use this template
          </Link>
          <Link href="/tools/todo-list" className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-text-primary)]">
            Open To-Do tool
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-2xl font-black text-[var(--color-text-primary)]">Task preview</h2>
          <ul className="mt-5 space-y-3">
            {template.tasks.map((task, index) => (
              <li key={`${task.title}-${index}`} className="rounded-2xl border border-[var(--color-border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{task.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.section && <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">{task.section}</span>}
                    {task.priority && <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">{task.priority}</span>}
                  </div>
                </div>
                {task.tags?.length ? <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">{task.tags.map((tag) => `#${tag}`).join(" ")}</p> : null}
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5">
            <h2 className="text-lg font-black text-[var(--color-text-primary)]">Best for</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
              Use this template when you want a structured starting point instead of building a list from scratch. It works with List, Table, Board, Week, Checklist, and Print views.
            </p>
          </div>
          {related.length > 0 && (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-lg font-black text-[var(--color-text-primary)]">Related templates</h2>
              <div className="mt-3 space-y-2">
                {related.map((item) => (
                  <Link key={item.id} href={`/tools/todo-list/templates/${item.id}`} className="block rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)]">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
