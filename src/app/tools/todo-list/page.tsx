import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools/registry";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("todo-list");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const TodoListToolClient = dynamic(() => import("./TodoListToolClient"), {
  loading: () => (
    <div className="h-[560px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function TodoListPage() {
  const tool = getToolRegistry().getById("todo-list");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      eyebrow="Productivity workspace"
      headerSize="compact"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          A fast, private to-do workspace — capture tasks in seconds, organize them into lists, and
          work them as a checklist or a Kanban board. Everything is saved offline in your browser.
        </p>
      }
      article={
        <ToolContentCard title="About Darma Tasks">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TodoListToolClient />
    </ToolPage>
  );
}
