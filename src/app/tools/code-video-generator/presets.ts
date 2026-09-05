import type { CodeVideoProject } from "./timeline";

export type CodeVideoPresetCategory =
  | "Interface"
  | "Motion"
  | "Interaction"
  | "Layout";

export type CodeVideoPreset = CodeVideoProject & {
  id: string;
  description: string;
  category: CodeVideoPresetCategory;
};

/**
 * Starter projects for the typing animation.
 *
 * Every project is deliberately short: the timeline types the source character
 * by character, so a compact file produces a watchable clip while a long one
 * produces a slow recording. Group order below is the order shown in the
 * grouped starter picker.
 */
export const CODE_VIDEO_PRESETS: CodeVideoPreset[] = [
  // ── Motion ────────────────────────────────────────────────────────────────
  {
    id: "orbit-loader",
    title: "Orbit loader",
    description: "A compact HTML and CSS project with a polished animated result.",
    category: "Motion",
    html: `<main class="scene">
  <div class="loader" role="status" aria-label="Loading">
    <span class="orbit orbit-one"></span>
    <span class="orbit orbit-two"></span>
    <span class="core"></span>
  </div>
  <p>Preparing your workspace…</p>
</main>
`,
    css: `:root {
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  background: #090b10;
  color: #f7f7f8;
}

* { box-sizing: border-box; }

body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 35%, rgba(240, 90, 40, 0.18), transparent 28rem), #090b10;
}

.scene { display: grid; justify-items: center; gap: 2rem; }
.loader { position: relative; width: 10rem; aspect-ratio: 1; display: grid; place-items: center; }
.core { width: 2.2rem; aspect-ratio: 1; border-radius: 50%; background: #f05a28; box-shadow: 0 0 2.4rem rgba(240, 90, 40, 0.7); }
.orbit { position: absolute; inset: 0; border: 2px solid rgba(255, 255, 255, 0.16); border-top-color: #f05a28; border-radius: 50%; animation: spin 2.2s linear infinite; }
.orbit-two { inset: 1.4rem; border-top-color: #ffd8ca; animation-duration: 1.35s; animation-direction: reverse; }
.scene p { margin: 0; color: rgba(255, 255, 255, 0.68); letter-spacing: 0.04em; }
@keyframes spin { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .orbit { animation-duration: 8s; } }
`,
    js: "",
  },
  {
    id: "typing-dots",
    title: "Chat typing dots",
    description: "Three-dot typing indicator for chat, support, and AI response demos.",
    category: "Motion",
    html: `<main class="chat">
  <div class="bubble">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
  <p>Assistant is typing…</p>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #0f172a; color: #e2e8f0; }
.chat { display: grid; justify-items: center; gap: 1.25rem; }
.bubble { display: flex; gap: 0.5rem; padding: 1.1rem 1.5rem; border-radius: 999px; background: #1e293b; }
.dot { width: 0.6rem; aspect-ratio: 1; border-radius: 50%; background: #38bdf8; animation: bounce 1.2s ease-in-out infinite; }
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }
p { margin: 0; color: #94a3b8; font-size: 0.9rem; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-0.5rem); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .dot { animation: none; opacity: 1; } }
`,
    js: "",
  },
  {
    id: "skeleton-card",
    title: "Skeleton shimmer",
    description: "Loading placeholder with a shimmer sweep for content-heavy layouts.",
    category: "Motion",
    html: `<main class="card" aria-busy="true" aria-label="Loading article">
  <div class="thumb shimmer"></div>
  <div class="line shimmer w-80"></div>
  <div class="line shimmer w-60"></div>
  <div class="line shimmer w-40"></div>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; background: #f8fafc; }
.card { width: min(100%, 22rem); display: grid; gap: 0.85rem; padding: 1.25rem; border: 1px solid #e2e8f0; border-radius: 1rem; background: white; }
.thumb { height: 8rem; border-radius: 0.75rem; }
.line { height: 0.8rem; border-radius: 999px; }
.w-80 { width: 80%; }
.w-60 { width: 60%; }
.w-40 { width: 40%; }
.shimmer {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: sweep 1.4s linear infinite;
}
@keyframes sweep { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .shimmer { animation: none; } }
`,
    js: "",
  },
  {
    id: "gradient-text",
    title: "Animated gradient text",
    description: "A short pure-CSS title effect for intros, titles, and channel branding.",
    category: "Motion",
    html: `<main>
  <h1 class="headline">Build in public</h1>
  <p>Ship one small thing every day.</p>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #06070d; color: #cbd5e1; text-align: center; }
.headline {
  margin: 0;
  font-size: clamp(2.5rem, 9vw, 5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, #f97316, #ec4899, #6366f1, #f97316);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: slide 6s linear infinite;
}
p { margin: 0.75rem 0 0; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.8rem; }
@keyframes slide { to { background-position: 300% 0; } }
@media (prefers-reduced-motion: reduce) { .headline { animation: none; } }
`,
    js: "",
  },

  // ── Interface ─────────────────────────────────────────────────────────────
  {
    id: "pricing-card",
    title: "Pricing card",
    description: "A single plan card with feature list and CTA for SaaS explainers.",
    category: "Interface",
    html: `<main class="plan">
  <p class="eyebrow">Starter</p>
  <h1>$19<small>/month</small></h1>
  <p class="lede">For small teams shipping their first product.</p>
  <ul>
    <li>Up to 5 projects</li>
    <li>Unlimited local exports</li>
    <li>Community support</li>
  </ul>
  <button type="button">Choose plan</button>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; background: #f8fafc; color: #0f172a; }
.plan { width: min(100%, 22rem); padding: 2rem; border: 1px solid #e2e8f0; border-radius: 1.5rem; background: white; box-shadow: 0 1.5rem 3.5rem rgba(15, 23, 42, 0.08); }
.eyebrow { margin: 0; color: #7c3aed; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { margin: 0.6rem 0; font-size: 2.9rem; }
small { font-size: 1rem; color: #64748b; font-weight: 500; }
.lede { color: #475569; line-height: 1.6; }
ul { margin: 1.25rem 0 0; padding-left: 1.1rem; color: #475569; line-height: 2; }
button { width: 100%; min-height: 3rem; margin-top: 1.25rem; border: 0; border-radius: 0.8rem; background: #7c3aed; color: white; font: inherit; font-weight: 800; cursor: pointer; }
`,
    js: "",
  },
  {
    id: "glass-profile",
    title: "Glass profile card",
    description: "A glassmorphism card over a gradient backdrop for design-focused clips.",
    category: "Interface",
    html: `<main class="glass">
  <div class="avatar">MC</div>
  <h1>Maya Chen</h1>
  <p>Product designer · Remote</p>
  <div class="stats">
    <span><b>128</b>Projects</span>
    <span><b>4.9</b>Rating</span>
    <span><b>6y</b>Experience</span>
  </div>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color-scheme: dark; }
* { box-sizing: border-box; }
body {
  min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; color: #f8fafc;
  background: linear-gradient(135deg, #6366f1, #ec4899 55%, #f97316);
}
.glass {
  width: min(100%, 20rem); padding: 2rem; text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(1rem);
  box-shadow: 0 1.5rem 3rem rgba(15, 23, 42, 0.25);
}
.avatar { width: 4.5rem; aspect-ratio: 1; margin: 0 auto; display: grid; place-items: center; border-radius: 50%; background: rgba(255, 255, 255, 0.25); font-size: 1.4rem; font-weight: 800; }
h1 { margin: 1rem 0 0.25rem; font-size: 1.4rem; }
p { margin: 0; color: rgba(255, 255, 255, 0.78); font-size: 0.9rem; }
.stats { display: flex; justify-content: space-between; gap: 0.5rem; margin-top: 1.5rem; }
.stats span { display: grid; gap: 0.15rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.72); }
.stats b { font-size: 1.2rem; color: #fff; }
`,
    js: "",
  },
  {
    id: "neon-button",
    title: "Neon CTA button",
    description: "A glowing hover button that reads clearly at video resolution.",
    category: "Interface",
    html: `<main>
  <button class="neon" type="button">Launch project</button>
  <p>Hover to see the glow build.</p>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #08080f; color: #64748b; }
main { display: grid; justify-items: center; gap: 1.5rem; }
.neon {
  padding: 1rem 2.5rem;
  border: 2px solid #22d3ee;
  border-radius: 999px;
  background: transparent;
  color: #22d3ee;
  font: inherit;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 200ms ease, box-shadow 250ms ease, background 250ms ease;
}
.neon:hover, .neon:focus-visible {
  color: #06111a;
  background: #22d3ee;
  box-shadow: 0 0 1rem #22d3ee, 0 0 3rem rgba(34, 211, 238, 0.55);
  outline: none;
}
p { margin: 0; font-size: 0.85rem; }
`,
    js: "",
  },
  {
    id: "stat-tiles",
    title: "Dashboard stat tiles",
    description: "Three responsive KPI tiles for analytics and dashboard walkthroughs.",
    category: "Interface",
    html: `<main>
  <h1>Weekly overview</h1>
  <div class="grid">
    <article><span>Revenue</span><strong>$24.8k</strong><em>+12%</em></article>
    <article><span>Orders</span><strong>1,284</strong><em>+8%</em></article>
    <article><span>Refunds</span><strong>32</strong><em class="down">-3%</em></article>
  </div>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; padding: 2rem; background: #0f172a; color: #f8fafc; }
main { max-width: 60rem; margin: auto; }
h1 { font-size: clamp(1.75rem, 5vw, 2.75rem); }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
article { padding: 1.4rem; border: 1px solid #334155; border-radius: 1.1rem; background: #111827; }
span { color: #94a3b8; font-size: 0.85rem; }
strong { display: block; margin: 0.6rem 0; font-size: 2rem; }
em { color: #4ade80; font-style: normal; font-weight: 800; }
.down { color: #f87171; }
@media (max-width: 42rem) { .grid { grid-template-columns: 1fr; } }
`,
    js: "",
  },

  // ── Interaction ───────────────────────────────────────────────────────────
  {
    id: "counter-card",
    title: "Interactive counter card",
    description: "A small HTML, CSS, and JavaScript project for testing the full three-file flow.",
    category: "Interaction",
    html: `<main class="counter-card">
  <span class="eyebrow">Darma mini project</span>
  <h1>Focus counter</h1>
  <p>Use the controls to track one focused repetition at a time.</p>
  <output id="count">0</output>
  <div class="actions">
    <button id="decrease" type="button">Decrease</button>
    <button id="increase" type="button">Increase</button>
  </div>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #f7f4ef; color: #1f1c19; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; }
.counter-card { width: min(100%, 28rem); padding: 2rem; border: 1px solid #d8d0c7; border-radius: 1.5rem; background: #fffdf9; box-shadow: 0 1.5rem 4rem rgba(59, 43, 28, 0.12); }
.eyebrow { color: #c4471c; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
h1 { margin: 0.5rem 0; }
p { color: #6f655c; line-height: 1.6; }
output { display: block; margin: 1.5rem 0; font-size: 4rem; font-weight: 900; }
.actions { display: flex; gap: 0.75rem; }
button { flex: 1; min-height: 2.75rem; border: 0; border-radius: 0.8rem; background: #1f1c19; color: white; font: inherit; font-weight: 700; cursor: pointer; }
button:last-child { background: #f05a28; }
`,
    js: `const output = document.querySelector("#count");
const increaseButton = document.querySelector("#increase");
const decreaseButton = document.querySelector("#decrease");
let count = 0;

function render() {
  if (output) output.textContent = String(count);
}

increaseButton?.addEventListener("click", () => {
  count += 1;
  render();
});

decreaseButton?.addEventListener("click", () => {
  count = Math.max(0, count - 1);
  render();
});

render();
`,
  },
  {
    id: "theme-toggle",
    title: "Dark mode toggle",
    description: "A light and dark theme switch built on a single data attribute.",
    category: "Interaction",
    html: `<main>
  <h1>Theme switch</h1>
  <p>One attribute drives every color token on the page.</p>
  <button id="toggle" type="button" aria-pressed="false">Switch to dark</button>
</main>
`,
    css: `:root {
  --bg: #f8fafc;
  --fg: #0f172a;
  --muted: #64748b;
  --accent: #2563eb;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
[data-theme="dark"] {
  --bg: #0b1120;
  --fg: #e2e8f0;
  --muted: #94a3b8;
  --accent: #60a5fa;
}
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: var(--bg); color: var(--fg); transition: background 250ms ease, color 250ms ease; }
main { text-align: center; }
h1 { margin: 0 0 0.5rem; }
p { margin: 0 0 1.5rem; color: var(--muted); }
button { min-height: 2.75rem; padding: 0 1.5rem; border: 0; border-radius: 0.75rem; background: var(--accent); color: white; font: inherit; font-weight: 800; cursor: pointer; }
`,
    js: `const toggle = document.querySelector("#toggle");
const root = document.documentElement;

toggle?.addEventListener("click", () => {
  const dark = root.dataset.theme === "dark";
  root.dataset.theme = dark ? "light" : "dark";
  toggle.setAttribute("aria-pressed", String(!dark));
  toggle.textContent = dark ? "Switch to dark" : "Switch to light";
});
`,
  },
  {
    id: "tabs-panel",
    title: "Accessible tabs",
    description: "A three-tab panel with aria-selected wiring, useful for teaching patterns.",
    category: "Interaction",
    html: `<main>
  <div class="tabs" role="tablist" aria-label="Plan details">
    <button role="tab" aria-selected="true" data-panel="overview">Overview</button>
    <button role="tab" aria-selected="false" data-panel="pricing">Pricing</button>
    <button role="tab" aria-selected="false" data-panel="support">Support</button>
  </div>
  <section id="overview">A short summary of what the plan includes.</section>
  <section id="pricing" hidden>Billed monthly. Cancel at any time.</section>
  <section id="support" hidden>Community support with a 48-hour response goal.</section>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; background: #f1f5f9; color: #0f172a; }
main { width: min(100%, 32rem); padding: 1.75rem; border-radius: 1.25rem; background: white; box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08); }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
[role="tab"] { flex: 1; min-height: 2.5rem; border: 1px solid #cbd5e1; border-radius: 0.7rem; background: #f8fafc; font: inherit; font-weight: 700; cursor: pointer; }
[role="tab"][aria-selected="true"] { border-color: #2563eb; background: #2563eb; color: white; }
section { color: #475569; line-height: 1.7; }
`,
    js: `const tabs = [...document.querySelectorAll('[role="tab"]')];

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((other) => {
      const selected = other === tab;
      other.setAttribute("aria-selected", String(selected));
      const panel = document.querySelector("#" + other.dataset.panel);
      if (panel) panel.hidden = !selected;
    });
  });
});
`,
  },
  {
    id: "accordion-faq",
    title: "FAQ accordion",
    description: "Native details and summary elements with almost no JavaScript.",
    category: "Interaction",
    html: `<main>
  <p class="eyebrow">Help center</p>
  <h1>Frequently asked questions</h1>
  <details open>
    <summary>Does this run locally?</summary>
    <p>Yes. This example has no network dependency.</p>
  </details>
  <details>
    <summary>Can I edit the source?</summary>
    <p>Edit each file, then replay the timeline.</p>
  </details>
  <details>
    <summary>Is any data uploaded?</summary>
    <p>No. Everything stays in the browser.</p>
  </details>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; padding: 2rem; background: #f8fafc; color: #0f172a; }
main { max-width: 40rem; margin: auto; }
.eyebrow { color: #2563eb; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { font-size: clamp(1.9rem, 6vw, 3rem); }
details { margin: 0.75rem 0; padding: 1rem 1.1rem; border: 1px solid #cbd5e1; border-radius: 0.9rem; background: white; }
summary { cursor: pointer; font-weight: 800; }
details p { color: #475569; line-height: 1.65; }
`,
    js: `document.querySelectorAll("details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) console.info("Opened:", item.querySelector("summary")?.textContent);
  });
});
`,
  },
  {
    id: "count-up",
    title: "Animated count-up",
    description: "A number that eases to its target value, good for results and metrics.",
    category: "Interaction",
    html: `<main>
  <p class="eyebrow">Projects shipped</p>
  <output id="value">0</output>
  <button id="run" type="button">Run again</button>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #05070f; color: #e2e8f0; }
main { display: grid; justify-items: center; gap: 1rem; text-align: center; }
.eyebrow { margin: 0; color: #38bdf8; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
output { font-size: clamp(3.5rem, 14vw, 7rem); font-weight: 900; font-variant-numeric: tabular-nums; }
button { min-height: 2.6rem; padding: 0 1.4rem; border: 1px solid #334155; border-radius: 0.7rem; background: transparent; color: inherit; font: inherit; font-weight: 700; cursor: pointer; }
`,
    js: `const output = document.querySelector("#value");
const button = document.querySelector("#run");
const target = 1284;

function animate() {
  const start = performance.now();
  const duration = 1600;

  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    if (output) output.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

button?.addEventListener("click", animate);
animate();
`,
  },
  {
    id: "todo-mini",
    title: "Mini todo list",
    description: "Add and complete items: a complete CRUD-style demo in very few lines.",
    category: "Interaction",
    html: `<main>
  <h1>Today</h1>
  <form id="form">
    <input id="input" placeholder="Add a task" aria-label="Add a task" />
    <button type="submit">Add</button>
  </form>
  <ul id="list"></ul>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; background: #fffbeb; color: #1c1917; }
main { width: min(100%, 26rem); padding: 1.75rem; border-radius: 1.25rem; background: white; box-shadow: 0 1rem 3rem rgba(120, 53, 15, 0.12); }
h1 { margin: 0 0 1rem; }
form { display: flex; gap: 0.5rem; }
input { flex: 1; min-height: 2.6rem; padding: 0 0.8rem; border: 1px solid #e7e5e4; border-radius: 0.7rem; font: inherit; }
button { min-height: 2.6rem; padding: 0 1.1rem; border: 0; border-radius: 0.7rem; background: #ea580c; color: white; font: inherit; font-weight: 800; cursor: pointer; }
ul { margin: 1.25rem 0 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
li { display: flex; gap: 0.6rem; align-items: center; padding: 0.7rem 0.85rem; border: 1px solid #f5f5f4; border-radius: 0.7rem; }
li.done span { text-decoration: line-through; color: #a8a29e; }
`,
    js: `const form = document.querySelector("#form");
const input = document.querySelector("#input");
const list = document.querySelector("#list");

function addTask(title) {
  const item = document.createElement("li");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.addEventListener("change", () => item.classList.toggle("done", box.checked));
  const label = document.createElement("span");
  label.textContent = title;
  item.append(box, label);
  list?.append(item);
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = input?.value.trim();
  if (!value) return;
  addTask(value);
  input.value = "";
});

["Write the outline", "Record the intro"].forEach(addTask);
`,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    id: "landing-hero",
    title: "Landing hero",
    description: "A centered hero with headline, subcopy, and two calls to action.",
    category: "Layout",
    html: `<main class="hero">
  <p class="badge">New · v2.0</p>
  <h1>Ship your side project this weekend</h1>
  <p class="lede">A focused toolkit that removes setup work so you can start with the interesting part.</p>
  <div class="actions">
    <a class="primary" href="#">Get started</a>
    <a class="ghost" href="#">See the demo</a>
  </div>
</main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; color: #0f172a; background: radial-gradient(circle at 50% 0%, #e0e7ff, #f8fafc 60%); }
.hero { max-width: 42rem; text-align: center; }
.badge { display: inline-block; margin: 0; padding: 0.35rem 0.85rem; border-radius: 999px; background: #e0e7ff; color: #4338ca; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.06em; }
h1 { margin: 1.25rem 0 0.75rem; font-size: clamp(2.2rem, 7vw, 3.75rem); line-height: 1.1; letter-spacing: -0.03em; }
.lede { margin: 0 auto; max-width: 32rem; color: #475569; font-size: 1.05rem; line-height: 1.7; }
.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; margin-top: 2rem; }
a { min-height: 3rem; display: inline-flex; align-items: center; padding: 0 1.5rem; border-radius: 0.8rem; font-weight: 800; text-decoration: none; }
.primary { background: #4f46e5; color: white; }
.ghost { border: 1px solid #c7d2fe; color: #4338ca; }
`,
    js: "",
  },
  {
    id: "responsive-nav",
    title: "Responsive navigation",
    description: "A header that collapses to a menu toggle below 560px.",
    category: "Layout",
    html: `<header>
  <a class="brand" href="#">North</a>
  <button id="menu" type="button" aria-expanded="false" aria-controls="links">Menu</button>
  <nav id="links">
    <a href="#">Work</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </nav>
</header>
<main><p>Resize the preview below 560px to reveal the toggle.</p></main>
`,
    css: `:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; background: #f1f5f9; color: #0f172a; }
header { display: flex; align-items: center; gap: 1.1rem; padding: 1.1rem 1.5rem; background: white; border-bottom: 1px solid #e2e8f0; }
.brand { margin-right: auto; font-size: 1.35rem; font-weight: 900; color: #0f172a; text-decoration: none; }
nav { display: flex; gap: 1.1rem; }
nav a { color: #475569; text-decoration: none; }
main { padding: 1.5rem; color: #475569; }
#menu { display: none; min-height: 2.6rem; padding: 0 0.9rem; border: 1px solid #cbd5e1; border-radius: 0.65rem; background: white; font: inherit; font-weight: 800; cursor: pointer; }
@media (max-width: 35rem) {
  header { flex-wrap: wrap; }
  #menu { display: block; }
  nav { display: none; flex-basis: 100%; flex-direction: column; padding-top: 0.75rem; }
  nav.open { display: flex; }
}
`,
    js: `const button = document.querySelector("#menu");
const nav = document.querySelector("#links");

button?.addEventListener("click", () => {
  const open = nav?.classList.toggle("open") ?? false;
  button.setAttribute("aria-expanded", String(open));
});
`,
  },
];

export const CODE_VIDEO_PRESET_CATEGORIES: CodeVideoPresetCategory[] = [
  "Motion",
  "Interface",
  "Interaction",
  "Layout",
];

export const DEFAULT_CODE_VIDEO_PROJECT = CODE_VIDEO_PRESETS[0];
