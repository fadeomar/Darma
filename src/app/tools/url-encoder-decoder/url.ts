import type {
  QueryParamRow,
  UrlCheck,
  UrlCodeSnippets,
  UrlEncodingType,
  UrlInspection,
  UrlMode,
  UrlProcessResult,
  UrlReport,
  UrlStats,
} from "./types";

export type {
  QueryParamRow,
  UrlCheck,
  UrlEncodingType,
  UrlInspection,
  UrlMode,
  UrlProcessResult,
  UrlStats,
} from "./types";

const INVALID_PERCENT_ERROR =
  "Invalid percent-encoded input. Every percent sign must be followed by two hexadecimal characters, such as %20.";
const RELATIVE_BASE = "https://darma.local";
const SENSITIVE_QUERY_KEY = /(?:^|[_-])(token|access[_-]?token|api[_-]?key|secret|password|passwd|auth|authorization|session|sessionid|jwt|code)(?:$|[_-])/i;
const TRACKING_QUERY_KEY = /^(utm_[a-z0-9_]+|gclid|fbclid|msclkid)$/i;

export function hasMalformedPercentEncoding(value: string): boolean {
  return /%(?![0-9a-fA-F]{2})/.test(value);
}

export function processUrlText(
  input: string,
  mode: UrlMode,
  type: UrlEncodingType,
): UrlProcessResult {
  if (!input) {
    return {
      ok: false,
      output: "",
      status: "Empty input",
      error: "Add text, a URL, or a query string to begin.",
    };
  }

  try {
    if (mode === "encode") {
      const output = encodeByType(input, type);
      return { ok: true, output, status: "Encoded" };
    }

    if (hasMalformedPercentEncoding(input)) {
      return {
        ok: false,
        output: "",
        status: "Invalid URL encoding",
        error: INVALID_PERCENT_ERROR,
      };
    }

    const output = decodeByType(input, type);
    return { ok: true, output, status: "Decoded" };
  } catch (error) {
    return {
      ok: false,
      output: "",
      status: "Invalid URL encoding",
      error:
        error instanceof URIError
          ? INVALID_PERCENT_ERROR
          : "The URL text could not be processed. Check the input and try again.",
    };
  }
}

function encodeByType(input: string, type: UrlEncodingType): string {
  if (type === "full") return encodeURI(input);
  if (type === "form") {
    const params = new URLSearchParams([["value", input]]);
    return params.toString().slice("value=".length);
  }
  return encodeURIComponent(input);
}

function decodeByType(input: string, type: UrlEncodingType): string {
  if (type === "full") return decodeURI(input);
  if (type === "form") return decodeURIComponent(input.replace(/\+/g, " "));
  return decodeURIComponent(input);
}

export function inspectUrlInput(input: string): UrlInspection {
  const raw = input.trim();
  if (!raw) return emptyInspection();

  const absoluteCandidate = /^[a-z][a-z\d+.-]*:/i.test(raw);
  const relativeCandidate = /^(?:\/\/|\/|\.\/|\.\.\/)/.test(raw);

  if (absoluteCandidate || relativeCandidate) {
    try {
      const url = absoluteCandidate ? new URL(raw) : new URL(raw, RELATIVE_BASE);
      const queryParams = paramsToRows(url.searchParams);
      return {
        kind: absoluteCandidate ? "absolute-url" : "relative-url",
        raw,
        parseable: true,
        protocol: absoluteCandidate ? url.protocol : raw.startsWith("//") ? "protocol-relative" : "relative",
        origin: absoluteCandidate ? url.origin : "",
        host: absoluteCandidate || raw.startsWith("//") ? url.host : "",
        hostname: absoluteCandidate || raw.startsWith("//") ? url.hostname : "",
        port: absoluteCandidate || raw.startsWith("//") ? url.port : "",
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        username: url.username,
        hasPassword: Boolean(url.password),
        queryParams,
        duplicateParamKeys: findDuplicateKeys(queryParams),
        sensitiveParamKeys: findSensitiveKeys(queryParams),
      };
    } catch (error) {
      return {
        ...emptyInspection(),
        kind: "text",
        raw,
        parseError: error instanceof Error ? error.message : "The URL could not be parsed.",
      };
    }
  }

  const query = extractStandaloneQuery(raw);
  if (query !== null) {
    const queryParams = paramsToRows(new URLSearchParams(query));
    return {
      ...emptyInspection(),
      kind: "query-string",
      raw,
      parseable: true,
      search: query ? `?${query}` : "",
      queryParams,
      duplicateParamKeys: findDuplicateKeys(queryParams),
      sensitiveParamKeys: findSensitiveKeys(queryParams),
    };
  }

  return { ...emptyInspection(), kind: "text", raw };
}

