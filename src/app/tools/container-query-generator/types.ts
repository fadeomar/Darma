export type ContainerType = "inline-size" | "size" | "normal";
export type ContainerConditionType = "min-width" | "max-width" | "range";
export type ContainerUnit = "px" | "rem" | "em";

export type ComponentPresetId =
  | "responsive-card"
  | "product-card"
  | "profile-card"
  | "article-preview"
  | "pricing-card"
  | "dashboard-widget"
  | "sidebar-module"
  | "media-object"
  | "stats-card"
  | "feature-panel";

export type ContainerStyleRule = {
  id: string;
  selector: string;
  property: string;
  value: string;
};

export type ContainerBreakpoint = {
  id: string;
  name: string;
  conditionType: ContainerConditionType;
  minWidth?: number;
  maxWidth?: number;
  unit: ContainerUnit;
  styles: ContainerStyleRule[];
};

export type ContainerQueryExportOptions = {
  includeComments: boolean;
  includeDemoStyles: boolean;
  includeMediaQueryComparison: boolean;
  classPrefix: string;
};

export type ContainerQueryState = {
  presetId: ComponentPresetId;
  containerSelector: string;
  containerName: string;
  containerType: ContainerType;
  componentClassName: string;
  previewWidth: number;
  showContainerOutline: boolean;
  showBreakpointMarkers: boolean;
  showActiveRules: boolean;
  breakpoints: ContainerBreakpoint[];
  selectedBreakpointId: string | null;
  exportOptions: ContainerQueryExportOptions;
};

export type ContainerQueryValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  breakpointId?: string;
  ruleId?: string;
};
