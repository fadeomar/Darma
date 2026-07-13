export default function MarkdownPreviewerArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Preview Markdown before it reaches production</h2>
      <p>
        Markdown is used for repository READMEs, API references, release notes, runbooks, meeting notes, tutorials, and long-form content. A useful previewer should do more than convert headings and lists: it should make the document structure visible, surface publishing risks, and produce files that can be used outside the editor.
      </p>

      <h2>A practical editing workflow</h2>
      <ol>
        <li>Start with a preset or open an existing Markdown or text file.</li>
        <li>Write with live preview enabled, or switch to manual mode for large edits.</li>
        <li>Review the document outline, link behavior, and production checks.</li>
        <li>Export the original Markdown, a standalone styled HTML page, or a JSON quality report.</li>
      </ol>

      <h2>What the production checks cover</h2>
      <p>
        The checks review the primary H1, heading hierarchy, duplicate section labels, fenced code blocks, code language labels, unsafe or placeholder links, image alt text, raw HTML, long lines, and overall editor size. These checks are practical heuristics rather than a replacement for a documentation review, but they catch common issues before publishing.
      </p>

      <h2>Sanitized and browser-local</h2>
      <p>
        The source is processed in your browser and is not sent to a Darma server. Preview HTML is sanitized before it is inserted into the page, unsafe link protocols are blocked, and raw HTML is displayed as text instead of being executed. The standalone HTML export uses the sanitized output and includes responsive document styling.
      </p>

      <h2>Supported Markdown features</h2>
      <ul>
        <li>H1 through H6 headings with unique anchor IDs.</li>
        <li>Bold, italic, strikethrough, inline code, links, and images.</li>
        <li>Ordered lists, bullet lists, and task list checkboxes.</li>
        <li>Blockquotes, horizontal rules, fenced code blocks, and tables.</li>
        <li>Optional GitHub-style single-line breaks and safe new-tab links.</li>
      </ul>
    </article>
  );
}
