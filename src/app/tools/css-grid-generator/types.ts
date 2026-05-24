export type GridLengthUnit = "px" | "rem" | "%" | "fr" | "auto";

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
};

export type ResponsiveSettings = {
  enabled: boolean;
  tabletBreakpoint: number;
  mobileBreakpoint: number;
  tabletColumns: number;
  mobileBehavior: "stack" | "preserve" | "two-column";
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
