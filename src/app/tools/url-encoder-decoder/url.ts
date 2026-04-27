export type UrlMode = "encode" | "decode";
export type UrlEncodingType = "full" | "component";

export type UrlProcessResult =
  | {
      ok: true;
      output: string;
      status: "Encoded" | "Decoded" | "Empty input";
    }
  | {
      ok: false;
      output: "";
      status: "Invalid URL encoding" | "Empty input";
      error: string;
    };

export type QueryParamRow = {
  key: string;
  value: string;
};

const INVALID_PERCENT_ERROR =
  "Invalid percent-encoded input. Percent-encoded sequences must use valid hexadecimal pairs such as %20.";

export function processUrlText(
  input: string,
  mode: UrlMode,
  type: UrlEncodingType,
): UrlProcessResult {
  if (!input) {
    return { ok: false, output: "", status: "Empty input", error: "Add text or a URL to begin." };
  }

  try {
    if (mode === "encode") {
      const output = type === "full" ? encodeURI(input) : encodeURIComponent(input);
      return { ok: true, output, status: "Encoded" };
    }

    const output = type === "full" ? decodeURI(input) : decodeURIComponent(input);
    return { ok: true, output, status: "Decoded" };
  } catch (error) {
    if (error instanceof URIError) {
      return {
        ok: false,
        output: "",
        status: "Invalid URL encoding",
        error: INVALID_PERCENT_ERROR,
      };
    }

    return {
      ok: false,
      output: "",
      status: "Invalid URL encoding",
      error: "The URL text could not be processed. Check the input and try again.",
    };
  }
}

export function parseQueryParams(input: string): QueryParamRow[] {
  const raw = input.trim();
  if (!raw) return [];

  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      return paramsToRows(url.searchParams);
    }

    const query = raw.startsWith("?") ? raw.slice(1) : raw;
    if (!looksLikeQueryString(query)) return [];

    return paramsToRows(new URLSearchParams(query));
  } catch {
    return [];
  }
}

function looksLikeQueryString(value: string): boolean {
  if (!value.includes("=")) return false;
  if (value.includes(" ") && !value.includes("&")) return false;
  return true;
}

function paramsToRows(params: URLSearchParams): QueryParamRow[] {
  return Array.from(params.entries()).map(([key, value]) => ({ key, value }));
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
