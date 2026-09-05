export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">A browser-local front-end production studio</h2>
        <p>
          Keep HTML, CSS, and JavaScript in separate editors while viewing the combined result inside a sandboxed iframe. Start from a responsive preset, switch between desktop, tablet, and mobile canvases, and run changes automatically or with Ctrl/Command + Enter.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Save and reopen editable projects</h2>
        <p>
          Export a versioned Darma project file that preserves the three source files, selected viewport, and run mode. The same JSON can be imported later after schema, file-size, source-size, and tool-identity validation. Legacy version 1 project files remain supported.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Runtime feedback and production audit</h2>
        <p>
          Runtime exceptions and console messages appear beside the preview. The production audit separately reports blocking errors, warnings, informational environment notes, and passing checks for JavaScript syntax, CSS structure, duplicate IDs, form labels, image alternatives, unsafe links, inline handlers, credential-like values, source size, and external dependencies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Production handoff formats</h2>
        <p>
          Download a standalone HTML document, editable project JSON, Markdown audit, CSV metrics, or a seven-file ZIP containing external HTML, CSS, JavaScript, the reopenable project, audit report, metrics, and setup notes. All source processing stays in the browser.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Sandbox boundaries</h2>
        <p>
          Scripts and forms run without same-origin access to the Darma application. This is a front-end smoke-test environment, not a package bundler or backend runtime. Validate dependencies, CSP, accessibility, cross-browser behavior, APIs, and server integration in the target application before deployment.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Start from a complete interaction pattern</h2>
        <p>
          The preset library covers product and pricing cards, forms, dashboards, navigation, search filtering, progress steps, dialogs, toasts, FAQs, counters, and empty states. Each starter includes HTML, CSS, and JavaScript together so you can test a realistic pattern before replacing it with your own source.
        </p>
      </section>
    </div>
  );
}
