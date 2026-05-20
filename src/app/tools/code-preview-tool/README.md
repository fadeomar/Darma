# Code Preview Tool

Write HTML, CSS, and JavaScript in editor tabs and preview the result instantly in a sandboxed iframe.

## Privacy

`local-only` — all code runs entirely in the browser inside a sandboxed `<iframe>`. No code is sent to any server.

## How it works

The tool renders the user's HTML, CSS, and JS into a sandboxed iframe using a `srcdoc` blob or data URL. The iframe is isolated without same-origin access, so the snippet cannot read the Darma app context.

Runtime errors thrown inside the iframe are caught and reported below the preview to help with debugging.

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, dynamic `ssr: false` import |
| `CodePreviewTool` (in `@/sections/`) | `"use client"` — editor tabs, iframe renderer, error reporting |
| `Article.tsx` | Short description rendered below the tool |
