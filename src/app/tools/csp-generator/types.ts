export type CspPolicyMode = "basic" | "strict-nonce" | "hash" | "report-only" | "custom";
export type CspRiskLevel = "strong" | "moderate" | "permissive" | "risky" | "invalid";

export type CspDirectiveName =
  | "default-src"
  | "script-src"
  | "style-src"
  | "img-src"
  | "connect-src"
  | "font-src"
  | "frame-src"
  | "child-src"
  | "worker-src"
  | "manifest-src"
  | "media-src"
  | "object-src"
  | "base-uri"
  | "form-action"
  | "frame-ancestors"
  | "navigate-to"
  | "upgrade-insecure-requests"
  | "require-trusted-types-for"
  | "trusted-types"
  | "report-uri"
  | "report-to";

export type CspSourceRisk = "safe" | "normal" | "contextual" | "risky";

export type CspSourceValue = {
  id: string;
  value: string;
  risk: CspSourceRisk;
};

export type CspDirective = {
  id: string;
  name: CspDirectiveName | string;
  enabled: boolean;
  sources: CspSourceValue[];
  description: string;
};

export type CspIntegrationId =
  | "google-fonts"
  | "google-analytics"
  | "youtube"
  | "stripe"
  | "sentry"
  | "cloudflare-cdn"
  | "custom";

export type CspExportTarget =
  | "header"
  | "report-only-header"
  | "meta"
  | "nextjs"
  | "vercel"
  | "netlify"
  | "nginx"
  | "apache"
  | "express"
  | "cloudflare-worker"
  | "explanation";

export type CspExportOptions = {
  headerName: "Content-Security-Policy" | "Content-Security-Policy-Report-Only";
  includeComments: boolean;
  lineBreakDirectives: boolean;
  quoteStyle: "double" | "single";
  reportEndpoint: string;
};

export type CspGeneratorState = {
  presetId: string;
  policyMode: CspPolicyMode;
  reportOnly: boolean;
  directives: CspDirective[];
  selectedDirectiveId: string | null;
  enabledIntegrations: CspIntegrationId[];
  exportOptions: CspExportOptions;
};

export type CspValidationMessage = {
  type: "info" | "warning" | "error";
  severity: "low" | "medium" | "high";
  message: string;
  directiveName?: string;
  source?: string;
};

export type CspPreset = {
  id: string;
  name: string;
  description: string;
  riskLevel: CspRiskLevel;
  state: CspGeneratorState;
};
