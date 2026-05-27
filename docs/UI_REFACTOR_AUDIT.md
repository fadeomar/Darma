# Darma UI Refactor Audit

## Baseline status

- Initial `npm run typecheck`: failed before installing dependencies in this extracted workspace. The first failures were missing modules such as `@prisma/client`, `bcryptjs`, `next`, `react`, `lucide-react`, `clsx`, and `tailwind-merge`.
- After dependency installation, typecheck surfaced existing source issues unrelated to the new Sprint A primitives: missing generated Prisma client types, missing animated-background type exports, missing `keywords` on `ToolDefinition`, and the SVG path editor timer type. The source issues were fixed; Prisma type generation could not be completed in this container because `prisma generate` needed to download an engine from `binaries.prisma.sh` and DNS/network access failed with `EAI_AGAIN`.
- Verification note: with temporary local Prisma client type stubs used only inside `node_modules` for validation, `npm run typecheck` passed. These stubs are not part of the source code package.
- `npm run build`: failed at the `prisma generate` step for the same offline/DNS reason. Running `npx next build` directly compiled successfully, then the container timed out/EPIPE during page-data collection, so the full production build could not be conclusively completed in this environment.

Recommended verification sequence on a normal local machine remains:

```bash
npm install
npx prisma generate
npm run typecheck
npm run build
```

## Existing shared UI components

Current shared UI primitives live in `src/components/ui` and include:

- `Input`: strong Darma token styling, previously defaulted to full width only. Sprint A added safe `size` and `width` variants while preserving `size="md"` and `width="full"` defaults.
- `Select`: same styling model as `Input`. Sprint A added matching `size` and `width` variants with backwards-compatible defaults.
- `Textarea`: solid default editor surface. Sprint A added `variant="default" | "editor" | "output"` and `minRows` while preserving existing visual behavior by default.
- `Field`: useful label/description/error wrapper. Sprint A added `density="comfortable" | "compact"` and `layout="stacked" | "inline"` without changing the default contract.
- `Button`, `CopyButton`, `Tabs`, `Slider`, `Card`, `SurfaceCard`, `ActionBar`, and `PreviewFrame`: already useful for tool UIs and should remain the generic foundation.

Main gap found: compact generator controls currently need a standard field/control system so visual tools stop using one-off rows, ad-hoc CSS, and full-width numeric inputs.

## Existing tool layouts

Darma already has the right route-level layouts under `src/features/tools/layouts`:

- `ToolLayoutVisualGenerator`: preview + controls visual generator layout.
- `ToolLayoutTextWorkbench`: input/output text workbench layout.
- `ToolLayoutSingleUtility`: focused utility/generator layout.
- `ToolLayoutFullscreenStudio`: immersive canvas/fullscreen tools.
- `ToolPage`: shared tool route shell.

Decision: do not create a competing `ToolStudioLayout`. New shared primitives should be used inside these layouts.

## Legacy UI patterns found

Search command:

```bash
rg "configuration|soft-shadow|className=\"row|style\.css|styles\.css|document\.documentElement\.style" src/app/tools src/components
```

Key results:

- `src/app/tools/buttons-css-generator/style.css` uses `.soft-shadow`, `.configuration`, and `.row` layout classes.
- `src/app/tools/buttons-css-generator/Configuration.tsx` uses `configuration soft-shadow` and nested `.row` markup.
- `src/app/tools/buttons-css-generator/Inputs.tsx` uses repeated `.row` markup.
- `src/app/tools/buttons-css-generator/page.tsx` imports `./style.css`.
- `src/app/tools/neumorphic-css-generator/style.css` uses `.soft-shadow`, `.configuration`, and `.row` layout classes.
- `src/app/tools/neumorphic-css-generator/Configuration.tsx` mutates `document.documentElement.style.cssText` and uses `configuration soft-shadow`.
- `src/app/tools/neumorphic-css-generator/ShapeSwitcher.tsx` uses `.row` markup.
- `src/app/tools/neumorphic-css-generator/page.tsx` imports `./style.css`.
- `src/app/tools/box-shadows-generator/page.tsx` imports `./styles.css`.
- `src/app/tools/beam-calculator/page.tsx` imports `./style.css`.
- `src/app/tools/svg-path-editor/page.tsx` imports `./style.css`.
- `src/components/ConfigurationRow/index.tsx` and `src/components/ConfigurationRow1.tsx` use `.row` patterns.
- `src/components/VariantSelector/index.tsx`, `CTAButton`, `RainbowButton`, `TestCard`, and `ToggleSwitch` import local CSS files.
- `src/components/ThemeToggle.tsx` uses `soft-shadow` classes.

