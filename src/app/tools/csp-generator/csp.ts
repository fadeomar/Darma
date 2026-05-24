import type {
  CspDirective,
  CspGeneratorState,
  CspIntegrationId,
  CspRiskLevel,
  CspSourceValue,
  CspValidationMessage,
} from "./types";

const DIRECTIVE_DESCRIPTIONS: Record<string, string> = {
  "default-src": "Fallback source list for most resource types.",
  "script-src": "Controls which scripts can execute.",
  "style-src": "Controls stylesheets and inline styles.",
  "img-src": "Controls images, icons, and image-like resources.",
  "connect-src": "Controls fetch, XHR, WebSocket, and EventSource connections.",
  "font-src": "Controls web font loading.",
  "frame-src": "Controls frames and embedded browsing contexts.",
  "child-src": "Legacy fallback for workers and frames.",
  "worker-src": "Controls workers and service workers.",
  "manifest-src": "Controls web app manifest loading.",
  "media-src": "Controls audio and video loading.",
  "object-src": "Controls plugin/object/embed content.",
  "base-uri": "Controls which URLs can be used in a base element.",
  "form-action": "Controls where forms can submit.",
  "frame-ancestors": "Controls who can embed this page.",
  "navigate-to": "Controls navigation targets in supporting browsers.",
  "upgrade-insecure-requests": "Asks the browser to upgrade HTTP resource URLs to HTTPS.",
  "require-trusted-types-for": "Enforces Trusted Types for supported DOM sinks.",
  "trusted-types": "Restricts allowed Trusted Types policy names.",
  "report-uri": "Legacy endpoint for CSP violation reports.",
  "report-to": "Reporting API group for CSP violation reports.",
};

const ORDER = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "connect-src",
  "font-src",
  "frame-src",
  "child-src",
  "worker-src",
  "manifest-src",
  "media-src",
  "object-src",
  "base-uri",
  "form-action",
  "frame-ancestors",
  "navigate-to",
  "upgrade-insecure-requests",
  "require-trusted-types-for",
  "trusted-types",
  "report-uri",
  "report-to",
];

function uid(prefix = "csp") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function classifySourceRisk(directiveName: string, source: string): CspSourceValue["risk"] {
  const value = source.trim();
  if (["'none'", "'self'"].includes(value) || value.startsWith("'nonce-") || value.startsWith("'sha")) return "safe";
  if (["'unsafe-inline'", "'unsafe-eval'", "*", "http:"].includes(value)) return "risky";
  if (value === "data:" && directiveName !== "img-src" && directiveName !== "font-src") return "risky";
  if (value === "data:" || value === "blob:" || value === "https:" || value.includes("*.")) return "contextual";
  return "normal";
}

export function createSource(value: string, directiveName: string): CspSourceValue {
  return { id: uid("source"), value: value.trim(), risk: classifySourceRisk(directiveName, value) };
}

export function createCspDirective(partial: Partial<CspDirective> = {}): CspDirective {
  const name = partial.name ?? "default-src";
  return {
    id: partial.id ?? uid("directive"),
    name,
    enabled: partial.enabled ?? true,
    description: partial.description ?? DIRECTIVE_DESCRIPTIONS[name] ?? "Custom CSP directive.",
    sources: partial.sources ?? [],
  };
}

function directive(name: string, sources: string[] = [], enabled = true): CspDirective {
  return createCspDirective({ name, enabled, sources: sources.map((source) => createSource(source, name)) });
}

export function createDefaultCspState(): CspGeneratorState {
  return {
    presetId: "strict-starter",
    policyMode: "strict-nonce",
    reportOnly: false,
    selectedDirectiveId: null,
    enabledIntegrations: [],
    exportOptions: {
      headerName: "Content-Security-Policy",
      includeComments: true,
      lineBreakDirectives: false,
      quoteStyle: "double",
      reportEndpoint: "/csp-report",
    },
    directives: [
      directive("default-src", ["'self'"]),
      directive("script-src", ["'nonce-{RANDOM_NONCE}'", "'strict-dynamic'"]),
      directive("style-src", ["'self'"]),
      directive("img-src", ["'self'", "data:", "https:"]),
      directive("font-src", ["'self'"]),
      directive("connect-src", ["'self'"]),
      directive("object-src", ["'none'"]),
      directive("base-uri", ["'none'"]),
      directive("form-action", ["'self'"]),
      directive("frame-ancestors", ["'none'"]),
      directive("upgrade-insecure-requests", []),
    ],
  };
}

function enabledDirectives(state: CspGeneratorState) {
  return [...state.directives]
    .filter((item) => item.enabled)
    .sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
}

