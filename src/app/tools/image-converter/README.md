# Image Converter

Convert images between PNG, JPEG, and WebP formats locally in your browser. Optionally resize before export and adjust quality for compressed formats.

## Privacy

`local-only` — the file is processed using browser Canvas APIs (`drawImage` + `toBlob`/`toDataURL`). No image data is sent to any server.

## Features

- Convert between PNG, JPEG, and WebP
- Optional width/height resize with aspect ratio lock
- Quality slider for JPEG and WebP output
- Live preview before download
- Download the converted file directly from the browser

## Logic

Image conversion uses the browser's built-in Canvas API:
1. The source file is read with `FileReader` (or `createObjectURL`)
2. Drawn onto a `<canvas>` element at the target dimensions
3. Exported via `canvas.toBlob(callback, mimeType, quality)`

This approach is lossy for JPEG/WebP compression but lossless for PNG. Quality `1.0` preserves the maximum fidelity supported by the format.

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, `ToolPage` |
| `ImageConverterClient.tsx` | `"use client"` — file input, resize controls, quality slider, preview, download |
| `Article.tsx` | Explanation of format differences and use cases |
