export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is a slug?
        </h2>
        <p>
          A slug is the readable part of a URL that identifies a page. Instead of
          long or cryptic links, a slug turns a title into a clean format like{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            /blog/how-to-build-a-json-formatter
          </code>
          . Slugs improve readability for people and help search engines
          understand your page topic.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Why clean URL slugs matter
        </h2>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Better SEO context
            </strong>{" "}
            — meaningful words in URLs can improve click trust and page relevance.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Easier sharing
            </strong>{" "}
            — short, readable links are simpler to copy and remember.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Cleaner CMS content
            </strong>{" "}
            — consistent slugs keep blog posts, products, and docs organized.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Fewer routing issues
            </strong>{" "}
            — removing unsafe characters prevents broken links and encoding quirks.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How to write good SEO slugs
        </h2>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>Use clear keywords that match page intent.</li>
          <li>Keep slugs concise and avoid filler words when possible.</li>
          <li>Use one separator style consistently (usually hyphen).</li>
          <li>Avoid punctuation, emoji, and duplicate separators.</li>
          <li>Do not change published slugs unless you also add redirects.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Slug examples
        </h2>
        <div className="space-y-3">
          {[
            ["How to Build a JSON Formatter", "how-to-build-a-json-formatter"],
            ["React + Next.js Guide 2026!", "react-next-js-guide-2026"],
            ["أفضل أدوات المطورين", "أفضل-أدوات-المطورين"],
            ["Café Déjà Vu & Crème Brûlée", "cafe-deja-vu-creme-brulee"],
          ].map(([from, to]) => (
            <div
              key={from}
              className="rounded-xl border border-black/8 bg-[var(--color-surface-subtle)] p-3 dark:border-white/10 dark:bg-[var(--color-code-surface)]/40"
            >
              <p className="text-xs text-[var(--color-text-tertiary)]">Input</p>
              <p className="font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-secondary)]">{from}</p>
              <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">Slug</p>
              <p className="font-mono text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">{to}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy note
        </h2>
        <p>
          All slug generation runs entirely in your browser. Your text is never
          uploaded, stored, or sent to a server.
        </p>
      </section>
    </div>
  );
}
