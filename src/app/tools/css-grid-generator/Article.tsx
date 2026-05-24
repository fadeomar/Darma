export default function CssGridGeneratorArticle() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-muted)]">
      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">What is CSS Grid?</h2>
        <p className="mt-3">
          CSS Grid is a two-dimensional layout system for arranging content across rows and columns. It is especially useful for page shells,
          dashboards, galleries, bento layouts, pricing sections, and any interface where horizontal and vertical placement both matter.
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
        <h2 className="text-xl font-bold text-[var(--color-text)]">Columns, rows, gaps, and fr units</h2>
        <p className="mt-3">
          The <code>fr</code> unit shares available space between tracks. A common production-safe pattern is <code>minmax(0, 1fr)</code>,
          which lets columns shrink without causing unexpected overflow. Gaps are the spacing between grid tracks and are usually easier to
          maintain than adding margins to every child item.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Line placement vs named template areas</h2>
        <p className="mt-3">
          Line placement uses values like <code>grid-column: 1 / 3</code> and is powerful for precise component layouts. Named template areas
          use readable labels such as <code>header</code>, <code>sidebar</code>, and <code>main</code>, which can make large page layouts easier
          to understand and maintain. This generator supports both approaches.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Responsive CSS Grid tips</h2>
        <p className="mt-3">
          Always test layouts at mobile widths. A beautiful desktop grid can become cramped on small screens, so it is common to switch to
          fewer columns or stack items under a mobile breakpoint. For content-heavy cards, prefer simple mobile stacking unless the compact
          two-column version stays readable.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Common layouts you can build</h2>
        <p className="mt-3">
          Start from the presets to create dashboard cards, app shells, sidebars, galleries, marketing sections, pricing cards, and bento grids.
          Then adjust track templates, item placement, alignment, and responsive behavior until the generated code matches your project.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Privacy note</h2>
        <p className="mt-3">
          The CSS Grid Generator runs locally in your browser. The layout you design, item names, and generated code are not sent to a server.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">FAQ</h2>
        <div className="mt-3 space-y-4">
          <div>
            <h3 className="font-bold text-[var(--color-text)]">Can I use the output in React?</h3>
            <p>Yes. Copy the React JSX tab and pair it with the generated CSS tab.</p>
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text)]">Is the Tailwind output exact?</h3>
            <p>It is a starter. CSS Grid can use complex custom tracks and named areas that do not always map cleanly to simple utility classes.</p>
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text)]">Should I use template areas?</h3>
            <p>Use them when the layout represents named regions. For small card grids, line-based placement is often simpler.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
