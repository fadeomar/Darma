import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { resolveRelatedTools, type ResolvedRelatedTool } from "@/features/tools/related/resolveRelatedTools";

function formatCategory(category: string) {
  return category.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function RelatedCard({ item }: { item: ResolvedRelatedTool }) {
  const category = item.tool.secondaryCategory?.[0] ?? item.tool.mainCategory?.[0];

  return (
    <Link href={item.tool.href} className="block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
      <Card as="article" variant="interactive" padding="md" className="flex h-full flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="soft">{item.reasonLabel}</Badge>
          {category ? <Badge variant="outline">{formatCategory(category)}</Badge> : null}
        </div>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{item.tool.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{item.tool.description}</p>
        <p className="mt-auto pt-5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Open next →</p>
      </Card>
    </Link>
  );
}

export function RelatedToolsGrid({
  tool,
  limit = 6,
  title = "Related tools",
  description = "Keep moving through nearby tools and practical next steps.",
}: {
  tool: ToolDefinition;
  limit?: number;
  title?: string;
  description?: string;
}) {
  const relatedTools = resolveRelatedTools(tool.id, { limit, includeReasons: true });
  if (!relatedTools.length) return null;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-5">
        <div>
          <Badge variant="soft">Recommendations</Badge>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
        </div>
        <Link href="/tools" className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
          View all tools
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {relatedTools.map((item) => <RelatedCard key={item.tool.id} item={item} />)}
      </div>
    </section>
  );
}