export function parseQueryParams(input: string): QueryParamRow[] {
  return inspectUrlInput(input).queryParams;
}

export function rebuildInputWithQueryRows(input: string, rows: Array<Pick<QueryParamRow, "key" | "value">>): string {
  const query = new URLSearchParams();
  rows.forEach((row) => query.append(row.key, row.value));
  const serialized = query.toString();
  const raw = input.trim();
  const inspection = inspectUrlInput(raw);

  if (inspection.kind === "query-string") {
    return `${raw.startsWith("?") ? "?" : ""}${serialized}`;
  }

  if (inspection.kind === "absolute-url" || inspection.kind === "relative-url") {
    const hashIndex = raw.indexOf("#");
    const hash = hashIndex >= 0 ? raw.slice(hashIndex) : "";
    const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
    const queryIndex = withoutHash.indexOf("?");
    const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
    return `${base}${serialized ? `?${serialized}` : ""}${hash}`;
  }

  return serialized ? `?${serialized}` : raw;
}

export function computeUrlStats(
  input: string,
  output: string,
  inspection: UrlInspection,
): UrlStats {
  const inputCharacters = input.length;
  const outputCharacters = output.length;
  return {
    inputCharacters,
    outputCharacters,
    percentSequences: (output.match(/%[0-9a-fA-F]{2}/g) ?? []).length,
    queryParameters: inspection.queryParams.length,
    uniqueQueryKeys: new Set(inspection.queryParams.map((row) => row.key)).size,
    duplicateQueryKeys: inspection.duplicateParamKeys.length,
    expansionPercent:
      inputCharacters > 0
        ? Math.round(((outputCharacters - inputCharacters) / inputCharacters) * 1000) / 10
        : 0,
  };
}

