import { createBreakpoint, createDefaultContainerQueryState, createStyleRule } from "./containerQuery";
import type { ComponentPresetId, ContainerQueryState } from "./types";

type Preset = {
  id: ComponentPresetId;
  name: string;
  description: string;
  state: ContainerQueryState;
};

function base(overrides: Partial<ContainerQueryState> = {}): ContainerQueryState {
  return { ...createDefaultContainerQueryState(), ...overrides };
}

export const CONTAINER_QUERY_PRESETS: Preset[] = [
  {
    id: "responsive-card",
    name: "Responsive card",
    description: "A card that changes from stacked to horizontal as its container grows.",
    state: createDefaultContainerQueryState(),
  },
  {
    id: "product-card",
    name: "Product card",
    description: "Product media, price, details, and action layout.",
    state: base({
      presetId: "product-card",
      containerName: "product",
      containerSelector: ".product-wrapper",
      componentClassName: "product-card",
      selectedBreakpointId: "product-wide",
      breakpoints: [
        createBreakpoint({
          id: "product-compact",
          name: "Compact product",
          conditionType: "max-width",
          maxWidth: 420,
          unit: "px",
          styles: [
            createStyleRule({ selector: ".product-card", property: "display", value: "block" }),
            createStyleRule({ selector: ".product-card__actions", property: "display", value: "grid" }),
          ],
        }),
        createBreakpoint({
          id: "product-wide",
          name: "Wide product",
          conditionType: "min-width",
          minWidth: 560,
          unit: "px",
          styles: [
            createStyleRule({ selector: ".product-card", property: "display", value: "grid" }),
            createStyleRule({ selector: ".product-card", property: "grid-template-columns", value: "220px 1fr" }),
            createStyleRule({ selector: ".product-card__title", property: "font-size", value: "1.6rem" }),
          ],
        }),
      ],
    }),
  },
  {
    id: "profile-card",
    name: "Profile card",
    description: "Avatar and bio component for sidebars or full content areas.",
    state: base({
      presetId: "profile-card",
      containerName: "profile",
      containerSelector: ".profile-wrapper",
      componentClassName: "profile-card",
      previewWidth: 460,
      selectedBreakpointId: "profile-row",
      breakpoints: [
        createBreakpoint({
          id: "profile-stack",
          name: "Stacked profile",
          conditionType: "max-width",
          maxWidth: 359,
          unit: "px",
          styles: [
            createStyleRule({ selector: ".profile-card", property: "text-align", value: "center" }),
            createStyleRule({ selector: ".profile-card__media", property: "aspect-ratio", value: "1" }),
          ],
        }),
        createBreakpoint({
          id: "profile-row",
          name: "Profile row",
          conditionType: "min-width",
          minWidth: 420,
          unit: "px",
          styles: [
            createStyleRule({ selector: ".profile-card", property: "display", value: "grid" }),
            createStyleRule({ selector: ".profile-card", property: "grid-template-columns", value: "120px 1fr" }),
            createStyleRule({ selector: ".profile-card", property: "align-items", value: "center" }),
          ],
        }),
      ],
    }),
  },
  {
    id: "article-preview",
    name: "Article preview",
    description: "Editorial card with image, title, excerpt, and metadata.",
    state: base({
      presetId: "article-preview",
      containerName: "article",
      containerSelector: ".article-wrapper",
      componentClassName: "article-card",
      previewWidth: 620,
      selectedBreakpointId: "article-featured",
      breakpoints: [
        createBreakpoint({ id: "article-list", name: "List item", conditionType: "min-width", minWidth: 420, unit: "px", styles: [
          createStyleRule({ selector: ".article-card", property: "display", value: "grid" }),
          createStyleRule({ selector: ".article-card", property: "grid-template-columns", value: "160px 1fr" }),
        ] }),
        createBreakpoint({ id: "article-featured", name: "Featured", conditionType: "min-width", minWidth: 760, unit: "px", styles: [
          createStyleRule({ selector: ".article-card", property: "grid-template-columns", value: "300px 1fr" }),
          createStyleRule({ selector: ".article-card__title", property: "font-size", value: "2rem" }),
        ] }),
      ],
    }),
  },
  {
    id: "pricing-card",
    name: "Pricing card",
    description: "Pricing module with compact and expanded sales content.",
    state: base({
      presetId: "pricing-card",
      containerName: "pricing",
      containerSelector: ".pricing-wrapper",
      componentClassName: "pricing-card",
      previewWidth: 380,
      selectedBreakpointId: "pricing-expanded",
      breakpoints: [
        createBreakpoint({ id: "pricing-compact", name: "Compact", conditionType: "max-width", maxWidth: 360, unit: "px", styles: [
          createStyleRule({ selector: ".pricing-card__description", property: "display", value: "none" }),
          createStyleRule({ selector: ".pricing-card", property: "padding", value: "1rem" }),
        ] }),
        createBreakpoint({ id: "pricing-expanded", name: "Expanded", conditionType: "min-width", minWidth: 520, unit: "px", styles: [
          createStyleRule({ selector: ".pricing-card", property: "padding", value: "2rem" }),
          createStyleRule({ selector: ".pricing-card__title", property: "font-size", value: "1.9rem" }),
        ] }),
      ],
    }),
  },
  {
    id: "dashboard-widget",
    name: "Dashboard widget",
    description: "Metric card that expands into a richer layout when space allows.",
    state: base({
      presetId: "dashboard-widget",
      containerName: "widget",
      containerSelector: ".widget-wrapper",
      componentClassName: "dashboard-widget",
      selectedBreakpointId: "widget-rich",
      breakpoints: [
        createBreakpoint({ id: "widget-compact", name: "Compact widget", conditionType: "max-width", maxWidth: 340, unit: "px", styles: [
          createStyleRule({ selector: ".dashboard-widget__actions", property: "display", value: "none" }),
          createStyleRule({ selector: ".dashboard-widget__title", property: "font-size", value: "1.1rem" }),
        ] }),
        createBreakpoint({ id: "widget-rich", name: "Rich widget", conditionType: "min-width", minWidth: 640, unit: "px", styles: [
          createStyleRule({ selector: ".dashboard-widget", property: "grid-template-columns", value: "1fr 180px" }),
          createStyleRule({ selector: ".dashboard-widget", property: "padding", value: "1.75rem" }),
        ] }),
      ],
    }),
  },
  {
    id: "sidebar-module",
    name: "Sidebar module",
    description: "Compact module for narrow sidebars and wider content areas.",
    state: base({ presetId: "sidebar-module", containerName: "module", containerSelector: ".module-wrapper", componentClassName: "sidebar-module", previewWidth: 320 }),
  },
  {
    id: "media-object",
    name: "Media object",
    description: "Image or avatar beside flexible content.",
    state: base({ presetId: "media-object", containerName: "media", containerSelector: ".media-wrapper", componentClassName: "media-object", previewWidth: 500 }),
  },
  {
    id: "stats-card",
    name: "Stats card",
    description: "Metric card that reveals supporting detail when wider.",
    state: base({ presetId: "stats-card", containerName: "stats", containerSelector: ".stats-wrapper", componentClassName: "stats-card", previewWidth: 430 }),
  },
  {
    id: "feature-panel",
    name: "Feature panel",
    description: "Marketing feature panel with expanded visual treatment.",
    state: base({ presetId: "feature-panel", containerName: "feature", containerSelector: ".feature-wrapper", componentClassName: "feature-panel", previewWidth: 680 }),
  },
];
