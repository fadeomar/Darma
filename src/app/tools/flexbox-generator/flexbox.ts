import type { CSSProperties } from "react";
import type {
  FlexGeneratorState,
  FlexItem,
  FlexQuickAction,
  FlexValidationMessage,
} from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const uid = () => Math.random().toString(36).slice(2, 9);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const toClassName = (value: string, fallback: string) => {
  const clean = value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return clean || fallback;
};

export function createFlexItem(partial: Partial<FlexItem> = {}): FlexItem {
  const id = partial.id ?? `item-${uid()}`;
  const name = partial.name ?? "Flex item";

  return {
    id,
    name,
    content: partial.content ?? name,
    flexGrow: partial.flexGrow ?? 0,
    flexShrink: partial.flexShrink ?? 1,
    flexBasis: partial.flexBasis ?? "auto",
    width: partial.width ?? "auto",
    height: partial.height ?? "auto",
    order: partial.order ?? 0,
    alignSelf: partial.alignSelf ?? "auto",
    marginLeftAuto: partial.marginLeftAuto ?? false,
    marginRightAuto: partial.marginRightAuto ?? false,
    background: partial.background ?? "#2563eb",
    textColor: partial.textColor ?? "#ffffff",
    borderRadius: partial.borderRadius ?? 18,
    padding: partial.padding ?? "1rem",
  };
}

export function createDefaultFlexState(): FlexGeneratorState {
  const items = [
    createFlexItem({ id: "logo", name: "Logo", content: "Darma", flexGrow: 0, flexBasis: "140px", background: "#4f46e5" }),
    createFlexItem({ id: "nav", name: "Navigation", content: "Docs · Tools · Pricing", flexGrow: 1, flexBasis: "280px", background: "#0f766e" }),
    createFlexItem({ id: "search", name: "Search", content: "Search", flexGrow: 0, flexBasis: "180px", background: "#9333ea" }),
    createFlexItem({ id: "actions", name: "Actions", content: "Sign in", flexGrow: 0, flexBasis: "120px", background: "#ea580c" }),
  ];

  return {
    display: "flex",
    direction: "row",
    wrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    alignContent: "stretch",
    gap: { row: 1, column: 1, unit: "rem" },
    containerClassName: "flex-layout",
    itemClassPrefix: "flex-item",
    minHeight: 260,
    padding: "1.25rem",
    background: "#f8fafc",
    borderRadius: 24,
    previewWidth: 960,
    showAxisOverlay: true,
    showItemSizes: true,
    showGapMarkers: true,
    showWrapLines: true,
    includeDemoStyles: true,
    includeComments: true,
    responsive: {
      enabled: true,
      tabletBreakpoint: 768,
      mobileBreakpoint: 640,
      tabletBehavior: "wrap",
      mobileBehavior: "stack",
    },
    items,
    selectedItemId: items[0]?.id ?? null,
  };
}

export function normalizeFlexState(state: FlexGeneratorState): FlexGeneratorState {
  const itemCount = Math.max(1, Math.min(state.items.length, 20));
  const items = state.items.slice(0, itemCount).map((item) => ({
    ...item,
    name: item.name.trim() || "Flex item",
    content: item.content,
    flexGrow: clamp(Number(item.flexGrow) || 0, 0, 12),
    flexShrink: clamp(Number(item.flexShrink) || 0, 0, 12),
    order: clamp(Math.round(Number(item.order) || 0), -12, 12),
    borderRadius: clamp(Number(item.borderRadius) || 0, 0, 64),
    flexBasis: item.flexBasis.trim() || "auto",
    width: item.width.trim() || "auto",
    height: item.height.trim() || "auto",
    padding: item.padding.trim() || "1rem",
  }));

  return {
    ...state,
    containerClassName: toClassName(state.containerClassName, "flex-layout"),
    itemClassPrefix: toClassName(state.itemClassPrefix, "flex-item"),
    minHeight: clamp(Number(state.minHeight) || 260, 120, 800),
    borderRadius: clamp(Number(state.borderRadius) || 0, 0, 64),
    gap: {
      row: clamp(Number(state.gap.row) || 0, 0, state.gap.unit === "rem" ? 6 : 96),
      column: clamp(Number(state.gap.column) || 0, 0, state.gap.unit === "rem" ? 6 : 96),
      unit: state.gap.unit,
    },
    previewWidth: clamp(Number(state.previewWidth) || 960, 320, 1440),
    responsive: {
      ...state.responsive,
      tabletBreakpoint: clamp(Number(state.responsive.tabletBreakpoint) || 768, 480, 1200),
      mobileBreakpoint: clamp(Number(state.responsive.mobileBreakpoint) || 640, 320, 900),
    },
    items,
    selectedItemId: items.some((item) => item.id === state.selectedItemId) ? state.selectedItemId : items[0]?.id ?? null,
  };
}

