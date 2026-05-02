# Darma SVG Path Editor

A Darma-native React/Next.js SVG path editor workbench. The SVG parsing and transformation engine is adapted from `Yqnn/svg-path-editor` under Apache-2.0.

## Current MVP

- Path input and live preview
- Interactive target point and control point dragging
- Command list and selected-command inspector
- Command value editing
- Insert line command, delete command, command type conversion, relative/absolute toggle
- Scale, translate, rotate, round output
- Convert all commands to absolute or relative
- Optimize and reverse path
- Import first `<path d="...">` from SVG markup
- Copy path, copy full SVG, download SVG
- Responsive 3-zone workbench layout

## Manual test paths

```txt
M 10 10 L 100 10 L 100 100 Z
M 20 80 C 40 10, 65 10, 95 80
M 10 80 Q 95 10 180 80
M 20 20 A 30 30 0 0 1 80 80
```

## Attribution

Preserve project-level `NOTICE` and `LICENSE.yqnn-svg-path-editor` when modifying or redistributing this tool.
