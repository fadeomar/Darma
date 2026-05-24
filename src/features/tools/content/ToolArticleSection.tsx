export function ToolArticleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-black text-[var(--color-text)]">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-[var(--color-text-muted)]">{children}</div>
    </section>
  );
}
