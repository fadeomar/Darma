import Link from "next/link";
import { type ReactNode } from "react";
import { Badge } from "@/components/ui";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { getToolRegistry } from "@/features/tools/registry";
import { cn } from "@/lib/cn";

const audienceLabels: Record<string, string> = {
  developer: "Developer",
  designer: "Designer",
  student: "Student",
  creator: "Creator",
  general: "General",
};

const maxWidthClass = {
  default: "max-w-[var(--container-page)]",
  wide: "max-w-[var(--container-wide)]",
  full: "max-w-none",
};

function RelatedToolsSection({ tool }: { tool: ToolDefinition }) {
  const relatedTools = (tool.relatedTools ?? [])
    .map((id) => getToolRegistry().getById(id))
    .filter((relatedTool): relatedTool is ToolDefinition => Boolean(relatedTool))
    .filter((relatedTool) => relatedTool.id !== tool.id && relatedTool.visibility === "public")
    .slice(0, 4);

  if (!relatedTools.length) return null;

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="soft">Related tools</Badge>
          <h2 className="mt-3 text-2xl font-black text-[var(--color-text)]">Keep working with nearby tools</h2>
        </div>
        <Link href="/tools" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          View all tools
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {relatedTools.map((relatedTool) => (
          <Link
            key={relatedTool.id}
            href={relatedTool.href}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 transition hover:border-[var(--color-accent)]"
          >
            <h3 className="font-bold text-[var(--color-text)]">{relatedTool.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{relatedTool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ToolPage({
  tool,
  title,
  description,
  eyebrow = "Darma tool",
  children,
  article,
  related,
  maxWidth = "default",
  headerAlign = "left",
  intro,
}: {
  tool?: ToolDefinition;
  title?: string;
  description?: string;
  eyebrow?: ReactNode;
  children: ReactNode;
  article?: ReactNode;
  related?: ReactNode;
  maxWidth?: keyof typeof maxWidthClass;
  headerAlign?: "left" | "center";
  intro?: ReactNode;
}) {
  const pageTitle = title ?? tool?.title;
  const pageDescription = description ?? tool?.description;

  return (
    <div className={cn("mx-auto px-4 py-8 sm:px-6 lg:px-8", maxWidthClass[maxWidth])}>
      <header
        className={cn(
          "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-8",
          headerAlign === "center" && "text-center",
        )}
      >
        <Link href="/tools" className="inline-flex text-sm font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]">
          Back to tools
        </Link>
        <div className={cn("mt-4 flex flex-wrap gap-2", headerAlign === "center" && "justify-center")}>
          {eyebrow ? <Badge variant="soft">{eyebrow}</Badge> : null}
          {(tool?.audiences ?? []).map((audience) => (
            <Badge key={audience} variant="outline">
              {audienceLabels[audience] ?? audience}
            </Badge>
          ))}
          {(tool?.secondaryCategory ?? []).map((category) => (
            <Badge key={category} variant="outline">
              {category}
            </Badge>
          ))}
        </div>
        {pageTitle ? (
          <h1 className="mt-4 text-4xl font-black leading-[var(--leading-tight)] text-[var(--color-text)] sm:text-5xl">
            {pageTitle}
          </h1>
        ) : null}
        {pageDescription ? (
          <p className={cn("mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg", headerAlign === "center" && "mx-auto")}>
            {pageDescription}
          </p>
        ) : null}
        {intro ? <div className="mt-6">{intro}</div> : null}
      </header>

      <div className="mt-8">{children}</div>
      {article ? <div className="mt-8">{article}</div> : null}
      {related ? <div className="mt-8">{related}</div> : tool ? <div className="mt-8"><RelatedToolsSection tool={tool} /></div> : null}
    </div>
  );
}
