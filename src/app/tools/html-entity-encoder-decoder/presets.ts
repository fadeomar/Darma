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
  { id: "html-as-text", label: "HTML shown as text", description: "Escape markup for documentation, chat, or code examples.", mode: "encode", value: SAMPLE_TEXT, options: { context: "text", scope: "essential", format: "named", convertQuotes: false } },
  { id: "double-attribute", label: "Double-quoted attribute", description: "Encode a value intended for a double-quoted HTML attribute.", mode: "encode", value: `Tom & Jerry said "hello" <today>`, options: { context: "double-attribute", scope: "essential", format: "named" } },
  { id: "unicode-numeric", label: "Unicode numeric entities", description: "Convert multilingual characters and emoji to hexadecimal entities.", mode: "encode", value: "مرحبا — Café — 你好 — 🚀", options: { context: "text", scope: "nonAscii", format: "hex" } },
  { id: "encoded-article", label: "Decode escaped markup", description: "Decode common entities and inspect the resulting markup characters.", mode: "decode", value: "&lt;h1&gt;Fish &amp; Chips&lt;/h1&gt; &copy; 2026 &mdash; Darma" },
  { id: "numeric-multilingual", label: "Decode numeric Unicode", description: "Decode decimal and hexadecimal references into multilingual text.", mode: "decode", value: "Arabic: &#x645;&#x631;&#x62D;&#x628;&#x627; | Emoji: &#128640;" },
  { id: "double-encoding-audit", label: "Double-encoding audit", description: "Detect values such as &amp;lt; and compare one-pass versus two-pass decoding.", mode: "decode", value: "&amp;lt;strong&amp;gt;Sale &amp;amp; support&amp;lt;/strong&amp;gt;", decodePasses: 1 },
  { id: "single-attribute", label: "Single-quoted attribute", description: "Escape apostrophes and markup for a single-quoted attribute value.", mode: "encode", value: "Fadi's tools & <helpers>", options: { context: "single-attribute", scope: "essential", format: "named" } },
  { id: "code-snippet", label: "Code snippet in docs", description: "Show HTML source literally inside documentation text.", mode: "encode", value: '<button type="button">Save & continue</button>', options: { context: "text", scope: "essential", format: "named" } },
  { id: "copyright-trademark", label: "Symbols and marks", description: "Encode common typographic and legal symbols with readable named entities.", mode: "encode", value: "© 2026 Darma™ — Tools & Utilities", options: { context: "text", scope: "special", format: "named" } },
  { id: "decimal-unicode", label: "Decimal Unicode", description: "Represent non-ASCII text with decimal numeric entities.", mode: "encode", value: "Résumé — مرحبا — ✓", options: { context: "text", scope: "nonAscii", format: "decimal" } },
  { id: "preencoded-safe", label: "Preserve existing entities", description: "Keep valid existing entities while encoding raw special characters around them.", mode: "encode", value: "Already escaped: &lt;tag&gt; & raw <tag>", options: { context: "text", scope: "essential", format: "named", preserveExistingEntities: true } },
  { id: "decode-quotes", label: "Decode attribute text", description: "Decode quotes, ampersands, and angle brackets from copied HTML data.", mode: "decode", value: "Tom &amp; Jerry said &quot;hello&quot; &lt;today&gt;" },
  { id: "decode-legal", label: "Decode named symbols", description: "Turn common named symbols back into readable characters.", mode: "decode", value: "&copy; 2026 Darma &middot; Tools &trade; &mdash; browser only" },
  { id: "decode-mixed", label: "Mixed entity formats", description: "Decode named, decimal, and hexadecimal entities in one sample.", mode: "decode", value: "&lt;span&gt;&#169; &#x1F680; &amp; &#34;quoted&#34;&lt;/span&gt;" },
  { id: "malformed-review", label: "Malformed entity review", description: "Inspect unknown names, missing semicolons, and incomplete numeric references.", mode: "decode", value: "&notARealEntity; &amp incomplete &#xZZ; &#123" },
  { id: "two-pass-demo", label: "Two-pass decode", description: "Use a second decode pass when you know content was escaped twice.", mode: "decode", value: "&amp;lt;p&amp;gt;Hello &amp;amp; welcome&amp;lt;/p&amp;gt;", decodePasses: 2 },
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
