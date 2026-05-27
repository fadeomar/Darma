export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is URL encoding?
        </h2>
        <p>
          URL encoding, also called percent encoding, converts spaces, Unicode
          text, emojis, and reserved characters into a format that can travel
          safely inside a URL. For example, a space often becomes{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            %20
          </code>
          . Encoding is formatting for URLs, not encryption and not security.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          URL encoding vs URL decoding
        </h2>
        <p>
          Encoding changes readable text into URL-safe text. Decoding changes
          percent-encoded text back into readable text. Developers commonly use
          this when building links, API requests, redirect URLs, search pages,
          UTM campaigns, and query strings.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Full URL vs URL component
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Full URL
            </h3>
            <p className="mt-1 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Use full URL mode when you want to keep URL structure characters
              such as <code className="font-mono text-xs">:</code>,{" "}
              <code className="font-mono text-xs">/</code>,{" "}
              <code className="font-mono text-xs">?</code>, and{" "}
              <code className="font-mono text-xs">&</code> readable while
              encoding unsafe characters like spaces and Unicode text.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              URL component / query value
            </h3>
            <p className="mt-1 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Use component mode for a single query parameter value, path
              segment, or piece of text that will be inserted into a larger URL.
              This mode encodes reserved characters more aggressively, which is
              usually what you want for values like search terms or redirect
              URLs.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          When to use encodeURIComponent
        </h2>
        <p>
          Use component encoding when a value sits after an equals sign in a
          query string. For example, encode the value in{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            ?q=hello world & Darma tools
          </code>{" "}
          before placing it into a URL. This prevents characters like ampersands
          from accidentally splitting your query into extra parameters.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Query parameter examples
        </h2>
        <p>
          A query string like{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            name=Darma&amp;tool=url%20encoder
          </code>{" "}
          has two parameters: <strong>name</strong> with the value{" "}
          <strong>Darma</strong>, and <strong>tool</strong> with the decoded
          value <strong>url encoder</strong>. The inspector in this tool helps
          you quickly read those key/value pairs.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common URL encoding mistakes
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
          <li>Using full URL encoding for a query value that contains ampersands.</li>
          <li>Decoding malformed text such as <code className="font-mono text-xs">%ZZ</code>.</li>
          <li>Thinking URL encoding hides private data. It does not.</li>
          <li>Replacing every plus sign with a space outside query-string parsing.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy note
        </h2>
        <p>
          Conversion happens entirely in your browser using built-in JavaScript
          URL APIs. Your input is not uploaded to a server. Still, be careful
          with sensitive tokens in URLs because encoded data can be decoded by
          anyone who can see the link.
        </p>
      </section>
    </div>
  );
}
