# QR Code Generator

A browser-local QR production studio for URLs, text, WhatsApp, email, phone, SMS, WiFi, vCard contacts, map coordinates, and calendar events.

## Phase 28 capabilities

- Live PNG and SVG generation with configurable size, quiet zone, colors, transparency, and error correction.
- Four summary cards for content, density, contrast, and production readiness.
- Production checks with error, warning, info, and pass severity levels.
- Contrast-ratio calculation, quiet-zone review, output-size review, payload-density guidance, and sensitive-data reminders.
- JSON project import/export with normalization and schema validation.
- PNG, SVG, HTML, CSS, React TSX, JSON, Markdown, and ZIP production exports.
- Practical presets for menus, WiFi, WhatsApp orders, classroom links, business contacts, events, and websites.
- Local processing with no QR payload upload.

## Main files

- `QRCodeClient.tsx` — responsive production UI and browser export workflow.
- `qr.ts` — payload builders and content-specific validation.
- `studio.ts` — project import, normalization, audits, summaries, and developer exports.
- `qr.test.ts` — payload and validation coverage.
- `studio.test.ts` — import, audit, contrast, summary, and export coverage.

## Verification

```bash
npm exec vitest run \
  src/app/tools/qr-code/qr.test.ts \
  src/app/tools/qr-code/studio.test.ts

npm run typecheck
npm run lint
npm run build
```
