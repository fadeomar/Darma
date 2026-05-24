# Darma Tool Standard

## Shared tool UI primitives

New and refactored tools should prefer the shared Darma tool UI primitives from `src/features/tools/components` instead of inventing custom control panels, output cards, and warning blocks.

Use full-width controls for textareas, code, URLs, file/dropzone areas, long source inputs, and generated output. Use compact/numeric controls for values such as gap, radius, blur, opacity, order, grow, shrink, columns, rows, breakpoint widths, transform values, and image dimensions.

## Visual generator structure

Visual generators should use `ToolPage`, the existing Darma tool layouts such as `ToolLayoutVisualGenerator`, and shared primitives such as `PreviewToolbar`, `ToolControlPanel`, `ControlSection`, `ControlGrid`, `SliderNumberField`, `NumberField`, `ColorField`, `SegmentedControl`, `PresetGallery`, `WarningPanel`, and `CodeOutputPanel`.

Desktop order: preview and controls side by side, then generated output. Mobile order: presets or quick settings, preview, primary actions, advanced controls, output, then article/help content.

## Layout generator structure

Layout generators should behave like teaching studios: the preview should be visually dominant, controls should be compact and grouped, and generated output should be standardized. Use `ToolPage` plus the existing Darma tool layouts, especially `ToolLayoutVisualGenerator`, then compose the inner experience with shared primitives.

For CSS Grid, Flexbox, and Container Query tools, make layout concepts visible: grid lines, axis labels, active breakpoints, selected items, container width, and generated rule effects. Numeric controls such as columns, rows, gaps, grow/shrink, order, and breakpoint widths should use compact numeric fields rather than full-width inputs.

## Technical generator structure

Technical generators should emphasize guidance, warnings, and safe output. Responsive image, transform, and CSP tools should use the same shared primitives while adding analyzer panels, risk panels, preview toolbars, compact rows, and cautious text where needed.

For security-sensitive tools such as CSP, never claim a generated policy is fully secure. Use language such as “suggested policy,” “risk warnings,” and “test before production.” Risky values like `'unsafe-inline'`, `'unsafe-eval'`, wildcards, `data:`, and `blob:` should be clearly labeled in text, not only by color.
