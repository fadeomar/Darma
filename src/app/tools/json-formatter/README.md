# JSON Formatter Production Studio

A browser-local JSON workbench for formatting, validation, conservative repair, structured inspection, production auditing, reusable profiles, and developer exports.

## Structure

```text
json-formatter/
  page.tsx                 Route shell, registry metadata, and JSON-LD
  JsonFormatterClient.tsx  Interactive formatter, inspectors, audit, and exports
  JsonCodeEditor.tsx       Monaco JSON editor wrapper
  JsonTreeView.tsx         Expandable tree inspector
  JsonTableView.tsx        Array-of-objects table preview
  JsonStatsPanel.tsx       Payload metrics
  utils.ts                 Pure parse, format, repair, table, and stats logic
  utils.test.ts            Core operation tests
  studio.ts                Profiles, precision scans, production audit, and exports
  studio.test.ts           Production workflow and edge-case tests
  Article.tsx              Usage, precision, privacy, and export guidance
```

## Production features

- Four summary cards for root type, structure, payload size, and readiness
- Error, warning, info, and pass checks
- Unsafe integer detection before `JSON.parse` can round exact digits
- Secret-like and prototype-sensitive key-path detection
- 5 MB local file import guard and large-payload warnings
- Practical formatting, stable-review, transport, and inspection presets
- Versioned settings-only profile import/export
- Formatted JSON, minified JSON, JavaScript, TypeScript, Markdown, CSV, and ZIP exports
- Optional local history with additional warnings for secret-like payloads

## Export privacy

The formatter profile, Markdown audit, and CSV metrics intentionally exclude JSON values. Formatted JSON, minified JSON, JavaScript, TypeScript, and the ZIP production pack include the current payload.

## Tests

```bash
npm exec vitest run \
  src/app/tools/json-formatter/utils.test.ts \
  src/app/tools/json-formatter/studio.test.ts
```
