import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";
import type { ToolId } from "@/features/tools/domain/tool";

export function NextToolSuggestions({
  toolIds,
  title = "Continue with",
  description = "Useful next steps that stay in the Darma tools catalog.",
}: {
  toolIds: ToolId[];
  title?: string;
  description?: string;
}) {
  const registry = getToolRegistry();
  const tools = toolIds
    .map((id) => registry.getById(id))
    .filter((tool) => tool && tool.visibility === "public");

  if (!tools.length) return null;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)]">
      <Badge variant="soft">Next step</Badge>
      <h2 className="mt-3 text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      <div className="mt-4 grid gap-3">
        {tools.map((tool) => (
          <Link key={tool.id} href={tool.href} className="rounded-[var(--radius-md)] focus:outline-none focus:shadow-[var(--focus-ring)]">
            <Card as="article" variant="interactive" padding="sm" className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black text-[var(--color-text-primary)]">{tool.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{tool.shortDescription ?? tool.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden />
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
