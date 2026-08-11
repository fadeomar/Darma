import type { ToolPreviewConfig } from "./types";

/**
 * Tool id -> preview configuration.
 *
 * Adding a tool without an entry is not an error: `resolveToolPreview` falls
 * back to a family chosen from the tool's layout type and category, so the card
 * still gets a semantic preview rather than a blank frame. The registry test
 * keeps the mapping complete for the shipped catalog.
 */
export const TOOL_PREVIEWS: Record<string, ToolPreviewConfig> = {
  /* ---------------------------------------------------------------- text */
  "text-cleaner": {
    family: "text",
    op: "clean",
    inputLabel: "Pasted",
    outputLabel: "Cleaned",
    input: [
      { text: "  Hello   «World»  ", tone: "muted" },
      { text: "smart “quotes” + tabs", tone: "muted" },
      { text: "trailing spaces   ", tone: "strike" },
    ],
    output: [
      { text: "Hello World" },
      { text: 'smart "quotes" + tabs' },
      { text: "trailing spaces" },
    ],
    stat: { label: "Removed", value: "84 chars" },
  },
  "base64-encoder-decoder": {
    family: "text",
    op: "encode",
    inputLabel: "Plain",
    outputLabel: "Base64",
    input: [{ text: "Darma tools" }, { text: "file.pdf", tone: "muted" }],
    output: [{ text: "RGFybWEgdG9vbHM=", tone: "code" }, { text: "JVBERi0xLjcKJcfs…", tone: "code" }],
    stat: { label: "Payload", value: "+33%" },
  },
  "url-encoder-decoder": {
    family: "text",
    op: "encode",
    inputLabel: "Query",
    outputLabel: "Percent-encoded",
    input: [{ text: "q=hello world" }, { text: "tag=css&ui" }],
    output: [{ text: "q=hello«%20»world", tone: "code" }, { text: "tag=css«%26»ui", tone: "code" }],
    stat: { label: "Params", value: "2 safe" },
  },
  "html-entity-encoder-decoder": {
    family: "text",
    op: "escape",
    inputLabel: "Markup",
    outputLabel: "Entities",
    input: [{ text: "<b>Café</b>" }, { text: "5 > 3 & 2 < 4" }],
    output: [{ text: "«&lt;»b«&gt;»Caf«&eacute;»", tone: "code" }, { text: "5 «&gt;» 3 «&amp;» 2 «&lt;» 4", tone: "code" }],
    stat: { label: "Escaped", value: "6 chars" },
  },
  "slug-generator": {
    family: "text",
    op: "slugify",
    inputLabel: "Title",
    outputLabel: "Route",
    input: [{ text: "Café & Bar — Opening Soon!" }, { text: "Ways of Working (2026)", tone: "muted" }],
    output: [{ text: "/«cafe-bar-opening-soon»", tone: "code" }, { text: "/ways-of-working-2026", tone: "code" }],
    stat: { label: "Collisions", value: "0" },
  },
  "lorem-ipsum-generator": {
    family: "text",
    op: "generate",
    inputLabel: "Rules",
    outputLabel: "Placeholder",
    input: [{ text: "3 paragraphs", tone: "muted" }, { text: "48 words each", tone: "muted" }, { text: "Latin base", tone: "muted" }],
    output: [
      { text: "Lorem ipsum dolor sit amet," },
      { text: "consectetur adipiscing elit," },
      { text: "sed do eiusmod tempor.", tone: "muted" },
    ],
    stat: { label: "Words", value: "144" },
  },
  "regex-tester": {
    family: "text",
    op: "match",
    inputLabel: "Subject",
    outputLabel: "Groups",
    pattern: "(\\w+)@(\\w+)\\.dev",
    input: [
      { text: "ping «ada@darma.dev» now" },
      { text: "cc «lin@studio.dev» too" },
    ],
    output: [
      { text: "1  ada · darma", tone: "code" },
      { text: "2  lin · studio", tone: "code" },
    ],
    stat: { label: "Matches", value: "2 of 2" },
  },
  "scrabble-word-finder": {
    family: "text",
    op: "solve",
    inputLabel: "Rack",
    outputLabel: "Best plays",
    input: [{ text: "R A T I O N S", tone: "code" }, { text: "board: 7 letters", tone: "muted" }],
    output: [
      { text: "«RATIONS» — 57", tone: "bullet" },
      { text: "AROINTS — 51", tone: "bullet" },
      { text: "RATIOS — 42", tone: "bullet" },
    ],
    stat: { label: "Valid words", value: "126" },
  },
  "markdown-previewer": {
    family: "text",
    op: "render",
    inputLabel: "Markdown",
    outputLabel: "Preview",
    input: [
      { text: "# Release notes", tone: "code" },
      { text: "**Ship** the new grid", tone: "code" },
      { text: "- audit tokens", tone: "code" },
    ],
    output: [
      { text: "Release notes", tone: "heading" },
      { text: "Ship the new grid" },
      { text: "audit tokens", tone: "bullet" },
    ],
  },
  "json-to-typescript": {
    family: "text",
    op: "infer",
    inputLabel: "JSON sample",
    outputLabel: "TypeScript",
    input: [
      { text: '{ "id": 7,', tone: "code" },
      { text: '  "name": "Ada",', tone: "code" },
      { text: '  "active": true }', tone: "code" },
    ],
    output: [
      { text: "interface «User» {", tone: "code" },
      { text: "  id: number", tone: "code" },
      { text: "  name: string", tone: "code" },
    ],
    stat: { label: "Types", value: "3 fields" },
  },
  "todo-list": {
    family: "text",
    op: "track",
    inputLabel: "Today",
    outputLabel: "Progress",
    input: [
      { text: "Draft release notes", tone: "strike" },
      { text: "Review card contrast", tone: "strike" },
      { text: "Ship preview system", tone: "bullet" },
    ],
    output: [
      { text: "Done  2", tone: "bullet" },
      { text: "Doing 1", tone: "bullet" },
      { text: "Saved on this device", tone: "muted" },
    ],
    stat: { label: "Complete", value: "67%" },
  },

  /* --------------------------------------------------------------- data */
  "json-formatter": {
    family: "data",
    title: "response.json",
    lines: [
      { value: "{", kind: "brace" },
      { indent: 1, key: '"workspace"', value: '"Darma"', kind: "string" },
      { indent: 1, key: '"tools"', value: "67", kind: "number" },
      { indent: 1, key: '"filters"', value: "{", kind: "brace" },
      { indent: 2, key: '"audience"', value: '"developer"', kind: "string" },
      { indent: 2, key: '"strict"', value: "true", kind: "bool" },
      { indent: 1, value: "}", kind: "brace" },
      { value: "}", kind: "brace" },
    ],
    status: { tone: "ok", text: "Valid · 2-space" },
  },
  "jwt-decoder": {
    family: "data",
    title: "id_token",
    segments: [
      { label: "header", tone: "one" },
      { label: "payload", tone: "two" },
      { label: "signature", tone: "three" },
    ],
    lines: [
      { key: '"alg"', value: '"HS256"', kind: "string" },
      { key: '"sub"', value: '"user_4821"', kind: "string" },
      { key: '"iat"', value: "1780012800", kind: "number" },
      { key: '"exp"', value: "1780016400", kind: "number" },
    ],
    status: { tone: "warn", text: "Expires in 1h" },
  },

  /* --------------------------------------------------------------- code */
  "animated-background-generator": {
    family: "code",
    lang: "background.css",
    chips: ["particles", "60 fps", "reduced motion"],
    code: [
      "@keyframes drift",
      "  from: translate3d(0,0,0)",
      "  to: translate3d(0,-40px,0)",
      ".layer",
      "  animation: drift 9s linear infinite",
    ],
    sample: "none",
  },
  "buttons-css-generator": {
    family: "code",
    lang: "button.css",
    chips: ["focus ring", "AA contrast", "44px target"],
    code: [
      ".btn",
      "  padding: 0.75rem 1.4rem",
      "  border-radius: 0.75rem",
      "  background: #ff6a3d",
    ],
    sample: "button",
  },
  "code-preview-tool": {
    family: "code",
    lang: "preview.html",
    chips: ["HTML", "CSS", "JS"],
    code: [
      "<section class=card>",
      "  <h2>Live preview</h2>",
      "  <button>Run</button>",
      "</section>",
    ],
    sample: "card",
  },
  "code-video-generator": {
    family: "code",
    lang: "script.js · 00:42",
    chips: ["16:9 + 9:16", "captions", "MP4 + WebM"],
    code: [
      "// step 3 — wire the counter",
      "let value = 0",
      "btn.onclick = () => {",
      "  count.textContent = ++value",
      "}▌",
    ],
    sample: "card",
  },
  "css-clamp-generator": {
    family: "code",
    lang: "fluid.css",
    chips: ["320 → 1440", "no jumps", "rem safe"],
    code: [
      "/* fluid heading */",
      "h1",
      "  font-size: clamp(1.75rem, 1.1rem + 3.2vw, 3.5rem)",
      "  line-height: 1.08",
    ],
    sample: "none",
  },

  /* --------------------------------------------------------------- calc */
  "gpa-calculator": {
    family: "calc",
    inputs: [
      { label: "Data Structures · 4cr", value: "A−" },
      { label: "Design Systems · 3cr", value: "B+" },
      { label: "Statistics · 3cr", value: "A" },
    ],
    result: { label: "Semester GPA", value: "3.57", note: "On track for honours" },
    scale: { min: "0.0", max: "4.0", pos: 89 },
  },
  "bmi-calculator": {
    family: "calc",
    inputs: [
      { label: "Height", value: "175 cm" },
      { label: "Weight", value: "72 kg" },
      { label: "Age", value: "31" },
    ],
    result: { label: "Body mass index", value: "23.5", note: "Healthy range" },
    scale: { min: "18.5", max: "30", pos: 43 },
  },
  "loan-calculator": {
    family: "calc",
    inputs: [
      { label: "Principal", value: "€24,000" },
      { label: "Rate", value: "5.4%" },
      { label: "Term", value: "60 months" },
    ],
    result: { label: "Monthly payment", value: "457", unit: "€", note: "Total interest €3,420" },
  },
  "tip-calculator": {
    family: "calc",
    inputs: [
      { label: "Bill", value: "€86.40" },
      { label: "Tip", value: "18%" },
      { label: "Split", value: "4 people" },
    ],
    result: { label: "Each person pays", value: "25.49", unit: "€", note: "Tip €15.55" },
  },
  "percentage-calculator": {
    family: "calc",
    inputs: [
      { label: "From", value: "1,280" },
      { label: "To", value: "1,536" },
      { label: "Mode", value: "Change" },
    ],
    result: { label: "Percentage change", value: "+20", unit: "%", note: "Difference 256" },
  },
  "unit-converter": {
    family: "calc",
    inputs: [
      { label: "Value", value: "12.5 mi" },
      { label: "Category", value: "Length" },
      { label: "Precision", value: "3 dp" },
    ],
    result: { label: "Converted", value: "20.117", unit: "km", note: "1 mi = 1.60934 km" },
  },
  "beam-calculator": {
    family: "calc",
    inputs: [
      { label: "Span", value: "6.0 m" },
      { label: "Load", value: "12 kN/m" },
      { label: "Support", value: "Simply supported" },
    ],
    result: { label: "Max bending moment", value: "54.0", unit: "kN·m", note: "Deflection 11.2 mm" },
    scale: { min: "0", max: "L", pos: 50 },
  },
  "word-counter": {
    family: "calc",
    inputs: [
      { label: "Words", value: "1,482" },
      { label: "Sentences", value: "96" },
      { label: "Characters", value: "8,940" },
    ],
    result: { label: "Reading time", value: "6", unit: "min", note: "Longest sentence 41 words" },
  },
  "click-speed-test": {
    family: "calc",
    inputs: [
      { label: "Clicks", value: "94" },
      { label: "Window", value: "10 s" },
      { label: "Best streak", value: "12" },
    ],
    result: { label: "Clicks per second", value: "9.4", unit: "CPS", note: "Personal best 9.8" },
    scale: { min: "0", max: "15", pos: 63 },
  },

  /* -------------------------------------------------------------- chart */
  "statistics-calculator": {
    family: "chart",
    kind: "bars",
    series: [28, 46, 72, 88, 64, 41, 24],
    metric: { label: "Mean", value: "54.8", delta: "σ 12.4", tone: "flat" },
    legend: ["Median 56", "Mode 61", "n = 240"],
  },
  "readability-score": {
    family: "chart",
    kind: "donut",
    series: [46, 28, 16, 10],
    metric: { label: "Reading grade", value: "8.4", delta: "Plain English", tone: "up" },
    legend: ["Short", "Medium", "Long", "Complex"],
  },
  "mouse-scroll-test": {
    family: "chart",
    kind: "line",
    series: [18, 42, 30, 66, 54, 82, 71],
    metric: { label: "Peak scroll rate", value: "1,240 px/s", delta: "smooth", tone: "up" },
    legend: ["Wheel", "Trackpad"],
  },
  "spacebar-counter": {
    family: "chart",
    kind: "bars",
    series: [34, 58, 76, 90, 68, 52],
    metric: { label: "Presses in 10s", value: "78", delta: "+6 vs last", tone: "up" },
    legend: ["Per second", "Session best"],
  },
  "text-to-speech": {
    family: "chart",
    kind: "bars",
    series: [22, 54, 37, 81, 62, 90, 45, 26],
    metric: { label: "Generated WAV", value: "0:07", delta: "in-browser", tone: "up" },
    legend: ["Kathleen · low", "22 kHz mono", "Piper voice"],
  },

  /* -------------------------------------------------------------- color */
  "color-converter": {
    family: "color",
    swatches: ["#ff6a3d", "#f7c948", "#2dd4bf"],
    rows: [
      { label: "HEX", value: "#FF6A3D" },
      { label: "RGB", value: "255, 106, 61" },
      { label: "HSL", value: "14, 100%, 62%" },
    ],
    verdict: { text: "AA on ink", tone: "ok", ratio: "5.2:1" },
  },
  "color-name-finder": {
    family: "color",
    swatches: ["#2dd4bf", "#14b8a6", "#0d9488"],
    rows: [
      { label: "Nearest", value: "Turquoise" },
      { label: "HEX", value: "#2DD4BF" },
      { label: "Distance", value: "ΔE 1.8" },
    ],
  },
  "color-palette-generator": {
    family: "color",
    swatches: ["#0f3d3e", "#1c6b6a", "#2dd4bf", "#f7c948", "#ff6a3d"],
    rows: [
      { label: "Harmony", value: "Split complementary" },
      { label: "Contrast", value: "AA on ink" },
    ],
  },
  "color-shades": {
    family: "color",
    swatches: ["#fff1ec", "#ffd6c7", "#ffab8c", "#ff8b68", "#ff6a3d", "#e2542b", "#b8401e", "#8a2f16", "#5c1e0e"],
    rows: [
      { label: "Scale", value: "50 → 900" },
      { label: "Token", value: "--brand-500" },
    ],
  },
  "css-gradient-generator": {
    family: "color",
    gradient: "linear-gradient(115deg, #ff6a3d 0%, #f7c948 48%, #2dd4bf 100%)",
    stops: ["#ff6a3d", "#f7c948", "#2dd4bf"],
    rows: [
      { label: "Angle", value: "115deg" },
      { label: "Output", value: "linear-gradient(…)" },
    ],
  },
  "glassmorphism-generator": {
    family: "layout",
    mode: "surface",
    surface: "linear-gradient(140deg, rgba(255,255,255,0.42), rgba(255,255,255,0.12))",
    code: "backdrop-filter: blur(18px) saturate(140%)",
  },

  /* -------------------------------------------------------------- image */
  "image-compressor-resizer": {
    family: "image",
    mode: "before-after",
    before: { label: "4.8 MB · 4000px", tone: "linear-gradient(150deg,#273145,#5a667b)" },
    after: { label: "620 KB · 1600px", tone: "linear-gradient(150deg,#134e4a,#2dd4bf)" },
    badge: "−87%",
  },
  "image-converter": {
    family: "image",
    mode: "before-after",
    before: { label: "PNG · 2.1 MB", tone: "linear-gradient(150deg,#3b2f4a,#6d5f86)" },
    after: { label: "WebP · 310 KB", tone: "linear-gradient(150deg,#1e3a5f,#38bdf8)" },
    badge: "−85%",
  },
  "photo-filter-editor": {
    family: "image",
    mode: "before-after",
    before: { label: "Original", tone: "linear-gradient(150deg,#4b4b4b,#8b8b8b)" },
    after: { label: "Warm · contrast 118%", tone: "linear-gradient(150deg,#7c2d12,#f7c948)" },
    badge: "12 filters",
  },
  "responsive-image-srcset-generator": {
    family: "image",
    mode: "srcset",
    variants: [
      { label: "400w", width: 1 },
      { label: "800w", width: 1.7 },
      { label: "1600w", width: 2.6 },
    ],
    badge: "sizes: (max-width: 720px) 100vw, 50vw",
  },
  "app-screenshot-mockup-generator": {
    family: "image",
    mode: "device",
    badge: "Desktop + phone frames",
  },
  "fake-screen": {
    family: "image",
    mode: "fullscreen",
    scene: { tone: "linear-gradient(140deg,#0b3b6f,#1d4ed8)", label: "Updating · 47%", progress: 47 },
    variants: [
      { label: "Update", width: 1 },
      { label: "Error", width: 1 },
      { label: "Screensaver", width: 1 },
    ],
  },
  "paint-canvas": {
    family: "image",
    mode: "canvas",
    strokes: ["#ff6a3d", "#2dd4bf", "#f7c948"],
  },

  /* ----------------------------------------------------------- geometry */
  "svg-path-editor": {
    family: "geometry",
    path: "M18 70 C40 18 78 96 104 42 S140 20 150 34",
    anchors: [[18, 70], [104, 42], [150, 34]],
    handles: [[18, 70, 40, 18], [104, 42, 78, 96], [150, 34, 140, 20]],
    code: "C 40 18, 78 96, 104 42",
    caption: "3 anchors · 4 commands",
  },
  "clip-path-generator": {
    family: "geometry",
    path: "M80 10 L146 44 L128 84 L32 84 L14 44 Z",
    fill: true,
    anchors: [[80, 10], [146, 44], [128, 84], [32, 84], [14, 44]],
    code: "polygon(50% 4%, 92% 48%, 80% 92%…)",
  },
  "border-radius-generator": {
    family: "geometry",
    path: "M24 12 H136 A28 20 0 0 1 148 46 A34 26 0 0 1 118 82 H44 A30 22 0 0 1 16 46 A24 18 0 0 1 24 12 Z",
    fill: true,
    anchors: [[24, 12], [148, 46], [44, 82]],
    code: "border-radius: 42% 58% 36% 64% / 52% 38% 62% 48%",
  },
  "css-transform-generator": {
    family: "geometry",
    path: "M52 16 L120 30 L108 78 L40 64 Z",
    fill: true,
    guides: [[36, 20, 124, 20], [36, 20, 36, 80], [36, 80, 124, 80], [124, 20, 124, 80]],
    anchors: [[52, 16], [120, 30], [108, 78], [40, 64]],
    code: "rotate(11deg) scale(1.08) skewX(-4deg)",
  },
  "aspect-ratio-calculator": {
    family: "geometry",
    path: "M12 14 H148 V82 H12 Z",
    guides: [[12, 82, 148, 14], [92, 14, 92, 82]],
    anchors: [[148, 14], [92, 82]],
    code: "1920 × 1080  →  16 : 9",
    caption: "Scaled 1280 × 720",
  },
  "css-loaders": {
    family: "geometry",
    path: "M120 48 A24 24 0 1 1 96 24",
    guides: [[24, 60, 24, 36], [40, 66, 40, 30], [56, 62, 56, 34]],
    anchors: [[96, 24]],
    caption: "Spinners · bars · dots · progress",
    code: "animation: spin 900ms linear infinite",
  },

  /* ----------------------------------------------------------- security */
  "password-generator": {
    family: "security",
    mode: "generated",
    sample: "kR7#vQ2m$Lx9",
    strength: { label: "Strong · 96 bits", level: 4 },
    checks: [
      { label: "Upper", state: "ok" },
      { label: "Digits", state: "ok" },
      { label: "Symbols", state: "ok" },
      { label: "Reused", state: "fail" },
    ],
  },
  "uuid-generator": {
    family: "security",
    mode: "generated",
    sample: "9f2c1a-4b7e-11f0",
    meta: [
      { label: "Version", value: "v7 (time ordered)" },
      { label: "Batch", value: "250 ids" },
      { label: "Collision risk", value: "negligible" },
    ],
  },
  "csp-generator": {
    family: "security",
    mode: "checks",
    checks: [
      { label: "default-src 'self'", state: "ok" },
      { label: "script-src nonce", state: "ok" },
      { label: "img-src data:", state: "warn" },
      { label: "unsafe-inline", state: "fail" },
    ],
    meta: [
      { label: "Directives", value: "9 configured" },
      { label: "Mode", value: "Report-Only" },
    ],
  },

  /* --------------------------------------------------------------- time */
  "timestamp-converter": {
    family: "time",
    mode: "convert",
    from: { label: "Unix epoch", value: "1780012800", sub: "seconds" },
    to: { label: "Readable", value: "29 May 2026", sub: "14:00:00 UTC" },
    extra: [
      { label: "ISO ", value: "2026-05-29T14:00Z" },
      { label: "Relative ", value: "in 3 weeks" },
    ],
  },
  "timezone-converter": {
    family: "time",
    mode: "zones",
    from: { label: "Berlin", value: "16:00", sub: "CEST · UTC+2" },
    to: { label: "New York", value: "10:00", sub: "EDT · UTC−4" },
    extra: [
      { label: "Overlap ", value: "09:00–12:00" },
      { label: "Shift ", value: "−6 hours" },
    ],
  },
  "date-difference-calculator": {
    family: "time",
    mode: "duration",
    from: { label: "Start", value: "04 Aug 2026", sub: "Tuesday" },
    to: { label: "End", value: "18 Dec 2026", sub: "Friday" },
    extra: [
      { label: "Total ", value: "136 days" },
      { label: "Workdays ", value: "98" },
    ],
  },
  "pomodoro-timer": {
    family: "time",
    mode: "countdown",
    dial: 0.68,
    from: { label: "Focus", value: "17:04", sub: "session 3 of 4" },
    to: { label: "Next", value: "05:00", sub: "short break" },
    extra: [{ label: "Today ", value: "2h 25m focused" }],
  },
  "reaction-time-test": {
    family: "time",
    mode: "countdown",
    dial: 0.32,
    from: { label: "State", value: "WAIT", sub: "green means click" },
    to: { label: "Result", value: "218 ms", sub: "best 194 ms" },
    extra: [{ label: "Average ", value: "241 ms over 5 tries" }],
  },

  /* --------------------------------------------------------------- meta */
  "og-image-generator": {
    family: "meta",
    mode: "social",
    title: "Darma Tech Atlas",
    description: "Resources, learning paths, careers, and ways of working.",
    url: "darma.dev/tech-atlas",
    chips: ["1200 × 630", "PNG", "Safe area"],
  },
  "meta-tag-generator": {
    family: "meta",
    mode: "browser",
    title: "Darma — free browser tools",
    description: "67 privacy-first tools that run entirely in your browser.",
    url: "https://darma.dev/tools",
    chips: ["title", "description", "og:", "twitter:"],
  },
  "qr-code": {
    family: "meta",
    mode: "qr",
    seed: 41,
    url: "darma.dev/tools/qr-code",
    chips: ["Error level Q", "SVG + PNG", "1024px"],
  },
  "favicon-app-icon-generator": {
    family: "meta",
    mode: "icons",
    title: "Darma — browser tools",
    icons: ["512", "180", "64", "32"],
    chips: ["manifest.json", "apple-touch", "maskable"],
  },
  "robots-txt-generator": {
    family: "meta",
    mode: "lines",
    title: "robots.txt",
    lines: [
      "# public crawl policy",
      "User-agent: *",
      "Disallow: /admin",
      "Allow: /tools",
      "Sitemap: https://darma.dev/sitemap.xml",
    ],
  },
  "sitemap-xml-generator": {
    family: "meta",
    mode: "lines",
    title: "sitemap.xml",
    lines: [
      "# 312 urls discovered",
      "loc: /tools/json-formatter",
      "lastmod: 2026-08-04",
      "changefreq: weekly",
      "priority: 0.8",
    ],
  },

  /* ------------------------------------------------------------- layout */
  "box-shadows-generator": {
    family: "layout",
    mode: "shadow",
    surface: "0 18px 34px -12px rgba(15,23,42,0.45), 0 4px 10px rgba(15,23,42,0.18)",
    code: "0 18px 34px -12px rgba(15,23,42,.45)",
  },
  "neumorphic-css-generator": {
    family: "layout",
    mode: "shadow",
    surface: "10px 10px 22px rgba(15,23,42,0.16), -10px -10px 22px rgba(255,255,255,0.85)",
    code: "10px 10px 22px #d5d2cb, -10px -10px 22px #ffffff",
  },
  "css-grid-generator": {
    family: "layout",
    mode: "grid",
    cols: 4,
    cells: [2, 1, 1, 1, 2, 1, 3, 1],
    code: "grid-template-columns: repeat(4, minmax(0, 1fr))",
  },
  "flexbox-generator": {
    family: "layout",
    mode: "flex",
    cells: [1, 2, 1, 1.6],
    code: "justify-content: space-between · align-items: center",
  },
  "container-query-generator": {
    family: "layout",
    mode: "breakpoints",
    breakpoints: [
      { label: "@sm 320", width: 1 },
      { label: "@md 640", width: 1.6 },
      { label: "@lg 960", width: 2.3 },
    ],
    code: "@container card (min-width: 640px)",
  },
};

