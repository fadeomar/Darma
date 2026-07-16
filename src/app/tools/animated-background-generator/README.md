# Animated Background Production Studio

Create deterministic animated CSS backgrounds, preview them behind real interface content, audit motion and paint cost, save a reopenable project, and export a complete production package.

## Privacy

The tool is local-only. Project parsing, particle generation, previews, reports, and ZIP assembly happen in the browser. No configuration or generated code is uploaded.

## Core workflow

1. Start from a production preset.
2. Tune colors, density, size, speed, intensity, blur, glow, blend mode, and gradient style.
3. Preview the result behind hero, card, or dashboard content.
4. Review the four summary cards and severity-based production checks.
5. Export individual code snippets, a project JSON, reports, or the complete ZIP.

## Project format

The reopenable JSON format uses:

```json
{
  "tool": "darma-animated-background-generator",
  "schemaVersion": 1,
  "exportedAt": "2026-07-14T00:00:00.000Z",
  "state": {}
}
```

Import rules:

- Maximum file size: 1 MB
- Exact tool and schema-version match required
- Invalid numbers are clamped to supported ranges
- Invalid enums and colors fall back to safe defaults
- Null characters are removed
- Imported projects always resume with animation running

## Production ZIP

The pack contains:

- `index.html`
- `animated-background.css`
- `AnimatedBackground.tsx`
- `animated-background.tokens.json`
- `animated-background-project.json`
- `production-report.md`
- `production-metrics.csv`
- `README.md`

## Production checks

The audit reviews:

- Hex color validity
- Particle-size ordering
- DOM density
- Large blur and glow combinations
- Estimated performance cost
- Motion intensity
- Blend-mode portability
- Reduced-motion support
- Readability-preview status
- Export payload size
- Manual device verification

## Implementation

- `lib/seededRandom.ts`: deterministic pseudo-random number generation
- `lib/generateParticleData.ts`: particle positions, sizes, timing, drift, color, and opacity
- `lib/generateCss.ts`: scoped CSS, keyframes, preset-specific layers, and reduced-motion fallback
- `lib/generateHtml.ts`: matching particle markup
- `lib/studio.ts`: project validation, metrics, audit, reports, and production files
- `lib/zip.ts`: dependency-free stored ZIP creation and verification

## Tests

- `lib/generateParticleData.test.ts`: deterministic generation, bounds, CSS, HTML, and reduced motion
- `lib/studio.test.ts`: normalization, project import, readiness, metrics, and production checks
- `lib/studio.export.test.ts`: generated files and ZIP round-trip
