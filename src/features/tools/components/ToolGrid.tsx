import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { ToolDefinition } from "@/features/tools/domain/tool";

export function ToolGrid({ tools }: { tools: ToolDefinition[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <Link key={tool.id} href={tool.href} className="block h-full">
          <Card as="article" variant="interactive" padding="md" className="h-full">
            <div className="mb-3 flex flex-wrap gap-2">
              {tool.mainCategory?.[0] ? <Badge variant="soft">{tool.mainCategory[0]}</Badge> : null}
              {tool.privacy ? <Badge variant="outline">{tool.privacy === "client-only" ? "Browser-only" : tool.privacy}</Badge> : null}
            </div>
            <h3 className="text-lg font-black text-[var(--color-text)]">{tool.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{tool.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
