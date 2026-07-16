export type CodePreviewViewport = "desktop" | "tablet" | "mobile";

export type ProjectSource = {
  html: string;
  css: string;
  js: string;
};

export type CodePreviewProject = {
  schemaVersion: 2;
  tool: "darma-code-preview";
  exportedAt: string;
  settings: {
    viewport: CodePreviewViewport;
    autoRun: boolean;
  };
  files: {
    "index.html": string;
    "styles.css": string;
    "script.js": string;
  };
};

export type CheckSeverity = "error" | "warning" | "info" | "pass";

export type ProductionCheck = {
  id: string;
  label: string;
  detail: string;
  status: CheckSeverity;
};

export type CodePreviewMetrics = {
  sourceBytes: number;
  htmlLines: number;
  cssLines: number;
  jsLines: number;
  elementCount: number;
  selectorCount: number;
  functionCount: number;
  blockingChecks: number;
  warningChecks: number;
  infoChecks: number;
  passingChecks: number;
  readinessScore: number;
};

export type ImportedCodePreviewProject = {
  source: ProjectSource;
  viewport: CodePreviewViewport;
  autoRun: boolean;
};

export const CODE_PREVIEW_PROJECT_MAX_BYTES = 1_000_000;
const MAX_FILE_CHARS = 600_000;
const SUPPORTED_VIEWPORTS = new Set<CodePreviewViewport>(["desktop", "tablet", "mobile"]);

function countLines(value: string) {
  return value ? value.split(/\r\n|\r|\n/).length : 0;
}

function utf8Bytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function cleanSource(value: unknown, label: string) {
  if (typeof value !== "string") throw new Error(`${label} must be a string.`);
  if (value.length > MAX_FILE_CHARS) throw new Error(`${label} is too large.`);
  return value.replace(/\u0000/g, "");
}

function escapeRawTextClosingTag(value: string, tag: "script" | "style") {
  return value.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);
}

