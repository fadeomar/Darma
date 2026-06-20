import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";
import { toolWorkflows } from "@/features/tools/workflows";

export const metadata: Metadata = {
  title: "Tool Workflows | Darma Tools",
  description: "Guided Darma tool workflows for frontend CSS, SEO launches, JSON APIs, branding, image optimization, and developer utilities.",
};

export default function ToolWorkflowsPage() {
  const registry = getToolRegistry();
  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <Link href="/tools" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Back to tools</Link>
        <Badge variant="soft" className="mt-4">Workflows</Badge>
        <h1 className="mt-4 text-4xl font-black text-[var(--color-text)] sm:text-5xl">Darma tool workflows</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">Use Darma as a connected toolkit. Each workflow lists browser tools in a practical order for common design, development, SEO, and content tasks.</p>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toolWorkflows.map((workflow) => {
          const count = workflow.toolIds.map((id) => registry.getById(id)).filter(Boolean).length;
          return (
            <Link key={workflow.id} href={`/tools/workflows/${workflow.id}`} className="block h-full">
              <Card as="article" variant="interactive" padding="lg" className="h-full">
                <Badge variant="outline">{count} tools</Badge>
                <h2 className="mt-4 text-2xl font-black text-[var(--color-text)]">{workflow.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{workflow.description}</p>
                {workflow.steps?.length ? (
                  <ol className="mt-4 grid gap-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
                    {workflow.steps.slice(0, 4).map((step, index) => (
                      <li key={step}>
                        <span className="font-bold text-[var(--color-text)]">{index + 1}.</span> {step}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
