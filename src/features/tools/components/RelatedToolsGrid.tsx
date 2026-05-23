import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { resolveRelatedTools, type ResolvedRelatedTool } from "@/features/tools/related/resolveRelatedTools";

function RelatedCard({ item }: { item: ResolvedRelatedTool }) {
  return (
    <Link href={item.tool.href} className="block h-full">
      <Card as="article" variant="interactive" padding="md" className="h-full">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="soft">{item.reasonLabel}</Badge>
          {item.tool.mainCategory?.[0] ? <Badge variant="outline">{item.tool.mainCategory[0]}</Badge> : null}
        </div>
        <h3 className="text-lg font-black text-[var(--color-text)]">{item.tool.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">{item.tool.description}</p>
      </Card>
    </Link>
  );
}

export function RelatedToolsGrid({ tool, limit = 6, title = "Related tools", description = "Keep moving through nearby tools and practical next steps." }: { tool: ToolDefinition; limit?: number; title?: string; description?: string }) {
  const relatedTools = resolveRelatedTools(tool.id, { limit, includeReasons: true });
  if (!relatedTools.length) return null;

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="soft">Recommendations</Badge>
          <h2 className="mt-3 text-2xl font-black text-[var(--color-text)]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        </div>
        <Link href="/tools" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          View all tools
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {relatedTools.map((item) => <RelatedCard key={item.tool.id} item={item} />)}
      </div>
    </section>
  );
}
