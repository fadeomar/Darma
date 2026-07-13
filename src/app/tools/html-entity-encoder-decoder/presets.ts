import type { EncodeOptions, EntityExample } from "./types";

export const DEFAULT_OPTIONS: EncodeOptions = {
  format: "named",
  scope: "essential",
  context: "text",
  preserveLineBreaks: true,
  convertQuotes: false,
  preserveExistingEntities: true,
};

export const SAMPLE_TEXT = `<article class="card">
  <h1>Tom & Jerry's "Best" moments</h1>
  <p>5 > 3, 2 < 4, and © 2026 Darma.</p>
</article>`;

export const ENTITY_PRESETS: EntityExample[] = [
  {
    id: "html-as-text",
    label: "HTML shown as text",
    description: "Escape markup for documentation, chat, or code examples.",
    mode: "encode",
    value: SAMPLE_TEXT,
    options: { context: "text", scope: "essential", format: "named", convertQuotes: false },
  },
  {
    id: "double-attribute",
    label: "Double-quoted attribute",
    description: "Encode a value intended for a double-quoted HTML attribute.",
    mode: "encode",
    value: `Tom & Jerry said "hello" <today>`,
    options: { context: "double-attribute", scope: "essential", format: "named" },
  },
  {
    id: "unicode-numeric",
    label: "Unicode numeric entities",
    description: "Convert multilingual characters and emoji to hexadecimal entities.",
    mode: "encode",
    value: "مرحبا — Café — 你好 — 🚀",
    options: { context: "text", scope: "nonAscii", format: "hex" },
  },
  {
    id: "encoded-article",
    label: "Decode escaped markup",
    description: "Decode common entities and inspect the resulting markup characters.",
    mode: "decode",
    value: "&lt;h1&gt;Fish &amp; Chips&lt;/h1&gt; &copy; 2026 &mdash; Darma",
  },
  {
    id: "numeric-multilingual",
    label: "Decode numeric Unicode",
    description: "Decode decimal and hexadecimal references into multilingual text.",
    mode: "decode",
    value: "Arabic: &#x645;&#x631;&#x62D;&#x628;&#x627; | Emoji: &#128640;",
  },
  {
    id: "double-encoding-audit",
    label: "Double-encoding audit",
    description: "Detect values such as &amp;lt; and compare one-pass versus two-pass decoding.",
    mode: "decode",
    value: "&amp;lt;strong&amp;gt;Sale &amp;amp; support&amp;lt;/strong&amp;gt;",
    decodePasses: 1,
  },
];

export const ENCODE_EXAMPLES = ENTITY_PRESETS.filter((preset) => preset.mode === "encode");
export const DECODE_EXAMPLES = ENTITY_PRESETS.filter((preset) => preset.mode === "decode");

export const QUICK_REFERENCE = [
  { entity: "&lt;", character: "<", use: "Opening angle bracket" },
  { entity: "&gt;", character: ">", use: "Closing angle bracket" },
  { entity: "&amp;", character: "&", use: "Ampersand" },
  { entity: "&quot;", character: '"', use: "Double quote" },
  { entity: "&#39;", character: "'", use: "Single quote" },
  { entity: "&copy;", character: "©", use: "Copyright symbol" },
];
