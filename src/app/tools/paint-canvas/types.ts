export type PaintTool = "brush" | "eraser" | "line" | "rectangle" | "circle" | "triangle";

export type ExportFormat = "png" | "jpeg";

export type Point = { x: number; y: number };

export type PaintSettings = {
  tool: PaintTool;
  color: string;
  size: number;
  fill: boolean;
};

export const SHAPE_TOOLS: PaintTool[] = ["line", "rectangle", "circle", "triangle"];

export function isShapeTool(tool: PaintTool): boolean {
  return SHAPE_TOOLS.includes(tool);
}
