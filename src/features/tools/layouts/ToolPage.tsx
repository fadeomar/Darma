import Link from "next/link";
import { type ReactNode } from "react";
import { Badge } from "@/components/ui";
import { RelatedToolsGrid } from "@/features/tools/components/RelatedToolsGrid";
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

  return (
    <div className={cn("mx-auto px-4 py-8 sm:px-6 lg:px-8", maxWidthClass[maxWidth])}>
      <header
        className={cn(
          "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] backdrop-blur",
          headerSize === "compact" ? "p-4 sm:p-5" : "p-6 sm:p-8",
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
          <h1
            className={cn(
              "mt-4 font-black leading-[var(--leading-tight)] text-[var(--color-text)]",
              headerSize === "compact" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
            )}
          >
            {pageTitle}
          </h1>
        ) : null}
        {pageDescription ? (
          <p
            className={cn(
              "mt-3 max-w-3xl leading-7 text-[var(--color-text-muted)]",
              headerSize === "compact" ? "text-sm sm:text-base" : "text-base sm:text-lg",
              headerAlign === "center" && "mx-auto",
            )}
          >
            {pageDescription}
          </p>
        ) : null}
        {intro ? <div className={headerSize === "compact" ? "mt-4" : "mt-6"}>{intro}</div> : null}
      </header>

      <div className="mt-8">{children}</div>
      {article ? <div className="mt-8">{article}</div> : null}
      {relatedContent ? <div className="mt-8">{relatedContent}</div> : null}
    </div>
  );
}
