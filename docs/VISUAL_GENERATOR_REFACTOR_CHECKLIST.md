# Visual Generator Refactor Checklist

## Layout

- [ ] Uses ToolPage
- [ ] Uses ToolLayoutVisualGenerator
- [ ] Preview is visually dominant
- [ ] Controls are grouped with ToolControlPanel
- [ ] Code output uses CodeOutputPanel
- [ ] Mobile order is usable

## Controls

- [ ] Numeric fields are compact
- [ ] Sliders use SliderNumberField where helpful
- [ ] Colors use ColorField
- [ ] Modes use SegmentedControl
- [ ] Presets use PresetGallery where helpful

## Accessibility

- [ ] Labels exist
- [ ] Preset cards are keyboard accessible
- [ ] Buttons have accessible names
- [ ] Warnings are not color-only
- [ ] Focus states are visible

## QA

- [ ] npm run typecheck passes
- [ ] npm run build passes
- [ ] No horizontal overflow
- [ ] Dark mode still works
- [ ] Generated output still copies correctly

## Refactored visual generators

- [x] Glassmorphism Generator
- [x] Border Radius Generator
- [x] Box Shadows Generator
- [x] Buttons CSS Generator
- [x] Neumorphic CSS Generator
