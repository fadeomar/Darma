export type ToolFaqItem = { question: string; answer: React.ReactNode };

export function ToolFaq({ items }: { items: ToolFaqItem[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-[var(--color-text)]">FAQ</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.question}>
            <h3 className="font-bold text-[var(--color-text)]">{item.question}</h3>
            <div className="mt-1 text-sm leading-7 text-[var(--color-text-muted)]">{item.answer}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
