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
    <article
      className={cn(
        "mx-auto max-w-4xl rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 text-sm leading-7 text-[var(--color-text-secondary)] shadow-[var(--shadow-card)] sm:p-7",
        "[&_a]:font-semibold [&_a]:text-[var(--color-primary)] [&_a:hover]:text-[var(--color-primary-hover)]",
        "[&_code]:rounded-[var(--radius-xs)] [&_code]:border [&_code]:border-[var(--color-code-border)] [&_code]:bg-[var(--color-code-bg)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[var(--color-code-text)]",
        "[&_pre]:overflow-auto [&_pre]:rounded-[var(--radius-md)] [&_pre]:border [&_pre]:border-[var(--color-code-border)] [&_pre]:bg-[var(--color-code-bg)] [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-6 [&_pre]:text-[var(--color-code-text)]",
        className,
      )}
    >
      <div className="space-y-6">{children}</div>
    </article>
  );
}

function ToolArticleSection({ title, children, className }: ToolArticleSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export const ToolArticle = Object.assign(ToolArticleRoot, { Section: ToolArticleSection });
export { ToolArticleSection };
