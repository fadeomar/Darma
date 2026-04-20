import { ReactNode } from "react";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <section className="rounded-[32px] border border-black/10 bg-white/70 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] sm:p-8">
      {eyebrow ? <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[var(--textColor)]/60">{eyebrow}</p> : null}
      <h1 className="max-w-4xl text-4xl font-black tracking-tight text-[var(--textColor)] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--textColor)]/75 sm:text-lg">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
