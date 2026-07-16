# Code Preview Production Studio

Build, audit, save, reopen, and export small HTML, CSS, and JavaScript prototypes entirely in the browser.

## Main workflow

1. Start from a practical preset or edit the three source files directly.
2. Preview the result in desktop, tablet, or mobile dimensions.
3. Inspect runtime errors, console messages, and production checks.
4. Export a standalone page, editable project, audit report, metrics, or complete ZIP.
5. Reopen a prior `darma-project.json` file to continue editing.

## Project import

- Maximum JSON file size: 1 MB.
- Supports project schema versions 1 and 2.
- Version 2 preserves viewport and auto-run settings.
- Imported HTML, CSS, and JavaScript are type-checked, size-limited, and stripped of null characters.
- Files exported by other tools are rejected.

## Production checks

The local audit covers:

- Required HTML source
- CSS brace balance
- JavaScript syntax
- Duplicate IDs
- Missing image alternatives
- Form controls without accessible names
- Buttons without an explicit type
- Unsafe `target="_blank"` links
- Inline event handlers and HTML script tags
- Debug logging
- Credential-like assignments
- Excessive source size
- External resource dependencies
- The iframe sandbox boundary

These checks are fast heuristics, not replacements for browser testing, an accessibility audit, dependency review, or server-side validation.

## Production ZIP

The generated package contains:

- `index.html`
- `styles.css`
- `script.js`
- `darma-project.json`
- `production-report.md`
- `production-metrics.csv`
- `README.md`

## Privacy and security

The tool is browser-local. Source code is not uploaded by Darma. The preview iframe allows scripts and forms but does not receive same-origin access to the Darma application. Never place real secrets in browser source or exported projects.

## Implementation files

| File | Role |
|---|---|
| `src/app/tools/code-preview-tool/page.tsx` | Tool page, metadata, and article composition |
| `src/app/tools/code-preview-tool/Article.tsx` | User-facing guidance |
| `src/sections/CodePreviewTool/index.tsx` | Client interface, editor, sandbox, import, and downloads |
| `src/sections/CodePreviewTool/presets.ts` | Practical starter projects |
| `src/sections/CodePreviewTool/studio.ts` | Typed project schema, audit, metrics, and export logic |
| `src/sections/CodePreviewTool/studio.test.ts` | Import, audit, and metrics tests |
| `src/sections/CodePreviewTool/studio.export.test.ts` | Production ZIP validation |
