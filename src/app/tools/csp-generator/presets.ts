import { createDefaultCspState, createCspDirective } from "./csp";
import type { CspGeneratorState, CspPreset } from "./types";

function source(value: string, directiveName: string) {
  return {
    id: `${directiveName}-${value}`.replace(/[^a-z0-9]+/gi, "-"),
    value,
    risk: value === "'unsafe-inline'" || value === "'unsafe-eval'" || value === "*" || value === "http:" ? "risky" as const : value === "data:" || value === "https:" || value.includes("*.") ? "contextual" as const : "normal" as const,
  };
}

function directive(name: string, values: string[] = []) {
  return createCspDirective({ name, sources: values.map((item) => source(item, name)) });
}

function base(partial: Partial<CspGeneratorState> = {}): CspGeneratorState {
  return { ...createDefaultCspState(), ...partial };
}

export const CSP_PRESETS: readonly CspPreset[] = [
  {
    id: "strict-starter",
    name: "Strict starter",
    description: "Nonce-based script policy with strong defaults.",
    riskLevel: "strong",
    state: createDefaultCspState(),
  },
  {
    id: "static-site",
    name: "Static website",
    description: "Simple static site with self-hosted assets.",
    riskLevel: "strong",
    state: base({
      presetId: "static-site",
      policyMode: "basic",
      directives: [
        directive("default-src", ["'self'"]),
        directive("script-src", ["'self'"]),
        directive("style-src", ["'self'"]),
        directive("img-src", ["'self'", "data:"]),
        directive("font-src", ["'self'"]),
        directive("object-src", ["'none'"]),
        directive("base-uri", ["'none'"]),
        directive("form-action", ["'self'"]),
        directive("frame-ancestors", ["'none'"]),
      ],
    }),
  },
  {
    id: "nextjs-app",
    name: "Next.js app",
    description: "Starter policy for a modern Next.js application.",
    riskLevel: "moderate",
    state: base({
      presetId: "nextjs-app",
      policyMode: "basic",
      directives: [
        directive("default-src", ["'self'"]),
        directive("script-src", ["'self'", "'unsafe-inline'"]),
        directive("style-src", ["'self'", "'unsafe-inline'"]),
        directive("img-src", ["'self'", "data:", "blob:", "https:"]),
        directive("font-src", ["'self'", "data:"]),
        directive("connect-src", ["'self'", "https:"]),
        directive("object-src", ["'none'"]),
        directive("base-uri", ["'self'"]),
        directive("form-action", ["'self'"]),
        directive("frame-ancestors", ["'none'"]),
        directive("upgrade-insecure-requests", []),
      ],
    }),
  },
  {
    id: "marketing-analytics",
    name: "Marketing site with analytics",
    description: "Allows common analytics, fonts, and remote images.",
    riskLevel: "moderate",
    state: base({
      presetId: "marketing-analytics",
      policyMode: "basic",
      directives: [
        directive("default-src", ["'self'"]),
        directive("script-src", ["'self'", "https://www.googletagmanager.com"]),
        directive("style-src", ["'self'", "https://fonts.googleapis.com"]),
        directive("img-src", ["'self'", "data:", "https:"]),
        directive("font-src", ["'self'", "https://fonts.gstatic.com"]),
        directive("connect-src", ["'self'", "https://www.google-analytics.com"]),
        directive("object-src", ["'none'"]),
        directive("base-uri", ["'none'"]),
        directive("form-action", ["'self'"]),
        directive("frame-ancestors", ["'none'"]),
      ],
    }),
  },
  {
    id: "saas-dashboard",
    name: "SaaS dashboard",
    description: "API, fonts, images, workers, and frame controls for app dashboards.",
    riskLevel: "moderate",
    state: base({
      presetId: "saas-dashboard",
      directives: [
        directive("default-src", ["'self'"]),
        directive("script-src", ["'self'"]),
        directive("style-src", ["'self'", "'unsafe-inline'"]),
        directive("img-src", ["'self'", "data:", "blob:", "https:"]),
        directive("font-src", ["'self'", "data:"]),
        directive("connect-src", ["'self'", "https:", "wss:"]),
        directive("worker-src", ["'self'", "blob:"]),
        directive("frame-src", ["'self'"]),
        directive("object-src", ["'none'"]),
        directive("base-uri", ["'none'"]),
        directive("form-action", ["'self'"]),
        directive("frame-ancestors", ["'self'"]),
      ],
    }),
  },
  {
    id: "embedded-media",
    name: "Embedded media",
    description: "Starter for pages using YouTube or embedded videos.",
    riskLevel: "moderate",
    state: base({
      presetId: "embedded-media",
      directives: [
        directive("default-src", ["'self'"]),
        directive("script-src", ["'self'"]),
        directive("style-src", ["'self'"]),
        directive("img-src", ["'self'", "data:", "https://i.ytimg.com"]),
        directive("frame-src", ["https://www.youtube.com", "https://www.youtube-nocookie.com"]),
        directive("media-src", ["'self'", "https:"]),
        directive("object-src", ["'none'"]),
        directive("base-uri", ["'none'"]),
        directive("form-action", ["'self'"]),
        directive("frame-ancestors", ["'none'"]),
      ],
    }),
  },
  {
    id: "report-only",
    name: "Report-only testing",
    description: "Test policy impact without blocking resources.",
    riskLevel: "moderate",
    state: base({ presetId: "report-only", policyMode: "report-only", reportOnly: true, directives: [...createDefaultCspState().directives, directive("report-uri", ["/csp-report"])] }),
  },
  {
    id: "learning-demo",
    name: "Learning demo",
    description: "Easy-to-read policy for learning CSP syntax.",
    riskLevel: "permissive",
    state: base({
      presetId: "learning-demo",
      policyMode: "basic",
      directives: [
        directive("default-src", ["'self'"]),
        directive("script-src", ["'self'", "https:"]),
        directive("style-src", ["'self'", "'unsafe-inline'"]),
        directive("img-src", ["'self'", "data:", "https:"]),
        directive("connect-src", ["'self'", "https:"]),
        directive("object-src", ["'none'"]),
      ],
    }),
  },
];
