# Beam Calculator Production Studio

A browser-local beam analysis and handoff tool for statically determinate simply supported beams and cantilevers. It calculates reactions, shear force, bending moment, key stations, SFD/BMD diagrams, and production-readiness findings.

> Educational and preliminary analysis only. A readiness result is not a structural capacity or code-compliance check.

## Privacy

`client-only` — calculations, diagrams, imports, and exports run in the browser. The latest setup is saved to `localStorage` under `darma-beam-calculator:v2`. No beam data is uploaded.

## Supported analysis

- Simply supported beams with two pin/roller supports at distinct positions.
- Cantilevers with one fixed support.
- Point loads, uniformly distributed loads, and applied moments.
- Vertical reactions, fixed-end moment, SFD, BMD, extrema, key stations, and force/moment equilibrium.
- Metric model units: m, kN, kN/m, and kN·m.

## Phase 33 production improvements

- Four fixed summary cards for beam type, applied loads, maximum absolute moment, and readiness.
- Severity-based production audit separate from field validation.
- Hardened project import:
  - 1 MB maximum file size in the UI.
  - Correct `tool` and `version` required for wrapped project files.
  - Unique, non-empty support and load IDs.
  - Non-negative load magnitudes; direction/rotation controls determine sign.
  - Defensive limits on imported support and load counts.
- Export formats:
  - Editable project JSON.
  - Solved results JSON.
  - Markdown calculation and readiness report.
  - CSV key-station table.
  - Standalone SVG containing SFD and BMD.
  - ZIP production pack with all handoff files and a scope README.

## Production pack

The ZIP contains:

- `beam-project.json`
- `beam-results.json`
- `beam-report.md`
- `beam-stations.csv`
- `beam-diagrams.svg`
- `README.md`

## Sign conventions

- x runs from the left end, `0`, to the right end, `L`.
- Upward force is positive; downward force is negative.
- Sagging bending moment is positive; hogging is negative.
- Counter-clockwise applied moments are positive; clockwise moments are negative.
- Magnitude inputs are stored as zero or positive values. Use the direction or rotation control to reverse an action.

## Architecture

| File                       | Role                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `page.tsx`                 | Metadata, JSON-LD, tool shell, and article                                     |
| `BeamCalculatorShell.tsx`  | Client-only dynamic mount                                                      |
| `BeamCalculatorClient.tsx` | State, persistence, input actions, audit UI, import, and exports               |
| `components/*`             | Beam inputs, schematic, diagrams, presets, and result views                    |
| `lib/beamAnalysis.ts`      | Reaction solver and shear/moment engine                                        |
| `lib/beamValidation.ts`    | Solver input guardrails                                                        |
| `lib/beamExport.ts`        | Project/result serialization and base report generation                        |
| `lib/studio.ts`            | Phase 33 audit, summary, CSV, SVG, Markdown, and ZIP exports                   |
| `__tests__/*`              | Solver, validation, import, explanation, coordinate, and production-pack tests |

## Scope limits

This tool does not calculate stress, member capacity, section classification, deflection, vibration, buckling, lateral torsional stability, connections, load combinations, partial factors, or code compliance. It is not a replacement for structural engineering software or professional review.
