const useCases = [
  {
    title: "Cards & panels",
    text: "Keep everyday surfaces subtle: low opacity, moderate blur, and often two light layers instead of one heavy shadow.",
  },
  {
    title: "Dropdowns & popovers",
    text: "Use compact vertical lift and a controlled blur so overlays separate from nearby content without looking detached.",
  },
  {
    title: "Modals & sheets",
    text: "A wider, softer shadow can support stronger elevation because the component sits above the rest of the interface.",
  },
  {
    title: "Buttons & focus",
    text: "Use small shadows for hover elevation, inset shadows for pressed states, and colored zero-offset spread for focus rings or glows.",
  },
  {
    title: "Forms",
    text: "Inset shadows can suggest recessed inputs, but keep them restrained so borders, labels, and focus states remain readable.",
  },
  {
    title: "Hero visuals",
    text: "Large blur and wider paint areas work well for one-off mockups or product imagery, but are usually too expensive for long repeated lists.",
  },
];

const anatomy = [
  ["X / Y offset", "Moves the shadow. Small positive Y values are the most common UI starting point."],
  ["Blur", "Controls softness. Higher blur creates a larger, more distant-feeling shadow."],
  ["Spread", "Expands or contracts the shadow before blur. Negative spread helps keep layered shadows tight."],
  ["Opacity", "Usually matters more than darkness. Lower opacity keeps modern interface shadows from feeling muddy."],
  ["Inset", "Draws the shadow inside the element for pressed, recessed, or field-like surfaces."],
  ["Multiple layers", "Combines a small crisp contact shadow with a wider soft shadow for more natural depth."],
];

export default function Article() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <div className="space-y-3">
        <p>
          CSS <code>box-shadow</code> is most useful when you choose a shadow for the component you are building, then tune it - not when you start from four empty numeric controls. The preset library above is intentionally broad so cards, menus, modals, buttons, forms, marketing visuals, and special styles all have a practical starting point.
        </p>
        <p>
          Similar examples are kept on purpose. Two shadows can be numerically close but still represent different product decisions, such as a dashboard card versus a dropdown or a pricing card.
        </p>
      </div>

      <section>
        <h2 className="text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Choose by use case</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{item.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What each control changes</h2>
        <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {anatomy.map(([title, text]) => (
            <div key={title} className="border-l-2 border-[var(--color-border-strong)] pl-3">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
              <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-tertiary)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Production rule of thumb</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
          Reuse common elevations as design tokens. Keep repeated list and table shadows lightweight, reserve very large blur for isolated hero surfaces, and test inset or colored shadows against the real background they will ship on.
        </p>
      </div>

      <p>
        When the result is ready, export it as a CSS declaration, CSS variable, Tailwind extension, React style object, or token JSON so the same elevation can be reused consistently across the product.
      </p>
    </div>
  );
}
