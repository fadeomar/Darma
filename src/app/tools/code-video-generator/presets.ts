import type { CodeVideoProject } from "./timeline";

export const CODE_VIDEO_PRESETS: Array<CodeVideoProject & { id: string; description: string }> = [
  {
    id: "orbit-loader",
    title: "Orbit loader",
    description: "A compact HTML and CSS project with a polished animated result.",
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
    id: "counter-card",
    title: "Interactive counter card",
    description: "A small HTML, CSS, and JavaScript project for testing the full three-file flow.",
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
];

export const DEFAULT_CODE_VIDEO_PROJECT = CODE_VIDEO_PRESETS[0];
