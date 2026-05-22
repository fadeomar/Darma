export default function UuidGeneratorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-slate-700 dark:text-slate-300">
      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          What is a UUID?
        </h2>
        <p>
          A UUID, or Universally Unique Identifier, is a 128-bit identifier commonly
          written as five groups of hexadecimal characters separated by hyphens.
          Developers use UUIDs when they need IDs that can be generated independently
          without asking a central server for the next number.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          What is a v4 UUID?
        </h2>
        <p>
          A v4 UUID is random rather than time-based or name-based. This tool uses
          the browser-native <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">crypto.randomUUID()</code>
          API, which creates v4 UUIDs using a cryptographically secure random number
          generator when the browser supports it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Common uses
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Mock API responses and frontend fixtures.</li>
          <li>Database rows, seed data, and local development records.</li>
          <li>Distributed systems where multiple clients need to create IDs.</li>
          <li>Temporary object IDs in tests, demos, and prototypes.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Privacy and security notes
        </h2>
        <p>
          Generation happens locally in your browser. UUIDs are never uploaded to a
          Darma server. Treat UUIDs as identifiers, not secrets: they are useful for
          uniqueness, but they should not be used as passwords, API keys, session
          tokens, or authorization credentials.
        </p>
      </section>
    </div>
  );
}
