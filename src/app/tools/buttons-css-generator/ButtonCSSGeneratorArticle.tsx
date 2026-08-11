import { Code2, MousePointerClick, ShieldCheck, SlidersHorizontal } from "lucide-react";

const cards = [
  {
    icon: SlidersHorizontal,
    title: "Start from production presets",
    description: "Browse live CTA, gradient, glass, icon, loading, animated, and 3D examples, then load any one into the studio.",
  },
  {
    icon: MousePointerClick,
    title: "Test real interaction and device states",
    description: "Preview mouse, touch, and keyboard behavior across desktop, tablet, and mobile frames, then compare a frozen A baseline against your current B version.",
  },
  {
    icon: ShieldCheck,
    title: "Review accessibility quickly",
    description: "Contrast, touch height, focus-visible output, and reduced-motion guards are surfaced directly in the studio.",
  },
  {
    icon: Code2,
    title: "Generate reusable button systems",
    description: "Turn one button into semantic roles, generate a dark-theme companion, import existing CSS, share the configuration, then export reusable CSS/HTML plus framework starter snippets.",
  },
];

export default function ButtonCSSGeneratorArticle() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <div className="space-y-3">
        <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Design buttons that are ready to use, not just pretty in isolation.</h2>
        <p>
          The CSS Button Generator combines a curated live gallery with a visual Button Studio. Start from a polished example or from scratch, save favorites locally, then tune shape, typography, gradients, borders, shadows, icons, motion, and production states while the preview stays interactive. Desktop, tablet, and mobile frames plus mouse, touch, and keyboard simulation help you test the component beyond a static canvas, while undo, redo, and A/B comparison make exploration safe. Versioned share links, CSS import, searchable icons, mobile-only full-width rules, Learn mode, Inspect mode, keyboard undo/redo, and scoped custom overrides make the same workspace useful for handoff, learning, and reverse-engineering existing buttons.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-xs)]">
              <Icon className="h-5 w-5 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h3 className="mt-3 font-bold text-[var(--color-text-primary)]">{card.title}</h3>
              <p className="mt-1 text-xs leading-6 text-[var(--color-text-tertiary)]">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
        <h3 className="font-bold text-[var(--color-text-primary)]">Recommended workflow</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-6 text-[var(--color-text-tertiary)]">
          <li>Browse the live examples and pick the closest visual direction before opening the detailed controls.</li>
          <li>Adjust content, style, size, colors, border, shadow, and interaction using progressive controls instead of a long property wall.</li>
          <li>Design hover, active, and focus behavior independently, then test all states across light, dark, gradient, or custom surfaces and real UI contexts.</li>
          <li>Use device and input simulation, reduced-motion preview, or A/B compare before committing to the final interaction.</li>
          <li>Generate a semantic button family or automatic light/dark pair when the design needs to scale beyond one isolated control.</li>
          <li>Import an existing CSS button when you already have code, or use Learn and Inspect modes to understand what the current controls generate.</li>
          <li>Share the current configuration with a versioned URL, choose responsive mobile width when the CTA should stack on small screens, copy CSS for quick use, or export family/theme code, tokens, and variables when the button will become part of a design system.</li>
        </ol>
      </div>
    </div>
  );
}
