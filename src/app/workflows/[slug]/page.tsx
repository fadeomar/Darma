import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, ExternalLink, Link2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";
import { appendWorkflowContext, getToolWorkflow, toolWorkflows } from "@/features/tools/workflows";
import { WorkflowProgressSummary } from "@/features/tools/workflows/components";

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
  const related = (workflow.relatedWorkflowIds ?? [])
    .map((id) => toolWorkflows.find((item) => item.id === id))
    .filter(Boolean);
  const startStep = workflow.steps[0];
  if (!startStep) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: workflow.title,
    description: workflow.description,
    totalTime: workflow.estimatedTime,
    step: workflow.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.description,
      url: appendWorkflowContext(step.href, workflow.id),
    })),
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
          <Badge variant="soft">Connected workflow</Badge>
          <Badge variant="outline">{workflow.steps.length} steps</Badge>
          {workflow.estimatedTime ? <Badge variant="outline"><Clock3 className="mr-1 h-3 w-3" aria-hidden />{workflow.estimatedTime}</Badge> : null}
          {(workflow.audience ?? []).map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">{workflow.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">{workflow.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={appendWorkflowContext(startStep.href, workflow.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-sm font-bold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]">
            Start with step 1 <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="#workflow-steps" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
            Review all steps
          </Link>
        </div>
        <WorkflowProgressSummary workflowId={workflow.id} stepIds={workflow.steps.map((step) => step.id)} />
      </Card>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card variant="article" padding="lg">
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]"><Link2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />Why this order?</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{workflow.useCase}</p>
        </Card>
        <Card variant="article" padding="lg">
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]"><CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" aria-hidden />Expected outcome</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{workflow.outcome}</p>
        </Card>
      </div>

      <section id="workflow-steps" className="mt-8 space-y-4 scroll-mt-24">
        {workflow.steps.map((step, index) => {
          const tool = step.toolId ? registry.getById(step.toolId) : null;
          const href = appendWorkflowContext(step.href, workflow.id);
          return (
            <Card key={step.id} as="article" variant="interactive" padding="md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] font-mono text-sm font-black text-[var(--color-primary-text)]">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="soft">{tool?.layoutType?.replace(/-/g, " ") ?? "Explorer step"}</Badge>
                    {tool?.secondaryCategory?.[0] ? <Badge variant="outline">{tool.secondaryCategory[0]}</Badge> : null}
                    {step.handoff ? <Badge variant="accent">Data handoff</Badge> : null}
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{step.description}</p>
                  {step.handoff ? <p className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--color-text-secondary)]">{step.handoff}</p> : null}
                  <Link href={href} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)]">
                    {index === 0 ? "Start this workflow" : "Open this step"} <ExternalLink className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
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