const gapValue = (state: FlexGeneratorState) => `${state.gap.row}${state.gap.unit} ${state.gap.column}${state.gap.unit}`;
const itemClass = (state: FlexGeneratorState, index: number) => `${state.itemClassPrefix}-${index + 1}`;
const itemSelector = (state: FlexGeneratorState, index: number) => `.${itemClass(state, index)}`;

function itemCssRules(state: FlexGeneratorState, item: FlexItem, index: number): string[] {
  const lines = [`${itemSelector(state, index)} {`, `  flex: ${item.flexGrow} ${item.flexShrink} ${item.flexBasis};`];
  if (item.width !== "auto") lines.push(`  width: ${item.width};`);
  if (item.height !== "auto") lines.push(`  height: ${item.height};`);
  if (item.order !== 0) lines.push(`  order: ${item.order};`);
  if (item.alignSelf !== "auto") lines.push(`  align-self: ${item.alignSelf};`);
  if (item.marginLeftAuto) lines.push("  margin-left: auto;");
  if (item.marginRightAuto) lines.push("  margin-right: auto;");
  if (state.includeDemoStyles) {
    lines.push(`  background: ${item.background};`);
    lines.push(`  color: ${item.textColor};`);
    lines.push(`  border-radius: ${item.borderRadius}px;`);
    lines.push(`  padding: ${item.padding};`);
  }
  lines.push("}");
  return lines;
}

export function generateFlexCss(state: FlexGeneratorState): string {
  const normalized = normalizeFlexState(state);
  const className = normalized.containerClassName;
  const lines: string[] = [];

  if (normalized.includeComments) lines.push("/* Flexbox layout generated by Darma */");
  lines.push(`.${className} {`);
  lines.push(`  display: ${normalized.display};`);
  lines.push(`  flex-direction: ${normalized.direction};`);
  lines.push(`  flex-wrap: ${normalized.wrap};`);
  lines.push(`  justify-content: ${normalized.justifyContent};`);
  lines.push(`  align-items: ${normalized.alignItems};`);
  lines.push(`  align-content: ${normalized.alignContent};`);
  lines.push(`  gap: ${gapValue(normalized)};`);
  if (normalized.includeDemoStyles) {
    lines.push(`  min-height: ${normalized.minHeight}px;`);
    lines.push(`  padding: ${normalized.padding};`);
    lines.push(`  background: ${normalized.background};`);
    lines.push(`  border-radius: ${normalized.borderRadius}px;`);
  }
  lines.push("}", "");

  normalized.items.forEach((item, index) => {
    lines.push(...itemCssRules(normalized, item, index), "");
  });

  if (normalized.responsive.enabled) {
    lines.push(`@media (max-width: ${normalized.responsive.tabletBreakpoint}px) {`);
    lines.push(`  .${className} {`);
    if (normalized.responsive.tabletBehavior === "wrap") lines.push("    flex-wrap: wrap;");
    if (normalized.responsive.tabletBehavior === "stack") lines.push("    flex-direction: column;");
    lines.push("  }");
    if (normalized.responsive.tabletBehavior === "wrap") {
      lines.push(`  .${className} > * {`);
      lines.push("    flex-basis: min(100%, 240px);");
      lines.push("  }");
    }
    lines.push("}", "");

    lines.push(`@media (max-width: ${normalized.responsive.mobileBreakpoint}px) {`);
    lines.push(`  .${className} {`);
    if (normalized.responsive.mobileBehavior === "stack" || normalized.responsive.mobileBehavior === "center-stack") {
      lines.push("    flex-direction: column;");
      lines.push("    align-items: stretch;");
    } else if (normalized.responsive.mobileBehavior === "wrap") {
      lines.push("    flex-wrap: wrap;");
    }
    if (normalized.responsive.mobileBehavior === "center-stack") {
      lines.push("    justify-content: center;");
      lines.push("    text-align: center;");
    }
    lines.push("  }");
    if (normalized.responsive.mobileBehavior === "stack" || normalized.responsive.mobileBehavior === "center-stack") {
      lines.push(`  .${className} > * {`);
      lines.push("    width: 100%;");
      lines.push("    flex-basis: auto;");
      lines.push("    margin-left: 0;");
      lines.push("    margin-right: 0;");
      lines.push("  }");
    }
    lines.push("}");
  }

  return lines.join("\n").trim();
}

