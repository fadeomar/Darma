import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, Link2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { DetailHero, DetailSectionNav, type DetailSectionNavItem } from "@/components/details";
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
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DetailHero
        variant="workflow"
        backHref="/workflows"
        backLabel="All connected workflows"
        eyebrow="Move work forward without losing the handoff"
        badges={[
          { label: "Connected workflow", tone: "soft" },
          { label: `${workflow.steps.length} steps`, tone: "outline" },
          ...(workflow.estimatedTime ? [{ label: workflow.estimatedTime, tone: "outline" as const }] : []),
        ]}
        title={workflow.title}
        description={workflow.description}
        metrics={[
          { value: workflow.steps.length, label: "steps" },
          { value: workflow.estimatedTime ?? "Flexible", label: "duration" },
          { value: workflow.steps.filter((step) => Boolean(step.toolId)).length, label: "tool steps" },
          { value: related.length, label: "related routes" },
        ]}
        actions={[
          { href: appendWorkflowContext(startStep.href, workflow.id), label: "Start with step one", tone: "primary" },
          { href: "#workflow-steps", label: "Review the full route", tone: "secondary" },
        ]}
        signals={[
          { label: "First handoff", value: startStep.title },
          { label: "Audience", value: (workflow.audience ?? []).join(", ") || "General" },
          { label: "Sequence", value: "Ordered and connected" },
          { label: "Progress", value: "Saved in this browser" },
        ]}
        asideTitle="Route preview"
        asideItems={workflow.steps.map((step, index) => `${index + 1}. ${step.title}`)}
      />

      <DetailSectionNav
        items={[
          { id: "workflow-overview", label: "Why this route" },
          { id: "workflow-steps", label: "Steps" },
          ...(related.length ? [{ id: "related-workflows", label: "Related workflows" }] : []),
        ] satisfies DetailSectionNavItem[]}
        label={`${workflow.title} sections`}
      />

      <section id="workflow-overview" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 py-10 sm:px-6 lg:px-8">
        <WorkflowProgressSummary workflowId={workflow.id} stepIds={workflow.steps.map((step) => step.id)} />
        <div className="detail-overview-grid mt-5 grid gap-5 lg:grid-cols-2">
          <Card variant="article" padding="lg">
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]"><Link2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />Why this order?</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{workflow.useCase}</p>
          </Card>
          <Card variant="article" padding="lg">
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]"><CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" aria-hidden />Expected outcome</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{workflow.outcome}</p>
          </Card>
        </div>
      </section>

      <section id="workflow-steps" className="relative mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-10 sm:px-6 lg:px-8">
        <div className="absolute bottom-8 left-[23px] top-8 hidden w-px bg-[var(--color-border-default)] sm:block" aria-hidden />
        <div className="space-y-4">
          {workflow.steps.map((step, index) => {
            const tool = step.toolId ? registry.getById(step.toolId) : null;
            const href = appendWorkflowContext(step.href, workflow.id);
            return (
              <article key={step.id} className="group relative grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary-border)] sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-6">
                <span className="relative z-10 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] font-mono text-sm font-black text-[var(--color-primary-text)] shadow-[0_0_0_6px_var(--color-page-bg)]">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="soft">{tool?.layoutType?.replace(/-/g, " ") ?? "Explorer step"}</Badge>
                    {tool?.secondaryCategory?.[0] ? <Badge variant="outline">{tool.secondaryCategory[0]}</Badge> : null}
                    {step.handoff ? <Badge variant="accent">Data handoff</Badge> : null}
                  </div>
                  <h2 className="darma-balanced-heading mt-3 text-xl font-black tracking-[-0.025em] text-[var(--color-text-primary)] sm:text-2xl">{step.title}</h2>
                  <p className="darma-pretty-copy mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{step.description}</p>
                  {step.handoff ? (
                    <p className="darma-pretty-copy mt-3 max-w-3xl rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                      <span className="font-bold text-[var(--color-text-primary)]">Pass forward:</span> {step.handoff}
                    </p>
                  ) : null}
                </div>
                <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)] sm:justify-self-end">
                  Open step <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {related.length > 0 ? (
        <section id="related-workflows" className="mx-4 mb-16 max-w-[var(--container-wide)] scroll-mt-28 rounded-[var(--radius-xl)] sm:mx-6 lg:mx-auto border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)]">
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
