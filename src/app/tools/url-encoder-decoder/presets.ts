import type { UrlPreset } from "./types";

export const URL_PRESETS: UrlPreset[] = [
  {
    id: "unicode-url",
    label: "Unicode URL",
    description: "Encode spaces, Arabic text, accents, and emoji while preserving URL structure.",
    mode: "encode",
    type: "full",
    value: "https://example.com/بحث/دليل الأدوات?q=café tools 🚀&lang=ar",
  },
  {
    id: "query-value",
    label: "Query value",
    description: "Safely encode a value that contains reserved query-string characters.",
    mode: "encode",
    type: "component",
    value: "design systems & UI/UX = better products",
  },
  {
    id: "nested-redirect",
    label: "Nested redirect",
    description: "Encode a complete callback URL before placing it inside another query parameter.",
    mode: "encode",
    type: "component",
    value: "https://app.example.com/callback?status=success&next=/dashboard",
  },
  {
    id: "form-value",
    label: "Form value",
    description: "Use application/x-www-form-urlencoded behavior where spaces become plus signs.",
    mode: "encode",
    type: "form",
    value: "Darma tools + URL lab",
  },
  {
    id: "encoded-campaign",
    label: "Campaign URL",
    description: "Decode and inspect repeated campaign parameters and a fragment.",
    mode: "decode",
    type: "full",
    value: "https://example.com/pricing?utm_source=newsletter&utm_source=partner&plan=pro%20annual#checkout",
  },
  {
    id: "security-review",
    label: "Security review",
    description: "Exercise checks for credentials, sensitive query keys, and possible double encoding.",
    mode: "decode",
    type: "full",
    value: "https://admin:demo@example.com/callback?token=abc123&redirect=%252Fdashboard",
  },
];
