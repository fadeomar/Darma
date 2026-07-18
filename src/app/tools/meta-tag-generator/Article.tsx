export default function Article() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">One source for search and social metadata</h2>
        <p>
          A production page normally combines a document title, meta description, canonical URL, Open Graph fields, and an X/Twitter card. This studio keeps those values in one editable project so the search snippet, social-card copy, raw head tags, and framework export stay aligned.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">What the production audit checks</h2>
        <p>
          The audit flags missing titles and canonical URLs, invalid absolute URLs, long preview copy, missing social images or alt text, malformed locales and handles, insecure HTTP assets, and payload size. Passing the audit does not guarantee a platform will display the card exactly as shown because remote services can cache, crop, or truncate deployed content.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Portable projects and developer exports</h2>
        <p>
          Save a versioned JSON project to reopen the same fields later. Export copy-ready head tags, a standalone HTML example, a Next.js Metadata module, a Markdown readiness report, CSV metrics, or a ZIP production pack. The JSON importer validates the Darma tool identifier and schema version before replacing the current form.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Privacy and final verification</h2>
        <p>
          All generation and validation happen locally in the browser. Darma does not fetch the canonical URL or social image, so no remote page content is inspected. After deployment, verify the real public URL with the preview tools used by the search and social platforms relevant to your release.
        </p>
      </section>
    </div>
  );
}
