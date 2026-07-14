# Darma SVG Path Editor

A Darma-native SVG path production workbench. The SVG parsing and transformation engine is adapted from `Yqnn/svg-path-editor` under Apache-2.0.

## Phase 26 capabilities

- Raw path, pasted SVG markup, and local `.svg` file import
- Multiple-path detection and picker
- Interactive target/control point dragging with zoom, pan, grid, and snap
- Command inspector, command editing, insertion, deletion, and relative/absolute conversion
- Scale, translate, rotate, precision, optimize, reverse, undo, redo, examples, and local saved paths
- Four live summary cards for commands, editable points, geometry, and payload size
- Severity-based production checks for syntax, geometry, open fills, complexity, coordinates, and payload size
- SVG, React/TypeScript, CSS mask, JSON, Markdown report, and ZIP production-pack exports
- Responsive three-zone desktop workbench with stacked tablet/mobile layouts
- Browser-local processing with no upload

## Automated coverage

- SVG engine parsing and number formatting
- SVG path extraction from raw data and full markup
- Path metrics and approximate bounds
- Production-check edge cases
- Generated SVG, React, CSS, and JSON export syntax

## Manual test paths

```txt
M 10 10 L 100 10 L 100 100 Z
M 20 80 C 40 10, 65 10, 95 80
M 10 80 Q 95 10 180 80
M 20 20 A 30 30 0 0 1 80 80
```

## Attribution

Preserve project-level `LICENSE.yqnn-svg-path-editor` and any applicable notice when modifying or redistributing this tool.