Do not delete these yet; migrate them in planned tool-specific sprints.

## Full-width control risks

Search command:

```bash
rg "<Input|<Select|<Textarea|w-full" src/app/tools
```

Examples that should be reviewed during migration:

- `src/app/tools/animated-background-generator/Configuration.tsx`: full-width range, select, and compact control inputs.
- `src/app/tools/animated-background-generator/components/ControlPanel.tsx`: range and select controls for speed, intensity, particle count, blur, opacity, glow, blend mode, and shape.
- `src/app/tools/password-generator/PasswordGeneratorClient.tsx`: full-width sliders and numeric-like controls.
- `src/app/tools/css-gradient-generator/CssGradientGeneratorClient.tsx`: full-width compact controls for stop position/type/angle-like inputs.
- `src/app/tools/fake-screen/FakeScreenClient.tsx`: compact numeric controls, color pickers, and sliders use full-width ad-hoc inputs.
- `src/app/tools/color-shades/InputSection.tsx`: color/source controls use one-off input styling.
- Text workbench tools such as JSON, URL, Base64, and Text Cleaner intentionally use full-width textareas; those are acceptable.

Width rules for future refactors:

- Full width is good for textareas, code editors, generated output, URL/source inputs, and upload/dropzone areas.
- Compact or numeric widths are better for gap, radius, blur, opacity, row/column count, image dimensions, order, grow/shrink, and transform values.

## High-risk tools

### Legacy CSS/layout risk

- `src/app/tools/buttons-css-generator`
- `src/app/tools/neumorphic-css-generator`
- `src/app/tools/box-shadows-generator`
- `src/app/tools/beam-calculator`
- `src/app/tools/svg-path-editor`

### Global style mutation risk

- `src/app/tools/neumorphic-css-generator/Configuration.tsx`

### Large client component risk

- `src/app/tools/fake-screen/FakeScreenClient.tsx`
- `src/app/tools/beam-calculator/BeamCalculatorClient.tsx`
- `src/app/tools/svg-path-editor/SvgPathEditorClient.tsx`
- `src/app/tools/animated-background-generator/components/ControlPanel.tsx`

### Visual preview risk

- `src/app/tools/animated-background-generator`
- `src/app/tools/buttons-css-generator`
- `src/app/tools/neumorphic-css-generator`
- `src/app/tools/box-shadows-generator`
- `src/app/tools/css-gradient-generator`
- `src/app/tools/svg-path-editor`

### Text/editor risk

- `src/app/tools/json-formatter`
- `src/app/tools/base64-encoder-decoder`
- `src/app/tools/url-encoder-decoder`
- `src/app/tools/text-cleaner`
- `src/app/tools/code-preview` / `src/sections/CodePreviewTool`

## Safe migration order

1. Shared UI primitives
2. Pilot visual tools
3. Legacy visual tools
4. Layout tools
5. Text workbench tools
6. Utility tools
7. Directory/product polish

## Sprint A recommendations

Sprint A should add and standardize:

- `ToolControlPanel`
- `ControlSection`
- `ControlGrid`
- `CompactField`
- `SliderNumberField`
- `ColorField`
- `NumberField`
- `SegmentedControl`
- `PresetGallery`
- `PreviewToolbar`
- `CodeOutputPanel`
- `EditorPanel`
- `ResultPanel`
- `WarningPanel`
- `ToolMobileActions`
- `ToolArticle`

These components were added under `src/features/tools/components` for future sprints. Existing tools were intentionally not refactored in Sprint A.
