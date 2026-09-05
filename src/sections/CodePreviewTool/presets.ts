export type CodePreviewPreset = {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
};

export const CODE_PREVIEW_PRESETS: CodePreviewPreset[] = [
  {
    id: "product-card",
    name: "Product card",
    description: "Responsive commerce card with a practical CTA interaction.",
    html: `<article class="product-card">
  <div class="product-art" aria-hidden="true">
    <span>NEW</span>
  </div>
  <div class="product-copy">
    <p class="eyebrow">Workspace collection</p>
    <h1>Focus Desk Lamp</h1>
    <p class="description">Warm, adjustable light for late-night creative work.</p>
    <div class="product-footer">
      <strong>$79</strong>
      <button type="button" id="add-to-cart">Add to cart</button>
    </div>
    <p class="status" id="cart-status" role="status" aria-live="polite"></p>
  </div>
</article>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f5f1e8;
  color: #1f1d1a;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.product-card {
  width: min(100%, 760px);
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(260px, 1.1fr);
  overflow: hidden;
  border: 1px solid #d8d0c3;
  border-radius: 24px;
  background: #fffdf8;
  box-shadow: 0 24px 60px rgba(58, 45, 29, 0.14);
}
.product-art {
  min-height: 320px;
  display: grid;
  place-items: start;
  padding: 24px;
  background:
    radial-gradient(circle at 65% 32%, #ffd35a 0 18%, transparent 19%),
    linear-gradient(145deg, #23211f, #544b42);
}
.product-art span {
  border-radius: 999px;
  background: #fff8df;
  padding: 8px 11px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.product-copy { padding: 38px; }
.eyebrow {
  margin: 0 0 12px;
  color: #9b4d24;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
h1 { margin: 0; font-size: clamp(30px, 5vw, 52px); line-height: 0.98; }
.description { margin: 20px 0 32px; color: #696157; line-height: 1.7; }
.product-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.product-footer strong { font-size: 28px; }
button {
  border: 0;
  border-radius: 12px;
  background: #f05a28;
  color: white;
  padding: 13px 18px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
button:hover { background: #d94b1d; }
.status { min-height: 20px; margin: 14px 0 0; color: #20744a; font-weight: 700; }
@media (max-width: 620px) {
  .product-card { grid-template-columns: 1fr; }
  .product-art { min-height: 190px; }
  .product-copy { padding: 28px; }
}`,
    js: `const button = document.querySelector("#add-to-cart");
const status = document.querySelector("#cart-status");

button?.addEventListener("click", () => {
  status.textContent = "Added to your cart.";
  button.textContent = "Added";
});`,
  },
  {
    id: "signup-form",
    name: "Signup form",
    description: "Accessible form state, validation, and responsive layout.",
    html: `<main class="signup-shell">
  <section class="signup-copy">
    <p class="eyebrow">Darma Preview</p>
    <h1>Build something useful today.</h1>
    <p>Test responsive UI, form states, and lightweight JavaScript without leaving your browser.</p>
  </section>
  <form class="signup-form" id="signup-form" novalidate>
    <label>
      <span>Name</span>
      <input id="name" name="name" autocomplete="name" required />
    </label>
    <label>
      <span>Email</span>
      <input id="email" name="email" type="email" autocomplete="email" required />
    </label>
    <button type="submit">Create workspace</button>
    <p id="form-status" role="status" aria-live="polite"></p>
  </form>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #171918;
  color: #f8f6f0;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.signup-shell {
  width: min(100%, 920px);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 18px;
}
.signup-copy,
.signup-form {
  border: 1px solid #363a37;
  border-radius: 24px;
  background: #202321;
  padding: clamp(28px, 5vw, 52px);
}
.signup-copy { background: linear-gradient(145deg, #262b27, #1d201e); }
.eyebrow { color: #ff8b5e; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { margin: 18px 0; font-size: clamp(36px, 6vw, 68px); line-height: 0.95; }
p { color: #b8bdb9; line-height: 1.7; }
.signup-form { display: grid; align-content: center; gap: 18px; }
label { display: grid; gap: 8px; font-weight: 750; }
input {
  width: 100%;
  border: 1px solid #4b504c;
  border-radius: 12px;
  background: #171918;
  color: white;
  padding: 13px 14px;
  font: inherit;
  outline: none;
}
input:focus { border-color: #ff7846; box-shadow: 0 0 0 3px rgba(255, 120, 70, 0.2); }
button {
  border: 0;
  border-radius: 12px;
  background: #ff6d37;
  color: #1a110d;
  padding: 14px 18px;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}
#form-status { min-height: 22px; margin: 0; font-weight: 750; }
@media (max-width: 720px) {
  .signup-shell { grid-template-columns: 1fr; }
}`,
    js: `const form = document.querySelector("#signup-form");
const status = document.querySelector("#form-status");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();

  if (!name || !email.includes("@")) {
    status.textContent = "Enter a name and a valid email address.";
    status.style.color = "#ff9a7a";
    return;
  }

  status.textContent = "Workspace created locally for " + name + ".";
  status.style.color = "#77d69a";
  form.reset();
});`,
  },
  {
    id: "interactive-counter",
    name: "Counter widget",
    description: "Compact stateful component for testing click behavior.",
    html: `<section class="counter-card" aria-labelledby="counter-title">
  <p class="eyebrow">Interaction test</p>
  <h1 id="counter-title">Focus counter</h1>
  <p>Use this preset to verify buttons, keyboard focus, and runtime logs.</p>
  <output id="count" aria-live="polite">0</output>
  <div class="actions">
    <button type="button" data-action="decrease">−</button>
    <button type="button" data-action="reset">Reset</button>
    <button type="button" data-action="increase">+</button>
  </div>
</section>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #fff8ed, #f3e7d7);
  color: #241f1a;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.counter-card {
  width: min(100%, 430px);
  border: 1px solid #d8cbb9;
  border-radius: 28px;
  background: rgba(255, 253, 248, 0.9);
  padding: 34px;
  text-align: center;
  box-shadow: 0 24px 70px rgba(69, 49, 25, 0.14);
}
.eyebrow { color: #a14d24; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { margin: 10px 0 8px; font-size: 36px; }
p { color: #74695d; line-height: 1.6; }
output { display: block; margin: 28px 0; font-size: 76px; font-weight: 950; line-height: 1; }
.actions { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 10px; }
button {
  min-height: 48px;
  border: 1px solid #d8cbb9;
  border-radius: 14px;
  background: white;
  color: inherit;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
}
button:hover { border-color: #f05a28; background: #fff2ea; }
button:focus-visible { outline: 3px solid rgba(240, 90, 40, 0.28); outline-offset: 2px; }`,
    js: `let count = 0;
const output = document.querySelector("#count");

function render() {
  output.textContent = String(count);
  console.info("Counter value:", count);
}

document.querySelector(".actions")?.addEventListener("click", (event) => {
  const action = event.target.closest("button")?.dataset.action;
  if (action === "increase") count += 1;
  if (action === "decrease") count -= 1;
  if (action === "reset") count = 0;
  render();
});`,
  },
  {
    id: "pricing-card",
    name: "Pricing card",
    description: "Responsive pricing CTA with a selected billing state.",
    html: `<section class="price-card" aria-labelledby="plan-title">
  <p class="eyebrow">Starter</p>
  <h1 id="plan-title">$19 <small>/ month</small></h1>
  <p class="description">For small teams shipping their first product.</p>
  <ul>
    <li>Up to 5 projects</li>
    <li>Unlimited local exports</li>
    <li>Community support</li>
  </ul>
  <button type="button" id="plan">Choose plan</button>
  <p id="status" role="status" aria-live="polite"></p>
</section>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.price-card {
  width: min(100%, 380px);
  padding: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: white;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}
.eyebrow { margin: 0; color: #7c3aed; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { margin: 12px 0; font-size: 46px; }
small { font-size: 16px; color: #64748b; }
.description { color: #475569; line-height: 1.6; }
ul { margin: 18px 0 0; padding-left: 18px; color: #475569; line-height: 1.9; }
button {
  width: 100%;
  min-height: 48px;
  margin-top: 18px;
  border: 0;
  border-radius: 12px;
  background: #7c3aed;
  color: white;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
}
button:focus-visible { outline: 3px solid rgba(124, 58, 237, 0.3); outline-offset: 2px; }
#status { min-height: 20px; margin: 12px 0 0; color: #15803d; font-weight: 700; }`,
    js: `document.querySelector("#plan")?.addEventListener("click", () => {
  document.querySelector("#status").textContent = "Starter plan selected.";
});`,
  },
  {
    id: "dashboard-stats",
    name: "Dashboard stats",
    description: "Compact responsive KPI cards for dashboard layout testing.",
    html: `<main>
  <h1>Weekly overview</h1>
  <div class="grid">
    <article>
      <span>Revenue</span>
      <strong>$24.8k</strong>
      <em>+12%</em>
    </article>
    <article>
      <span>Orders</span>
      <strong>1,284</strong>
      <em>+8%</em>
    </article>
    <article>
      <span>Refunds</span>
      <strong>32</strong>
      <em class="down">-3%</em>
    </article>
  </div>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  padding: 32px;
  background: #0f172a;
  color: #f8fafc;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
main { max-width: 960px; margin: auto; }
h1 { font-size: clamp(28px, 5vw, 48px); }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
article {
  padding: 22px;
  border: 1px solid #334155;
  border-radius: 18px;
  background: #111827;
}
span { color: #94a3b8; }
strong { display: block; margin: 10px 0; font-size: 32px; }
em { color: #4ade80; font-style: normal; font-weight: 800; }
.down { color: #f87171; }
@media (max-width: 680px) {
  .grid { grid-template-columns: 1fr; }
}`,
    js: `console.info("Dashboard preview ready");`,
  },
  {
    id: "toast-notification",
    name: "Toast notification",
    description: "Button-triggered toast with timed dismissal and live-region feedback.",
    html: `<main>
  <h1>Local settings</h1>
  <p>Trigger a toast to verify timers, live regions, and stacking context.</p>
  <button type="button" id="save">Save changes</button>
  <div id="toast" role="status" aria-live="polite" hidden>Changes saved locally.</div>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #fff7ed;
  color: #1c1917;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
main { max-width: 480px; text-align: center; }
p { color: #78716c; line-height: 1.65; }
button {
  min-height: 48px;
  padding: 14px 20px;
  border: 0;
  border-radius: 12px;
  background: #ea580c;
  color: white;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
}
button:focus-visible { outline: 3px solid rgba(234, 88, 12, 0.3); outline-offset: 2px; }
#toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  padding: 14px 18px;
  border-radius: 12px;
  background: #111827;
  color: white;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}`,
    js: `const button = document.querySelector("#save");
const toast = document.querySelector("#toast");
let timer;

button?.addEventListener("click", () => {
  toast.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
});`,
  },
  {
    id: "faq-accordion",
    name: "FAQ accordion",
    description: "Accessible native details/summary FAQ with responsive spacing.",
    html: `<main>
  <p class="eyebrow">Help center</p>
  <h1>Frequently asked questions</h1>
  <details open>
    <summary>Does this run locally?</summary>
    <p>Yes. This example has no network dependency.</p>
  </details>
  <details>
    <summary>Can I edit the source?</summary>
    <p>Edit HTML, CSS, and JavaScript, then rerun the preview.</p>
  </details>
  <details>
    <summary>Is any data uploaded?</summary>
    <p>No. Source processing stays in your browser.</p>
  </details>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 30px;
  background: #f8fafc;
  color: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
main { max-width: 720px; margin: auto; }
.eyebrow { color: #2563eb; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { font-size: clamp(32px, 6vw, 58px); }
details {
  margin: 12px 0;
  padding: 16px 18px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: white;
}
summary { cursor: pointer; font-weight: 850; }
summary:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.3); outline-offset: 2px; }
p { color: #475569; line-height: 1.65; }`,
    js: `console.info("Native disclosure widgets need very little JavaScript.");`,
  },
  {
    id: "mobile-nav",
    name: "Mobile navigation",
    description: "Responsive navigation with a menu toggle and aria-expanded state.",
    html: `<header>
  <a class="brand" href="#">North</a>
  <button type="button" id="menu" aria-expanded="false" aria-controls="links">Menu</button>
  <nav id="links">
    <a href="#">Work</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </nav>
</header>
<main>
  <p>Resize the preview below 560px to reveal the menu toggle.</p>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  margin: 0;
  background: #f1f5f9;
  color: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
header {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}
.brand { margin-right: auto; font-size: 22px; font-weight: 900; color: #0f172a; text-decoration: none; }
nav { display: flex; gap: 18px; }
nav a { color: #475569; text-decoration: none; }
main { padding: 24px; color: #475569; }
button {
  display: none;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
@media (max-width: 560px) {
  header { flex-wrap: wrap; }
  button { display: block; }
  nav { display: none; flex-basis: 100%; flex-direction: column; padding-top: 12px; }
  nav.open { display: flex; }
}`,
    js: `const button = document.querySelector("#menu");
const nav = document.querySelector("#links");

button?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  button.setAttribute("aria-expanded", String(open));
});`,
  },
  {
    id: "search-filter",
    name: "Search filter",
    description: "Client-side list filtering for testing text inputs and empty states.",
    html: `<main>
  <label for="q">Search tools</label>
  <input id="q" type="search" placeholder="Try color">
  <ul id="items">
    <li>Color palette</li>
    <li>Regex tester</li>
    <li>Image compressor</li>
    <li>Color converter</li>
  </ul>
  <p id="empty" role="status" hidden>No matches.</p>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 28px;
  background: #f8fafc;
  color: #111827;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
main { max-width: 620px; margin: auto; }
label { display: block; margin-bottom: 8px; font-weight: 850; }
input {
  width: 100%;
  min-height: 48px;
  padding: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font: inherit;
}
input:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.28); outline-offset: 2px; }
ul { padding: 0; list-style: none; }
li {
  margin: 8px 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}
#empty { color: #6b7280; }`,
    js: `const input = document.querySelector("#q");
const items = [...document.querySelectorAll("#items li")];
const empty = document.querySelector("#empty");

input?.addEventListener("input", () => {
  const term = input.value.toLowerCase();
  let shown = 0;
  items.forEach((item) => {
    const hit = item.textContent.toLowerCase().includes(term);
    item.hidden = !hit;
    if (hit) shown += 1;
  });
  empty.hidden = shown > 0;
});`,
  },
  {
    id: "progress-steps",
    name: "Progress steps",
    description: "Multi-step status UI with simple next and reset interaction.",
    html: `<main>
  <ol>
    <li class="active">Account</li>
    <li>Profile</li>
    <li>Finish</li>
  </ol>
  <div class="actions">
    <button type="button" id="next">Next step</button>
    <button type="button" id="reset">Reset</button>
  </div>
  <p id="status" role="status" aria-live="polite">Step 1 of 3</p>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #eef2ff;
  color: #1e1b4b;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
main { width: min(92vw, 560px); padding: 28px; border-radius: 20px; background: white; }
ol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 0; list-style: none; }
li { padding: 12px; text-align: center; border-radius: 10px; background: #f1f5f9; color: #64748b; }
.active { background: #4f46e5; color: white; font-weight: 850; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
button {
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  background: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
button:focus-visible { outline: 3px solid rgba(79, 70, 229, 0.3); outline-offset: 2px; }
#status { color: #4338ca; font-weight: 750; }`,
    js: `const steps = [...document.querySelectorAll("li")];
const status = document.querySelector("#status");
let index = 0;

function render() {
  steps.forEach((step, position) => step.classList.toggle("active", position <= index));
  status.textContent = "Step " + (index + 1) + " of " + steps.length;
}

document.querySelector("#next")?.addEventListener("click", () => {
  index = Math.min(index + 1, steps.length - 1);
  render();
});

document.querySelector("#reset")?.addEventListener("click", () => {
  index = 0;
  render();
});`,
  },
  {
    id: "modal-dialog",
    name: "Modal dialog",
    description: "Native dialog example for open, close, and focus behavior.",
    html: `<main>
  <h1>Destructive action</h1>
  <p>This local example never deletes anything.</p>
  <button type="button" id="open">Delete item</button>
  <dialog id="dialog" aria-labelledby="dialog-title">
    <h2 id="dialog-title">Delete item?</h2>
    <p>Confirm to close the dialog with a result value.</p>
    <form method="dialog">
      <button type="submit" value="cancel">Cancel</button>
      <button type="submit" value="confirm" class="danger">Confirm</button>
    </form>
  </dialog>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
main { max-width: 480px; text-align: center; }
p { color: #475569; line-height: 1.65; }
button {
  min-height: 44px;
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
button:focus-visible { outline: 3px solid rgba(15, 23, 42, 0.25); outline-offset: 2px; }
.danger { border-color: #dc2626; background: #dc2626; color: white; }
dialog { max-width: 380px; border: 0; border-radius: 18px; padding: 26px; text-align: left; }
dialog::backdrop { background: rgba(15, 23, 42, 0.6); }
form { display: flex; justify-content: flex-end; gap: 10px; margin: 0; }`,
    js: `const dialog = document.querySelector("#dialog");

document.querySelector("#open")?.addEventListener("click", () => dialog.showModal());

dialog?.addEventListener("close", () => {
  console.info("Dialog result:", dialog.returnValue);
});`,
  },
  {
    id: "empty-state",
    name: "Empty state",
    description: "Useful empty-state layout with primary and secondary actions.",
    html: `<main>
  <div class="icon" aria-hidden="true">&#9678;</div>
  <h1>No saved results yet</h1>
  <p>Save a result to compare it later or export it with your team.</p>
  <div class="actions">
    <button type="button">Run analysis</button>
    <a href="#">View example</a>
  </div>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #fafafa;
  color: #18181b;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
main { max-width: 520px; text-align: center; }
.icon {
  width: 72px;
  height: 72px;
  margin: auto;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: #ede9fe;
  color: #7c3aed;
  font-size: 36px;
}
h1 { margin: 20px 0 8px; font-size: 36px; }
p { color: #71717a; line-height: 1.65; }
.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 18px; }
button, a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 11px 15px;
  border-radius: 10px;
  font: inherit;
  font-weight: 850;
  text-decoration: none;
  cursor: pointer;
}
button { border: 0; background: #7c3aed; color: white; }
a { border: 1px solid #ddd6fe; color: #7c3aed; }
button:focus-visible, a:focus-visible { outline: 3px solid rgba(124, 58, 237, 0.3); outline-offset: 2px; }`,
    js: `console.info("Empty state example loaded");`,
  },
];

export const DEFAULT_CODE_PREVIEW_PRESET = CODE_PREVIEW_PRESETS[0];
