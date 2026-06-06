# JSON Formatter & Validator

Format, validate, repair, minify, sort, and inspect JSON in the browser. No upload, no server, no signup.

## Structure

```
json-formatter/
  page.tsx                — route shell, metadata, intro/sidebar content
  JsonFormatterClient.tsx — JSON studio UI and client-only interactions
  JsonCodeEditor.tsx      — Monaco JSON editor wrapper with line numbers/folding
  JsonTreeView.tsx        — collapsible JSON tree inspector
  JsonTableView.tsx       — table preview for arrays of objects
  JsonStatsPanel.tsx      — payload metrics and size stats
  utils.ts                — pure logic: parse, validate, format, repair, stats
  utils.test.ts           — vitest unit tests for utils
  Article.tsx             — SEO article content and usage guide
```

## Features

- Monaco-powered JSON editor with syntax highlighting, line numbers, folding, bracket guides, and readable selection
- Live validation with line + column error reporting where the browser parser exposes it
- Format with 2-space, 4-space, or tab indent
- Optional deep key sorting
- Minify to a single line
- Safe repair helper for common loose JSON issues: comments, single quotes, unquoted keys, trailing commas, and unsupported values such as `NaN`
- Text, tree, table, and stats output views
- Drag-and-drop or file picker upload for `.json` files
- Optional local history using `localStorage`
- One-click copy and download

## Privacy

`local-only` — all processing uses browser-side JavaScript. Nothing is sent anywhere. Optional history is stored only in the current browser.

## Running tests

```bash
npx vitest run src/app/tools/json-formatter/utils.test.ts
```