export function generateFlexHtml(state: FlexGeneratorState): string {
  const normalized = normalizeFlexState(state);
  const children = normalized.items
    .map((item, index) => `  <article class="${normalized.itemClassPrefix} ${itemClass(normalized, index)}">${escapeHtml(item.content)}</article>`)
    .join("\n");
  return `<section class="${normalized.containerClassName}">\n${children}\n</section>`;
}

export function generateFlexJsx(state: FlexGeneratorState): string {
  const normalized = normalizeFlexState(state);
  const children = normalized.items
    .map((item, index) => `      <article className="${normalized.itemClassPrefix} ${itemClass(normalized, index)}">${escapeHtml(item.content)}</article>`)
    .join("\n");
  return `export function FlexLayout() {\n  return (\n    <section className="${normalized.containerClassName}">\n${children}\n    </section>\n  );\n}`;
}

function tailwindJustify(value: string) {
  const map: Record<string, string> = {
    "flex-start": "justify-start",
    center: "justify-center",
    "flex-end": "justify-end",
    "space-between": "justify-between",
    "space-around": "justify-around",
    "space-evenly": "justify-evenly",
  };
  return map[value] ?? "justify-start";
}

function tailwindAlign(value: string) {
  const map: Record<string, string> = {
    stretch: "items-stretch",
    "flex-start": "items-start",
    center: "items-center",
    "flex-end": "items-end",
    baseline: "items-baseline",
  };
  return map[value] ?? "items-stretch";
}

export function generateTailwindStarter(state: FlexGeneratorState): string {
  const normalized = normalizeFlexState(state);
  const directionClass = normalized.direction === "row" ? "flex-row" : normalized.direction === "column" ? "flex-col" : normalized.direction === "row-reverse" ? "flex-row-reverse" : "flex-col-reverse";
  const wrapClass = normalized.wrap === "wrap" ? "flex-wrap" : normalized.wrap === "wrap-reverse" ? "flex-wrap-reverse" : "flex-nowrap";
  const gapClass = normalized.gap.unit === "rem" && normalized.gap.row === normalized.gap.column ? `gap-${Math.max(0, Math.round(normalized.gap.row * 4))}` : "gap-4";
  const children = normalized.items
    .map((item) => {
      const flexClass = item.flexGrow > 0 ? "flex-1" : "flex-none";
      return `  <div className="${flexClass}">${escapeHtml(item.content)}</div>`;
    })
    .join("\n");

  return `<div className="flex ${directionClass} ${wrapClass} ${tailwindJustify(normalized.justifyContent)} ${tailwindAlign(normalized.alignItems)} ${gapClass}">\n${children}\n</div>`;
}

export function generateInlinePreviewStyles(state: FlexGeneratorState): {
  container: CSSProperties;
  items: Record<string, CSSProperties>;
} {
  const normalized = normalizeFlexState(state);
  return {
    container: {
      display: normalized.display,
      flexDirection: normalized.direction,
      flexWrap: normalized.wrap,
      justifyContent: normalized.justifyContent,
      alignItems: normalized.alignItems,
      alignContent: normalized.alignContent,
      gap: gapValue(normalized),
      minHeight: normalized.minHeight,
      padding: normalized.padding,
      background: normalized.background,
      borderRadius: normalized.borderRadius,
      width: "100%",
    },
    items: Object.fromEntries(
      normalized.items.map((item) => [
        item.id,
        {
          flex: `${item.flexGrow} ${item.flexShrink} ${item.flexBasis}`,
          width: item.width,
          height: item.height,
          order: item.order,
          alignSelf: item.alignSelf,
          marginLeft: item.marginLeftAuto ? "auto" : undefined,
          marginRight: item.marginRightAuto ? "auto" : undefined,
          background: item.background,
          color: item.textColor,
          borderRadius: item.borderRadius,
          padding: item.padding,
        } satisfies CSSProperties,
      ]),
    ),
  };
}

