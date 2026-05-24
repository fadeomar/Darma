export type FlexDisplay = "flex" | "inline-flex";

export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";

export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

export type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export type AlignItems = "stretch" | "flex-start" | "center" | "flex-end" | "baseline";

export type AlignContent =
  | "stretch"
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export type FlexAlignSelf = "auto" | "stretch" | "flex-start" | "center" | "flex-end" | "baseline";

export type GapUnit = "px" | "rem";

export type FlexGap = {
  row: number;
  column: number;
  unit: GapUnit;
};

export type FlexItem = {
  id: string;
  name: string;
  content: string;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  width: string;
  height: string;
  order: number;
  alignSelf: FlexAlignSelf;
  marginLeftAuto: boolean;
  marginRightAuto: boolean;
  background: string;
  textColor: string;
  borderRadius: number;
  padding: string;
};

export type FlexResponsiveSettings = {
  enabled: boolean;
  tabletBreakpoint: number;
  mobileBreakpoint: number;
  tabletBehavior: "preserve" | "wrap" | "stack";
  mobileBehavior: "preserve" | "wrap" | "stack" | "center-stack";
};

export type FlexGeneratorState = {
  display: FlexDisplay;
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  alignContent: AlignContent;
  gap: FlexGap;
  containerClassName: string;
  itemClassPrefix: string;
  minHeight: number;
  padding: string;
  background: string;
  borderRadius: number;
  previewWidth: number;
  showAxisOverlay: boolean;
  showItemSizes: boolean;
  showGapMarkers: boolean;
  showWrapLines: boolean;
  includeDemoStyles: boolean;
  includeComments: boolean;
  responsive: FlexResponsiveSettings;
  items: FlexItem[];
  selectedItemId: string | null;
};

export type FlexValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  itemId?: string;
};

export type FlexQuickAction =
  | "center-everything"
  | "space-between"
  | "equal-items"
  | "wrap-cards"
  | "vertical-stack"
  | "push-last-end"
  | "selected-fill-remaining"
  | "reset-item-sizing";

export type FlexPreset = {
  id: string;
  name: string;
  description: string;
  state: FlexGeneratorState;
};
