# Color Shades Generator

Generate a smooth gradient of shades between two colors, click any swatch to copy the value, and explore curated color pair suggestions.

## Privacy

`local-only` — all shade calculation runs in the browser. No data is sent anywhere.

## Logic

`@/utils/color-shades` exports `generateShades(params: ColorShadesParams): ColorShade[]`.

Given two hex colors (`color1`, `color2`) and a `steps` count, it interpolates in RGB space and returns an array of evenly-spaced colors between them.

The initial shades are generated on the server at render time (passed as `initialShades` props) so the page is not blank on first load — client updates happen immediately when the user changes either color or the step count.

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, initial shades pre-computed, `ToolPage` + `ToolLayoutVisualGenerator` |
| `ColorShadesClient.tsx` | `"use client"` — color pickers, step slider, swatch copy |
| `SuggestionsSection.tsx` | `"use client"` — curated color pair suggestions |
| `InputSection.tsx` | Input controls sub-component |
| `PreviewSection.tsx` | Swatch grid sub-component |
| `ColorShadesArticle.tsx` | Educational article about color palettes |
