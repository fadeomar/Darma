import type { UrlPreset } from "./types";

export const URL_PRESETS: UrlPreset[] = [
  { id: "unicode-url", label: "Unicode URL", description: "Encode spaces, Arabic text, accents, and emoji while preserving URL structure.", mode: "encode", type: "full", value: "https://example.com/بحث/دليل الأدوات?q=café tools 🚀&lang=ar" },
  { id: "query-value", label: "Query value", description: "Safely encode a value that contains reserved query-string characters.", mode: "encode", type: "component", value: "design systems & UI/UX = better products" },
  { id: "nested-redirect", label: "Nested redirect", description: "Encode a complete callback URL before placing it inside another query parameter.", mode: "encode", type: "component", value: "https://app.example.com/callback?status=success&next=/dashboard" },
  { id: "form-value", label: "Form value", description: "Use form behavior where spaces become plus signs.", mode: "encode", type: "form", value: "Darma tools + URL lab" },
  { id: "encoded-campaign", label: "Campaign URL", description: "Decode repeated campaign parameters and a fragment.", mode: "decode", type: "full", value: "https://example.com/pricing?utm_source=newsletter&utm_source=partner&plan=pro%20annual#checkout" },
  { id: "security-review", label: "Security review", description: "Exercise checks for credentials, sensitive query keys, and possible double encoding.", mode: "decode", type: "full", value: "https://admin:demo@example.com/callback?token=abc123&redirect=%252Fdashboard" },
  { id: "search-query", label: "Search query", description: "Encode a natural-language search phrase as one query parameter value.", mode: "encode", type: "component", value: "best free browser tools for developers" },
  { id: "filter-state", label: "Filter state", description: "Encode JSON-like UI filter state before placing it in a URL parameter.", mode: "encode", type: "component", value: '{"status":["active","paused"],"sort":"updated desc"}' },
  { id: "email-subject", label: "mailto subject", description: "Encode a subject line containing punctuation and spaces.", mode: "encode", type: "component", value: "Darma feedback: image tools & privacy" },
  { id: "path-segment", label: "Dynamic path segment", description: "Encode one user-controlled path segment without encoding an entire URL.", mode: "encode", type: "component", value: "Café & Design / 2026" },
  { id: "oauth-state", label: "OAuth state value", description: "Encode a structured state value before adding it to an authorization URL.", mode: "encode", type: "component", value: "return=/settings/profile&source=invite" },
  { id: "decoded-unicode", label: "Decode Unicode path", description: "Inspect percent-encoded Arabic path and query text.", mode: "decode", type: "full", value: "https://example.com/%D8%A3%D8%AF%D9%88%D8%A7%D8%AA?query=%D8%AA%D8%AC%D8%B1%D8%A8%D8%A9%20%D8%B3%D8%B1%D9%8A%D8%B9%D8%A9" },
  { id: "form-decode", label: "Decode form body", description: "Decode plus-separated form data copied from an application/x-www-form-urlencoded request.", mode: "decode", type: "form", value: "name=Fadi+Yalla&topic=UI%2FUX+review&priority=high" },
  { id: "api-query", label: "API query string", description: "Decode filters, pagination, and repeated fields from an API request.", mode: "decode", type: "full", value: "https://api.example.com/items?status=active&status=draft&page=2&limit=50&sort=created%3Adesc" },
  { id: "double-encoded", label: "Double-encoded value", description: "Inspect a value containing encoded percent signs before deciding whether to decode again.", mode: "decode", type: "component", value: "%252Fdashboard%253Ftab%253Dbilling" },
  { id: "fragment-route", label: "Hash route", description: "Decode a URL that combines encoded query values with a client-side hash route.", mode: "decode", type: "full", value: "https://app.example.com/?q=design%20system#/results%3Fview%3Dgrid" },
];
