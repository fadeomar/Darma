# Meta Tag Production Studio

Create, validate, preview, save, and export SEO, Open Graph, and X/Twitter metadata without sending project data to a server.

## Phase 41 capabilities

- Four summary cards for title length, description length, social-image coverage, and readiness.
- Search-result and social-card copy previews.
- All existing metadata fields exposed in the UI, including image alt text, locale, site handle, and creator handle.
- Severity-based production checks for required fields, URL validity, copy length, HTTPS, locale, handles, image context, and payload size.
- Versioned project JSON import/export with a 1 MB import limit.
- Exports for raw head tags, standalone HTML, Next.js Metadata, Markdown, CSV, and a ZIP production pack.
- Browser-local processing only; entered URLs are not fetched.

## Production pack

The ZIP contains:

- `meta-tags.html`
- `head-example.html`
- `metadata.ts`
- `meta-project.json`
- `production-report.md`
- `production-metrics.csv`
- `README.md`

## Important limitation

Local previews estimate hierarchy and copy length. Deployed platforms may cache, crop, or truncate metadata differently, so verify the final public URL after release.
