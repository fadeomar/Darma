export type JwtDecodeStatus = "empty" | "decoded" | "invalid" | "warning" | "expired" | "not-yet-valid";

export type JwtDecodeIssue = {
  level: "error" | "warning" | "info";
  message: string;
};

export type JwtDecodedSection = {
  raw: string;
  decoded: string;
  parsed: unknown;
  pretty: string;
};

export type JwtClaimInsight = {
  key: string;
  label: string;
  value: string;
  rawValue: unknown;
  status: "success" | "warning" | "danger" | "info";
  description: string;
};

export type JwtClaimAnalysis = {
  insights: JwtClaimInsight[];
  isExpired: boolean | null;
  isNotYetValid: boolean | null;
  expiresAt: string | null;
  expiresIn: string | null;
  issuedAt: string | null;
  notBefore: string | null;
};

export type JwtDecodeResult = {
  status: JwtDecodeStatus;
  issues: JwtDecodeIssue[];
  token: string;
  tokenBytes: number;
  segments: string[];
  header: JwtDecodedSection | null;
  payload: JwtDecodedSection | null;
  signature: string;
  decodedJson: string;
  algorithm: string | null;
  tokenType: string | null;
  headerClaimCount: number;
  payloadClaimCount: number;
  claimAnalysis: JwtClaimAnalysis;
};

export type JwtCheck = {
  id: string;
  severity: "success" | "info" | "warning" | "danger";
  title: string;
  message: string;
};

export type JwtTab = "payload" | "header" | "claims" | "security" | "signature";
export type JwtVerificationMode = "secret" | "jwk";
export type JwtVerificationStatus = "idle" | "verified" | "failed";

export type JwtVerificationResult = {
  status: JwtVerificationStatus;
  message: string;
  verifiedAt: string | null;
  algorithm: string | null;
  payload: Record<string, unknown> | null;
  header: Record<string, unknown> | null;
};

export type JwtVerificationInput = {
  token: string;
  mode: JwtVerificationMode;
  secret?: string;
  jwk?: string;
  issuer?: string;
  audience?: string;
};

export type JwtSampleDefinition = {
  id: string;
  label: string;
  category: string;
  description: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature?: string;
};
