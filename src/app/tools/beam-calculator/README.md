# Beam Calculator Studio

A clear, user-friendly beam analysis tool for educational and preliminary calculations: supports, loads, reactions, shear force, bending moment, and visual diagrams.

> Educational and preliminary analysis only. Not a substitute for a licensed structural engineer.

## Privacy

`client-only` — every calculation and diagram runs in the browser. The latest setup is auto-saved to `localStorage` (key `darma-beam-calculator:v2`). No data is sent to any server.

## What it does

- Statically determinate beams: **simply supported** (two pin/roller supports) and **cantilever** (one fixed support).
- Loads: **point loads**, **uniformly distributed loads (UDL)**, and **applied moments** (up/down, CW/CCW).
- Outputs: support reactions, fixed-end moment (cantilever), shear force & bending moment at key stations, max shear, max sagging/hogging moment, max absolute moment, and an equilibrium check.
- Visuals: beam schematic with supports/loads/reactions, shear force diagram (SFD), bending moment diagram (BMD).
- Quality of life: presets, validation with field-level errors, auto-save/restore, reset, copy results, download JSON, download Markdown report, copy/import config JSON.

## Sign conventions

- x runs left (0) to right (L).
- Downward loads negative, upward reactions positive (UP-positive force axis).
- Sagging moment positive, hogging moment negative.
- Applied moments: CCW positive, CW negative.

## Architecture

| File | Role |
|---|---|
| `page.tsx` | Server component — metadata, JSON-LD, `ToolPage`, About article |
| `BeamCalculatorShell.tsx` | Dynamic (client-only) mount wrapper |
| `BeamCalculatorClient.tsx` | Orchestrator — state, persistence, actions, layout |
| `Article.tsx` | Educational About content |
| `components/BeamInputs.tsx` | Beam length + supports + loads control panel |
| `components/BeamSupportEditor.tsx` | Add/edit/remove supports |
| `components/BeamLoadEditor.tsx` | Add/edit/remove loads |
| `components/BeamPresetCards.tsx` | Preset gallery |
| `components/BeamCanvas.tsx` | Beam schematic SVG (supports, loads, reactions) |
| `components/BeamDiagram.tsx` | Reusable SFD/BMD SVG |
| `components/BeamResults.tsx` | Summary cards, station table, plain-language explanation |
| `lib/beamTypes.ts` | Data model and result types |
| `lib/beamAnalysis.ts` | Reaction solver + shear/moment engine |
| `lib/beamValidation.ts` | Input guardrails |
| `lib/beamPresets.ts` | Ready-to-solve scenarios |
| `lib/beamExport.ts` | Config/results serialization + reports |
| `lib/beamFormatting.ts` | Number formatting helpers |
| `__tests__/` | Vitest coverage for the engine and validation |

## Future enhancements

- Imperial units (data model already routes through `UNIT_SYSTEMS`).
- Overhanging supports and triangular/linear distributed loads (type union is open for this).
- SVG diagram export and deflection estimates.
