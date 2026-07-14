# Fake Screen Studio

Create safe fullscreen displays for demos, display checks, video scenes, classrooms, and creative projects: color screens, update simulations, error scenes, screensavers, and animated canvas backgrounds.

## Phase 27 production upgrade

- Four compact live summary cards
- Severity-based production audit
- Complete share-link round trip for every editable field
- Versioned JSON configuration import and export
- Standalone HTML export with visible demo notice and click-to-fullscreen behavior
- Markdown audit report and ZIP production pack
- Tests for progress modes, query compatibility, import validation, contrast, audits, summaries, and generated exports
- Registry-driven metadata, JSON-LD, and a single canonical article implementation

## Privacy

`client-only` — configuration, previews, imports, audits, and exports stay in the browser.

## Categories

| Category | Examples |
|---|---|
| Color screens | Solid colors, dead-pixel test, screen cleaning, soft light |
| Fake updates | Windows-inspired, Mac-inspired, Ubuntu-inspired, Chrome OS-inspired, Android-inspired, terminal |
| Prank/error screens | Blue error, no signal, radar, broken-screen simulation, hacker terminal |
| Screensavers | DVD bounce, flip clock, quote screen, matrix rain, floating text |
| Canvas backgrounds | Circles, starfield, network, waves, aurora, confetti, and more |

## Responsible use

Keep fake update and error scenes visibly identifiable as demos or simulations. Fullscreen always requires a user action and can be exited with normal browser controls. The tool does not open popups, block shortcuts, or modify the device.

## Files

| File | Role |
|---|---|
| `page.tsx` | Registry metadata, JSON-LD, tool header, article, and related tools |
| `FakeScreenClient.tsx` | Preview renderer, controls, fullscreen, share link, and import/export orchestration |
| `components/FakeScreenProductionPanel.tsx` | Summary cards, audit results, and production actions |
| `lib/studio.ts` | State normalization, query codec, progress logic, audits, and export builders |
| `lib/studio.test.ts` | Unit tests for production logic and edge cases |
| `presets.ts` | Default state and ready-made scenes |
| `types.ts` | Shared scene and configuration types |
| `Article.tsx` | Workflow, production, privacy, and responsible-use guidance |
