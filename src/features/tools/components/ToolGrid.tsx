import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { ToolDefinition } from "@/features/tools/domain/tool";

function formatCategory(category: string) {
  return category.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function privacyLabel(privacy?: ToolDefinition["privacy"]) {
  if (privacy === "client-only") return "Browser-only";
  if (privacy === "local-storage") return "Local storage";
  if (privacy === "server-assisted") return "Server assisted";
  if (privacy === "external-api") return "External API";
  return null;
}

export function ToolGrid({ tools }: { tools: ToolDefinition[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => {
        const category = tool.secondaryCategory?.[0] ?? tool.mainCategory?.[0];
        const privacy = privacyLabel(tool.privacy);

        return (
          <Link key={tool.id} href={tool.href} className="block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]">
            <Card as="article" variant="interactive" padding="md" className="flex h-full flex-col">
              <div className="mb-3 flex flex-wrap gap-2">
                {category ? <Badge variant="soft">{formatCategory(category)}</Badge> : null}
                {privacy ? <Badge variant="accent">{privacy}</Badge> : null}
              </div>
              <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{tool.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{tool.description}</p>
              <p className="mt-auto pt-5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Open tool →</p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
