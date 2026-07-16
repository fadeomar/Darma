# Open Graph Image Production Studio

Browser-only Darma studio for designing Open Graph images, social preview cards, metadata snippets, reusable settings projects, production audits, and export packs.

## Route

`/tools/og-image-generator`

## Phase 38 capabilities

- Eight visual templates and five practical quick presets
- 1200×630 primary preview plus platform-style previews
- Logo and background image uploads processed locally
- Four production summary cards
- Severity-based production checks
- Versioned settings-only JSON project import/export
- Explicit stale-package detection while a design regenerates
- HTML and Next.js metadata snippets
- Local HTML/meta checker and existing-package checker
- PNG and ZIP downloads
- Unit tests for validation, project normalization, audits, reports, and ZIP generation

## Production ZIP contents

The exact image list depends on the selected pack. Every generated package also includes:

- `html-meta-tags.txt`
- `metadata-snippet.ts`
- `social-preview.html`
- `validation-checklist.md`
- `og-project.json`
- `production-audit.md`
- `production-metrics.csv`
- `asset-manifest.json`
- `README.md`

Next.js and complete packs also include App Router instructions.

## Project-file policy

The JSON project stores design and metadata settings only. Uploaded logo and background data URLs are intentionally removed so the project remains compact and does not duplicate private local assets. Imported projects require those files to be reattached.

## Privacy

All rendering, validation, project parsing, and ZIP generation happen locally in the browser.
