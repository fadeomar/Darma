import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToolArticleProps = {
  children: ReactNode;
  className?: string;
};

export type ToolArticleSectionProps = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
};

function ToolArticleRoot({ children, className }: ToolArticleProps) {
  return (
    <article className={cn("mx-auto max-w-3xl space-y-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-text-muted)] shadow-sm", className)}>
      {children}
    </article>
  );
}

function ToolArticleSection({ title, children, className }: ToolArticleSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export const ToolArticle = Object.assign(ToolArticleRoot, { Section: ToolArticleSection });
export { ToolArticleSection };