export function generateCspPolicy(state: CspGeneratorState): string {
  const separator = state.exportOptions.lineBreakDirectives ? ";\n  " : "; ";
  return enabledDirectives(state)
    .map((directiveItem) => {
      const sources = directiveItem.sources.map((source) => source.value).filter(Boolean);
      return sources.length > 0 ? `${directiveItem.name} ${sources.join(" ")}` : directiveItem.name;
    })
    .join(separator)
    .trim();
}

export function generateCspHeader(state: CspGeneratorState): string {
  const headerName = state.reportOnly ? "Content-Security-Policy-Report-Only" : state.exportOptions.headerName;
  return `${headerName}: ${generateCspPolicy(state)}`;
}

export function generateCspMetaTag(state: CspGeneratorState): string {
  const policy = generateCspPolicy(state).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<meta\n  http-equiv="Content-Security-Policy"\n  content="${policy}"\n/>`;
}

export function generateNextJsHeadersConfig(state: CspGeneratorState): string {
  const key = state.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return `const securityHeaders = [\n  {\n    key: "${key}",\n    value: "${generateCspPolicy(state)}",\n  },\n];\n\nexport default {\n  async headers() {\n    return [\n      {\n        source: "/(.*)",\n        headers: securityHeaders,\n      },\n    ];\n  },\n};`;
}

export function generateVercelConfig(state: CspGeneratorState): string {
  const key = state.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return JSON.stringify({ headers: [{ source: "/(.*)", headers: [{ key, value: generateCspPolicy(state) }] }] }, null, 2);
}

export function generateNetlifyHeaders(state: CspGeneratorState): string {
  const key = state.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return `/*\n  ${key}: ${generateCspPolicy(state)}`;
}

export function generateNginxHeader(state: CspGeneratorState): string {
  const key = state.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return `add_header ${key} "${generateCspPolicy(state)}" always;`;
}

export function generateApacheHeader(state: CspGeneratorState): string {
  const key = state.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return `Header always set ${key} "${generateCspPolicy(state)}"`;
}

export function generateExpressMiddleware(state: CspGeneratorState): string {
  const key = state.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return `app.use((req, res, next) => {\n  res.setHeader(\n    "${key}",\n    "${generateCspPolicy(state)}"\n  );\n  next();\n});`;
}

export function generateCloudflareWorkerSnippet(state: CspGeneratorState): string {
  const key = state.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return `export default {\n  async fetch(request, env, ctx) {\n    const response = await fetch(request);\n    const newResponse = new Response(response.body, response);\n    newResponse.headers.set("${key}", "${generateCspPolicy(state)}");\n    return newResponse;\n  },\n};`;
}

export function generateCspExplanation(state: CspGeneratorState): string {
  const risk = calculateCspRiskLevel(state);
  const directives = enabledDirectives(state).map((item) => item.name).join(", ");
  const mode = state.reportOnly ? "report-only testing" : state.policyMode;
  return `This ${mode} CSP currently scores as ${risk}. It includes these enabled directives: ${directives}. CSP is a browser-enforced allowlist that can reduce the impact of cross-site scripting and data injection, but it is not a replacement for escaping, validation, dependency hygiene, and secure app code. Test policies in report-only mode before enforcing them on production traffic.`;
}

export function parseCspPolicy(input: string): { directives: CspDirective[]; warnings: CspValidationMessage[] } {
  const warnings: CspValidationMessage[] = [];
  const trimmed = input.replace(/^Content-Security-Policy(-Report-Only)?:/i, "").trim().slice(0, 10000);
  const directives = trimmed
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name = "", ...sources] = part.split(/\s+/).filter(Boolean);
      if (!name.includes("-")) {
        warnings.push({ type: "warning", severity: "medium", message: `“${name}” may not be a valid CSP directive.`, directiveName: name });
      }
      return createCspDirective({ name, sources: sources.map((source) => createSource(source, name)) });
    });
  if (directives.length === 0) {
    warnings.push({ type: "error", severity: "high", message: "No CSP directives were found in the pasted policy." });
  }
  return { directives, warnings };
}

function findDirective(state: CspGeneratorState, name: string) {
  return state.directives.find((item) => item.name === name && item.enabled);
}

export function validateCspState(state: CspGeneratorState): CspValidationMessage[] {
  const messages: CspValidationMessage[] = [];
  const directives = enabledDirectives(state);
  for (const item of directives) {
    for (const source of item.sources) {
      if (source.value === "'unsafe-inline'" && item.name === "script-src") messages.push({ type: "warning", severity: "high", message: "script-src allows 'unsafe-inline'. Prefer nonces or hashes for production.", directiveName: item.name, source: source.value });
      if (source.value === "'unsafe-eval'") messages.push({ type: "warning", severity: "high", message: "'unsafe-eval' enables string-to-code execution and should be avoided.", directiveName: item.name, source: source.value });
      if (source.value === "*") messages.push({ type: "warning", severity: "high", message: "Wildcard * allows any origin for this directive.", directiveName: item.name, source: source.value });
      if (source.value === "http:") messages.push({ type: "warning", severity: "medium", message: "http: allows insecure resources. Prefer https:.", directiveName: item.name, source: source.value });
      if (source.value === "data:" && item.name === "script-src") messages.push({ type: "warning", severity: "high", message: "data: in script-src is highly risky and should be avoided.", directiveName: item.name, source: source.value });
      if (source.value.includes("{RANDOM_NONCE}")) messages.push({ type: "info", severity: "medium", message: "Replace nonce placeholders with a cryptographically random nonce for every response.", directiveName: item.name, source: source.value });
    }
  }
  if (!findDirective(state, "default-src")) messages.push({ type: "warning", severity: "medium", message: "default-src is missing. Add a fallback directive for predictable policy behavior.", directiveName: "default-src" });
  if (!findDirective(state, "object-src")) messages.push({ type: "warning", severity: "medium", message: "Consider object-src 'none' to restrict plugin/object content.", directiveName: "object-src" });
  if (!findDirective(state, "base-uri")) messages.push({ type: "warning", severity: "medium", message: "Consider base-uri 'none' or 'self' to reduce base tag injection risk.", directiveName: "base-uri" });
  if (!findDirective(state, "frame-ancestors")) messages.push({ type: "info", severity: "low", message: "frame-ancestors is not set. Add it to define who can embed your site.", directiveName: "frame-ancestors" });
  if (state.reportOnly || state.policyMode === "report-only") messages.push({ type: "info", severity: "medium", message: "Report-only mode logs violations but does not block them." });
  messages.push({ type: "info", severity: "low", message: "A CSP generator is not a full security audit. Test the policy against your real application." });
  return messages;
}

export function calculateCspRiskLevel(state: CspGeneratorState): CspRiskLevel {
  const messages = validateCspState(state);
  if (messages.some((message) => message.type === "error")) return "invalid";
  const riskySourceCount = state.directives.flatMap((directiveItem) => directiveItem.sources).filter((source) => source.risk === "risky").length;
  if (riskySourceCount >= 2 || messages.some((message) => message.severity === "high")) return "risky";
  if (riskySourceCount === 1 || !findDirective(state, "frame-ancestors")) return "permissive";
  if (state.policyMode === "strict-nonce" || state.policyMode === "hash") return "strong";
  return "moderate";
}

function upsertDirective(state: CspGeneratorState, name: string, sources: string[]) {
  const existing = state.directives.find((item) => item.name === name);
  const nextSources = sources.map((source) => createSource(source, name));
  if (!existing) return { ...state, directives: [...state.directives, directive(name, sources)] };
  const existingValues = new Set(existing.sources.map((source) => source.value));
  return {
    ...state,
    directives: state.directives.map((item) =>
      item.id === existing.id
        ? { ...item, enabled: true, sources: [...item.sources, ...nextSources.filter((source) => !existingValues.has(source.value))] }
        : item,
    ),
  };
}

export function applyCspIntegration(state: CspGeneratorState, integrationId: string): CspGeneratorState {
  let next = { ...state, enabledIntegrations: [...new Set([...state.enabledIntegrations, integrationId as CspIntegrationId])] };
  if (integrationId === "google-fonts") {
    next = upsertDirective(next, "style-src", ["https://fonts.googleapis.com"]);
    next = upsertDirective(next, "font-src", ["https://fonts.gstatic.com"]);
  }
  if (integrationId === "google-analytics") {
    next = upsertDirective(next, "script-src", ["https://www.googletagmanager.com"]);
    next = upsertDirective(next, "connect-src", ["https://www.google-analytics.com"]);
  }
  if (integrationId === "youtube") {
    next = upsertDirective(next, "frame-src", ["https://www.youtube.com", "https://www.youtube-nocookie.com"]);
    next = upsertDirective(next, "img-src", ["https://i.ytimg.com"]);
  }
  if (integrationId === "stripe") {
    next = upsertDirective(next, "script-src", ["https://js.stripe.com"]);
    next = upsertDirective(next, "frame-src", ["https://js.stripe.com", "https://hooks.stripe.com"]);
  }
  if (integrationId === "sentry") next = upsertDirective(next, "connect-src", ["https://*.ingest.sentry.io"]);
  if (integrationId === "cloudflare-cdn") {
    next = upsertDirective(next, "script-src", ["https://cdnjs.cloudflare.com"]);
    next = upsertDirective(next, "style-src", ["https://cdnjs.cloudflare.com"]);
  }
  return next;
}
