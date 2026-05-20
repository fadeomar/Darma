# CSS Gradient Generator

Design linear and radial CSS gradients visually — adjust angle, color stops, and positions — then copy clean CSS background code.

## Privacy

`local-only` — all gradient generation runs in the browser. No data is sent anywhere.

## Features

- Linear and radial gradient types
- Adjustable angle / shape
- Multiple color stops with position control
- Presets and random gradient generation
- Reverse stops
- Copy as `background` value or full CSS class

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, `ToolPage` |
| `CssGradientGeneratorClient.tsx` | `"use client"` — gradient controls, live preview, copy output |
| `Article.tsx` | Educational content about CSS gradients |
