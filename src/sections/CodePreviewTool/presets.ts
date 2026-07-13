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
];

export const DEFAULT_CODE_PREVIEW_PRESET = CODE_PREVIEW_PRESETS[0];
