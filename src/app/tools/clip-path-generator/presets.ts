import { regularPolygon, star } from "./clipPath";
import type { ClipPathPreset, ClipPoint } from "./types";

export const CLIP_PATH_PRESETS: ClipPathPreset[] = [
  {
    id: "triangle",
    name: "Triangle",
    category: "basic",
    description: "Upward-pointing triangle.",
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  },
  {
    id: "rhombus",
    name: "Rhombus / Diamond",
    category: "basic",
    description: "Four-point diamond.",
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
    ],
  },
  {
    id: "trapezoid",
    name: "Trapezoid",
    category: "basic",
    description: "Wider at the bottom.",
    points: [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  },
  {
    id: "parallelogram",
    name: "Parallelogram",
    category: "basic",
    description: "Slanted rectangle.",
    points: [
      { x: 25, y: 0 },
      { x: 100, y: 0 },
      { x: 75, y: 100 },
      { x: 0, y: 100 },
    ],
  },
  {
    id: "pentagon",
    name: "Pentagon",
    category: "polygon",
    description: "Regular 5-sided polygon.",
    points: regularPolygon(5),
  },
  {
    id: "hexagon",
    name: "Hexagon",
    category: "polygon",
    description: "Regular 6-sided polygon.",
    points: regularPolygon(6),
  },
  {
    id: "heptagon",
    name: "Heptagon",
    category: "polygon",
    description: "Regular 7-sided polygon.",
    points: regularPolygon(7),
  },
  {
    id: "octagon",
    name: "Octagon",
    category: "polygon",
    description: "Regular 8-sided polygon.",
    points: regularPolygon(8),
  },
  {
    id: "star",
    name: "Star (5-point)",
    category: "decorative",
    description: "Five-pointed star.",
    points: star(5, 0.5),
  },
  {
    id: "burst",
    name: "Burst (8-point)",
    category: "decorative",
    description: "Eight-pointed sparkle.",
    points: star(8, 0.55),
  },
  {
    id: "chevron-right",
    name: "Chevron",
    category: "arrow",
    description: "Right-pointing chevron band.",
    points: [
      { x: 0, y: 0 },
      { x: 75, y: 0 },
      { x: 100, y: 50 },
      { x: 75, y: 100 },
      { x: 0, y: 100 },
      { x: 25, y: 50 },
    ],
  },
  {
    id: "arrow-right",
    name: "Arrow",
    category: "arrow",
    description: "Right-pointing arrow.",
    points: [
      { x: 0, y: 30 },
      { x: 60, y: 30 },
      { x: 60, y: 0 },
      { x: 100, y: 50 },
      { x: 60, y: 100 },
      { x: 60, y: 70 },
      { x: 0, y: 70 },
    ],
  },
  {
    id: "message",
    name: "Message bubble",
    category: "decorative",
    description: "Speech bubble with a tail.",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 75 },
      { x: 30, y: 75 },
      { x: 15, y: 100 },
      { x: 15, y: 75 },
      { x: 0, y: 75 },
    ],
  },
  {
    id: "cross",
    name: "Cross / Plus",
    category: "decorative",
    description: "Plus symbol.",
    points: [
      { x: 35, y: 0 },
      { x: 65, y: 0 },
      { x: 65, y: 35 },
      { x: 100, y: 35 },
      { x: 100, y: 65 },
      { x: 65, y: 65 },
      { x: 65, y: 100 },
      { x: 35, y: 100 },
      { x: 35, y: 65 },
      { x: 0, y: 65 },
      { x: 0, y: 35 },
      { x: 35, y: 35 },
    ],
  },
];

export const DEFAULT_PRESET_ID = "hexagon";

export function getPresetById(id: string): ClipPathPreset | undefined {
  return CLIP_PATH_PRESETS.find((preset) => preset.id === id);
}

export const PRESET_MATCH_TOLERANCE = 0.05;

export function findMatchingPresetId(points: ClipPoint[], tolerance = PRESET_MATCH_TOLERANCE): string | null {
  const match = CLIP_PATH_PRESETS.find((preset) => {
    if (preset.points.length !== points.length) return false;
    return preset.points.every(
      (point, index) =>
        Math.abs(point.x - points[index].x) <= tolerance && Math.abs(point.y - points[index].y) <= tolerance,
    );
  });
  return match?.id ?? null;
}
