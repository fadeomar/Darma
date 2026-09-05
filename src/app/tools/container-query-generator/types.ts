export type ContainerType = "inline-size" | "size" | "normal";
export type ContainerConditionType = "min-width" | "max-width" | "range";
export type ContainerUnit = "px" | "rem" | "em";
export type ContainerPreviewMode = "card" | "product" | "dashboard" | "article";

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
  | "feature-panel"
  | "search-result"
  | "checkout-summary"
  | "notification-panel"
  | "team-member-card"
  | "video-card"
  | "filter-panel"
  | "comment-thread"
  | "comparison-row"
  | "calendar-event"
  | "cta-banner";

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
  includeSupportsGuard: boolean;
  includeFallbackLayer: boolean;
  includeContainerUnits: boolean;
  classPrefix: string;
};

export type ContainerQueryState = {
  presetId: ComponentPresetId;
  containerSelector: string;
  containerName: string;
  containerType: ContainerType;
  componentClassName: string;
  previewWidth: number;
  previewMode: ContainerPreviewMode;
  showContainerOutline: boolean;
  showBreakpointMarkers: boolean;
  showActiveRules: boolean;
  showDemoContent: boolean;
  breakpoints: ContainerBreakpoint[];
  selectedBreakpointId: string | null;
  exportOptions: ContainerQueryExportOptions;
};

export type ContainerQueryValidationMessage = {
  type: "info" | "warning" | "error" | "success";
  message: string;
  breakpointId?: string;
  ruleId?: string;
};

export type ContainerQuerySummary = {
  breakpoints: number;
  rules: number;
  active: number;
  maxWidth: number;
};
