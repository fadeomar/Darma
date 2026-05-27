import Link from "next/link";
import type { ReactNode } from "react";

export default function ScreenToolCard({
  href,
  title,
  description,
  children,
}: {
  href: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-md)]"
    >
      <div className="mb-4 h-32 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-preview-border)] bg-[var(--color-preview-bg-strong)]">
        {children}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
        {description}
      </p>
    </Link>
  );
}
