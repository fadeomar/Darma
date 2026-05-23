export type JwtDecodeStatus = "empty" | "valid" | "invalid" | "warning";

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
  status?: "success" | "warning" | "danger" | "info";
  description: string;
};

export type JwtClaimAnalysis = {
  insights: JwtClaimInsight[];
  isExpired: boolean | null;
  isNotYetValid: boolean | null;
};

export type JwtDecodeResult = {
  status: JwtDecodeStatus;
  issues: JwtDecodeIssue[];
  token: string;
  segments: string[];
  header: JwtDecodedSection | null;
  payload: JwtDecodedSection | null;
  signature: string;
  decodedJson: string;
  claimAnalysis: JwtClaimAnalysis;
};

export type JwtTab = "header" | "payload" | "signature" | "claims";

export type JwtSample = {
  label: string;
  description: string;
  token: string;
};
