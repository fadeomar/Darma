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
  { id: "decagon", name: "Decagon", category: "polygon", description: "Regular 10-sided polygon for badges and medallions.", points: regularPolygon(10) },
  { id: "dodecagon", name: "Dodecagon", category: "polygon", description: "Regular 12-sided polygon with a softer circular feel.", points: regularPolygon(12) },
  { id: "arrow-left", name: "Arrow left", category: "arrow", description: "Left-pointing navigation or directional arrow.", points: [{x:100,y:30},{x:40,y:30},{x:40,y:0},{x:0,y:50},{x:40,y:100},{x:40,y:70},{x:100,y:70}] },
  { id: "arrow-up", name: "Arrow up", category: "arrow", description: "Upward arrow for scroll-to-top or directional UI.", points: [{x:30,y:100},{x:30,y:40},{x:0,y:40},{x:50,y:0},{x:100,y:40},{x:70,y:40},{x:70,y:100}] },
  { id: "arrow-down", name: "Arrow down", category: "arrow", description: "Downward arrow for scroll cues and callouts.", points: [{x:30,y:0},{x:70,y:0},{x:70,y:60},{x:100,y:60},{x:50,y:100},{x:0,y:60},{x:30,y:60}] },
  { id: "hero-diagonal", name: "Hero diagonal", category: "basic", description: "Diagonal lower edge for hero images and section separators.", points: [{x:0,y:0},{x:100,y:0},{x:100,y:78},{x:0,y:100}] },
  { id: "image-slant", name: "Image slant", category: "basic", description: "Slanted image frame for editorial and marketing media.", points: [{x:12,y:0},{x:100,y:0},{x:88,y:100},{x:0,y:100}] },
  { id: "cut-corners", name: "Cut corners", category: "basic", description: "Chamfered card shape with all four corners clipped.", points: [{x:10,y:0},{x:90,y:0},{x:100,y:10},{x:100,y:90},{x:90,y:100},{x:10,y:100},{x:0,y:90},{x:0,y:10}] },
  { id: "bookmark", name: "Bookmark", category: "decorative", description: "Bookmark or ribbon shape for saved-state UI.", points: [{x:15,y:0},{x:85,y:0},{x:85,y:100},{x:50,y:76},{x:15,y:100}] },
  { id: "tag", name: "Price tag", category: "decorative", description: "Tag silhouette for labels, pricing, and promotional graphics.", points: [{x:0,y:20},{x:70,y:20},{x:100,y:50},{x:70,y:80},{x:0,y:80}] },
  { id: "shield", name: "Shield", category: "decorative", description: "Shield shape for security, trust, and achievement badges.", points: [{x:50,y:0},{x:95,y:15},{x:88,y:68},{x:50,y:100},{x:12,y:68},{x:5,y:15}] },
  { id: "house", name: "House", category: "decorative", description: "Simple house silhouette for home and property UI.", points: [{x:0,y:45},{x:50,y:0},{x:100,y:45},{x:88,y:45},{x:88,y:100},{x:12,y:100},{x:12,y:45}] },
  { id: "lightning", name: "Lightning", category: "decorative", description: "Angular lightning bolt for energy and speed accents.", points: [{x:58,y:0},{x:20,y:55},{x:48,y:55},{x:35,y:100},{x:82,y:40},{x:55,y:40}] },
  { id: "notched-card", name: "Notched card", category: "decorative", description: "Card with side notches for tickets, coupons, and vouchers.", points: [{x:0,y:0},{x:100,y:0},{x:100,y:35},{x:90,y:50},{x:100,y:65},{x:100,y:100},{x:0,y:100},{x:0,y:65},{x:10,y:50},{x:0,y:35}] }
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
