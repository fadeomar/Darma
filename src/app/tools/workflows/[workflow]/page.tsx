import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { ToolGrid } from "@/features/tools/components/ToolGrid";
import { getToolRegistry } from "@/features/tools/registry";
import { getToolWorkflow, toolWorkflows } from "@/features/tools/workflows";

export function generateMetadata({ params }: { params: { workflow: string } }): Metadata {
  const workflow = getToolWorkflow(params.workflow);
  if (!workflow) return {};
  return {
    title: `${workflow.title} | Darma Workflows`,
    description: workflow.description,
    alternates: { canonical: `/tools/workflows/${workflow.id}` },
  };
}

export default function WorkflowPage({ params }: { params: { workflow: string } }) {
  const workflow = getToolWorkflow(params.workflow);
  if (!workflow) notFound();

  const registry = getToolRegistry();
  const tools = workflow.toolIds.map((id) => registry.getById(id)).filter((tool) => tool && tool.visibility === "public");
  const related = (workflow.relatedWorkflowIds ?? []).map((id) => toolWorkflows.find((item) => item.id === id)).filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: workflow.title,
    description: workflow.description,
    itemListElement: tools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool?.title, url: tool?.href })),
  };

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <Link href="/tools/workflows" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Back to workflows</Link>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="soft">Workflow</Badge>
          <Badge variant="outline">{tools.length} tools</Badge>
        </div>
        <h1 className="mt-4 text-4xl font-black text-[var(--color-text)] sm:text-5xl">{workflow.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{workflow.description}</p>
      </section>
      <Card variant="article" padding="lg" className="mt-8">
        <h2 className="text-2xl font-black text-[var(--color-text)]">Recommended use case</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{workflow.useCase}</p>
      </Card>
      <section className="mt-8">
        <ToolGrid tools={tools as NonNullable<(typeof tools)[number]>[]} />
      </section>
      {related.length > 0 ? (
        <section className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-black text-[var(--color-text)]">Related workflows</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => item ? (
              <Link key={item.id} href={`/tools/workflows/${item.id}`} className="rounded-[var(--radius-full)] border border-[var(--color-border)] px-3 py-1 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                {item.title}
              </Link>
            ) : null)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
