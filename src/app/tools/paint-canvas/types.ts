export type PaintTool =
  | "select"
  | "brush"
  | "highlight"
  | "eraser"
  | "line"
  | "arrow"
  | "rectangle"
  | "circle"
  | "triangle"
  | "text"
  | "blur-region"
  | "pixelate-region";

export type ExportFormat = "png" | "jpeg" | "webp";
export type BrushPreset = "pen" | "fineliner" | "marker" | "brush";

export type Point = { x: number; y: number };

export type CanvasBackground = {
  mode: "solid" | "transparent";
  color: string;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasPreset = CanvasSize & {
  id: string;
  label: string;
  hint: string;
};

export type LocalSaveState = "idle" | "saving" | "saved" | "unavailable" | "error";

export type SelectedSummary = {
  label: string;
  count: number;
  isImage: boolean;
  isGroup: boolean;
  opacity: number;
  angle: number;
};

export type CanvasObjectSummary = {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  selected: boolean;
};

export type PaintSettings = {
  tool: PaintTool;
  color: string;
  size: number;
  fill: boolean;
  opacity: number;
  brushPreset: BrushPreset;
  stabilizer: number;
  dynamicWidth: boolean;
};

export const SHAPE_TOOLS: PaintTool[] = ["line", "arrow", "rectangle", "circle", "triangle"];
export const PRIVACY_TOOLS: PaintTool[] = ["blur-region", "pixelate-region"];

export function isShapeTool(tool: PaintTool): boolean {
  return SHAPE_TOOLS.includes(tool);
}

export function isPrivacyTool(tool: PaintTool): boolean {
  return PRIVACY_TOOLS.includes(tool);
}

export function isFreeDrawingTool(tool: PaintTool): boolean {
  return tool === "brush" || tool === "highlight" || tool === "eraser";
}
