/**
 * Seeds one high-quality Explore element: "Interactive Glass Product Card".
 *
 * SAFE FOR STAGING: create-only. It inserts the element ONLY if no row with
 * this slug exists. If the slug already exists it skips and logs — it will
 * never update, overwrite, or delete any existing element. Only ever touches
 * the single `interactive-glass-product-card` row.
 *
 * The element is created reviewed + not-deleted so it is immediately visible
 * in the public Explore tab and at /elements/interactive-glass-product-card.
 *
 * Run with: npm run seed:element  (requires DATABASE_URL)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slug = "interactive-glass-product-card";

const html = `<article class="glass-card" data-glass-card>
  <span class="glass-card__badge">New</span>
  <div class="glass-card__orb glass-card__orb--one"></div>
  <div class="glass-card__orb glass-card__orb--two"></div>

  <div class="glass-card__hero" aria-hidden="true">🎧</div>

  <div class="glass-card__panel">
    <p class="glass-card__eyebrow">Aurora Series</p>
    <h2 class="glass-card__title">Nimbus Wireless Earbuds</h2>
    <p class="glass-card__desc">
      Crystal-clear sound with adaptive noise cancelling and a 32-hour
      glass-finish charging case.
    </p>
    <div class="glass-card__row">
      <span class="glass-card__price">$149</span>
      <button class="glass-card__btn" type="button">Add to cart</button>
    </div>
  </div>
</article>`;

const css = `:root { color-scheme: dark; }

.glass-card {
  --mx: 50%;
  --my: 0%;
  position: relative;
  width: 320px;
  max-width: 88vw;
  padding: 18px;
  border-radius: 24px;
  overflow: hidden;
  color: #f5f7ff;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #6d5bff 0%, #b14bff 45%, #ff5ea8 100%);
  box-shadow: 0 18px 40px -18px rgba(76, 29, 149, 0.8);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease;
}

/* Pointer-tracking glow */
.glass-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: radial-gradient(
    220px circle at var(--mx) var(--my),
    rgba(255, 255, 255, 0.35),
    transparent 60%
  );
}

.glass-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 30px 60px -20px rgba(76, 29, 149, 0.95);
}
.glass-card:hover::after { opacity: 1; }

.glass-card__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(26px);
  opacity: 0.85;
}
.glass-card__orb--one {
  width: 150px; height: 150px;
  top: -40px; right: -30px;
  background: #ffd36e;
}
.glass-card__orb--two {
  width: 130px; height: 130px;
  bottom: -30px; left: -25px;
  background: #4be1ff;
}

.glass-card__badge {
  position: absolute;
  z-index: 2;
  top: 16px; left: 16px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.glass-card__hero {
  position: relative;
  z-index: 1;
  height: 120px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
}

.glass-card__panel {
  position: relative;
  z-index: 1;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.glass-card__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.8;
}
.glass-card__title {
  margin: 0 0 8px;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
}
.glass-card__desc {
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.5;
  opacity: 0.9;
}
.glass-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.glass-card__price {
  font-size: 22px;
  font-weight: 800;
}
.glass-card__btn {
  border: 0;
  cursor: pointer;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #2b0a52;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffffff, #e9e4ff);
  box-shadow: 0 8px 18px -8px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.glass-card__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px -8px rgba(0, 0, 0, 0.55);
}
.glass-card__btn:active { transform: translateY(0); }`;

const js = `const card = document.querySelector("[data-glass-card]");
if (card) {
  card.addEventListener("pointermove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mx", x + "%");
    card.style.setProperty("--my", y + "%");
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "0%");
  });
}`;

const description = `<p>A polished glassmorphism product card built with pure HTML and CSS. It layers a vivid gradient backdrop, soft color orbs, and a frosted glass panel (via <code>backdrop-filter</code>) to create depth.</p>
<p>On hover the card lifts with a deeper shadow, and a small JavaScript snippet tracks the pointer to move a soft highlight across the surface. No external assets or APIs &mdash; safe to drop into any project.</p>`;

async function main() {
  const data = {
    title: "Interactive Glass Product Card",
    slug,
    description,
    shortDescription:
      "A frosted glassmorphism product card with a hover lift and pointer-tracking glow.",
    html,
    css,
    js,
    tags: ["card", "glassmorphism", "product", "hover", "css", "ui"],
    mainCategory: ["ui-elements"],
    secondaryCategory: ["cards"],
    reviewed: true,
    deleted: false,
  };

  // Create-only: never overwrite an existing element (safe for staging).
  const existing = await prisma.element.findUnique({
    where: { slug },
    select: { id: true, deleted: true },
  });

  if (existing) {
    console.log(
      `⏭️  Skipped: an element with slug "${slug}" already exists ` +
        `(id=${existing.id}). No changes made.`,
    );
    return;
  }

  const element = await prisma.element.create({ data });

  console.log(
    `✅ Created element: "${element.title}" -> /elements/${element.slug}`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Element seed failed:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
