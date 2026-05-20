export default function Article() {
  return (
    <div className="space-y-4 text-sm leading-7 text-[var(--color-text-muted)]">
      <p>
        Write HTML, CSS, and JavaScript in the editor tabs and preview the result instantly in an isolated iframe. It is useful for testing snippets, UI ideas, animation prototypes, and small examples before moving them into a project.
      </p>
      <p>
        The preview iframe is sandboxed without same-origin access, so snippets cannot read the Darma app context. Runtime errors are reported below the preview to help you debug quickly.
      </p>
    </div>
  );
}
