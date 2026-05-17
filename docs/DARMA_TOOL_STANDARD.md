# Darma Tool Standard

Darma tools should be small, private-by-default browser utilities that are easy to add, test, search, and index. This standard is the baseline for every new tool and the migration target for older tools.

## Goals

- Run client-side whenever the browser can reasonably do the work.
- Keep each tool modular: route shell, client UI, pure logic, examples, article content, and tests should not collapse into one large file.
- Make tool metadata complete enough for search, SEO, related tools, analytics, and future directories.
- Make privacy behavior explicit, especially when data is stored locally or sent to an API.
- Prefer shared Darma layouts and UI primitives over bespoke one-off controls.

## Required Tool Shape

New tools should use this structure:

```txt
src/app/tools/<tool-slug>/
  page.tsx
  <ToolName>Client.tsx
  Article.tsx
  types.ts
  <tool-logic>.ts
  presets.ts
  README.md
```

For larger tools, move reusable non-route code into `src/features/tools/<tool-slug>` or `src/tools/<tool-slug>` once the repo has a shared tool-module home.

## Page Contract

`page.tsx` should stay thin:

- Read the tool from `getToolRegistry().getById("<tool-slug>")`.
- Export metadata using the shared tool SEO helper.
- Dynamically import heavy client components.
- Render `ToolPage` or `ToolPageShell`.
- Avoid business logic, browser APIs, and large inline sidebars.

## Client Contract

Client components may manage UI state, browser APIs, and interactions. They should import pure functions from local logic files for transformation, validation, formatting, parsing, generation, and scoring.

Avoid putting all of these into the client component:

- Large example catalogs
- Parser or math-heavy logic
- Output serializers
- Download/copy helpers that could be shared
- Long article/FAQ content

## Metadata Contract

Every public tool needs:

- `id`
- `title`
- `description`
- `href`
- `tags`
- `mainCategory`
- `secondaryCategory`
- `audiences`
- `visibility`
- `layoutType`
- `privacy`
- `keywords`
- `relatedTools`
- `featured` and `pinned` only when editorially intentional

Preferred privacy values:

- `client-only`: processing stays in the browser and is not persisted.
- `local-storage`: processing stays in the browser, with optional local persistence.
- `server-assisted`: user input is sent to a Darma API route.
- `external-api`: user input is sent to a third-party service.

## SEO Contract

Every tool page should have:

- Unique title and description.
- Canonical URL.
- OpenGraph title, description, and URL.
- `WebApplication` or `SoftwareApplication` JSON-LD where appropriate.
- Human-readable article/help content when the keyword deserves context.
- Internal links to related tools.
- Clear privacy copy for tools handling sensitive or pasted data.

## UI Contract

Use Darma primitives from `src/components/ui` and layouts from `src/features/tools/layouts`:

- `ToolLayoutTextWorkbench` for input/output text tools.
- `ToolLayoutVisualGenerator` for preview plus controls.
- `ToolLayoutSingleUtility` for simple focused generators/converters.
- `ToolLayoutFullscreenStudio` for immersive screen/canvas tools.
- `Button`, `Field`, `Input`, `Textarea`, `Select`, `Slider`, `Tabs`, `CopyButton`, `Card`, `Badge`.

Tool-specific CSS is allowed for complex canvases/editors, but should be scoped by a unique class prefix.

## Privacy And Security

- Do not add an API route for a tool unless browser-only processing is impossible or clearly worse.
- If a tool sends data to the server, label it as `server-assisted` and document what is sent.
- Add input size limits for all API routes and large client transforms.
- For user-code previews, sandbox iframes and avoid `allow-same-origin` unless the feature truly requires it.
- For security tools, fail closed if required browser security APIs are unavailable.
- Never log user-submitted tool payloads.

## Testing Contract

Every non-trivial pure logic file should have focused tests for:

- Valid examples.
- Invalid input.
- Edge cases and maximum/minimum bounds.
- Round-trip behavior where relevant.
- Security or privacy expectations for sensitive tools.

At minimum, new tools should pass:

```bash
npm run typecheck
npm run lint
```

## Migration Priority

1. JSON Formatter
2. Password Generator
3. SVG Path Editor
4. QR Code Generator
5. Code Preview Tool

These cover the main layout categories and the highest-risk privacy/security paths.