export function buildUrlChecks(args: {
  input: string;
  mode: UrlMode;
  type: UrlEncodingType;
  result: UrlProcessResult;
  inspection: UrlInspection;
}): UrlCheck[] {
  const { input, mode, type, result, inspection } = args;
  const checks: UrlCheck[] = [];

  if (!input) {
    return [{ id: "empty", level: "info", title: "Ready for input", message: "Paste text, a URL, or a query string to start the local analysis." }];
  }

  if ("error" in result) {
    checks.push({ id: "process-error", level: "danger", title: "Conversion blocked", message: result.error });
  } else {
    checks.push({ id: "conversion", level: "success", title: `${result.status} successfully`, message: "The conversion completed locally using browser URL APIs." });
  }

  if (mode === "decode" && /%25[0-9a-fA-F]{2}/.test(input)) {
    checks.push({ id: "double-encoding", level: "warning", title: "Possible double encoding", message: "Sequences such as %252F decode to another percent escape. A second decode may change the meaning or routing behavior." });
  }

  if (mode === "decode" && type === "component" && input.includes("+")) {
    checks.push({ id: "plus-ambiguity", level: "warning", title: "Plus signs stay literal", message: "Component mode does not treat + as a space. Use Form mode for application/x-www-form-urlencoded values." });
  }

  if (inspection.username || inspection.hasPassword) {
    checks.push({ id: "credentials", level: "danger", title: "Credentials embedded in URL", message: "Usernames or passwords in URLs can leak through history, logs, screenshots, and referrer headers." });
  }

  if (inspection.sensitiveParamKeys.length) {
    checks.push({ id: "sensitive-query", level: "danger", title: "Sensitive query keys detected", message: `Review ${inspection.sensitiveParamKeys.join(", ")}. Query values may appear in logs, browser history, analytics, and copied links.` });
  }

  if (inspection.duplicateParamKeys.length) {
    checks.push({ id: "duplicate-params", level: "warning", title: "Duplicate query keys", message: `${inspection.duplicateParamKeys.join(", ")} appear more than once. Servers and frameworks may resolve duplicates differently.` });
  }

  const trackingKeys = inspection.queryParams.map((row) => row.key).filter((key) => TRACKING_QUERY_KEY.test(key));
  if (trackingKeys.length) {
    checks.push({ id: "tracking-params", level: "info", title: "Tracking parameters present", message: `${Array.from(new Set(trackingKeys)).join(", ")} may be intentionally removable when sharing a clean URL.` });
  }

  if (inspection.kind === "absolute-url" && !/^https?:$/i.test(inspection.protocol)) {
    checks.push({ id: "protocol", level: "warning", title: "Non-HTTP protocol", message: `${inspection.protocol || "Unknown protocol"} may not behave like a normal web link. Validate the destination and consuming application.` });
  }

  if ((inspection.kind === "absolute-url" || inspection.kind === "relative-url") && /\s/.test(input)) {
    checks.push({ id: "raw-spaces", level: "warning", title: "Raw whitespace in URL", message: "Encode spaces and other whitespace before using the URL in HTML, HTTP requests, redirects, or logs." });
  }

  if (inspection.hash && /(token|secret|password|auth|session|code)=/i.test(inspection.hash)) {
    checks.push({ id: "sensitive-fragment", level: "warning", title: "Sensitive-looking fragment", message: "Fragments are not sent in normal HTTP requests, but they remain visible to browser-side code, history, and screenshots." });
  }

  if (input.length > 8000) {
    checks.push({ id: "length", level: "danger", title: "Very long URL input", message: "This input exceeds 8,000 characters and may fail in browsers, proxies, servers, analytics, or third-party integrations." });
  } else if (input.length > 2048) {
    checks.push({ id: "length", level: "warning", title: "Long URL compatibility risk", message: "There is no single universal URL limit, but links above roughly 2,048 characters can be less portable across systems." });
  }

  if (inspection.parseError) {
    checks.push({ id: "parse-error", level: "warning", title: "URL inspector could not parse this value", message: "Encoding can still work as plain text, but URL components and query diagnostics are unavailable." });
  }

  if (checks.length === 1 && checks[0]?.level === "success") {
    checks.push({ id: "production-ready", level: "success", title: "No obvious URL risks found", message: "No malformed escapes, embedded credentials, sensitive query keys, duplicate parameters, or length warnings were detected." });
  }

  return checks;
}

export function buildUrlCodeSnippets(args: {
  input: string;
  mode: UrlMode;
  type: UrlEncodingType;
  inspection: UrlInspection;
}): UrlCodeSnippets {
  const { input, mode, type, inspection } = args;
  const functionName = getNativeFunctionName(mode, type);
  const preparedExpression = type === "form" && mode === "encode"
    ? `encodeURIComponent(value).replace(/%20/g, "+")`
    : type === "form" && mode === "decode"
      ? `decodeURIComponent(value.replace(/\\+/g, " "))`
      : `${functionName}(value)`;
  const javascript = `const value = ${JSON.stringify(input)};\nconst result = ${preparedExpression};\nconsole.log(result);\n`;

  const queryApi = `const url = new URL(${JSON.stringify(input || "https://example.com/?q=darma")}, "https://example.com");\n\nfor (const [key, value] of url.searchParams) {\n  console.log({ key, value });\n}\n\nurl.searchParams.set("page", "2");\nconsole.log(url.toString());\n`;

  const curlTarget = inspection.kind === "absolute-url" && /^https?:$/i.test(inspection.protocol)
    ? redactUrlForReport(input)
    : "https://example.com/api?query=darma";
  const curl = `curl --get ${shellQuote(curlTarget)} \\\n  --data-urlencode ${shellQuote("query=Darma tools")} \\\n  --data-urlencode ${shellQuote("page=1")}\n`;

  return { javascript, queryApi, curl };
}