export function validateFlexState(state: FlexGeneratorState): FlexValidationMessage[] {
  const normalized = normalizeFlexState(state);
  const messages: FlexValidationMessage[] = [];

  if (normalized.wrap === "nowrap" && normalized.previewWidth <= 520) {
    messages.push({ type: "warning", message: "nowrap may overflow on small preview widths. Try wrap or a mobile stack behavior." });
  }
  if (normalized.alignContent !== "stretch" && normalized.wrap === "nowrap") {
    messages.push({ type: "info", message: "align-content is only visible when flex items wrap into multiple lines." });
  }
  if (normalized.items.some((item) => item.flexGrow > 0)) {
    messages.push({ type: "info", message: "flex-grow uses extra free space in the flex container." });
  }
  if (normalized.items.some((item) => item.flexShrink > 1)) {
    messages.push({ type: "info", message: "flex-shrink is easiest to see when items compete for limited width." });
  }
  if (normalized.items.some((item) => item.marginLeftAuto || item.marginRightAuto)) {
    messages.push({ type: "warning", message: "Auto margins can override justify-content spacing for the affected item." });
  }
  if (normalized.alignItems === "baseline") {
    messages.push({ type: "info", message: "Baseline alignment is most visible when items contain different text sizes." });
  }
  if (normalized.items.length >= 20) {
    messages.push({ type: "warning", message: "You reached the V1 item limit of 20 items." });
  }

  return messages;
}

export function applyQuickAction(state: FlexGeneratorState, action: FlexQuickAction): FlexGeneratorState {
  const normalized = normalizeFlexState(state);
  const selectedId = normalized.selectedItemId ?? normalized.items[0]?.id;

  switch (action) {
    case "center-everything":
      return { ...normalized, justifyContent: "center", alignItems: "center" };
    case "space-between":
      return { ...normalized, justifyContent: "space-between", alignItems: "center" };
    case "equal-items":
      return {
        ...normalized,
        items: normalized.items.map((item) => ({ ...item, flexGrow: 1, flexShrink: 1, flexBasis: "0" })),
      };
    case "wrap-cards":
      return {
        ...normalized,
        direction: "row",
        wrap: "wrap",
        alignItems: "stretch",
        items: normalized.items.map((item) => ({ ...item, flexGrow: 1, flexShrink: 1, flexBasis: "240px" })),
      };
    case "vertical-stack":
      return { ...normalized, direction: "column", wrap: "nowrap", justifyContent: "flex-start", alignItems: "stretch" };
    case "push-last-end": {
      const targetId = selectedId ?? normalized.items[normalized.items.length - 1]?.id;
      return {
        ...normalized,
        justifyContent: "flex-start",
        items: normalized.items.map((item, index) => ({
          ...item,
          marginLeftAuto: targetId ? item.id === targetId : index === normalized.items.length - 1,
          marginRightAuto: false,
        })),
      };
    }
    case "selected-fill-remaining":
      return {
        ...normalized,
        items: normalized.items.map((item) =>
          item.id === selectedId ? { ...item, flexGrow: 1, flexShrink: 1, flexBasis: "0" } : item,
        ),
      };
    case "reset-item-sizing":
      return {
        ...normalized,
        items: normalized.items.map((item) => ({
          ...item,
          flexGrow: 0,
          flexShrink: 1,
          flexBasis: "auto",
          width: "auto",
          height: "auto",
          order: 0,
          alignSelf: "auto",
          marginLeftAuto: false,
          marginRightAuto: false,
        })),
      };
    default:
      return normalized;
  }
}
