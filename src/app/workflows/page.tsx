import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Layers3 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";
import { getWorkflowToolIds, toolWorkflows } from "@/features/tools/workflows";

export const metadata: Metadata = {
  title: "Connected Tool Workflows | Darma",
  description: "Complete practical design, frontend, image, content, launch, and debugging tasks through connected Darma browser tools.",
  alternates: { canonical: "/workflows" },
};

export default function WorkflowsPage() {
  const registry = getToolRegistry();

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <Card padding="lg" className="overflow-hidden">
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Connected workflows</Badge>
          <Badge variant="outline">Browser-local progress</Badge>
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">
          Finish a real task, not just one tool
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
          Each workflow keeps its context while you move between tools, shows the current step inside every participating tool, and stores progress only in your browser. Color and Explorer workflows also pass useful working data forward instead of making you copy everything manually.
        </p>
      </Card>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {toolWorkflows.map((workflow) => {
          const toolCount = getWorkflowToolIds(workflow)
            .map((id) => registry.getById(id))
            .filter((tool) => tool?.visibility === "public").length;

          return (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`} className="block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
              <Card as="article" variant="interactive" padding="lg" className="flex h-full flex-col">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline"><Layers3 className="mr-1 h-3 w-3" aria-hidden />{workflow.steps.length} steps</Badge>
                  <Badge variant="soft">{toolCount} tools</Badge>
                  {workflow.estimatedTime ? <Badge variant="outline"><Clock3 className="mr-1 h-3 w-3" aria-hidden />{workflow.estimatedTime}</Badge> : null}
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{workflow.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{workflow.description}</p>
                <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Result</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-[var(--color-text-secondary)]">{workflow.outcome}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(workflow.audience ?? []).slice(0, 3).map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
                </div>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--color-primary-text-strong)]">
                  Open workflow <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Card>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
