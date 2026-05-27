import type { ReactNode } from "react";

export default function PageSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)] sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
