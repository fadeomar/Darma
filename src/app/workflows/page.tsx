import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";
import { toolWorkflows } from "@/features/tools/workflows";

export const metadata: Metadata = {
  title: "Workflows | Darma Tools",
  description: "Curated Darma tool workflows for CSS styling, SEO launches, API debugging, branding, image prep, and developer utilities.",
  alternates: { canonical: "/workflows" },
};

export default function WorkflowsPage() {
  const registry = getToolRegistry();

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <Link href="/tools" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Back to tools</Link>
        <Badge variant="soft" className="mt-4">Workflows</Badge>
        <h1 className="mt-4 text-4xl font-black text-[var(--color-text)] sm:text-5xl">Get work done with connected Darma tools</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          Start with a practical journey, then move through the right browser tools in a useful order. Workflows are curated shortcuts for common design, development, SEO, and content tasks.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toolWorkflows.map((workflow) => {
          const tools = workflow.toolIds.map((id) => registry.getById(id)).filter((tool) => tool?.visibility === "public");
          return (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`} className="block h-full">
              <Card as="article" variant="interactive" padding="lg" className="h-full">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{tools.length} tools</Badge>
                  {(workflow.audience ?? []).slice(0, 2).map((item) => <Badge key={item} variant="soft">{item}</Badge>)}
                </div>
                <h2 className="mt-4 text-2xl font-black text-[var(--color-text)]">{workflow.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{workflow.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
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
