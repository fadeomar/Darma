import type {
  ComponentPresetId,
  ContainerBreakpoint,
  ContainerQueryState,
  ContainerQuerySummary,
  ContainerQueryValidationMessage,
  ContainerStyleRule,
} from "./types";

let counter = 0;
function uid(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function indent(value: string, spaces = 2) {
  const pad = " ".repeat(spaces);
  return value.split("\n").map((line) => (line ? `${pad}${line}` : line)).join("\n");
}

function toClassName(selector: string, fallback: string) {
  return sanitizeCssIdentifier(selector.replace(/^\./, "") || fallback);
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
    previewMode: "card",
    showContainerOutline: true,
    showBreakpointMarkers: true,
    showActiveRules: true,
    showDemoContent: true,
    selectedBreakpointId: "comfortable",
    exportOptions: {
      includeComments: true,
      includeDemoStyles: true,
      includeMediaQueryComparison: false,
      includeSupportsGuard: true,
      includeFallbackLayer: true,
      includeContainerUnits: true,
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
  const safeComponentClass = sanitizeCssIdentifier(state.componentClassName || state.exportOptions?.classPrefix || "card");
  const breakpoints = state.breakpoints.slice(0, 8).map((breakpoint) => {
    const minWidth = clampNumber(breakpoint.minWidth ?? 0, 0, 2000);
    let maxWidth = breakpoint.maxWidth === undefined ? undefined : clampNumber(breakpoint.maxWidth, 0, 2000);
    if (breakpoint.conditionType === "max-width" && maxWidth === undefined) maxWidth = 480;
    if (breakpoint.conditionType === "range" && maxWidth === undefined) maxWidth = Math.max(1, minWidth + 280);
    return {
      ...breakpoint,
      name: breakpoint.name || "Breakpoint",
      unit: breakpoint.unit ?? "px",
      minWidth,
      maxWidth,
      styles: breakpoint.styles.slice(0, 20).map((rule) => ({
        ...rule,
        selector: rule.selector || `.${safeComponentClass}`,
        property: rule.property || "display",
        value: rule.value || "block",
      })),
    };
  });
  const selectedBreakpointId = breakpoints.some((breakpoint) => breakpoint.id === state.selectedBreakpointId)
    ? state.selectedBreakpointId
    : breakpoints[0]?.id ?? null;

  return {
    ...state,
    containerSelector: state.containerSelector || `.${safeComponentClass}-wrapper`,
    containerName: sanitizeCssIdentifier(state.containerName),
    containerType: state.containerType ?? "inline-size",
    componentClassName: safeComponentClass,
    previewMode: state.previewMode ?? "card",
    previewWidth: clampNumber(state.previewWidth, 260, 1200),
    showContainerOutline: state.showContainerOutline ?? true,
    showBreakpointMarkers: state.showBreakpointMarkers ?? true,
    showActiveRules: state.showActiveRules ?? true,
    showDemoContent: state.showDemoContent ?? true,
    selectedBreakpointId,
    breakpoints,
    exportOptions: {
      includeComments: state.exportOptions?.includeComments ?? true,
      includeDemoStyles: state.exportOptions?.includeDemoStyles ?? true,
      includeMediaQueryComparison: state.exportOptions?.includeMediaQueryComparison ?? false,
      includeSupportsGuard: state.exportOptions?.includeSupportsGuard ?? true,
      includeFallbackLayer: state.exportOptions?.includeFallbackLayer ?? true,
      includeContainerUnits: state.exportOptions?.includeContainerUnits ?? true,
      classPrefix: sanitizeCssIdentifier(state.exportOptions?.classPrefix || safeComponentClass),
    },
  };
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

function demoStyles(baseClass: string, includeContainerUnits: boolean) {
  const cqUnits = includeContainerUnits
    ? `\n  --cq-title-size: clamp(1.15rem, 7cqi, 1.9rem);\n  --cq-space: clamp(0.9rem, 4cqi, 1.6rem);`
    : "";
  return `.${baseClass} {\n  display: grid;\n  gap: var(--cq-gap, 1rem);\n  overflow: hidden;\n  border-radius: 1.25rem;\n  border: 1px solid #e2e8f0;\n  background: #ffffff;\n  box-shadow: 0 20px 50px rgb(15 23 42 / 0.08);${cqUnits}\n}\n\n.${baseClass}__media {\n  min-height: 160px;\n  background: linear-gradient(135deg, #dbeafe, #c4b5fd);\n}\n\n.${baseClass}__content {\n  display: grid;\n  gap: 0.75rem;\n  padding: var(--cq-space, 1.25rem);\n}\n\n.${baseClass}__eyebrow {\n  margin: 0;\n  font-size: 0.75rem;\n  font-weight: 700;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: #4f46e5;\n}\n\n.${baseClass}__title {\n  margin: 0;\n  font-size: var(--cq-title-size, 1.35rem);\n  line-height: 1.15;\n  color: #0f172a;\n}\n\n.${baseClass}__description {\n  margin: 0;\n  color: #475569;\n}\n\n.${baseClass}__actions a {\n  color: #2563eb;\n  font-weight: 700;\n  text-decoration: none;\n}`;
}

function queryBlocks(state: ContainerQueryState) {
  return state.breakpoints.map((breakpoint) => {
    const comments = state.exportOptions.includeComments ? `/* ${breakpoint.name}: ${formatContainerCondition(breakpoint)} */\n` : "";
    const namePart = state.containerName ? `${state.containerName} ` : "";
    return `${comments}@container ${namePart}${formatContainerCondition(breakpoint)} {\n${indent(groupedRules(breakpoint.styles))}\n}`;
  }).join("\n\n");
}

export function generateContainerQueryCss(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const baseClass = safe.componentClassName;
  const containerSelector = safe.containerSelector || `.${baseClass}-wrapper`;
  const comments = safe.exportOptions.includeComments;
  const parts: string[] = [];

  if (comments) parts.push("/* Query container */");
  parts.push(`${containerSelector} {\n  container-type: ${safe.containerType};${safe.containerName ? `\n  container-name: ${safe.containerName};` : ""}\n}`);

  if (safe.exportOptions.includeDemoStyles) {
    if (comments) parts.push("/* Base component styles */");
    parts.push(demoStyles(baseClass, safe.exportOptions.includeContainerUnits));
  }

  const queries = queryBlocks(safe);
  if (safe.exportOptions.includeSupportsGuard) {
    parts.push(`@supports (container-type: inline-size) {\n${indent(queries)}\n}`);
  } else {
    parts.push(queries);
  }

  if (safe.exportOptions.includeFallbackLayer) parts.push(generateContainerQueryFallbackCss(safe));
  if (safe.exportOptions.includeMediaQueryComparison) parts.push(generateMediaQueryComparison(safe));

  return parts.join("\n\n");
}

export function generateContainerQueryVariables(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const prefix = safe.exportOptions.classPrefix;
  return `:root {\n  --${prefix}-container-name: ${safe.containerName};\n  --${prefix}-container-type: ${safe.containerType};\n  --${prefix}-compact: ${safe.breakpoints[0]?.maxWidth ?? safe.breakpoints[0]?.minWidth ?? 400}px;\n  --${prefix}-comfortable: ${safe.breakpoints[1]?.minWidth ?? 560}px;\n  --${prefix}-expanded: ${safe.breakpoints[2]?.minWidth ?? 760}px;\n  --${prefix}-radius: 1.25rem;\n  --${prefix}-gap: 1rem;\n}`;
}

export function generateContainerQueryFallbackCss(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const baseClass = safe.componentClassName;
  return `@supports not (container-type: inline-size) {\n  /* Fallback: preserve a usable stacked component when container queries are unavailable. */\n  .${baseClass} {\n    display: grid;\n    gap: 1rem;\n  }\n\n  @media (min-width: 48rem) {\n    .${baseClass} {\n      grid-template-columns: minmax(10rem, 16rem) 1fr;\n      align-items: center;\n    }\n  }\n}`;
}

export function generateContainerQueryHtml(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const cls = safe.componentClassName;
  const wrapper = toClassName(safe.containerSelector, `${cls}-wrapper`);
  return `<div class="${wrapper}">\n  <article class="${cls}">\n    <div class="${cls}__media" aria-hidden="true"></div>\n    <div class="${cls}__content">\n      <p class="${cls}__eyebrow">Design system</p>\n      <h3 class="${cls}__title">Container-aware card</h3>\n      <p class="${cls}__description">\n        This component adapts to the space provided by its parent container.\n      </p>\n      <div class="${cls}__actions">\n        <a href="#">View details</a>\n      </div>\n    </div>\n  </article>\n</div>`;
}

export function generateContainerQueryJsx(state: ContainerQueryState): string {
  const html = generateContainerQueryHtml(state)
    .replace(/class=/g, "className=")
    .replace(/aria-hidden="true"><\/div>/g, "aria-hidden=\"true\" />");
  return `export function ContainerAwareCard() {\n  return (\n${indent(html)}\n  );\n}`;
}

export function generateContainerQueryTailwind(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const cls = safe.componentClassName;
  const rules = safe.breakpoints.map((breakpoint) => {
    const condition = formatContainerCondition(breakpoint);
    return `/* ${breakpoint.name}: @container ${safe.containerName} ${condition} */\n/* Tailwind v4 or plugin syntax may vary by setup; keep the generated CSS as the source of truth. */`;
  }).join("\n\n");
  return `<div className="@container/${safe.containerName}">\n  <article className="${cls} grid overflow-hidden rounded-2xl border bg-white shadow-sm">\n    <div className="${cls}__media min-h-40 bg-gradient-to-br from-blue-100 to-violet-200" />\n    <div className="${cls}__content grid gap-3 p-5">\n      <p className="${cls}__eyebrow text-xs font-bold uppercase tracking-wider text-indigo-600">Design system</p>\n      <h3 className="${cls}__title text-xl font-black text-slate-950">Container-aware card</h3>\n    </div>\n  </article>\n</div>\n\n${rules}`;
}

export function generateContainerQueryTokenJson(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  return JSON.stringify({
    container: {
      selector: safe.containerSelector,
      name: safe.containerName,
      type: safe.containerType,
      componentClassName: safe.componentClassName,
    },
    breakpoints: safe.breakpoints.map((breakpoint) => ({
      id: breakpoint.id,
      name: breakpoint.name,
      condition: formatContainerCondition(breakpoint),
      rules: breakpoint.styles.map((rule) => ({ selector: rule.selector, property: rule.property, value: rule.value })),
    })),
  }, null, 2);
}

export function generateContainerQueryExplanation(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  const active = getActiveBreakpoints(safe, safe.previewWidth);
  const lines = [
    `Container: ${safe.containerSelector}`,
    `Container type: ${safe.containerType}`,
    `Container name: ${safe.containerName}`,
    `Preview width: ${safe.previewWidth}px`,
    `Active breakpoint(s): ${active.length ? active.map((item) => item.name).join(", ") : "base styles only"}`,
    "",
    "Container queries respond to the parent container size, not the browser viewport size. This makes the component reusable inside sidebars, grids, modals, and full-width sections without changing global page breakpoints.",
    "",
    "Breakpoint map:",
  ];
  safe.breakpoints.forEach((breakpoint) => {
    lines.push(`- ${breakpoint.name}: @container ${safe.containerName} ${formatContainerCondition(breakpoint)} (${breakpoint.styles.length} rule${breakpoint.styles.length === 1 ? "" : "s"})`);
  });
  return lines.join("\n");
}

export function generateContainerQueryAudit(state: ContainerQueryState): string {
  const safe = normalizeContainerQueryState(state);
  return validateContainerQueryState(safe).map((message) => `${message.type.toUpperCase()}: ${message.message}`).join("\n");
}

function generateMediaQueryComparison(state: ContainerQueryState): string {
  const blocks = state.breakpoints
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

export function getContainerQuerySummary(state: ContainerQueryState): ContainerQuerySummary {
  const safe = normalizeContainerQueryState(state);
  return {
    breakpoints: safe.breakpoints.length,
    rules: safe.breakpoints.reduce((total, breakpoint) => total + breakpoint.styles.length, 0),
    active: getActiveBreakpoints(safe, safe.previewWidth).length,
    maxWidth: Math.max(...safe.breakpoints.map((breakpoint) => breakpoint.maxWidth ?? breakpoint.minWidth ?? 0), safe.previewWidth),
  };
}

export function validateContainerQueryState(state: ContainerQueryState): ContainerQueryValidationMessage[] {
  const safe = normalizeContainerQueryState(state);
  const messages: ContainerQueryValidationMessage[] = [];
  if (safe.containerType === "normal") {
    messages.push({ type: "error", message: "container-type: normal cannot be used for width/size container queries." });
  }
  if (!safe.containerName.trim()) {
    messages.push({ type: "warning", message: "Named @container rules need a matching container-name." });
  }
  if (!safe.containerSelector.startsWith(".") && !safe.containerSelector.startsWith("#")) {
    messages.push({ type: "warning", message: "Use a class or id selector for the query container to keep the generated code predictable." });
  }
  if (safe.breakpoints.length === 0) messages.push({ type: "error", message: "Add at least one breakpoint to generate useful @container rules." });
  safe.breakpoints.forEach((breakpoint) => {
    if (breakpoint.conditionType === "range" && (breakpoint.minWidth ?? 0) >= (breakpoint.maxWidth ?? 0)) {
      messages.push({ type: "error", message: "Range queries need min-width to be lower than max-width.", breakpointId: breakpoint.id });
    }
    if (breakpoint.conditionType === "max-width" && !breakpoint.maxWidth) {
      messages.push({ type: "warning", message: `${breakpoint.name} needs a max width value.`, breakpointId: breakpoint.id });
    }
    const seen = new Set<string>();
    breakpoint.styles.forEach((rule) => {
      const key = `${rule.selector}:${rule.property}`;
      if (seen.has(key)) {
        messages.push({ type: "warning", message: `Multiple ${rule.property} rules on ${rule.selector} may override each other.`, breakpointId: breakpoint.id, ruleId: rule.id });
      }
      if (rule.selector.trim() === safe.containerSelector.trim()) {
        messages.push({ type: "info", message: "Container queries style descendants. Styling the query container itself inside @container may not behave as expected.", breakpointId: breakpoint.id, ruleId: rule.id });
      }
      seen.add(key);
    });
  });
  if (safe.breakpoints.length >= 8) messages.push({ type: "info", message: "You reached the V1 limit of 8 breakpoints to keep output readable." });
  if (safe.exportOptions.includeSupportsGuard) messages.push({ type: "success", message: "The generated CSS includes a @supports guard for safer production use." });
  if (safe.exportOptions.includeFallbackLayer) messages.push({ type: "success", message: "A viewport fallback is included for older browsers." });
  if (!messages.length) messages.push({ type: "success", message: "Container query settings look production-ready." });
  return messages;
}

export function duplicateBreakpoint(breakpoint: ContainerBreakpoint): ContainerBreakpoint {
  return {
    ...breakpoint,
    id: uid("breakpoint"),
    name: `${breakpoint.name} copy`,
    styles: breakpoint.styles.map((rule) => ({ ...rule, id: uid("rule") })),
  };
}
