import { createCspDirective, createSource } from "./csp";
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
  /** Directive names switched off in the advanced editor. */
  disabledDirectives: string[];
};

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
  return { mode: "standard", reportOnly: false, services: [], added: [], removed: [], disabledDirectives: [] };
}

let counter = 0;
export function createCustomSource(directive: string, value: string): CspCustomSource {
  counter += 1;
  return { id: `custom-${counter}-${value.replace(/[^a-z0-9]+/gi, "-")}`, directive, value: value.trim() };
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

  for (const removal of builder.removed) {
    const arr = map.get(removal.directive);
    if (arr) map.set(removal.directive, arr.filter((value) => value !== removal.value));
  }

  const directives: CspDirective[] = order.map((name) =>
    createCspDirective({
      name,
      enabled: !builder.disabledDirectives.includes(name),
      sources: (map.get(name) ?? []).map((value) => createSource(value, name)),
    }),
  );

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
