import { CSP_DIRECTIVE_ORDER, createCspDirective, createSource } from "./csp";
import { CSP_SERVICES } from "./services";
import type { CspDirective, CspGeneratorState } from "./types";

export type CspPolicyMode = "basic" | "standard" | "strict";

export type CspCustomSource = { id: string; directive: string; value: string };

/**
 * High-level, user-facing state for the redesigned generator.
 * The full `CspGeneratorState` (and every export format) is derived
 * deterministically from this via {@link buildCspState}, so switching
 * mode or toggling a service never leaves the policy inconsistent.
 */
export type CspBuilderState = {
  mode: CspPolicyMode;
  reportOnly: boolean;
  /** Enabled service ids from CSP_SERVICES. */
  services: string[];
  /** Sources added in Step 3 or the advanced editor. */
  added: CspCustomSource[];
  /** Baseline/service sources the user removed in the advanced editor. */
  removed: { directive: string; value: string }[];
  /**
   * Explicit per-directive enable/disable from the advanced editor.
   * When a directive is absent here, its enabled state defaults to whether
   * the active mode/services/custom sources include it.
   */
  directiveOverrides: Record<string, boolean>;
};


export type CspQuickPreset = {
  id: string;
  label: string;
  tagline: string;
  description: string;
  mode: CspPolicyMode;
  services: string[];
  added?: Array<{ directive: string; value: string }>;
  reportOnly?: boolean;
};

export const CSP_QUICK_PRESETS: readonly CspQuickPreset[] = [
  {
    id: "static-site",
    label: "Static site",
    tagline: "Safe starter",
    description: "Marketing pages, docs, blogs, and simple landing pages.",
    mode: "standard",
    services: ["google-fonts", "image-cdn"],
  },
  {
    id: "next-saas",
    label: "Next.js SaaS",
    tagline: "Most common app",
    description: "Next.js app with analytics, API calls, images, and Vercel.",
    mode: "standard",
    services: ["google-fonts", "vercel", "external-apis", "image-cdn"],
  },
  {
    id: "media-page",
    label: "Media embeds",
    tagline: "YouTube/Vimeo",
    description: "Content-heavy pages that embed video and load CDN images.",
    mode: "standard",
    services: ["google-fonts", "youtube", "vimeo", "image-cdn"],
  },
  {
    id: "payments",
    label: "Payments",
    tagline: "Checkout ready",
    description: "Checkout pages using Stripe or PayPal plus app API calls.",
    mode: "standard",
    services: ["google-fonts", "stripe", "paypal", "external-apis"],
  },
  {
    id: "strict-report",
    label: "Strict test",
    tagline: "Report-only",
    description: "Nonce-based CSP for advanced apps. Start in report-only mode.",
    mode: "strict",
    services: [],
    reportOnly: true,
  },
  {
    id: "analytics-site",
    label: "Analytics site",
    tagline: "Marketing + metrics",
    description: "Marketing site with Google Analytics, fonts, and CDN-hosted images.",
    mode: "standard",
    services: ["google-fonts", "google-analytics", "image-cdn"],
  },
  {
    id: "supabase-app",
    label: "Supabase app",
    tagline: "Auth + realtime",
    description: "App using Supabase, external APIs, fonts, and hosted images.",
    mode: "standard",
    services: ["google-fonts", "supabase", "external-apis", "image-cdn"],
  },
  {
    id: "firebase-app",
    label: "Firebase app",
    tagline: "Firebase stack",
    description: "Frontend using Firebase services, analytics, fonts, and external APIs.",
    mode: "standard",
    services: ["google-fonts", "firebase", "google-analytics", "external-apis"],
  },
  {
    id: "auth0-saas",
    label: "Auth0 SaaS",
    tagline: "Hosted identity",
    description: "SaaS app with Auth0 login, API calls, Vercel, and image delivery.",
    mode: "standard",
    services: ["auth0", "vercel", "external-apis", "image-cdn"],
  },
  {
    id: "maps-directory",
    label: "Maps directory",
    tagline: "Location product",
    description: "Directory or store locator using Google Maps, fonts, and APIs.",
    mode: "standard",
    services: ["google-fonts", "google-maps", "external-apis", "image-cdn"],
  },
  {
    id: "cloudinary-media",
    label: "Cloudinary media",
    tagline: "Image-heavy app",
    description: "Image-heavy product using Cloudinary, API calls, and monitoring.",
    mode: "standard",
    services: ["cloudinary", "external-apis", "sentry"],
  },
  {
    id: "video-commerce",
    label: "Video commerce",
    tagline: "Media + checkout",
    description: "Commerce page combining YouTube embeds, Stripe, images, and APIs.",
    mode: "standard",
    services: ["youtube", "stripe", "image-cdn", "external-apis"],
  },
  {
    id: "paypal-checkout",
    label: "PayPal checkout",
    tagline: "Alternative payment",
    description: "Checkout flow using PayPal plus external APIs and hosted images.",
    mode: "standard",
    services: ["paypal", "external-apis", "image-cdn"],
  },
  {
    id: "recaptcha-form",
    label: "Protected forms",
    tagline: "reCAPTCHA",
    description: "Lead or signup forms protected by reCAPTCHA with analytics and fonts.",
    mode: "standard",
    services: ["recaptcha", "google-analytics", "google-fonts"],
  },
  {
    id: "monitoring-app",
    label: "Monitored app",
    tagline: "Sentry + APIs",
    description: "Application with Sentry error monitoring, API calls, and image assets.",
    mode: "standard",
    services: ["sentry", "external-apis", "image-cdn"],
  },
  {
    id: "strict-minimal",
    label: "Strict minimal",
    tagline: "Nonce baseline",
    description: "Minimal strict policy with no third parties, ready for nonce integration.",
    mode: "strict",
    services: [],
  },
] as const;

