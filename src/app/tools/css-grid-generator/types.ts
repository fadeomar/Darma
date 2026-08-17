export type GridLengthUnit = "px" | "rem" | "%" | "fr" | "auto";

export type GridEditorMode = "select" | "draw" | "inspect";

export type GridBreakpoint = "desktop" | "tablet" | "mobile";

export type GridTrackMode = "equal" | "custom" | "repeat" | "minmax" | "auto-fit" | "auto-fill";

export type GridTrack = {
  id: string;
  value: string;
};

export type GridGap = {
  row: number;
  column: number;
  unit: "px" | "rem";
};

export type GridAlignment = "stretch" | "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";

export type GridSelfAlignment = "auto" | "stretch" | "start" | "center" | "end";

export type GridAutoFlow = "row" | "column" | "row dense" | "column dense";

export type GridNestedAxisMode = "independent" | "subgrid";

export type GridNestedItem = {
  id: string;
  name: string;
  content: string;
  columnStart: number;
  columnEnd: number;
  rowStart: number;
  rowEnd: number;
  background: string;
  textColor: string;
};

export type GridNestedGrid = {
  columnMode: GridNestedAxisMode;
  rowMode: GridNestedAxisMode;
  columns: number;
  rows: number;
  columnTemplate: string;
  rowTemplate: string;
  gap: GridGap;
  items: GridNestedItem[];
};

export type GridItem = {
  id: string;
  name: string;
  areaName: string;
  columnStart: number;
  columnEnd: number;
  rowStart: number;
  rowEnd: number;
  background: string;
  textColor: string;
  borderRadius: number;
  padding: string;
  content: string;
  justifySelf: GridSelfAlignment;
  alignSelf: GridSelfAlignment;
  nestedGrid?: GridNestedGrid | null;
};

export type GridItemPlacement = Pick<
  GridItem,
  "columnStart" | "columnEnd" | "rowStart" | "rowEnd"
>;

export type GridBreakpointLayout = {
  columns: number;
  rows: number;
  columnTemplate: string;
  rowTemplate: string;
  gap: GridGap;
  useTemplateAreas: boolean;
  justifyItems: GridSelfAlignment;
  alignItems: GridSelfAlignment;
  justifyContent: GridAlignment;
  alignContent: GridAlignment;
  autoFlow: GridAutoFlow;
  autoColumns: string;
  autoRows: string;
  placements: Record<string, GridItemPlacement>;
};

export type ResponsiveSettings = {
  enabled: boolean;
  tabletBreakpoint: number;
  mobileBreakpoint: number;
  /** Legacy settings retained so existing presets/URLs migrate without breaking. */
  tabletColumns: number;
  mobileBehavior: "stack" | "preserve" | "two-column";
  tabletLayout?: GridBreakpointLayout;
  mobileLayout?: GridBreakpointLayout;
};

export type GridGeneratorState = {
  columns: number;
  rows: number;
  columnTemplate: string;
  rowTemplate: string;
  gap: GridGap;
  containerClassName: string;
  itemClassPrefix: string;
  useTemplateAreas: boolean;
  includeDemoStyles: boolean;
  showGridLines: boolean;
  showLineNumbers: boolean;
  showAreaNames: boolean;
  previewWidth: number;
  justifyItems: GridSelfAlignment;
  alignItems: GridSelfAlignment;
  justifyContent: GridAlignment;
  alignContent: GridAlignment;
  autoFlow: GridAutoFlow;
  autoColumns: string;
  autoRows: string;
  responsive: ResponsiveSettings;
  items: GridItem[];
  selectedItemId: string | null;
};

export type GridValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  itemId?: string;
};

export type GridPreset = {
  id: string;
  name: string;
  description: string;
  state: GridGeneratorState;
};
