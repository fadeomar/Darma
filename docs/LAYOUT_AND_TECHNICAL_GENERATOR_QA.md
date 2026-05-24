# Layout and Technical Generator QA

## Refactored in Sprint C

- [x] CSS Grid Generator
- [x] Flexbox Generator
- [x] Container Query Generator

## Refactored in Sprint D

- [x] Responsive Image Srcset Generator
- [x] CSS Transform Generator
- [x] CSP Generator

## Shared checks

- Preview is visually dominant where the tool has a visual preview.
- Controls use `ToolControlPanel`, `ControlSection`, and compact fields.
- Generated output uses `CodeOutputPanel`.
- Warnings and risk messages use `WarningPanel` or a compatible wrapper.
- Numeric controls are not unnecessarily full-width.
- Mobile layout avoids horizontal overflow.
- Article and route structure remain unchanged.
- Security wording stays cautious for CSP output.

## Follow-ups

- Add automated visual regression screenshots for tool pages.
- Add unit tests for output generation helpers.
- Consider deeper item editing for CSS Grid and Flexbox once the UI baseline is stable.
- Consider import/export state JSON for layout tools.