/** Layout-type fallback so an unmapped tool still gets a semantic family. */
const FALLBACK_BY_CATEGORY: Record<string, ToolPreviewConfig> = {
  css: {
    family: "code",
    lang: "styles.css",
    chips: ["live preview", "copy CSS"],
    code: [".element", "  display: grid", "  gap: 1rem", "  border-radius: 0.75rem"],
    sample: "none",
  },
  color: {
    family: "color",
    swatches: ["#ff6a3d", "#f7c948", "#2dd4bf", "#1c6b6a"],
    rows: [{ label: "HEX", value: "#FF6A3D" }, { label: "HSL", value: "14, 100%, 62%" }],
  },
  text: {
    family: "text",
    op: "process",
    inputLabel: "Input",
    outputLabel: "Output",
    input: [{ text: "Paste your text" }, { text: "any length", tone: "muted" }],
    output: [{ text: "Processed result" }, { text: "ready to copy", tone: "muted" }],
  },
  calculator: {
    family: "calc",
    inputs: [{ label: "Input A", value: "128" }, { label: "Input B", value: "64" }],
    result: { label: "Result", value: "2.00", note: "Recalculated as you type" },
  },
  visual: {
    family: "layout",
    mode: "grid",
    cols: 3,
    cells: [1, 2, 1, 1, 1, 2],
    code: "Visual generator with live preview",
  },
};

type FallbackInput = {
  id: string;
  layoutType?: string;
  secondaryCategory?: string[];
  mainCategory?: string[];
};

/**
 * Returns the preview for a tool. Registry first, then a category-derived
 * family, then a text workbench as the last resort.
 */
export function resolveToolPreview(tool: FallbackInput): ToolPreviewConfig {
  const mapped = TOOL_PREVIEWS[tool.id];
  if (mapped) return mapped;

  const categories = [...(tool.secondaryCategory ?? []), ...(tool.mainCategory ?? [])];
  for (const category of categories) {
    const fallback = FALLBACK_BY_CATEGORY[category];
    if (fallback) return fallback;
  }

  if (tool.layoutType === "visual-generator") return FALLBACK_BY_CATEGORY.visual;
  if (tool.layoutType === "single-utility") return FALLBACK_BY_CATEGORY.calculator;
  return FALLBACK_BY_CATEGORY.text;
}
