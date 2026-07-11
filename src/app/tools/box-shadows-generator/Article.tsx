export default function Article() {
  return (
    <div className="space-y-5 text-sm leading-7 text-[var(--color-text-secondary)]">
      <p>
        CSS <code>box-shadow</code> is best used as a reusable elevation token, not as a one-off decorative value. Keep common app shadows subtle, layered, and consistent across cards, menus, modals, and buttons.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Soft UI", text: "Use low opacity and medium blur for cards and panels." },
          { title: "Hero visuals", text: "Large blur can work well on marketing cards and mockups." },
          { title: "Performance", text: "Avoid many heavy shadows on repeated lists or tables." },
        ].map((item) => (
          <div key={item.title} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">{item.text}</p>
          </div>
        ))}
      </div>
      <p>
        For production systems, export the shadow as a CSS variable, Tailwind token, or design-token JSON so the same elevation style can be reused instead of manually copied across components.
      </p>
    </div>
  );
}
