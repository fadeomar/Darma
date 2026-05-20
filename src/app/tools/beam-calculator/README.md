# Beam Calculator

Canvas-first structural beam calculator with support and load placement, shear force diagrams (SFD), and bending moment diagrams (BMD).

## Privacy

`local-only` — all equilibrium calculations and diagram rendering run in the browser using the Canvas API. No data is sent to any server.

## Features

- Drag supports (pin, roller) and vertical point loads onto the beam canvas
- Automatic reaction force calculation from static equilibrium equations
- Real-time SFD and BMD rendering
- Phase 1.5: supports and vertical loads

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, full-width `ToolPage` |
| `BeamCalculatorShell.tsx` | Shell that mounts the canvas-based client |
| `BeamCalculatorClient.tsx` | `"use client"` — canvas rendering, drag interaction, equilibrium solver |
| `style.css` | Tool-scoped styles for the canvas and diagram panels |
