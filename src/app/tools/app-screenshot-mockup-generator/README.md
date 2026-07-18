# App Screenshot Mockup Production Studio

Client-only Darma studio for turning raw product screenshots into polished device mockups and verified production handoffs.

## Route

`/tools/app-screenshot-mockup-generator`

## Features

- Local PNG, JPG, and WebP screenshot upload
- Optional local background image
- Phone, tablet, laptop, desktop, browser, and clean-card frames
- Solid, gradient, mesh, and image backgrounds
- Badge, title, subtitle, footer, browser URL, safe-area, reflection, crop, rotation, scale, padding, and alignment controls
- Landing-page, social, app-store draft, documentation, and complete export packs
- Four production summary cards
- Severity-based production audit
- Design fingerprint that blocks stale PNG and ZIP downloads
- Versioned project JSON import/export with a 1 MB limit
- Uploaded screenshot and background bytes excluded from project backups
- HTML, responsive picture, Next.js, CSS, CSS variables, and design-token exports
- Markdown production report and CSV metrics
- Complete local ZIP production pack
- Local checker for existing PNG, JPG, and WebP packages

## Production ZIP

The ZIP contains the selected PNG outputs plus:

- `README.md`
- `html-figure-snippet.html`
- `next-image-snippet.tsx`
- `responsive-picture-snippet.html`
- `mockup-styles.css`
- `mockup-variables.css`
- `mockup.tokens.json`
- `mockup-project.json`
- `production-report.md`
- `production-metrics.csv`

## Project privacy

Project JSON stores settings only. Uploaded screenshot and background-image bytes are intentionally excluded and must be reattached after import.

## Tests

Phase 46 adds focused tests for project normalization, import rejection, fingerprints, production checks, reports, CSV output, package validation, ZIP interoperability, and generated Next.js TSX syntax.

## Privacy

Rendering, validation, project import, reports, PNG generation, and ZIP creation run locally in the browser. No screenshot is uploaded.
