export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          URL encoding is formatting, not encryption
        </h2>
        <p>
          Percent encoding converts spaces, Unicode text, and reserved
          characters into a representation that can safely travel inside a URL.
          It does not hide or protect the value. Anyone who can see an encoded
          URL can decode it, so credentials and tokens should not be placed in a
          query string merely because they are encoded.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Choose the correct encoding mode
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
            <h3 className="font-bold text-[var(--color-text-primary)]">Full URL</h3>
            <p className="mt-1 text-xs leading-6">
              Preserves structural separators such as <code>:</code>, <code>/</code>,
              <code>?</code>, and <code>&amp;</code>. Use it when the whole value is
              already a URL.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
            <h3 className="font-bold text-[var(--color-text-primary)]">Component</h3>
            <p className="mt-1 text-xs leading-6">
              Encodes reserved separators more aggressively. Use it for one path
              segment, query value, redirect URL, or any value inserted into a
              larger URL.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
            <h3 className="font-bold text-[var(--color-text-primary)]">Form value</h3>
            <p className="mt-1 text-xs leading-6">
              Uses application/x-www-form-urlencoded behavior, where spaces are
              represented by plus signs. This differs from ordinary component
              decoding, where a plus sign stays literal.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Query parameter behavior
        </h2>
        <p>
          Duplicate query keys are legal, but applications do not always resolve
          them in the same way. One framework may keep the first value, another
          may keep the last, and another may expose an array. The parameter
          editor preserves duplicates and highlights them so their intended
          behavior can be reviewed before deployment.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Double encoding and malformed escapes
        </h2>
        <p>
          A value such as <code>%252F</code> decodes once to <code>%2F</code> and
          only becomes a slash after a second decode. Accidental double decoding
          can change routes, validation results, and security boundaries. A lone
          percent sign or a sequence such as <code>%ZZ</code> is malformed and is
          rejected by strict URI decoding.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          URL safety checklist
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Do not embed usernames, passwords, session IDs, or API keys in URLs.</li>
          <li>Encode individual values before concatenating a query string.</li>
          <li>Review duplicate keys and nested redirect URLs carefully.</li>
          <li>Test long URLs across browsers, proxies, servers, and analytics tools.</li>
          <li>Remember that fragments remain visible to browser-side code and history.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Browser-local processing
        </h2>
        <p>
          Encoding, decoding, inspection, query editing, report generation, and
          ZIP creation run locally in the browser. The JSON audit report redacts
          detected credentials and sensitive query values, but the raw input and
          output files in an export pack still contain the values supplied by the
          user and should be handled accordingly.
        </p>
      </section>
    </div>
  );
}
