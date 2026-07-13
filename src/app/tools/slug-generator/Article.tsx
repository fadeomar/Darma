export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          What is a production-ready slug?
        </h2>
        <p>
          A slug is the readable route segment that identifies a page, product,
          article, or documentation entry. A production-ready slug is more than
          lowercase text with hyphens: it must also remain unique, avoid reserved
          application routes, fit your CMS constraints, and preserve redirects
          when an existing URL changes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Single routes, bulk manifests, and migrations
        </h2>
        <p>
          Single mode is useful while drafting one page. Bulk mode turns one title
          per line into a route manifest for catalogs, documentation, migrations,
          or CMS imports. Add a tab followed by the previous path to any bulk row
          to create a redirect mapping automatically.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--color-code-surface)] p-4 text-xs leading-6 text-[var(--color-code-text)]">
{`New article title\t/old-article-path
Second article title
Documentation/API authentication`}
        </pre>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Collision and reserved-route planning
        </h2>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <strong className="text-[var(--color-text-primary)]">Append number</strong>{" "}
            creates deterministic suffixes such as <code>product-name-2</code>.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Block duplicates</strong>{" "}
            is safer when every collision needs editorial review.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Allow duplicates</strong>{" "}
            is mainly useful when different prefixes or external systems guarantee uniqueness.
          </li>
          <li>
            Reserved segments such as <code>admin</code>, <code>api</code>, or
            <code>sitemap.xml</code> should be checked against your framework and infrastructure.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Unicode and ASCII-only routes
        </h2>
        <p>
          Unicode slugs keep Arabic, CJK, and other scripts readable. They are valid
          URL path content, but downstream analytics, CMS, redirect, and deployment
          tools must preserve them consistently. ASCII-only mode is intended for
          systems that explicitly reject Unicode; it removes unsupported non-Latin
          characters rather than pretending to transliterate languages incorrectly.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Safe slug migration workflow
        </h2>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>Export the route CSV and review collisions or blocked rows.</li>
          <li>Confirm reserved paths against your application router.</li>
          <li>Import or deploy the new routes.</li>
          <li>Apply permanent redirects from every previous path.</li>
          <li>Update internal links and canonical URLs.</li>
          <li>Monitor 404s after deployment instead of deleting redirects immediately.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Privacy
        </h2>
        <p>
          Route generation, collision detection, reports, and ZIP exports run in
          your browser. Titles and previous paths are not uploaded to a server.
        </p>
      </section>
    </div>
  );
}
