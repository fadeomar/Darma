
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";
import { getToolWorkflow, toolWorkflows } from "@/features/tools/workflows";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const workflow = getToolWorkflow(slug);
  if (!workflow) return {};
  return {
    title: `${workflow.title} | Darma Workflows`,
    description: workflow.description,
    alternates: { canonical: `/workflows/${workflow.id}` },
  };
}

export default async function WorkflowDetailPage({ params }: Props) {
  const { slug } = await params;
  const workflow = getToolWorkflow(slug);
  if (!workflow) notFound();

  const registry = getToolRegistry();
  const tools = workflow.toolIds.map((id) => registry.getById(id)).filter((tool) => tool?.visibility === "public");
  const related = (workflow.relatedWorkflowIds ?? [])
    .map((id) => toolWorkflows.find((item) => item.id === id))
    .filter(Boolean);
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
      <Card padding="lg">
        <Link href="/workflows" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to workflows
        </Link>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="soft">Workflow</Badge>
          <Badge variant="outline">{tools.length} tools</Badge>
          {(workflow.audience ?? []).map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">{workflow.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">{workflow.description}</p>
      </Card>

      <Card variant="article" padding="lg" className="mt-8">
        <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Why this order?</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{workflow.useCase}</p>
        {workflow.steps?.length ? (
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {workflow.steps.map((step, index) => (
              <li key={step} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                <span className="mr-2 font-mono text-xs font-black text-[var(--color-primary)]">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        ) : null}
      </Card>

      <section className="mt-8 space-y-4">
        {tools.map((tool, index) => tool ? (
          <Link key={tool.id} href={tool.href} className="block">
            <Card as="article" variant="interactive" padding="md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] font-mono text-sm font-black text-[var(--color-primary-text)]">{index + 1}</span>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="soft">{tool.layoutType?.replace(/-/g, " ") ?? "tool"}</Badge>
                    {tool.secondaryCategory?.[0] ? <Badge variant="outline">{tool.secondaryCategory[0]}</Badge> : null}
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{tool.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{tool.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ) : null)}
      </section>

      {related.length > 0 ? (
        <section className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-black text-[var(--color-text-primary)]">Related workflows</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => item ? (
              <Link key={item.id} href={`/workflows/${item.id}`} className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]">
                {item.title}
              </Link>
            ) : null)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
