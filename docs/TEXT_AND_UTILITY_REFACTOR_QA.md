# Darma Sprint E/F Text and Utility Refactor QA

This pass normalizes text workbench tools and single-purpose utilities around the shared Darma UI primitives introduced in earlier sprints.

## Sprint E targets updated

- JSON Formatter
- Text Cleaner
- Base64 Encoder/Decoder
- URL Encoder/Decoder
- HTML Entity Encoder/Decoder
- Markdown Previewer
- JWT Decoder
- JSON to TypeScript
- Regex Tester
- Robots.txt Generator
- Sitemap XML Generator
- Slug Generator
- Lorem Ipsum Generator
- Meta Tag Generator

## Sprint F targets updated

- Password Generator
- UUID Generator
- Timestamp Converter
- QR Code Generator
- Color Converter
- Color Shades

The Image Converter already had a browser-side dropzone, file info, conversion settings, result preview, download behavior, file-size validation, and object URL cleanup. It was reviewed as aligned with Sprint F2 patterns and left mostly intact to avoid needless churn.

## Shared UI patterns now used

- `ToolLayoutTextWorkbench` for text/code/SEO tools.
- `ToolLayoutSingleUtility` for result-first utilities.
- `EditorPanel` for text input and output surfaces.
- `CodeOutputPanel` for generated code and file output.
- `ResultPanel` for primary utility results.
- `ToolControlPanel`, `ControlSection`, and `ControlGrid` for grouped settings.
- `NumberField`, `ColorField`, and `SegmentedControl` for compact controls.
- `WarningPanel` for readable errors, safety notes, and warnings.
- `CopyButton` and download actions for generated output.

## Manual QA checklist

### Text workbench tools

- [ ] Input editor is visible immediately.
- [ ] Output panel remains stable when empty.
- [ ] Sample and clear actions work where present.
- [ ] Copy output works.
- [ ] Download output works where present.
- [ ] Invalid input produces readable text errors.
- [ ] Mobile order is input/actions/output/options/help.

### Utility tools

- [ ] Primary result is visible first.
- [ ] Copy/regenerate/download actions are prominent.
- [ ] Compact numeric controls do not stretch across the whole screen.
- [ ] Warning notes are text-based and not color-only.
- [ ] Mobile layout has no horizontal overflow.

### Security and privacy checks

- [ ] Password generation uses `crypto.getRandomValues` and does not fall back to `Math.random`.
- [ ] JWT decoder says decoded-only and does not claim signature verification.
- [ ] QR input length is validated before generation.
- [ ] Color outputs include text values, not swatches alone.
- [ ] Image Converter keeps browser-side conversion and object URL cleanup.

## Known verification note

Run locally after dependency installation:

```bash
npm run typecheck
npm run build
```

In restricted environments, `npm install` or `prisma generate` can fail before these checks complete. When that happens, run the commands in the local Darma development environment.
