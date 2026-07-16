# Responsive Image Delivery Studio

Browser-local responsive-image planning for HTML `img`, `picture`, and Next.js `Image` workflows.

## Phase 45 capabilities

- Width-descriptor candidate planning and slot-width analysis
- Editable `sizes` rules with viewport and DPR previews
- Loading, decoding, fetch-priority, object-fit, and class controls
- Picture-source management for format fallback and art direction
- Versioned project JSON import and export
- Severity-based production audit and readiness summary
- Standalone HTML, CSS, Next.js TSX, Markdown, CSV, manifest, and ZIP exports
- Defensive import normalization and duplicate-ID rejection
- HTML attribute escaping for URLs, classes, sizes, and alternative text

## Production ZIP

The generated pack contains:

- `responsive-image.html`
- `responsive-image.css`
- `ResponsiveImage.tsx`
- `responsive-image-snippets.txt`
- `responsive-image-project.json`
- `production-report.md`
- `production-metrics.csv`
- `README.md`

## Important behavior

The browser remains responsible for choosing a candidate from `srcset`. The analyzer estimates that choice from the configured slot and DPR, but real selection can also depend on cache state, supported formats, and browser heuristics.

Next.js `Image` generates its own candidate URLs. Use this studio’s candidate plan to prepare source assets and its `sizes` output to describe the real CSS layout.

All processing and project import/export remain in the browser.
