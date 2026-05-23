export default function Article() {
  return (
    <div className="space-y-5 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">What CSS clamp() means</h2>
        <p>
          CSS <code>clamp(min, preferred, max)</code> lets a value grow fluidly between a minimum and maximum boundary. The browser uses the preferred expression when it fits, but never goes below the minimum or above the maximum.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Why use fluid typography?</h2>
        <p>
          Fluid typography avoids sudden jumps between breakpoints. Instead of setting one font size for mobile and another for desktop, you can scale text smoothly from a small viewport to a large viewport.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Viewport and value ranges</h2>
        <p>
          The minimum viewport is where scaling starts, and the maximum viewport is where scaling stops. The minimum and maximum values define the actual CSS size at those boundaries. For example, a heading can scale from <code>2rem</code> at <code>320px</code> to <code>5rem</code> at <code>1280px</code>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Accessibility notes</h2>
        <p>
          Test generated typography on small screens, large screens, and browser zoom. Avoid tiny minimum font sizes, keep line-height readable, and make sure text remains usable when users increase zoom or font settings.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black text-[var(--color-text)]">Browser-only privacy</h2>
        <p>
          This generator runs locally in your browser. It does not need a server route and does not upload your CSS values or tokens.
        </p>
      </section>
    </div>
  );
}
