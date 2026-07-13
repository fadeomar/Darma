export type UrlMode = "encode" | "decode";
export type UrlEncodingType = "full" | "component" | "form";
export type UrlInputKind = "empty" | "absolute-url" | "relative-url" | "query-string" | "text";
export type UrlCheckLevel = "success" | "info" | "warning" | "danger";

export interface UrlProcessSuccess {
  ok: true;
  output: string;
  status: "Encoded" | "Decoded";
}

export interface UrlProcessFailure {
  ok: false;
  output: "";
  status: "Empty input" | "Invalid URL encoding";
  error: string;
}

export type UrlProcessResult = UrlProcessSuccess | UrlProcessFailure;

export interface QueryParamRow {
  id: string;
  index: number;
  key: string;
  value: string;
  duplicate: boolean;
  sensitive: boolean;
}

export interface UrlInspection {
  kind: UrlInputKind;
  raw: string;
  parseable: boolean;
  protocol: string;
  origin: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  username: string;
  hasPassword: boolean;
  queryParams: QueryParamRow[];
  duplicateParamKeys: string[];
  sensitiveParamKeys: string[];
  parseError?: string;
}

export interface UrlStats {
  inputCharacters: number;
  outputCharacters: number;
  percentSequences: number;
  queryParameters: number;
  uniqueQueryKeys: number;
  duplicateQueryKeys: number;
  expansionPercent: number;
}

export interface UrlCheck {
  id: string;
  level: UrlCheckLevel;
  title: string;
  message: string;
}

export interface UrlPreset {
  id: string;
  label: string;
  description: string;
  mode: UrlMode;
  type: UrlEncodingType;
  value: string;
}

export interface UrlCodeSnippets {
  javascript: string;
  queryApi: string;
  curl: string;
}

export interface UrlReport {
  generatedAt: string;
  mode: UrlMode;
  encodingType: UrlEncodingType;
  input: {
    kind: UrlInputKind;
    characters: number;
    redactedPreview: string;
  };
  output: {
    ok: boolean;
    characters: number;
    status: UrlProcessResult["status"];
  };
  inspection: {
    parseable: boolean;
    protocol: string;
    host: string;
    pathname: string;
    hashPresent: boolean;
    queryParameterCount: number;
    duplicateParameterKeys: string[];
    sensitiveParameterKeys: string[];
  };
  stats: UrlStats;
  checks: UrlCheck[];
}
