/**
 * Semantic tool previews.
 *
 * Every tool card renders a small picture of what the tool actually does:
 * the input it takes and the output it returns. The compositions are grouped
 * into twelve families so the catalog reads as one system, but each tool
 * supplies its own content, so two tools in the same family never render the
 * same picture with a different title.
 *
 * Text inside a preview is HTML, not SVG, so it scales with the browser's text
 * settings. The whole preview is decorative (`aria-hidden`) because the card
 * title already names the tool.
 */

/** Highlight markers: text wrapped in guillemets renders as a match chip. */
export type MarkedText = string;

export type ToolPreviewFamily =
  | "text"
  | "data"
  | "code"
  | "calc"
  | "chart"
  | "color"
  | "image"
  | "geometry"
  | "security"
  | "time"
  | "meta"
  | "layout";

export type TextTone = "plain" | "muted" | "accent" | "strike" | "heading" | "bullet" | "code";

export type TextLine = { text: MarkedText; tone?: TextTone };

/** 1. Text transformation — a before pane, an operation, an after pane. */
export type TextPreviewConfig = {
  family: "text";
  /** Short verb shown on the arrow between the panes. */
  op: string;
  inputLabel: string;
  outputLabel: string;
  /** Optional mono bar above the panes (regex pattern, delimiter, rule). */
  pattern?: string;
  input: TextLine[];
  output: TextLine[];
  stat?: { label: string; value: string };
};

export type DataKind = "string" | "number" | "bool" | "null" | "brace" | "plain";

export type DataLine = {
  indent?: number;
  key?: string;
  value?: string;
  kind?: DataKind;
};

/** 2. JSON and structured data — a code window with real nesting. */
export type DataPreviewConfig = {
  family: "data";
  title: string;
  /** Coloured segment bar above the window (JWT header/payload/signature). */
  segments?: { label: string; tone: "one" | "two" | "three" }[];
  lines: DataLine[];
  status?: { tone: "ok" | "warn" | "error"; text: string };
};

/** 3. Code generation and formatting — controls on the left, code on the right. */
export type CodePreviewConfig = {
  family: "code";
  lang: string;
  chips?: string[];
  code: string[];
  /** Small rendered result beside the code, when the code produces a visual. */
  sample?: "button" | "badge" | "card" | "none";
};

/** 4. Calculators — the entered rows, then the single number they produce. */
export type CalcPreviewConfig = {
  family: "calc";
  inputs: { label: string; value: string }[];
  result: { label: string; value: string; unit?: string; note?: string };
  /** Optional band with a marker, for calculators that land on a scale. */
  scale?: { min: string; max: string; pos: number };
};

/** 5. Charts, measurements and performance. */
export type ChartPreviewConfig = {
  family: "chart";
  kind: "bars" | "line" | "donut";
  series: number[];
  metric: { label: string; value: string; delta?: string; tone?: "up" | "down" | "flat" };
  legend?: string[];
};

/** 6. Colour, gradients and design tokens. */
export type ColorPreviewConfig = {
  family: "color";
  swatches?: string[];
  rows?: { label: string; value: string }[];
  gradient?: string;
  stops?: string[];
  /**
   * Accessibility result for the shown colour. The catalog has no standalone
   * contrast checker; the tools that report contrast do it alongside their
   * values, which is what this renders.
   */
  verdict?: { text: string; tone: "ok" | "warn" | "error"; ratio?: string };
};

/** 7. Image processing. */
export type ImagePreviewConfig = {
  family: "image";
  mode: "before-after" | "srcset" | "device" | "canvas" | "fullscreen";
  before?: { label: string; tone: string };
  after?: { label: string; tone: string };
  badge?: string;
  variants?: { label: string; width: number }[];
  strokes?: string[];
  /** Fullscreen scene: background, centre label, and progress fill. */
  scene?: { tone: string; label: string; progress: number };
};

/** 8. SVG, paths and geometry. */
export type GeometryPreviewConfig = {
  family: "geometry";
  /** Drawn inside a 0 0 160 92 viewBox. */
  path: string;
  fill?: boolean;
  anchors?: [number, number][];
  handles?: [number, number, number, number][];
  guides?: [number, number, number, number][];
  code?: string;
  caption?: string;
};

/** 9. Security, validation and passwords. */
export type SecurityPreviewConfig = {
  family: "security";
  mode: "generated" | "checks";
  sample?: string;
  strength?: { label: string; level: 1 | 2 | 3 | 4 };
  checks?: { label: string; state: "ok" | "warn" | "fail" }[];
  meta?: { label: string; value: string }[];
};

/** 10. Date, time and timezone. */
export type TimePreviewConfig = {
  family: "time";
  mode: "convert" | "zones" | "duration" | "countdown";
  from: { label: string; value: string; sub?: string };
  to: { label: string; value: string; sub?: string };
  extra?: { label: string; value: string }[];
  dial?: number;
};

/** 11. Metadata, social cards and browser output. */
export type MetaPreviewConfig = {
  family: "meta";
  mode: "social" | "browser" | "qr" | "icons" | "lines";
  title?: string;
  description?: string;
  url?: string;
  chips?: string[];
  icons?: string[];
  lines?: string[];
  /** Deterministic seed for the QR-style matrix. */
  seed?: number;
};

/** 12. Layout, CSS and responsive design. */
export type LayoutPreviewConfig = {
  family: "layout";
  mode: "grid" | "flex" | "box" | "breakpoints" | "shadow" | "surface";
  cols?: number;
  rows?: number;
  cells?: number[];
  code?: string;
  breakpoints?: { label: string; width: number }[];
  surface?: string;
};

export type ToolPreviewConfig =
  | TextPreviewConfig
  | DataPreviewConfig
  | CodePreviewConfig
  | CalcPreviewConfig
  | ChartPreviewConfig
  | ColorPreviewConfig
  | ImagePreviewConfig
  | GeometryPreviewConfig
  | SecurityPreviewConfig
  | TimePreviewConfig
  | MetaPreviewConfig
  | LayoutPreviewConfig;

export const TOOL_PREVIEW_FAMILIES: ToolPreviewFamily[] = [
  "text",
  "data",
  "code",
  "calc",
  "chart",
  "color",
  "image",
  "geometry",
  "security",
  "time",
  "meta",
  "layout",
];