export const MODE_META: Record<CspPolicyMode, { label: string; tagline: string; description: string; recommended?: boolean }> = {
  basic: {
    label: "Basic",
    tagline: "Easiest to ship",
    description: "Allowlist policy that keeps inline styles working. Good starting point for simple sites.",
  },
  standard: {
    label: "Standard",
    tagline: "Recommended",
    description: "Balanced defaults with hardening directives. Works for most apps with the services below.",
    recommended: true,
  },
  strict: {
    label: "Strict",
    tagline: "Most secure",
    description: "Nonce-based scripts with strict-dynamic. Strongest protection, needs a per-request nonce.",
  },
};

const MODE_BASE: Record<CspPolicyMode, Array<[string, string[]]>> = {
  basic: [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'"]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "https:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
  ],
  standard: [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'"]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "https:"]],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'self'"]],
    ["upgrade-insecure-requests", []],
  ],
  strict: [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'nonce-{RANDOM_NONCE}'", "'strict-dynamic'"]],
    ["style-src", ["'self'"]],
    ["img-src", ["'self'", "data:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'none'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    ["upgrade-insecure-requests", []],
  ],
};

export function createDefaultBuilderState(): CspBuilderState {
  return { mode: "standard", reportOnly: false, services: [], added: [], removed: [], directiveOverrides: {} };
}


export function applyQuickPreset(preset: CspQuickPreset): CspBuilderState {
  return {
    mode: preset.mode,
    reportOnly: preset.reportOnly ?? false,
    services: [...preset.services],
    added: (preset.added ?? []).map((item) => createCustomSource(item.directive, item.value)),
    removed: [],
    directiveOverrides: {},
  };
}

export function countBuilderSelections(builder: CspBuilderState) {
  return {
    services: builder.services.length,
    customSources: builder.added.length,
    removedSources: builder.removed.length,
  };
}

function slug(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "x";
}

export function createCustomSource(directive: string, value: string): CspCustomSource {
  const trimmed = value.trim();
  return { id: `custom-${slug(directive)}-${slug(trimmed)}`, directive, value: trimmed };
}

/** Deterministically expand the builder state into a full CSP state. */
export function buildCspState(builder: CspBuilderState): CspGeneratorState {
  const order: string[] = [];
  const map = new Map<string, string[]>();
  const ensure = (name: string) => {
    if (!map.has(name)) {
      map.set(name, []);
      order.push(name);
    }
    return map.get(name)!;
  };
  const add = (name: string, values: string[]) => {
    const arr = ensure(name);
    for (const value of values) if (value && !arr.includes(value)) arr.push(value);
  };

  for (const [name, values] of MODE_BASE[builder.mode]) {
    ensure(name);
    add(name, values);
  }

  for (const id of builder.services) {
    const service = CSP_SERVICES.find((item) => item.id === id);
    if (!service) continue;
    for (const addition of service.additions) add(addition.directive, addition.sources);
  }

  for (const custom of builder.added) add(custom.directive, [custom.value]);

  // Directives the active mode / services / custom sources actually include.
  // These default to enabled; everything else defaults to disabled so the
  // advanced editor can expose the full directive list without polluting output.
  const includedNames = new Set(order);

  for (const removal of builder.removed) {
    const arr = map.get(removal.directive);
    if (arr) map.set(removal.directive, arr.filter((value) => value !== removal.value));
  }

  // Every known directive, in canonical order, plus any custom directive not in it.
  const allNames = [
    ...CSP_DIRECTIVE_ORDER,
    ...order.filter((name) => !CSP_DIRECTIVE_ORDER.includes(name)),
  ];

  const directives: CspDirective[] = allNames.map((name) => {
    const override = builder.directiveOverrides[name];
    const enabled = override ?? includedNames.has(name);
    return createCspDirective({
      name,
      enabled,
      sources: (map.get(name) ?? []).map((value) => createSource(value, name)),
    });
  });

  return {
    presetId: builder.mode,
    policyMode: builder.mode === "strict" ? "strict-nonce" : "basic",
    reportOnly: builder.reportOnly,
    selectedDirectiveId: null,
    enabledIntegrations: [],
    exportOptions: {
      headerName: builder.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
      includeComments: true,
      lineBreakDirectives: false,
      quoteStyle: "double",
      reportEndpoint: "/csp-report",
    },
    directives,
  };
}
