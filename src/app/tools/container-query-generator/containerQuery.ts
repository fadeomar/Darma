import type {
  ComponentPresetId,
  ContainerBreakpoint,
  ContainerQueryState,
  ContainerQueryValidationMessage,
  ContainerStyleRule,
} from "./types";

let counter = 0;
function uid(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function sanitizeCssIdentifier(value: string): string {
  const cleaned = value.trim().replace(/^[.#]/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "card";
}

export function createStyleRule(partial: Partial<ContainerStyleRule> = {}): ContainerStyleRule {
  return {
    id: partial.id ?? uid("rule"),
    selector: partial.selector ?? ".card",
    property: partial.property ?? "gap",
    value: partial.value ?? "1rem",
  };
}

export function createBreakpoint(partial: Partial<ContainerBreakpoint> = {}): ContainerBreakpoint {
  return {
    id: partial.id ?? uid("breakpoint"),
    name: partial.name ?? "New breakpoint",
    conditionType: partial.conditionType ?? "min-width",
    minWidth: partial.minWidth ?? 480,
    maxWidth: partial.maxWidth,
    unit: partial.unit ?? "px",
    styles: partial.styles ?? [createStyleRule()],
  };
}

export function createDefaultContainerQueryState(): ContainerQueryState {
  return {
    presetId: "responsive-card",
    containerSelector: ".card-wrapper",
    containerName: "card",
    containerType: "inline-size",
    componentClassName: "card",
    previewWidth: 520,
    showContainerOutline: true,
    showBreakpointMarkers: true,
    showActiveRules: true,
    selectedBreakpointId: "comfortable",
    exportOptions: {
      includeComments: true,
      includeDemoStyles: true,
      includeMediaQueryComparison: true,
      classPrefix: "card",
    },
    breakpoints: [
      createBreakpoint({
        id: "compact",
        name: "Compact",
        conditionType: "max-width",
        maxWidth: 399,
        unit: "px",
        styles: [
          createStyleRule({ id: "compact-display", selector: ".card", property: "display", value: "block" }),
          createStyleRule({ id: "compact-media", selector: ".card__media", property: "aspect-ratio", value: "16 / 9" }),
          createStyleRule({ id: "compact-title", selector: ".card__title", property: "font-size", value: "1.125rem" }),
        ],
      }),
      createBreakpoint({
        id: "comfortable",
        name: "Comfortable",
        conditionType: "min-width",
        minWidth: 400,
        unit: "px",
        styles: [
          createStyleRule({ id: "comfortable-display", selector: ".card", property: "display", value: "grid" }),
          createStyleRule({ id: "comfortable-columns", selector: ".card", property: "grid-template-columns", value: "140px 1fr" }),
          createStyleRule({ id: "comfortable-align", selector: ".card", property: "align-items", value: "center" }),
        ],
      }),
      createBreakpoint({
        id: "expanded",
        name: "Expanded",
        conditionType: "min-width",
        minWidth: 720,
        unit: "px",
        styles: [
          createStyleRule({ id: "expanded-columns", selector: ".card", property: "grid-template-columns", value: "220px 1fr" }),
          createStyleRule({ id: "expanded-padding", selector: ".card", property: "padding", value: "2rem" }),
          createStyleRule({ id: "expanded-title", selector: ".card__title", property: "font-size", value: "1.75rem" }),
        ],
      }),
    ],
  };
}

export function normalizeContainerQueryState(state: ContainerQueryState): ContainerQueryState {
  const breakpoints = state.breakpoints.slice(0, 8).map((breakpoint) => ({
    ...breakpoint,
    name: breakpoint.name || "Breakpoint",
    unit: breakpoint.unit ?? "px",
    minWidth: clampNumber(breakpoint.minWidth ?? 0, 0, 2000),
    maxWidth: clampNumber(breakpoint.maxWidth ?? 0, 0, 2000),
    styles: breakpoint.styles.slice(0, 20).map((rule) => ({
      ...rule,
      selector: rule.selector || `.${state.componentClassName}`,
      property: rule.property || "display",
      value: rule.value || "block",
    })),
  }));
  const selectedBreakpointId = breakpoints.some((breakpoint) => breakpoint.id === state.selectedBreakpointId)
    ? state.selectedBreakpointId
    : breakpoints[0]?.id ?? null;

  return {
    ...state,
    containerSelector: state.containerSelector || ".card-wrapper",
    containerName: sanitizeCssIdentifier(state.containerName),
    componentClassName: sanitizeCssIdentifier(state.componentClassName),
    previewWidth: clampNumber(state.previewWidth, 240, 1200),
    selectedBreakpointId,
    breakpoints,
    exportOptions: {
      ...state.exportOptions,
      classPrefix: sanitizeCssIdentifier(state.exportOptions.classPrefix || state.componentClassName),
    },
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function formatContainerCondition(breakpoint: ContainerBreakpoint): string {
  if (breakpoint.conditionType === "max-width") return `(max-width: ${breakpoint.maxWidth ?? 480}${breakpoint.unit})`;
  if (breakpoint.conditionType === "range") return `(${breakpoint.minWidth ?? 320}${breakpoint.unit} <= width <= ${breakpoint.maxWidth ?? 720}${breakpoint.unit})`;
  return `(min-width: ${breakpoint.minWidth ?? 480}${breakpoint.unit})`;
}

function cssBlock(selector: string, rules: ContainerStyleRule[]) {
  const lines = rules.map((rule) => `  ${rule.property}: ${rule.value};`).join("\n");
  return `${selector} {\n${lines}\n}`;
}

function groupedRules(rules: ContainerStyleRule[]) {
  const map = new Map<string, ContainerStyleRule[]>();
  rules.forEach((rule) => {
    const list = map.get(rule.selector) ?? [];
    list.push(rule);
    map.set(rule.selector, list);
  });
  return Array.from(map.entries()).map(([selector, items]) => cssBlock(selector, items)).join("\n\n");
}

export function generateContainerQueryCss(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const containerName = safe.containerName;
  const baseClass = safe.componentClassName;
  const containerSelector = safe.containerSelector || `.${baseClass}-wrapper`;
  const comments = safe.exportOptions.includeComments;
  const parts: string[] = [];

  if (comments) parts.push("/* Query container */");
  parts.push(`${containerSelector} {\n  container-type: ${safe.containerType};${safe.containerName ? `\n  container-name: ${containerName};` : ""}\n}`);

  if (safe.exportOptions.includeDemoStyles) {
    if (comments) parts.push("/* Base component styles */");
    parts.push(`.${baseClass} {\n  display: grid;\n  gap: 1rem;\n  overflow: hidden;\n  border-radius: 1.25rem;\n  border: 1px solid #e2e8f0;\n  background: #ffffff;\n  box-shadow: 0 20px 50px rgb(15 23 42 / 0.08);\n}\n\n.${baseClass}__media {\n  min-height: 160px;\n  background: linear-gradient(135deg, #dbeafe, #c4b5fd);\n}\n\n.${baseClass}__content {\n  display: grid;\n  gap: 0.75rem;\n  padding: 1.25rem;\n}\n\n.${baseClass}__eyebrow {\n  margin: 0;\n  font-size: 0.75rem;\n  font-weight: 700;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: #4f46e5;\n}\n\n.${baseClass}__title {\n  margin: 0;\n  font-size: 1.35rem;\n  line-height: 1.15;\n  color: #0f172a;\n}\n\n.${baseClass}__description {\n  margin: 0;\n  color: #475569;\n}\n\n.${baseClass}__actions a {\n  color: #2563eb;\n  font-weight: 700;\n  text-decoration: none;\n}`);
  }

  safe.breakpoints.forEach((breakpoint) => {
    if (comments) parts.push(`/* ${breakpoint.name}: ${formatContainerCondition(breakpoint)} */`);
    const namePart = safe.containerName ? `${containerName} ` : "";
    parts.push(`@container ${namePart}${formatContainerCondition(breakpoint)} {\n${indent(groupedRules(breakpoint.styles))}\n}`);
  });

  if (safe.exportOptions.includeMediaQueryComparison) {
    parts.push(generateMediaQueryComparison(safe));
  }

  return parts.join("\n\n");
}

function indent(value: string) {
  return value.split("\n").map((line) => (line ? `  ${line}` : line)).join("\n");
}

export function generateContainerQueryHtml(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const cls = safe.componentClassName;
  const wrapper = (safe.containerSelector || `.${cls}-wrapper`).replace(/^\./, "");
  return `<div class="${wrapper}">\n  <article class="${cls}">\n    <div class="${cls}__media" aria-hidden="true"></div>\n    <div class="${cls}__content">\n      <p class="${cls}__eyebrow">Design system</p>\n      <h3 class="${cls}__title">Container-aware card</h3>\n      <p class="${cls}__description">\n        This component adapts to the space provided by its parent container.\n      </p>\n      <div class="${cls}__actions">\n        <a href="#">View details</a>\n      </div>\n    </div>\n  </article>\n</div>`;
}

export function generateContainerQueryJsx(state: ContainerQueryState): string {
  const html = generateContainerQueryHtml(state)
    .replace(/class=/g, "className=")
    .replace(/aria-hidden="true"><\/div>/g, "aria-hidden=\"true\" />");
  return `export function ContainerAwareCard() {\n  return (\n${indent(html)}\n  );\n}`;
}

export function generateContainerQueryExplanation(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const active = getActiveBreakpoints(safe, safe.previewWidth);
  const lines = [
    `This component creates a ${safe.containerType} query container named "${safe.containerName}" using ${safe.containerSelector}.`,
    `The preview width is ${safe.previewWidth}px, so ${active.length ? active.map((item) => item.name).join(", ") : "no custom breakpoint"} is currently active.`,
    "Container queries respond to the parent container size, not the browser viewport size.",
  ];
  safe.breakpoints.forEach((breakpoint) => {
    lines.push(`${breakpoint.name} applies when the container matches ${formatContainerCondition(breakpoint)} and changes ${breakpoint.styles.length} style ${breakpoint.styles.length === 1 ? "rule" : "rules"}.`);
  });
  return lines.join("\n\n");
}

export function generateMediaQueryComparison(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const blocks = safe.breakpoints
    .filter((breakpoint) => breakpoint.conditionType !== "range")
    .map((breakpoint) => {
      const mediaCondition = breakpoint.conditionType === "max-width" ? `(max-width: ${breakpoint.maxWidth ?? 480}px)` : `(min-width: ${breakpoint.minWidth ?? 480}px)`;
      return `@media ${mediaCondition} {\n${indent(groupedRules(breakpoint.styles))}\n}`;
    });
  return [`/* Media query comparison for learning only: viewport size, not container size. */`, ...blocks].join("\n\n");
}

export function getActiveBreakpoints(state: ContainerQueryState, width: number): ContainerBreakpoint[] {
  return state.breakpoints.filter((breakpoint) => {
    const min = breakpoint.minWidth ?? 0;
    const max = breakpoint.maxWidth ?? Number.POSITIVE_INFINITY;
    if (breakpoint.conditionType === "max-width") return width <= max;
    if (breakpoint.conditionType === "range") return width >= min && width <= max;
    return width >= min;
  });
}

export function validateContainerQueryState(state: ContainerQueryState): ContainerQueryValidationMessage[] {
  const messages: ContainerQueryValidationMessage[] = [
    { type: "info", message: "Container queries respond to parent size, not viewport size." },
  ];
  if (state.containerType === "normal") {
    messages.push({ type: "warning", message: "container-type: normal cannot be used for size queries like min-width or max-width." });
  }
  if (!state.containerName.trim()) {
    messages.push({ type: "warning", message: "Named @container rules need a matching container-name." });
  }
  state.breakpoints.forEach((breakpoint) => {
    if (breakpoint.conditionType === "range" && (breakpoint.minWidth ?? 0) >= (breakpoint.maxWidth ?? 0)) {
      messages.push({ type: "error", message: "Range queries need min-width to be lower than max-width.", breakpointId: breakpoint.id });
    }
    const seen = new Set<string>();
    breakpoint.styles.forEach((rule) => {
      const key = `${rule.selector}:${rule.property}`;
      if (seen.has(key)) {
        messages.push({ type: "warning", message: `Multiple ${rule.property} rules on ${rule.selector} may override each other.`, breakpointId: breakpoint.id, ruleId: rule.id });
      }
      seen.add(key);
    });
  });
  if (state.breakpoints.length >= 8) messages.push({ type: "info", message: "You reached the V1 limit of 8 breakpoints to keep output readable." });
  return messages;
}

export function withPresetId(state: ContainerQueryState, presetId: ComponentPresetId): ContainerQueryState {
  return { ...state, presetId };
}
