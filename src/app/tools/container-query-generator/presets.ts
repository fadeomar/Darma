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
  {
    id: "search-result",
    name: "Search result",
    description: "Result row that hides secondary metadata when space is tight and expands on wide surfaces.",
    state: base({ presetId: "search-result", containerName: "result", containerSelector: ".result-wrapper", componentClassName: "search-result", previewWidth: 620, previewMode: "article", selectedBreakpointId: "result-wide", breakpoints: [
      createBreakpoint({ id: "result-compact", name: "Compact result", conditionType: "max-width", maxWidth: 420, unit: "px", styles: [createStyleRule({ selector: ".search-result__meta", property: "display", value: "none" }), createStyleRule({ selector: ".search-result", property: "gap", value: "0.75rem" })] }),
      createBreakpoint({ id: "result-wide", name: "Wide result", conditionType: "min-width", minWidth: 560, unit: "px", styles: [createStyleRule({ selector: ".search-result", property: "display", value: "grid" }), createStyleRule({ selector: ".search-result", property: "grid-template-columns", value: "160px 1fr auto" })] }),
    ] }),
  },
  {
    id: "checkout-summary",
    name: "Checkout summary",
    description: "Order summary that becomes denser in a narrow checkout sidebar and roomier in full-width layouts.",
    state: base({ presetId: "checkout-summary", containerName: "checkout", containerSelector: ".checkout-summary-wrapper", componentClassName: "checkout-summary", previewWidth: 380, previewMode: "product", selectedBreakpointId: "checkout-wide", breakpoints: [
      createBreakpoint({ id: "checkout-narrow", name: "Sidebar", conditionType: "max-width", maxWidth: 360, unit: "px", styles: [createStyleRule({ selector: ".checkout-summary", property: "padding", value: "1rem" }), createStyleRule({ selector: ".checkout-summary__items", property: "gap", value: "0.5rem" })] }),
      createBreakpoint({ id: "checkout-wide", name: "Expanded", conditionType: "min-width", minWidth: 520, unit: "px", styles: [createStyleRule({ selector: ".checkout-summary", property: "padding", value: "1.75rem" }), createStyleRule({ selector: ".checkout-summary__total", property: "font-size", value: "1.5rem" })] }),
    ] }),
  },
  {
    id: "notification-panel",
    name: "Notification panel",
    description: "Notification list that simplifies timestamps and actions in narrow popovers.",
    state: base({ presetId: "notification-panel", containerName: "notifications", containerSelector: ".notification-panel-wrapper", componentClassName: "notification-panel", previewWidth: 360, previewMode: "card", selectedBreakpointId: "notifications-wide", breakpoints: [
      createBreakpoint({ id: "notifications-narrow", name: "Popover", conditionType: "max-width", maxWidth: 340, unit: "px", styles: [createStyleRule({ selector: ".notification__time", property: "display", value: "none" }), createStyleRule({ selector: ".notification", property: "padding", value: "0.75rem" })] }),
      createBreakpoint({ id: "notifications-wide", name: "Panel", conditionType: "min-width", minWidth: 480, unit: "px", styles: [createStyleRule({ selector: ".notification", property: "display", value: "grid" }), createStyleRule({ selector: ".notification", property: "grid-template-columns", value: "auto 1fr auto" })] }),
    ] }),
  },
  {
    id: "team-member-card",
    name: "Team member card",
    description: "Avatar, role, and actions that switch between centered card and horizontal directory row.",
    state: base({ presetId: "team-member-card", containerName: "member", containerSelector: ".member-wrapper", componentClassName: "team-member-card", previewWidth: 520, previewMode: "card", selectedBreakpointId: "member-row", breakpoints: [
      createBreakpoint({ id: "member-card", name: "Card", conditionType: "max-width", maxWidth: 360, unit: "px", styles: [createStyleRule({ selector: ".team-member-card", property: "text-align", value: "center" }), createStyleRule({ selector: ".team-member-card__actions", property: "justify-content", value: "center" })] }),
      createBreakpoint({ id: "member-row", name: "Directory row", conditionType: "min-width", minWidth: 500, unit: "px", styles: [createStyleRule({ selector: ".team-member-card", property: "display", value: "grid" }), createStyleRule({ selector: ".team-member-card", property: "grid-template-columns", value: "72px 1fr auto" }), createStyleRule({ selector: ".team-member-card", property: "align-items", value: "center" })] }),
    ] }),
  },
  {
    id: "video-card",
    name: "Video card",
    description: "Thumbnail and metadata that shift from stacked card to horizontal media row.",
    state: base({ presetId: "video-card", containerName: "video", containerSelector: ".video-wrapper", componentClassName: "video-card", previewWidth: 640, previewMode: "article", selectedBreakpointId: "video-row", breakpoints: [
      createBreakpoint({ id: "video-stack", name: "Stacked", conditionType: "max-width", maxWidth: 420, unit: "px", styles: [createStyleRule({ selector: ".video-card", property: "display", value: "block" }), createStyleRule({ selector: ".video-card__thumbnail", property: "aspect-ratio", value: "16 / 9" })] }),
      createBreakpoint({ id: "video-row", name: "Horizontal", conditionType: "min-width", minWidth: 560, unit: "px", styles: [createStyleRule({ selector: ".video-card", property: "display", value: "grid" }), createStyleRule({ selector: ".video-card", property: "grid-template-columns", value: "240px 1fr" })] }),
    ] }),
  },
  {
    id: "filter-panel",
    name: "Filter panel",
    description: "Filter controls that collapse detail in narrow sidebars and spread into columns when embedded wider.",
    state: base({ presetId: "filter-panel", containerName: "filters", containerSelector: ".filter-panel-wrapper", componentClassName: "filter-panel", previewWidth: 320, previewMode: "dashboard", selectedBreakpointId: "filters-wide", breakpoints: [
      createBreakpoint({ id: "filters-narrow", name: "Sidebar", conditionType: "max-width", maxWidth: 360, unit: "px", styles: [createStyleRule({ selector: ".filter-panel", property: "display", value: "block" }), createStyleRule({ selector: ".filter-panel__helper", property: "display", value: "none" })] }),
      createBreakpoint({ id: "filters-wide", name: "Inline filters", conditionType: "min-width", minWidth: 720, unit: "px", styles: [createStyleRule({ selector: ".filter-panel", property: "display", value: "grid" }), createStyleRule({ selector: ".filter-panel", property: "grid-template-columns", value: "repeat(3, minmax(0, 1fr))" })] }),
    ] }),
  },
  {
    id: "comment-thread",
    name: "Comment thread",
    description: "Conversation item that reduces avatar and metadata weight in constrained columns.",
    state: base({ presetId: "comment-thread", containerName: "comment", containerSelector: ".comment-wrapper", componentClassName: "comment", previewWidth: 560, previewMode: "article", selectedBreakpointId: "comment-wide", breakpoints: [
      createBreakpoint({ id: "comment-compact", name: "Compact", conditionType: "max-width", maxWidth: 380, unit: "px", styles: [createStyleRule({ selector: ".comment__avatar", property: "inline-size", value: "32px" }), createStyleRule({ selector: ".comment__meta", property: "font-size", value: "0.75rem" })] }),
      createBreakpoint({ id: "comment-wide", name: "Comfortable", conditionType: "min-width", minWidth: 500, unit: "px", styles: [createStyleRule({ selector: ".comment", property: "grid-template-columns", value: "48px 1fr" }), createStyleRule({ selector: ".comment", property: "gap", value: "1rem" })] }),
    ] }),
  },
  {
    id: "comparison-row",
    name: "Comparison row",
    description: "Feature-comparison row that hides supporting notes in tight cards and expands into multiple columns.",
    state: base({ presetId: "comparison-row", containerName: "comparison", containerSelector: ".comparison-wrapper", componentClassName: "comparison-row", previewWidth: 760, previewMode: "dashboard", selectedBreakpointId: "comparison-wide", breakpoints: [
      createBreakpoint({ id: "comparison-tight", name: "Tight", conditionType: "max-width", maxWidth: 480, unit: "px", styles: [createStyleRule({ selector: ".comparison-row__note", property: "display", value: "none" }), createStyleRule({ selector: ".comparison-row", property: "grid-template-columns", value: "1fr auto" })] }),
      createBreakpoint({ id: "comparison-wide", name: "Comparison table", conditionType: "min-width", minWidth: 680, unit: "px", styles: [createStyleRule({ selector: ".comparison-row", property: "grid-template-columns", value: "2fr repeat(3, 1fr)" }), createStyleRule({ selector: ".comparison-row", property: "gap", value: "1rem" })] }),
    ] }),
  },
  {
    id: "calendar-event",
    name: "Calendar event",
    description: "Event chip/card that reveals location and actions as the calendar column grows.",
    state: base({ presetId: "calendar-event", containerName: "event", containerSelector: ".event-wrapper", componentClassName: "calendar-event", previewWidth: 420, previewMode: "dashboard", selectedBreakpointId: "event-wide", breakpoints: [
      createBreakpoint({ id: "event-small", name: "Calendar cell", conditionType: "max-width", maxWidth: 240, unit: "px", styles: [createStyleRule({ selector: ".calendar-event__location", property: "display", value: "none" }), createStyleRule({ selector: ".calendar-event", property: "padding", value: "0.5rem" })] }),
      createBreakpoint({ id: "event-wide", name: "Agenda card", conditionType: "min-width", minWidth: 380, unit: "px", styles: [createStyleRule({ selector: ".calendar-event", property: "display", value: "grid" }), createStyleRule({ selector: ".calendar-event", property: "grid-template-columns", value: "80px 1fr auto" })] }),
    ] }),
  },
  {
    id: "cta-banner",
    name: "CTA banner",
    description: "Marketing callout that stacks content in narrow regions and aligns copy with actions when wider.",
    state: base({ presetId: "cta-banner", containerName: "cta", containerSelector: ".cta-wrapper", componentClassName: "cta-banner", previewWidth: 760, previewMode: "card", selectedBreakpointId: "cta-row", breakpoints: [
      createBreakpoint({ id: "cta-stack", name: "Stacked CTA", conditionType: "max-width", maxWidth: 520, unit: "px", styles: [createStyleRule({ selector: ".cta-banner", property: "display", value: "block" }), createStyleRule({ selector: ".cta-banner__actions", property: "margin-top", value: "1rem" })] }),
      createBreakpoint({ id: "cta-row", name: "Inline CTA", conditionType: "min-width", minWidth: 640, unit: "px", styles: [createStyleRule({ selector: ".cta-banner", property: "display", value: "grid" }), createStyleRule({ selector: ".cta-banner", property: "grid-template-columns", value: "1fr auto" }), createStyleRule({ selector: ".cta-banner", property: "align-items", value: "center" })] }),
    ] }),
  },
];
