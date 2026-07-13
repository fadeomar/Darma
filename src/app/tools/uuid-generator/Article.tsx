export default function UuidGeneratorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          UUID v4 versus UUID v7
        </h2>
        <p>
          UUIDs are 128-bit identifiers that can be created independently without a central sequence. UUID v4 fills the identifier with secure random data, while UUID v7 places a Unix-millisecond timestamp in the leading bits and keeps the remaining fields random. The time prefix makes v7 values friendlier to ordered indexes and chronological data pipelines.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Secure browser generation
        </h2>
        <p>
          Darma uses the Web Crypto API. UUID v4 uses <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-xs dark:bg-[var(--color-code-surface)]">crypto.randomUUID()</code> when available and securely falls back to <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-xs dark:bg-[var(--color-code-surface)]">crypto.getRandomValues()</code>. UUID v7 uses secure random bytes plus a monotonic sequence inside the same millisecond. The tool never falls back to <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-xs dark:bg-[var(--color-code-surface)]">Math.random()</code>.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Choosing a representation
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Use lowercase hyphenated UUIDs for the broadest validator and database compatibility.</li>
          <li>Use UUID v4 for opaque random identifiers and test fixtures.</li>
          <li>Use UUID v7 when time ordering and database index locality are useful.</li>
          <li>Use URN, uppercase, compact, or braced forms only when the receiving system expects them.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Validation and timestamp inspection
        </h2>
        <p>
          The inspector accepts canonical UUIDs, compact 32-character values, braced values, and <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-xs dark:bg-[var(--color-code-surface)]">urn:uuid:</code> identifiers. It reports the version and variant bits and decodes the embedded timestamp for UUID v7. A decoded timestamp is metadata, not proof of when an event occurred or who created it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Security and privacy notes
        </h2>
        <p>
          UUIDs provide practical uniqueness, not secrecy or authorization. Never use a UUID alone as a password, API key, session token, reset token, or access-control decision. Generation, inspection, and exports run locally in the browser and are not uploaded to Darma.
        </p>
      </section>
    </div>
  );
}
