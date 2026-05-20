# Color Converter

Parse any HEX, RGB, or HSL color and get all three formats at once, plus contrast ratios and a 7-stop shade palette.

## Privacy

`local-only` — all color math runs in the browser as pure arithmetic. No data is sent anywhere.

## Logic

`color.ts` exports pure conversion functions and a main parser:

### Low-level converters

| Function | Description |
|---|---|
| `hexToRgb(input)` | Parses `#rrggbb` or `#rgb` shorthand → `RgbColor \| null` |
| `rgbToHex(rgb)` | `RgbColor` → lowercase `#rrggbb` string |
| `rgbToHsl(rgb)` | `RgbColor` → `HslColor` (h: 0–360, s/l: 0–100) |
| `hslToRgb(hsl)` | `HslColor` → `RgbColor` (hue wraps; s/l clamped) |
| `formatRgb(rgb)` | → `"rgb(r, g, b)"` CSS string |
| `formatHsl(hsl)` | → `"hsl(h, s%, l%)"` CSS string |

### Main parser

```ts
parseColorInput(input: string): ParsedColorResult
```

Accepts any of:
- 6-digit hex: `#3b82f6`
- 3-digit shorthand: `#fff`
- `rgb(r, g, b)` or `rgba(r, g, b, a)`
- `hsl(h, s%, l%)` or `hsla(h, s%, l%, a)`

Returns `{ ok: false, error }` for unrecognised input or empty string.

On success returns:
```ts
{
  ok: true,
  detectedFormat,   // "hex" | "rgb" | "hsl"
  hex, rgb, hsl,
  cssRgb, cssHsl,
  bestTextColor,         // "#000000" or "#ffffff" — highest WCAG contrast
  contrastWithBlack,     // contrast ratio (1–21)
  contrastWithWhite,
  shades,                // 7 ColorShade entries: Light+30 to Dark-30
}
```

### Shade palette

`buildShades` produces 7 stops by adjusting lightness by ±10/±20/±30, clamped to [0, 100]. Each shade includes `hex`, `cssRgb`, and `cssHsl`.

### Contrast ratio

Uses the WCAG 2.1 relative luminance formula. `bestTextColor` is whichever of black or white has the higher ratio.

## Tests

`color.test.ts` — 36 tests covering `hexToRgb` (6-digit, 3-digit, invalid), `rgbToHex` (pure colors, round-trip), `rgbToHsl` and `hslToRgb` (primary colors, hue wrapping, round-trip), `formatRgb`/`formatHsl`, and `parseColorInput` (all formats, error cases, contrast, shades).
