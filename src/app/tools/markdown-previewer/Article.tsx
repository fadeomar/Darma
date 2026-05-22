export default function MarkdownPreviewerArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What Markdown is used for</h2>
      <p>
        Markdown is a lightweight writing format for READMEs, documentation, changelogs, notes, tutorials, issue templates, and API examples. It keeps the source text readable while still converting into structured HTML for publishing.
      </p>

      <h2>Why live preview helps</h2>
      <p>
        A side-by-side preview makes editing faster because you can write on one side and immediately check headings, lists, links, tables, code blocks, and blockquotes on the other. This is especially useful when preparing GitHub READMEs, project docs, release notes, and internal guides.
      </p>

      <h2>Common syntax examples</h2>
      <ul>
        <li><code># Heading</code> creates a main heading.</li>
        <li><code>**bold**</code> and <code>*italic*</code> add emphasis.</li>
        <li><code>[label](https://example.com)</code> creates a link.</li>
        <li><code>- item</code> creates a bullet list.</li>
        <li><code>```js</code> starts a fenced code block.</li>
        <li>Tables use pipes and a separator row, such as <code>| Name | Type |</code>.</li>
      </ul>

      <h2>Privacy and security</h2>
      <p>
        Markdown is processed locally in your browser. The text is not uploaded to a server, and no server route is used. The generated preview is sanitized before rendering so pasted content cannot run unsafe scripts in the preview panel.
      </p>
    </article>
  );
}
