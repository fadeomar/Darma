import {
  ArrowUpRight,
  Brush,
  Circle as CircleIcon,
  Eraser,
  Highlighter,
  Minus,
  MousePointer2,
  ScanSearch,
  Square,
  Triangle as TriangleIcon,
  Type,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { ReactNode } from "react";
import type { PaintTool } from "../types";

const TOOLS: { tool: PaintTool; label: string; icon: ReactNode }[] = [
  { tool: "select", label: "Select", icon: <MousePointer2 className="h-4 w-4" /> },
  { tool: "brush", label: "Brush", icon: <Brush className="h-4 w-4" /> },
  { tool: "highlight", label: "Highlight", icon: <Highlighter className="h-4 w-4" /> },
  { tool: "eraser", label: "Eraser", icon: <Eraser className="h-4 w-4" /> },
  { tool: "line", label: "Line", icon: <Minus className="h-4 w-4" /> },
  { tool: "arrow", label: "Arrow", icon: <ArrowUpRight className="h-4 w-4" /> },
  { tool: "rectangle", label: "Rectangle", icon: <Square className="h-4 w-4" /> },
  { tool: "circle", label: "Circle", icon: <CircleIcon className="h-4 w-4" /> },
  { tool: "triangle", label: "Triangle", icon: <TriangleIcon className="h-4 w-4" /> },
  { tool: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { tool: "blur-region", label: "Blur region", icon: <ScanSearch className="h-4 w-4" /> },
  { tool: "pixelate-region", label: "Pixelate", icon: <Grid3X3 className="h-4 w-4" /> },
];

export default function ToolRail({ activeTool, onToolChange }: { activeTool: PaintTool; onToolChange: (tool: PaintTool) => void }) {
  return (
    <aside className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">Tools</div>
      <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
        {TOOLS.map((item) => (
          <Button
            key={item.tool}
            size="sm"
            variant={activeTool === item.tool ? "primary" : "ghost"}
            leftIcon={item.icon}
            onClick={() => onToolChange(item.tool)}
            aria-pressed={activeTool === item.tool}
            className="shrink-0 justify-start whitespace-nowrap xl:w-full"
          >
            {item.label}
          </Button>
        ))}
      </div>
    </aside>
  );
}
