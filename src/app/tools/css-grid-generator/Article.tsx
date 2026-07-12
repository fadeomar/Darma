export default function CssGridGeneratorArticle() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-muted)]">
      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">What is CSS Grid?</h2>
        <p className="mt-3">
          CSS Grid is a two-dimensional layout system for arranging content across rows and columns. It is ideal for dashboards, galleries,
          bento layouts, landing page sections, app shells, pricing sections, and any interface where horizontal and vertical placement both matter.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">When to use Grid instead of Flexbox</h2>
        <p className="mt-3">
          Use CSS Grid when you need control over rows and columns at the same time. Use Flexbox when the layout is mostly one-dimensional,
          such as a navigation row, a button group, or aligning items inside a card. Many production interfaces use both: Grid for the main
          structure and Flexbox for small alignment details inside each grid item.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Line placement vs named template areas</h2>
        <p className="mt-3">
          Line placement uses values like <code>grid-column: 1 / 3</code> and is useful for precise component layouts. Named template areas
          use readable labels such as <code>header</code>, <code>sidebar</code>, and <code>main</code>, which makes larger page layouts easier
          to scan and maintain. The generator supports both output modes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Production-safe track templates</h2>
        <p className="mt-3">
          A reliable pattern for equal columns is <code>repeat(3, minmax(0, 1fr))</code>. The <code>minmax(0, 1fr)</code> pattern helps columns shrink
          without causing unexpected overflow. Use fixed tracks like <code>240px</code> for sidebars only when you also provide a responsive fallback.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Responsive CSS Grid tips</h2>
        <p className="mt-3">
          Always preview layouts at mobile widths. A strong desktop grid can become cramped on small screens, so it is common to switch to fewer
          columns or stack items below a mobile breakpoint. For content-heavy cards, simple mobile stacking is usually more readable than preserving
          the desktop placement.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Export options</h2>
        <p className="mt-3">
          The generated output includes regular CSS, CSS custom properties, HTML, React JSX, a Tailwind starter, design tokens, and a readable area map.
          Use CSS for exact results, Tailwind as a starter, and tokens when you want to document the layout inside a design system.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Privacy note</h2>
        <p className="mt-3">
          The CSS Grid Generator runs locally in your browser. The layout you design, item names, and generated code are not sent to a server.
        </p>
      </section>
    </div>
  );
}
