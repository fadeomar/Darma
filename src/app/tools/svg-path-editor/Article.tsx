export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is an SVG path editor?
        </h2>
        <p>
          An SVG path editor lets you inspect and change the commands inside an SVG
          <code className="mx-1 rounded bg-[var(--color-surface-subtle)] px-1.5 py-0.5 font-mono">d</code>
          attribute. Darma parses the path locally, exposes target and control points,
          and keeps the generated vector available as clean path data, standalone SVG,
          a typed React component, a CSS mask, or a production ZIP.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Recommended production workflow
        </h2>
        <ol className="ml-5 list-decimal space-y-2">
          <li>Paste path data, paste complete SVG markup, or open a local SVG file.</li>
          <li>Use the canvas, command inspector, transforms, and practical presets to refine the shape.</li>
          <li>Fit the viewBox and confirm stroke, fill, and output precision.</li>
          <li>Review the severity-based checks for syntax, geometry, open fills, complexity, coordinates, and payload size.</li>
          <li>Copy the format you need or download the ZIP pack containing SVG, React, CSS, JSON, and a Markdown report.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Understanding path commands
        </h2>
        <p>
          SVG paths are built from commands such as <strong>M</strong> for move,
          <strong> L</strong> for line, <strong>C</strong> and <strong>Q</strong> for curves,
          <strong> A</strong> for arcs, and <strong>Z</strong> for closing a contour.
          Uppercase commands use absolute coordinates; lowercase commands are relative
          to the previous point. Relative data can be smaller, while absolute data is
          often easier to debug. The editor can convert the entire path either way.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          ViewBox, bounds, and fill checks
        </h2>
        <p>
          The viewBox defines the coordinate window used to render the path. “Fit to
          path” calculates practical approximate bounds from target and control points,
          then adds padding so the shape is visible quickly. Arc extrema can extend
          beyond control-point estimates, so visually confirm complex arc-heavy icons.
          When fill is enabled, close intended contours with <strong>Z</strong>; browsers
          implicitly close open filled subpaths, which can create surprising geometry.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy and attribution
        </h2>
        <p>
          Editing, file reading, validation, and export generation run in your browser.
          SVG files are not uploaded. The path engine is adapted from
          Yqnn/svg-path-editor under Apache-2.0; the project license and notice must stay
          with redistributed versions.
        </p>
      </section>
    </div>
  );
}
