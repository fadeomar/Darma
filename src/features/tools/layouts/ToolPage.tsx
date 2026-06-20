import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";
import { Badge } from "@/components/ui";
import { RelatedToolsGrid } from "@/features/tools/components/RelatedToolsGrid";
import { RecentToolTracker } from "@/features/tools/components/RecentToolTracker";
import type { ToolDefinition } from "@/features/tools/domain/tool";
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

function privacyLabel(privacy?: ToolDefinition["privacy"]) {
  if (privacy === "client-only") return "Browser-only";
  if (privacy === "local-storage") return "Local storage";
  if (privacy === "server-assisted") return "Server assisted";
  if (privacy === "external-api") return "External API";
  return null;
}

function formatCategory(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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
  headerSize = "default",
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
  headerSize?: "default" | "compact";
}) {
  const pageTitle = title ?? tool?.title;
  const pageDescription = description ?? tool?.description;
  const relatedContent = related ?? (tool ? <RelatedToolsGrid tool={tool} /> : null);
  const privacy = privacyLabel(tool?.privacy);
  const primaryCategory = tool?.mainCategory?.[0] ?? tool?.secondaryCategory?.[0];

  return (
    <div className={cn("mx-auto px-4 py-7 sm:px-6 sm:py-9 lg:px-8", maxWidthClass[maxWidth])}>
      {tool ? <RecentToolTracker id={tool.id} title={tool.title} href={tool.href} /> : null}
      <header
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-5 py-5 shadow-[var(--shadow-card)] sm:px-7 sm:py-7",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[var(--color-primary-border)]",
          headerSize === "compact" ? "lg:px-7 lg:py-6" : "lg:px-8 lg:py-8",
          headerAlign === "center" && "text-center",
        )}
      >
        <div
          className={cn(
            "relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end",
            headerAlign === "center" && "lg:grid-cols-1",
          )}
        >
          <div className={cn("min-w-0", headerAlign === "center" && "mx-auto max-w-4xl")}>
            <Link
              href="/tools"
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-text-primary)] focus:outline-none focus:shadow-[var(--focus-ring)]",
                headerAlign === "center" && "mx-auto",
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to tools
            </Link>

            <div className={cn("mt-4 flex flex-wrap gap-2", headerAlign === "center" && "justify-center")}>
              {eyebrow ? <Badge variant="soft">{eyebrow}</Badge> : null}
              {privacy ? <Badge variant="accent">{privacy}</Badge> : null}
              {primaryCategory ? <Badge variant="outline">{formatCategory(primaryCategory)}</Badge> : null}
            </div>

            {pageTitle ? (
              <h1
                className={cn(
                  "mt-4 max-w-5xl font-black leading-[var(--leading-tight)] tracking-[-0.04em] text-[var(--color-text-primary)]",
                  headerSize === "compact" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl",
                  headerAlign === "center" && "mx-auto",
                )}
              >
                {pageTitle}
              </h1>
            ) : null}

            {pageDescription ? (
              <p
                className={cn(
                  "mt-3 max-w-3xl leading-7 text-[var(--color-text-secondary)]",
                  headerSize === "compact" ? "text-sm sm:text-base" : "text-base sm:text-lg",
                  headerAlign === "center" && "mx-auto",
                )}
              >
                {pageDescription}
              </p>
            ) : null}

            {intro ? <div className={headerSize === "compact" ? "mt-4" : "mt-5"}>{intro}</div> : null}
          </div>

          {headerAlign !== "center" ? (
            <aside className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-4 shadow-[inset_0_1px_0_var(--color-border-subtle)]">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Tool profile</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(tool?.audiences ?? []).map((audience) => (
                  <Badge key={audience} variant="outline">
                    {audienceLabels[audience] ?? audience}
                  </Badge>
                ))}
                {(tool?.secondaryCategory ?? []).slice(0, 3).map((category) => (
                  <Badge key={category} variant="outline">
                    {formatCategory(category)}
                  </Badge>
                ))}
              </div>
              {tool?.tags?.length ? (
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
                  {tool.tags.slice(0, 5).map((tag) => `#${tag}`).join("  ")}
                </p>
              ) : null}
            </aside>
          ) : null}
        </div>
      </header>

      <main className="mt-7 sm:mt-8">{children}</main>
      {article ? <div className="mt-8">{article}</div> : null}
      {relatedContent ? <div className="mt-8">{relatedContent}</div> : null}
    </div>
  );
}
