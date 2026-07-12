import { Code2, MousePointerClick, ShieldCheck, SlidersHorizontal } from "lucide-react";

const cards = [
  {
    icon: SlidersHorizontal,
    title: "Start from production presets",
    description: "Use CTA, outline, glass, icon, loading, and soft UI presets, then tune only the details you need.",
  },
  {
    icon: MousePointerClick,
    title: "Preview interaction states",
    description: "Check default, hover, active, and disabled states before shipping a button into a real interface.",
  },
  {
    icon: ShieldCheck,
    title: "Review accessibility quickly",
    description: "Contrast, tap target size, focus-visible output, and reduced-motion guards are surfaced directly in the studio.",
  },
  {
    icon: Code2,
    title: "Export usable code",
    description: "Copy CSS, HTML, React JSX, React style objects, Tailwind starter snippets, CSS variables, or token JSON.",
  },
];

export default function ButtonCSSGeneratorArticle() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <div className="space-y-3">
        <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Design buttons that are ready to use, not just pretty in isolation.</h2>
        <p>
          The Buttons CSS Generator helps you build primary actions, secondary actions, icon buttons, loading buttons, and decorative marketing buttons with a live preview and copy-ready code. It is built for practical interface work: readable labels, predictable hover states, focus styles, and exports that fit common front-end workflows.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-xs)]">
              <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              <h3 className="mt-3 font-bold text-[var(--color-text-primary)]">{card.title}</h3>
              <p className="mt-1 text-xs leading-6 text-[var(--color-text-tertiary)]">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
        <h3 className="font-bold text-[var(--color-text-primary)]">Recommended workflow</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-6 text-[var(--color-text-tertiary)]">
          <li>Pick the closest preset so the base spacing, shape, and interaction already feel balanced.</li>
          <li>Adjust text, class name, colors, padding, radius, and shadow inside the compact control panel.</li>
          <li>Check the production metrics for contrast, tap target, paint cost, and fallback requirements.</li>
          <li>Copy CSS for quick use, or export tokens and variables when the button will become part of a design system.</li>
        </ol>
      </div>
    </div>
  );
}
