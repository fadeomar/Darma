import type { PaintSettings } from "../types";

/**
 * Intent-based quick starting styles.
 *
 * A starter only configures tool settings (tool, color, size, fill, opacity,
 * brush feel). It never adds, replaces, or clears canvas objects, so applying
 * one is always safe on an in-progress drawing.
 */
export type PaintStarter = {
  id: string;
  label: string;
  description: string;
  settings: Partial<PaintSettings>;
};

export const PAINT_STARTERS: PaintStarter[] = [
  {
    id: "quick-sketch",
    label: "Quick sketch",
    description: "Medium dark brush for wireframes and rough ideas.",
    settings: { tool: "brush", brushPreset: "pen", color: "#111827", size: 8, fill: false, opacity: 1 },
  },
  {
    id: "fine-notes",
    label: "Fine notes",
    description: "Thin fineliner stroke for handwriting and margin notes.",
    settings: { tool: "brush", brushPreset: "fineliner", color: "#111827", size: 3, fill: false, opacity: 1 },
  },
  {
    id: "redline-review",
    label: "Redline review",
    description: "Thin red stroke for screenshot and UI review markup.",
    settings: { tool: "brush", brushPreset: "fineliner", color: "#ef4444", size: 4, fill: false, opacity: 1 },
  },
  {
    id: "marker-callout",
    label: "Marker callout",
    description: "Bold blue marker for workshop boards and emphasis.",
    settings: { tool: "brush", brushPreset: "marker", color: "#2563eb", size: 20, fill: false, opacity: 1 },
  },
  {
    id: "highlight-passage",
    label: "Highlight passage",
    description: "Translucent yellow highlighter for text and table rows.",
    settings: { tool: "highlight", color: "#eab308", size: 18, fill: false, opacity: 0.35 },
  },
  {
    id: "pointer-arrow",
    label: "Pointer arrow",
    description: "Red arrow for pointing at the exact element in a screenshot.",
    settings: { tool: "arrow", color: "#ef4444", size: 5, fill: false, opacity: 1 },
  },
  {
    id: "diagram-lines",
    label: "Diagram lines",
    description: "Clean slate line tool for flowcharts and process maps.",
    settings: { tool: "line", color: "#64748b", size: 4, fill: false, opacity: 1 },
  },
  {
    id: "wireframe-boxes",
    label: "Wireframe boxes",
    description: "Outline rectangles for page and component wireframes.",
    settings: { tool: "rectangle", color: "#2563eb", size: 3, fill: false, opacity: 1 },
  },
  {
    id: "layout-blocking",
    label: "Layout blocking",
    description: "Filled violet rectangles for greyboxing and compositions.",
    settings: { tool: "rectangle", color: "#7c3aed", size: 3, fill: true, opacity: 0.9 },
  },
  {
    id: "status-dots",
    label: "Status dots",
    description: "Filled green circles for map pins, states, and legends.",
    settings: { tool: "circle", color: "#22c55e", size: 3, fill: true, opacity: 1 },
  },
  {
    id: "label-text",
    label: "Label text",
    description: "Dark text tool for captions, step numbers, and labels.",
    settings: { tool: "text", color: "#111827", size: 6, fill: false, opacity: 1 },
  },
  {
    id: "redact-details",
    label: "Redact details",
    description: "Pixelate region for hiding emails, keys, and account data.",
    settings: { tool: "pixelate-region", opacity: 1 },
  },
];

export const STARTER_PREVIEW_COUNT = 6;
