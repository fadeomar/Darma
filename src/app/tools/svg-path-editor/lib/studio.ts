import { SvgPath } from "./svg";

export type CheckSeverity = "error" | "warning" | "info" | "pass";

export type PathBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PathAnalysis = {
  commandCount: number;
  targetPointCount: number;
  controlPointCount: number;
  editablePointCount: number;
  subpathCount: number;
  closedSubpathCount: number;
  relativeCommandCount: number;
  curveCommandCount: number;
  outputBytes: number;
  bounds: PathBounds | null;
  maxAbsoluteCoordinate: number;
};

export type ProductionCheck = {
  id: string;
  severity: CheckSeverity;
  title: string;
  detail: string;
};

export type ExportOptions = {
  path: string;
  viewBox: PathBounds;
  fill: string;
  stroke: string;
  strokeWidth: number;
  componentName?: string;
};

const PATH_TAG_PATTERN = /<path\b([\s\S]*?)(?:\/>|>)/gi;
const PATH_DATA_PATTERN = /\bd\s*=\s*(["'])([\s\S]*?)\1/i;

function round(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function sanitizeComponentName(value: string): string {
  const words = value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const name = words.map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`).join("");
  const safe = name || "DarmaSvgPath";
  return /^\d/.test(safe) ? `Svg${safe}` : safe;
}

function formatViewBox(viewBox: PathBounds): string {
  return [viewBox.x, viewBox.y, viewBox.width, viewBox.height].map((value) => round(value, 3)).join(" ");
}

export function extractSvgPaths(input: string): string[] {
  const direct = input.trim();
  if (!direct) return [];
  if (!direct.includes("<")) return [direct.replace(/\s+/g, " ")];

  const results: string[] = [];
  let tagMatch: RegExpExecArray | null;
  PATH_TAG_PATTERN.lastIndex = 0;

  while ((tagMatch = PATH_TAG_PATTERN.exec(direct)) !== null) {
    const dataMatch = tagMatch[1].match(PATH_DATA_PATTERN);
    const path = dataMatch?.[2]?.trim().replace(/\s+/g, " ");
    if (path) results.push(path);
  }

  return results;
}

export function calculatePathBounds(svg: SvgPath, padding = true): PathBounds | null {
  const points = svg.path.flatMap((item) => [...item.absolutePoints, ...item.absoluteControlPoints]);
  if (!points.length) return null;

  const xs = points.map((point) => point.x).filter(Number.isFinite);
  const ys = points.map((point) => point.y).filter(Number.isFinite);
  if (!xs.length || !ys.length) return null;

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const pad = padding ? Math.max(rawWidth * 0.14, rawHeight * 0.14, 24) : 0;

  return {
    x: round(minX - pad),
    y: round(minY - pad),
    width: round(Math.max(1, rawWidth + pad * 2)),
    height: round(Math.max(1, rawHeight + pad * 2)),
  };
}

export function analyzePath(svg: SvgPath, output: string): PathAnalysis {
  const commandTypes = svg.path.map((item) => item.getType(true));
  const coordinates = svg.path.flatMap((item) => [
    ...item.values,
    ...item.absolutePoints.flatMap((point) => [point.x, point.y]),
    ...item.absoluteControlPoints.flatMap((point) => [point.x, point.y]),
  ]).filter(Number.isFinite);
  const targetPointCount = svg.targetLocations().length;
  const controlPointCount = svg.controlLocations().length;

  return {
    commandCount: svg.path.length,
    targetPointCount,
    controlPointCount,
    editablePointCount: targetPointCount + controlPointCount,
    subpathCount: commandTypes.filter((type) => type === "M").length,
    closedSubpathCount: commandTypes.filter((type) => type === "Z").length,
    relativeCommandCount: svg.path.filter((item) => item.relative).length,
    curveCommandCount: commandTypes.filter((type) => ["C", "S", "Q", "T", "A"].includes(type)).length,
    outputBytes: byteLength(output),
    bounds: calculatePathBounds(svg, false),
    maxAbsoluteCoordinate: coordinates.length ? Math.max(...coordinates.map((value) => Math.abs(value))) : 0,
  };
}

export function buildProductionChecks(
  analysis: PathAnalysis | null,
  options: { hasError: boolean; fillEnabled: boolean; minified: boolean },
): ProductionCheck[] {
  if (options.hasError || !analysis) {
    return [{
      id: "syntax",
      severity: "error",
      title: "Path syntax must be fixed",
      detail: "Exports and production checks are disabled until the path parses successfully.",
    }];
  }

  const checks: ProductionCheck[] = [{
    id: "syntax",
    severity: "pass",
    title: "Valid SVG path syntax",
    detail: `${analysis.commandCount} commands parsed successfully.`,
  }];

  if (!analysis.bounds || analysis.bounds.width <= 1 || analysis.bounds.height <= 1) {
    checks.push({
      id: "geometry",
      severity: "warning",
      title: "Very small or one-dimensional geometry",
      detail: "The path may render as a line or point. Confirm the intended viewBox and stroke width.",
    });
  } else {
    checks.push({
      id: "geometry",
      severity: "pass",
      title: "Renderable geometry detected",
      detail: `Approximate bounds are ${round(analysis.bounds.width)} × ${round(analysis.bounds.height)}.`,
    });
  }

  if (options.fillEnabled && analysis.closedSubpathCount < analysis.subpathCount) {
    checks.push({
      id: "open-fill",
      severity: "warning",
      title: "Filled path contains an open subpath",
      detail: "Browsers implicitly close open filled subpaths. Add Z when an explicit closed contour is intended.",
    });
  }

  if (analysis.commandCount > 250) {
    checks.push({
      id: "complexity",
      severity: "warning",
      title: "High path complexity",
      detail: `${analysis.commandCount} commands may be expensive when animated or repeated many times.`,
    });
  } else {
    checks.push({
      id: "complexity",
      severity: "pass",
      title: "Practical command count",
      detail: `${analysis.commandCount} commands is suitable for common UI and web illustration use.`,
    });
  }

  if (analysis.maxAbsoluteCoordinate > 100_000) {
    checks.push({
      id: "coordinates",
      severity: "warning",
      title: "Extreme coordinate values",
      detail: "Large coordinates can reduce editing precision. Normalize or scale the path before shipping.",
    });
  }

  if (analysis.outputBytes > 10_000) {
    checks.push({
      id: "payload",
      severity: "warning",
      title: "Large inline payload",
      detail: `${analysis.outputBytes.toLocaleString()} bytes may be better served as an external SVG asset.`,
    });
  } else {
    checks.push({
      id: "payload",
      severity: "pass",
      title: "Compact inline payload",
      detail: `${analysis.outputBytes.toLocaleString()} bytes before surrounding markup.`,
    });
  }

  if (!options.minified && analysis.outputBytes > 300) {
    checks.push({
      id: "minify",
      severity: "info",
      title: "Minification is available",
      detail: "Enable minified output or run Optimize before embedding the path in production code.",
    });
  }

  return checks;
}

export function buildSvgMarkup(options: ExportOptions): string {
  const viewBox = formatViewBox(options.viewBox);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true" focusable="false">\n  <path d="${options.path}" fill="${options.fill}" stroke="${options.stroke}" stroke-width="${round(options.strokeWidth, 3)}" stroke-linecap="round" stroke-linejoin="round" />\n</svg>`;
}

export function buildReactComponent(options: ExportOptions): string {
  const componentName = sanitizeComponentName(options.componentName ?? "DarmaSvgPath");
  const viewBox = formatViewBox(options.viewBox);
  return `import type { SVGProps } from "react";\n\nexport function ${componentName}(props: SVGProps<SVGSVGElement>) {\n  return (\n    <svg viewBox="${viewBox}" aria-hidden="true" focusable="false" {...props}>\n      <path\n        d="${options.path}"\n        fill="${options.fill}"\n        stroke="${options.stroke}"\n        strokeWidth={${round(options.strokeWidth, 3)}}\n        strokeLinecap="round"\n        strokeLinejoin="round"\n      />\n    </svg>\n  );\n}\n`;
}

export function buildCssMaskSnippet(options: ExportOptions): string {
  const svg = buildSvgMarkup({ ...options, fill: "black", stroke: "none", strokeWidth: 0 })
    .replace(/\n/g, "")
    .replace(/\s{2,}/g, " ");
  const encodedSvg = encodeURIComponent(svg);
  return `.darma-svg-icon {\n  width: 1.5rem;\n  aspect-ratio: ${round(options.viewBox.width, 3)} / ${round(options.viewBox.height, 3)};\n  background: currentColor;\n  -webkit-mask: url('data:image/svg+xml,${encodedSvg}') center / contain no-repeat;\n  mask: url('data:image/svg+xml,${encodedSvg}') center / contain no-repeat;\n}\n`;
}

export function buildJsonManifest(options: ExportOptions, analysis: PathAnalysis): string {
  return JSON.stringify({
    version: 1,
    generator: "Darma SVG Path Editor",
    path: options.path,
    viewBox: options.viewBox,
    appearance: {
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
    },
    analysis,
  }, null, 2);
}

export function buildMarkdownReport(analysis: PathAnalysis, checks: ProductionCheck[]): string {
  const bounds = analysis.bounds
    ? `${round(analysis.bounds.width)} × ${round(analysis.bounds.height)}`
    : "Unavailable";
  const lines = [
    "# Darma SVG Path Report",
    "",
    `- Commands: ${analysis.commandCount}`,
    `- Editable points: ${analysis.editablePointCount}`,
    `- Subpaths: ${analysis.subpathCount}`,
    `- Closed subpaths: ${analysis.closedSubpathCount}`,
    `- Approximate bounds: ${bounds}`,
    `- Path payload: ${analysis.outputBytes} bytes`,
    "",
    "## Production checks",
    "",
    ...checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.detail}`),
    "",
  ];
  return lines.join("\n");
}