export function buildUrlReport(args: {
  input: string;
  mode: UrlMode;
  type: UrlEncodingType;
  result: UrlProcessResult;
  inspection: UrlInspection;
  stats: UrlStats;
  checks: UrlCheck[];
}): UrlReport {
  const { input, mode, type, result, inspection, stats, checks } = args;
  return {
    generatedAt: new Date().toISOString(),
    mode,
    encodingType: type,
    input: {
      kind: inspection.kind,
      characters: input.length,
      redactedPreview: redactUrlForReport(input).slice(0, 500),
    },
    output: {
      ok: result.ok,
      characters: result.output.length,
      status: result.status,
    },
    inspection: {
      parseable: inspection.parseable,
      protocol: inspection.protocol,
      host: inspection.host,
      pathname: inspection.pathname,
      hashPresent: Boolean(inspection.hash),
      queryParameterCount: inspection.queryParams.length,
      duplicateParameterKeys: inspection.duplicateParamKeys,
      sensitiveParameterKeys: inspection.sensitiveParamKeys,
    },
    stats,
    checks,
  };
}

export function redactUrlForReport(input: string): string {
  const raw = input.trim();
  if (!raw) return "";

  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(raw);
    const relative = /^(?:\/\/|\/|\.\/|\.\.\/)/.test(raw);
    if (!absolute && !relative) {
      const query = extractStandaloneQuery(raw);
      if (query === null) return raw;
      const params = new URLSearchParams(query);
      redactSensitiveParams(params);
      const serialized = params.toString();
      return `${raw.startsWith("?") ? "?" : ""}${serialized}`;
    }

    const url = absolute ? new URL(raw) : new URL(raw, RELATIVE_BASE);
    if (url.username) url.username = "[redacted]";
    if (url.password) url.password = "[redacted]";
    redactSensitiveParams(url.searchParams);
    if (absolute) return url.toString();

    const prefix = raw.startsWith("//") ? `//${url.host}` : "";
    return `${prefix}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return raw.replace(/((?:token|secret|password|api[_-]?key)=)[^&#\s]*/gi, "$1[redacted]");
  }
}

export const URL_EXAMPLES = [
  "https://example.com/search?q=hello world&lang=en",
  "hello world & Darma tools",
  "مرحبا بالعالم",
  "Café 😊",
  "name=Darma&tool=url%20encoder",
  "https://example.com/blog/React + Next.js Guide 2026",
  "hello%ZZworld",
];

function emptyInspection(): UrlInspection {
  return {
    kind: "empty",
    raw: "",
    parseable: false,
    protocol: "",
    origin: "",
    host: "",
    hostname: "",
    port: "",
    pathname: "",
    search: "",
    hash: "",
    username: "",
    hasPassword: false,
    queryParams: [],
    duplicateParamKeys: [],
    sensitiveParamKeys: [],
  };
}

function extractStandaloneQuery(raw: string): string | null {
  const value = raw.startsWith("?") ? raw.slice(1) : raw;
  if (!value) return raw.startsWith("?") ? "" : null;
  if (!value.includes("=")) return null;
  if (/\s/.test(value) && !/[&;]/.test(value)) return null;
  return value.split("#", 1)[0] ?? "";
}

function paramsToRows(params: URLSearchParams): QueryParamRow[] {
  const entries = Array.from(params.entries());
  const counts = new Map<string, number>();
  entries.forEach(([key]) => counts.set(key, (counts.get(key) ?? 0) + 1));
  return entries.map(([key, value], index) => ({
    id: `query-${index}`,
    index,
    key,
    value,
    duplicate: (counts.get(key) ?? 0) > 1,
    sensitive: SENSITIVE_QUERY_KEY.test(key),
  }));
}

function findDuplicateKeys(rows: QueryParamRow[]): string[] {
  return Array.from(new Set(rows.filter((row) => row.duplicate).map((row) => row.key)));
}

function findSensitiveKeys(rows: QueryParamRow[]): string[] {
  return Array.from(new Set(rows.filter((row) => row.sensitive).map((row) => row.key)));
}

function getNativeFunctionName(mode: UrlMode, type: UrlEncodingType): string {
  if (mode === "encode") return type === "full" ? "encodeURI" : "encodeURIComponent";
  return type === "full" ? "decodeURI" : "decodeURIComponent";
}

function redactSensitiveParams(params: URLSearchParams): void {
  const keys = Array.from(new Set(Array.from(params.keys())));
  keys.forEach((key) => {
    if (!SENSITIVE_QUERY_KEY.test(key)) return;
    const count = params.getAll(key).length;
    params.delete(key);
    for (let index = 0; index < count; index += 1) params.append(key, "[redacted]");
  });
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}
