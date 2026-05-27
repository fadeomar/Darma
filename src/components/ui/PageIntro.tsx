import { ReactNode } from "react";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {eyebrow ? <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">{eyebrow}</p> : null}
      <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div> : null}
    </section>
  );
}
