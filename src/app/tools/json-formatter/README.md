# JSON Formatter & Validator

Format, validate, and minify JSON in the browser. No upload, no server, no signup.

## Structure

```
json-formatter/
  page.tsx               — thin route shell, metadata from registry
  JsonFormatterClient.tsx — UI: input/output textareas, action buttons
  utils.ts               — pure logic: validateJSON, formatJSON, minifyJSON
  utils.test.ts          — vitest unit tests for utils
  Article.tsx            — SEO article content (FAQ, error guide)
```

## Features

- Format with 2-space, 4-space, or tab indent
- Minify to a single line
- Validate with line + column error location (Chrome and Firefox)
- Download output as `.json`
- One-click copy

## Privacy

`local-only` — all processing uses the browser's native `JSON.parse` / `JSON.stringify`. Nothing is sent anywhere.

## Running tests

```bash
npx vitest run src/app/tools/json-formatter/utils.test.ts
```
