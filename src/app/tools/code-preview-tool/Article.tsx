export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">A focused front-end playground</h2>
        <p>
          The Code Preview Studio keeps HTML, CSS, and JavaScript in separate source panels while rendering the combined result inside a sandboxed iframe. Use a practical preset to start quickly, switch between desktop, tablet, and mobile previews, then run changes automatically or manually with Ctrl/Command + Enter.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Runtime feedback and production checks</h2>
        <p>
          Runtime errors and console messages are surfaced next to the preview instead of being hidden in browser developer tools. The production checklist also looks for common issues such as JavaScript syntax errors, unbalanced CSS braces, duplicate IDs, missing image alternatives, unsafe new-tab links, inline event handlers, and buttons without an explicit type.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Export formats</h2>
        <p>
          Copy or download a self-contained HTML document, export the editable project structure as JSON, or download a ZIP containing index.html, styles.css, script.js, and a Darma project manifest. All editing and preview execution stay in your browser; Darma does not upload your code.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Sandbox limitations</h2>
        <p>
          The preview permits scripts and forms but does not grant same-origin access to the Darma application. Features that require a backend, package installation, module bundling, cross-origin credentials, or unrestricted browser APIs should be tested in a full local development environment before production use.
        </p>
      </section>
    </div>
  );
}
