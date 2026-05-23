import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { ToolGrid } from "@/features/tools/components/ToolGrid";
import type { ToolCollectionKind } from "@/features/tools/collections";
import { buildCollectionJsonLd, collectionDescription, collectionTitle, slugifyCollectionValue } from "@/features/tools/collections";
import type { ToolDefinition } from "@/features/tools/domain/tool";

function unique(values: string[]) {
  return Array.from(new Set(values)).slice(0, 8);
}

export function ToolCollectionPage({ kind, slug, tools, allTools }: { kind: ToolCollectionKind; slug: string; tools: ToolDefinition[]; allTools: ToolDefinition[] }) {
  const relatedCategories = unique(
    tools.flatMap((tool) => [...(tool.mainCategory ?? []), ...(tool.secondaryCategory ?? [])]).filter((value) => slugifyCollectionValue(value) !== slug),
  );
  const jsonLd = buildCollectionJsonLd(kind, slug, tools);

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <Link href="/tools" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Back to tools</Link>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="soft">{kind}</Badge>
          <Badge variant="outline">{tools.length} tools</Badge>
        </div>
        <h1 className="mt-4 text-4xl font-black text-[var(--color-text)] sm:text-5xl">{collectionTitle(kind, slug)}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{collectionDescription(kind, slug, tools.length)}</p>
      </section>

      <section className="mt-8">
        <ToolGrid tools={tools} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card variant="article" padding="lg">
          <h2 className="text-2xl font-black text-[var(--color-text)]">How to use this collection</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
            Start with the tool that matches your immediate task, then follow the related-tools recommendations on each page. These collections are generated from registry metadata, so future Darma tools automatically appear here when their categories, audiences, or privacy settings match.
          </p>
        </Card>
        <Card variant="article" padding="lg">
          <h2 className="text-2xl font-black text-[var(--color-text)]">FAQ</h2>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--color-text-muted)]">
            <p><strong>Are these tools browser-only?</strong> Most Darma utilities run locally in the browser. Check the privacy badge on each tool card.</p>
            <p><strong>How are tools selected?</strong> This page uses registry metadata instead of a manually duplicated list.</p>
          </div>
        </Card>
      </section>

      {relatedCategories.length > 0 ? (
        <section className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-black text-[var(--color-text)]">Related categories</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedCategories.map((category) => (
              <Link key={category} href={`/tools/category/${slugifyCollectionValue(category)}`} className="rounded-[var(--radius-full)] border border-[var(--color-border)] px-3 py-1 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                {category}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
