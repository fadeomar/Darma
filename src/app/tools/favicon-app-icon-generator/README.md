# Favicon & App Icon Production Studio

A client-only favicon and app icon workflow for Darma. It generates browser, Apple, PWA, maskable, legacy, and framework-specific assets while keeping source artwork local.

## Production workflow

- Start from an uploaded PNG/JPG/WebP image, safe inline SVG, initials, or emoji.
- Adjust source framing, shape, spacing, colors, manifest metadata, project target, and export pack.
- Inspect 16px, 32px, browser-tab, search, iOS, Android, PWA, and maskable previews.
- Review four compact production cards plus severity-based input, freshness, readiness, contrast, and portability checks.
- Export a versioned settings project and reopen it later.
- Generate a launch-ready ZIP with assets, manifests, snippets, install guidance, a project file, a Markdown audit, and CSV metrics.

## Project privacy

`darma-favicon-project.json` never embeds uploaded raster image data or image metadata. Safe SVG markup is included only when it is below 256 KB; oversized or unsafe SVG sources must be reattached after import. Project imports are limited to 1 MB and normalize enums, colors, text lengths, numbers, and source transforms.

## Generated handoff files

Every downloaded production ZIP adds:

- `favicon-project.json`
- `production-audit.md`
- `production-metrics.csv`

These accompany the selected Modern Web, Next.js App Router, PWA Complete, Legacy Full, or Complete Studio asset pack.

## Quality and safety checks

- Source presence and minimum image resolution
- Unsafe SVG markup
- Tiny-icon text length and foreground/background contrast
- Edge and maskable safe-area spacing
- Apple touch icon, PWA, manifest, and install readiness
- Duplicate or empty generated files
- Manifest and snippet path consistency
- Stale package prevention through a deterministic design fingerprint

All generation, validation, project parsing, and ZIP creation run locally in the browser. No uploaded artwork is sent to Darma servers.
