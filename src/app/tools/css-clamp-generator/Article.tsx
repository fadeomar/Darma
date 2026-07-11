export default function Article() {
  return (
    <div className="space-y-5 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">What CSS clamp() does</h2>
        <p>
          CSS <code>clamp(min, preferred, max)</code> lets one value scale fluidly while staying inside safe minimum and maximum limits. It is ideal for type, spacing, container widths, icons, and repeated design tokens.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Why this generator is useful</h2>
        <p>
          The math behind fluid values is easy to get wrong. This tool calculates the slope and intercept, previews the value across viewport sizes, warns about risky ranges, and exports code for CSS variables, Tailwind theme tokens, JSON tokens, and SCSS maps.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Recommended workflow</h2>
        <p>
          Start with a preset, adjust the minimum and maximum viewport widths, then test the preview at mobile, tablet, and desktop sizes. Use token scale mode when you need a consistent typography or spacing system rather than one isolated value.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Accessibility notes</h2>
        <p>
          Keep minimum font sizes readable, test zoom behavior, and avoid huge jumps between the min and max values. For spacing, make sure small screens do not lose critical content because of oversized padding.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Browser-only privacy</h2>
        <p>
          All calculations run locally in the browser. The tool does not upload your CSS values, token names, or generated snippets to a server.
        </p>
      </section>
    </div>
  );
}
