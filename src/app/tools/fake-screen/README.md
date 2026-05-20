# Fake Screen Tool

Create safe fullscreen displays for demos, video scenes, classroom use, and creative projects — color screens, fake OS updates, prank/error screens, screensavers, and animated canvas backgrounds.

## Privacy

`local-only` — all screens run entirely in the browser. No data is sent to any server.

## Categories

| Category | Examples |
|---|---|
| Color screens | Solid colors, dead pixel test, screen cleaning, soft light |
| Fake updates | Windows 11/10/XP, Mac, Ubuntu, Chrome OS, Android, terminal |
| Prank/error screens | Blue screen, no signal, radar, broken glass, hacker terminal |
| Screensavers | DVD bounce, flip clock, quote screen, matrix rain, floating text |
| Canvas backgrounds | Circles, starfield, particle network, waves, aurora, confetti, and more |

## Responsible use

Prank-style screens are intended for harmless jokes, videos, and creative scenes only. Fullscreen always requires a user click and can be exited with Esc. The tool does not open popups, block keyboard shortcuts, or modify the user device.

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, `ToolPage` with Suspense boundary |
| `FakeScreenClient.tsx` | `"use client"` — category selector, screen renderer, fullscreen/share controls |
| `Article.tsx` | Tool description and related links |
