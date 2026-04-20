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
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-black tracking-tight text-[color:var(--textColor)] sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