function csvCell(value: string | number) {
  const text = String(value);
  const spreadsheetSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${spreadsheetSafe.replace(/"/g, '""')}"`;
}

export function buildStandaloneDocument(source: ProjectSource, externalFiles = false) {
  const styles = externalFiles
    ? '<link rel="stylesheet" href="styles.css" />'
    : `<style>\n${escapeRawTextClosingTag(source.css, "style")}\n</style>`;
  const scripts = externalFiles
    ? '<script src="script.js" defer></script>'
    : `<script>\n${escapeRawTextClosingTag(source.js, "script")}\n</script>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Darma code preview</title>
  ${styles}
</head>
<body>
${source.html}
  ${scripts}
</body>
</html>`;
}

export function buildProject(source: ProjectSource, viewport: CodePreviewViewport, autoRun: boolean): CodePreviewProject {
  return {
    schemaVersion: 2,
    tool: "darma-code-preview",
    exportedAt: new Date().toISOString(),
    settings: { viewport, autoRun },
    files: {
      "index.html": source.html,
      "styles.css": source.css,
      "script.js": source.js,
    },
  };
}

export function buildProjectJson(source: ProjectSource, viewport: CodePreviewViewport, autoRun: boolean) {
  return JSON.stringify(buildProject(source, viewport, autoRun), null, 2);
}

export function parseProjectJson(raw: string): ImportedCodePreviewProject {
  if (!raw.trim()) throw new Error("The project file is empty.");
  if (utf8Bytes(raw) > CODE_PREVIEW_PROJECT_MAX_BYTES) {
    throw new Error("The project file exceeds the 1 MB import limit.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The project file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The project root must be an object.");
  }

  const value = parsed as Record<string, unknown>;
  if (value.tool !== "darma-code-preview") {
    throw new Error("This file was not exported by the Darma Code Preview tool.");
  }
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) {
    throw new Error("Unsupported Code Preview project version.");
  }
  if (!value.files || typeof value.files !== "object" || Array.isArray(value.files)) {
    throw new Error("The project is missing its files object.");
  }

  const files = value.files as Record<string, unknown>;
  const source = {
    html: cleanSource(files["index.html"], "index.html"),
    css: cleanSource(files["styles.css"], "styles.css"),
    js: cleanSource(files["script.js"], "script.js"),
  };

  if (utf8Bytes(source.html) + utf8Bytes(source.css) + utf8Bytes(source.js) > CODE_PREVIEW_PROJECT_MAX_BYTES) {
    throw new Error("The imported source exceeds the 1 MB project limit.");
  }

  let viewport: CodePreviewViewport = "desktop";
  let autoRun = true;
  if (value.schemaVersion === 2 && value.settings && typeof value.settings === "object" && !Array.isArray(value.settings)) {
    const settings = value.settings as Record<string, unknown>;
    if (typeof settings.viewport === "string" && SUPPORTED_VIEWPORTS.has(settings.viewport as CodePreviewViewport)) {
      viewport = settings.viewport as CodePreviewViewport;
    }
    if (typeof settings.autoRun === "boolean") autoRun = settings.autoRun;
  }

  return { source, viewport, autoRun };
}

export function getDuplicateIds(html: string) {
  const ids = Array.from(html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi), (match) => match[1]);
  const counts = new Map<string, number>();
  ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}

export function hasBalancedCssBraces(css: string) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  for (const char of withoutComments) {
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

export function canCompileJavascript(js: string) {
  if (!js.trim()) return true;
  try {
    // Syntax check only. The function is never executed here.
    new Function(js);
    return true;
  } catch {
    return false;
  }
}

export function getProductionChecks(source: ProjectSource): ProductionCheck[] {
  const duplicateIds = getDuplicateIds(source.html);
  const images = Array.from(source.html.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
  const imagesWithoutAlt = images.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag));
  const buttons = Array.from(source.html.matchAll(/<button\b[^>]*>/gi), (match) => match[0]);
  const buttonsWithoutType = buttons.filter((tag) => !/\btype\s*=/i.test(tag));
  const blankLinks = Array.from(source.html.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi), (match) => match[0]);
  const unsafeBlankLinks = blankLinks.filter((tag) => !/\brel\s*=\s*["'][^"']*noopener[^"']*["']/i.test(tag));
  const formControls = Array.from(source.html.matchAll(/<(input|textarea|select)\b[^>]*>/gi), (match) => match[0]);
  const controlsWithoutAccessibleName = formControls.filter((tag) => {
    if (/\b(type\s*=\s*["']hidden["']|aria-label\s*=|aria-labelledby\s*=|title\s*=)/i.test(tag)) return false;
    const id = tag.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
    return !id || !new RegExp(`<label\\b[^>]*for\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i").test(source.html);
  });
  const hasInlineHandlers = /\son[a-z]+\s*=/i.test(source.html);
  const hasScriptTag = /<script\b/i.test(source.html);
  const hasDebugStatements = /\bconsole\.(log|debug)\s*\(/.test(source.js);
  const hasExternalResources = /<(script|link|img)\b[^>]*(src|href)\s*=\s*["']https?:\/\//i.test(source.html) || /@import\s+(url\()?\s*["']?https?:\/\//i.test(source.css);
  const hasSecretLikeText = /(api[_-]?key|secret|access[_-]?token|private[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/i.test(`${source.html}\n${source.js}`);
  const sourceBytes = utf8Bytes(source.html) + utf8Bytes(source.css) + utf8Bytes(source.js);

  return [
    {
      id: "html-source",
      label: "HTML source",
      detail: source.html.trim() ? "Markup is present." : "Add HTML before exporting or sharing the preview.",
      status: source.html.trim() ? "pass" : "error",
    },
    {
      id: "css-braces",
      label: "CSS structure",
      detail: hasBalancedCssBraces(source.css) ? "CSS braces are balanced." : "One or more CSS braces appear unmatched.",
      status: hasBalancedCssBraces(source.css) ? "pass" : "error",
    },
    {
      id: "js-syntax",
      label: "JavaScript syntax",
      detail: canCompileJavascript(source.js) ? "JavaScript passes a syntax compile check." : "JavaScript contains a syntax error.",
      status: canCompileJavascript(source.js) ? "pass" : "error",
    },
    {
      id: "duplicate-ids",
      label: "Unique element IDs",
      detail: duplicateIds.length ? `Duplicate IDs: ${duplicateIds.slice(0, 3).join(", ")}.` : "No duplicate IDs detected.",
      status: duplicateIds.length ? "warning" : "pass",
    },
    {
      id: "image-alt",
      label: "Image alternatives",
      detail: imagesWithoutAlt.length ? `${imagesWithoutAlt.length} image tag(s) are missing alt text.` : "All detected images include alt text.",
      status: imagesWithoutAlt.length ? "warning" : "pass",
    },
    {
      id: "form-labels",
      label: "Form labels",
      detail: controlsWithoutAccessibleName.length ? `${controlsWithoutAccessibleName.length} form control(s) need an accessible name.` : "Detected form controls have accessible names.",
      status: controlsWithoutAccessibleName.length ? "warning" : "pass",
    },
    {
      id: "button-types",
      label: "Button behavior",
      detail: buttonsWithoutType.length ? `${buttonsWithoutType.length} button(s) are missing an explicit type.` : "All detected buttons have an explicit type.",
      status: buttonsWithoutType.length ? "warning" : "pass",
    },
    {
      id: "blank-links",
      label: "External link safety",
      detail: unsafeBlankLinks.length ? `${unsafeBlankLinks.length} target=_blank link(s) need rel=noopener.` : "No unsafe target=_blank links detected.",
      status: unsafeBlankLinks.length ? "warning" : "pass",
    },
    {
      id: "inline-events",
      label: "Event separation",
      detail: hasInlineHandlers ? "Move inline on* handlers into the JavaScript panel." : "No inline event handlers detected.",
      status: hasInlineHandlers ? "warning" : "pass",
    },
    {
      id: "html-scripts",
      label: "Script placement",
      detail: hasScriptTag ? "Keep scripts in the JavaScript panel for predictable execution." : "No script tags found inside the HTML panel.",
      status: hasScriptTag ? "warning" : "pass",
    },
    {
      id: "debug-statements",
      label: "Debug statements",
      detail: hasDebugStatements ? "Remove console.log/debug calls before production export." : "No console.log/debug calls detected.",
      status: hasDebugStatements ? "warning" : "pass",
    },
    {
      id: "secret-like-source",
      label: "Secret-like source",
      detail: hasSecretLikeText ? "The source appears to contain a credential-like value. Remove secrets before export." : "No obvious credential-like assignments detected.",
      status: hasSecretLikeText ? "error" : "pass",
    },
    {
      id: "source-size",
      label: "Source size",
      detail: sourceBytes > 500_000 ? "The project is large for a browser preview and portable handoff." : `Combined source size is ${sourceBytes.toLocaleString()} bytes.`,
      status: sourceBytes > 900_000 ? "error" : sourceBytes > 500_000 ? "warning" : "pass",
    },
    {
      id: "external-resources",
      label: "External dependencies",
      detail: hasExternalResources ? "External resources can fail because of CSP, CORS, network, or third-party changes." : "No external resource URL was detected.",
      status: hasExternalResources ? "info" : "pass",
    },
    {
      id: "sandbox-boundary",
      label: "Sandbox boundary",
      detail: "Preview scripts and forms run without same-origin access to the Darma application.",
      status: "info",
    },
  ];
}

export function getMetrics(source: ProjectSource, checks = getProductionChecks(source)): CodePreviewMetrics {
  const counts = {
    error: checks.filter((check) => check.status === "error").length,
    warning: checks.filter((check) => check.status === "warning").length,
    info: checks.filter((check) => check.status === "info").length,
    pass: checks.filter((check) => check.status === "pass").length,
  };
  const penalty = counts.error * 30 + counts.warning * 8;

  return {
    sourceBytes: utf8Bytes(source.html) + utf8Bytes(source.css) + utf8Bytes(source.js),
    htmlLines: countLines(source.html),
    cssLines: countLines(source.css),
    jsLines: countLines(source.js),
    elementCount: Array.from(source.html.matchAll(/<[a-z][^>]*>/gi)).length,
    selectorCount: Array.from(source.css.matchAll(/[^{}]+\{/g)).length,
    functionCount: Array.from(source.js.matchAll(/\bfunction\b|=>/g)).length,
    blockingChecks: counts.error,
    warningChecks: counts.warning,
    infoChecks: counts.info,
    passingChecks: counts.pass,
    readinessScore: Math.max(0, Math.min(100, 100 - penalty)),
  };
}

export function buildMarkdownReport(source: ProjectSource, checks = getProductionChecks(source)) {
  const metrics = getMetrics(source, checks);
  const sections = (["error", "warning", "info", "pass"] as CheckSeverity[])
    .map((severity) => {
      const rows = checks.filter((check) => check.status === severity);
      if (!rows.length) return "";
      return `## ${severity[0].toUpperCase()}${severity.slice(1)}\n\n${rows.map((check) => `- **${check.label}:** ${check.detail}`).join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `# Code Preview production report

Generated by Darma Code Preview Studio.

## Summary

- Readiness score: ${metrics.readinessScore}/100
- Source size: ${metrics.sourceBytes} bytes
- HTML/CSS/JavaScript lines: ${metrics.htmlLines}/${metrics.cssLines}/${metrics.jsLines}
- Elements/selectors/functions: ${metrics.elementCount}/${metrics.selectorCount}/${metrics.functionCount}
- Blocking issues: ${metrics.blockingChecks}
- Warnings: ${metrics.warningChecks}
- Informational checks: ${metrics.infoChecks}

${sections}

## Environment note

The browser preview is a sandboxed front-end smoke test. Validate backend integration, dependencies, CSP, accessibility, and cross-browser behavior in the target application before production deployment.
`;
}

export function buildMetricsCsv(source: ProjectSource, checks = getProductionChecks(source)) {
  const metrics = getMetrics(source, checks);
  const rows: Array<[string, string | number]> = [
    ["readiness_score", metrics.readinessScore],
    ["source_bytes", metrics.sourceBytes],
    ["html_lines", metrics.htmlLines],
    ["css_lines", metrics.cssLines],
    ["javascript_lines", metrics.jsLines],
    ["html_elements", metrics.elementCount],
    ["css_selectors", metrics.selectorCount],
    ["javascript_functions", metrics.functionCount],
    ["blocking_checks", metrics.blockingChecks],
    ["warning_checks", metrics.warningChecks],
    ["info_checks", metrics.infoChecks],
    ["passing_checks", metrics.passingChecks],
  ];
  return ["metric,value", ...rows.map(([metric, value]) => `${csvCell(metric)},${csvCell(value)}`)].join("\n");
}

export async function createProductionZip(source: ProjectSource, viewport: CodePreviewViewport, autoRun: boolean) {
  const { default: JSZip } = await import("jszip");
  const checks = getProductionChecks(source);
  const zip = new JSZip();
  zip.file("index.html", buildStandaloneDocument(source, true));
  zip.file("styles.css", source.css);
  zip.file("script.js", source.js);
  zip.file("darma-project.json", buildProjectJson(source, viewport, autoRun));
  zip.file("production-report.md", buildMarkdownReport(source, checks));
  zip.file("production-metrics.csv", buildMetricsCsv(source, checks));
  zip.file(
    "README.md",
    `# Darma Code Preview production pack\n\nOpen \`index.html\` in a browser. The editable project is stored in \`darma-project.json\`. Review \`production-report.md\` before deployment.\n`,
  );
  return zip.generateAsync({ type: "uint8array" });
}
