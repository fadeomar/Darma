import type { EncodeOptions, EntityExample } from "./types";

export const DEFAULT_OPTIONS: EncodeOptions = {
  format: "named",
  scope: "essential",
  preserveLineBreaks: true,
  convertQuotes: true,
};

export const SAMPLE_TEXT = `<article class="card">
  <h1>Tom & Jerry's "Best" moments</h1>
  <p>5 > 3, 2 < 4, and © 2026 Darma.</p>
</article>`;

export const ENCODE_EXAMPLES: EntityExample[] = [
  {
    id: "html-snippet",
    label: "HTML snippet",
    description: "Escape markup so it can be shown as text inside a page.",
    mode: "encode",
    value: SAMPLE_TEXT,
  },
  {
    id: "special-symbols",
    label: "Special symbols",
    description: "Try named, decimal, hex, and non-ASCII encoding modes.",
    mode: "encode",
    value: "Quotes: ‘single’ and “double”. Symbols: © ® ™ € £ ¥ — …",
  },
];

export const DECODE_EXAMPLES: EntityExample[] = [
  {
    id: "encoded-html",
    label: "Encoded HTML",
    description: "Decode common named entities into readable characters.",
    mode: "decode",
    value: "&lt;h1&gt;Fish &amp; Chips&lt;/h1&gt; &copy; 2026 &mdash; Darma",
  },
  {
    id: "numeric-entities",
    label: "Numeric entities",
    description: "Decode decimal and hexadecimal numeric entities.",
    mode: "decode",
    value: "Arabic: &#x645;&#x631;&#x62D;&#x628;&#x627; | Emoji: &#128640;",
  },
];

export const QUICK_REFERENCE = [
  { entity: "&lt;", character: "<", use: "Opening angle bracket" },
  { entity: "&gt;", character: ">", use: "Closing angle bracket" },
  { entity: "&amp;", character: "&", use: "Ampersand" },
  { entity: "&quot;", character: '"', use: "Double quote" },
  { entity: "&#39;", character: "'", use: "Single quote" },
  { entity: "&copy;", character: "©", use: "Copyright symbol" },
];
