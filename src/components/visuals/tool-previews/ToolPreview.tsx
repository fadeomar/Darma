import {
  CalcPreview,
  ChartPreview,
  CodePreview,
  ColorPreview,
  DataPreview,
  GeometryPreview,
  ImagePreview,
  LayoutPreview,
  MetaPreview,
  SecurityPreview,
  TextPreview,
  TimePreview,
} from "./families";
import type { ToolPreviewConfig } from "./types";

/** Renders the composition for a resolved preview configuration. */
export function ToolPreview({ config }: { config: ToolPreviewConfig }) {
  switch (config.family) {
    case "text":
      return <TextPreview config={config} />;
    case "data":
      return <DataPreview config={config} />;
    case "code":
      return <CodePreview config={config} />;
    case "calc":
      return <CalcPreview config={config} />;
    case "chart":
      return <ChartPreview config={config} />;
    case "color":
      return <ColorPreview config={config} />;
    case "image":
      return <ImagePreview config={config} />;
    case "geometry":
      return <GeometryPreview config={config} />;
    case "security":
      return <SecurityPreview config={config} />;
    case "time":
      return <TimePreview config={config} />;
    case "meta":
      return <MetaPreview config={config} />;
    case "layout":
      return <LayoutPreview config={config} />;
    default:
      return null;
  }
}
