# Neumorphic CSS Generator

Generate scoped neumorphic CSS for UI elements — adjust background color, intensity, blur, and distance to produce embossed or debossed effects.

## Privacy

`local-only` — all CSS generation runs in the browser. No data is sent anywhere.

## About neumorphism

Neumorphism blends flat design with subtle shadows to create the illusion of extruded or inset surfaces. It works best on monochromatic designs with a carefully chosen base color.

Two shadows are generated per element: a light shadow offset to the top-left and a dark shadow offset to the bottom-right (or inverted for inset mode). The generator calculates the shadow colors by lightening and darkening the base color.

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, `ToolPage` |
| `NeumorphicCssGeneratorClient.tsx` | `"use client"` — controls, live preview, copy output |
| Shared Darma tool UI | Preview, controls, and output are handled by Sprint B components. |
