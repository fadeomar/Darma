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
        <h2 className="text-xl font-bold text-[var(--color-text)]">How to use the visual Grid Studio</h2>
        <p className="mt-3">
          Start from a preset or draw items directly across the canvas. In Select mode you can drag items between cells, use the resize handles to change their spans, or focus an item and use the Arrow keys for one-cell movement. Desktop, Tablet, and Mobile each have a real editable layout, so the responsive code reflects the placement you actually designed.
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
        <h2 className="text-xl font-bold text-[var(--color-text)]">Nested grids and CSS subgrid</h2>
        <p className="mt-3">
          A selected parent item can become its own nested grid. Each nested axis can use independent tracks or CSS <code>subgrid</code> to inherit the parent tracks. Nested children can be positioned from the controls or moved directly on the canvas, while Darma keeps their placement inside the valid inherited track range at responsive breakpoints.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Import and continue existing Grid CSS</h2>
        <p className="mt-3">
          Paste common CSS Grid declarations to reconstruct editable tracks, gaps, item placement, named areas, auto-placement settings, and supported max-width breakpoints. Dynamic expressions such as <code>auto-fit</code> and <code>auto-fill</code> remain valid raw CSS when their runtime track count cannot be represented as fixed editor cells.
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
          The CSS Grid Studio runs locally in your browser. Your working layout is autosaved in local browser storage, and share links encode the workspace in the URL instead of requiring an account or server-side project. The layout editor and generated code do not require an upload workflow.
        </p>
      </section>
    </div>
  );
}
