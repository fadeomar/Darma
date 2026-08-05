import Link from "next/link";
import { ArrowLeft, ChevronDown, SlidersHorizontal } from "lucide-react";
import { type ReactNode } from "react";
import { Badge } from "@/components/ui";
import { FavoriteToolButton } from "@/features/tools/components/FavoriteToolButton";
import { RelatedToolsGrid } from "@/features/tools/components/RelatedToolsGrid";
import { RecentToolTracker } from "@/features/tools/components/RecentToolTracker";
import { ToolWorkflowNavigator } from "@/features/tools/workflows/components";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { audienceLabel, formatCategory, resolveToolProfile } from "./toolProfile";
import { cn } from "@/lib/cn";

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
  headerSize = "compact",
  showToolProfile = false,
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
  showToolProfile?: boolean;
}) {
  const pageTitle = title ?? tool?.title;
  const pageDescription = description ?? tool?.description;
  const relatedContent = related ?? (tool ? <RelatedToolsGrid tool={tool} /> : null);
  const privacy = privacyLabel(tool?.privacy);
  const primaryCategory = tool?.mainCategory?.[0] ?? tool?.secondaryCategory?.[0];
  const profile = resolveToolProfile(tool);
  const showProfile = showToolProfile && headerAlign !== "center" && profile.hasMeaningfulContent;

  return (
    <div className={cn("mx-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8", maxWidthClass[maxWidth])}>
      {tool ? <RecentToolTracker id={tool.id} title={tool.title} href={tool.href} /> : null}

      <header
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-5 py-5 shadow-[var(--shadow-card)] sm:px-6 sm:py-6",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[var(--color-primary-border)]",
          headerSize === "default" && "lg:px-8 lg:py-7",
          headerAlign === "center" && "text-center",
        )}
      >
        <div className={cn("relative min-w-0", headerAlign === "center" && "mx-auto max-w-4xl")}>
          <div className={cn("flex flex-wrap items-center gap-2", headerAlign === "center" && "justify-center")}>
            <Link
              href="/tools"
              className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-text-primary)] focus:outline-none focus:shadow-[var(--focus-ring)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Tools
            </Link>
            {eyebrow ? <Badge variant="soft">{eyebrow}</Badge> : null}
            {privacy ? <Badge variant="accent">{privacy}</Badge> : null}
            {primaryCategory ? <Badge variant="outline">{formatCategory(primaryCategory)}</Badge> : null}
            {tool ? <FavoriteToolButton toolId={tool.id} toolTitle={tool.title} /> : null}
            <a
              href="#tool-workspace"
              className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 text-xs font-bold text-[var(--color-primary-text-strong)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-active)] focus:outline-none focus:shadow-[var(--focus-ring)]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Workspace
            </a>
          </div>

          {pageTitle ? (
            <h1
              className={cn(
                "mt-4 max-w-5xl text-balance font-black leading-[1.03] tracking-[-0.045em] text-[var(--color-text-primary)]",
                headerSize === "compact" ? "text-3xl sm:text-4xl lg:text-5xl" : "text-4xl sm:text-5xl lg:text-6xl",
                headerAlign === "center" && "mx-auto",
              )}
            >
              {pageTitle}
            </h1>
          ) : null}

          {pageDescription ? (
            <p
              className={cn(
                "mt-3 max-w-4xl text-pretty text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7",
                headerAlign === "center" && "mx-auto",
              )}
            >
              {pageDescription}
            </p>
          ) : null}

          {intro ? <div className="mt-4 max-w-4xl">{intro}</div> : null}

          {showProfile ? (
            <details className="group mt-4 max-w-4xl rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/68">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3.5 text-xs font-bold text-[var(--color-text-secondary)] outline-none transition hover:bg-[var(--color-control-hover)] focus-visible:shadow-[var(--focus-ring)] [&::-webkit-details-marker]:hidden">
                <span>Audience, categories, and tags</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />
              </summary>
              <div className="border-t border-[var(--color-border-subtle)] px-3.5 py-3">
                {profile.audiences.length || profile.categories.length ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.audiences.map((audience) => (
                      <Badge key={audience} variant="outline">
                        {audienceLabel(audience)}
                      </Badge>
                    ))}
                    {profile.categories.map((category) => (
                      <Badge key={category} variant="outline">
                        {formatCategory(category)}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {profile.tags.length ? (
                  <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
                    {profile.tags.map((tag) => `#${tag}`).join("  ")}
                  </p>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </header>

      {tool ? <ToolWorkflowNavigator toolId={tool.id} /> : null}

      <main
        id="tool-workspace"
        data-tool-workspace
        data-tool-layout={tool?.layoutType ?? "custom"}
        data-tool-id={tool?.id}
        className="mt-5 scroll-mt-28 sm:mt-6"
      >
        {children}
      </main>
      {article ? <div className="mt-8">{article}</div> : null}
      {relatedContent ? <div className="mt-8">{relatedContent}</div> : null}
    </div>
  );
}
