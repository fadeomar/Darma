import type {
  LoremConfig,
  GeneratedOutput,
  LoremStats,
  TextStyle,
  BlockLength,
} from "./types";
import {
  CLASSIC_OPENING,
  CLASSIC_WORDS,
  CLASSIC_SENTENCES,
  READABLE_WORDS,
  READABLE_SENTENCES,
  STARTUP_WORDS,
  STARTUP_SENTENCES,
  ECOMMERCE_WORDS,
  ECOMMERCE_SENTENCES,
  BLOG_WORDS,
  BLOG_SENTENCES,
  PROFILE_WORDS,
  PROFILE_SENTENCES,
  HERO_BLOCKS,
  CARD_BLOCKS,
  TESTIMONIAL_BLOCKS,
  FAQ_BLOCKS,
  PRODUCT_BLOCKS,
  ABOUT_BLOCKS,
  ONBOARDING_BLOCKS,
  PRICING_BLOCKS,
} from "./contentPools";

// ─── Utilities ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Word pools by style ──────────────────────────────────────────────────────

function getWordPool(style: TextStyle): string[] {
  switch (style) {
    case "classic":    return CLASSIC_WORDS;
    case "readable":   return READABLE_WORDS;
    case "startup":    return STARTUP_WORDS;
    case "ecommerce":  return ECOMMERCE_WORDS;
    case "blog":       return BLOG_WORDS;
    case "profile":    return PROFILE_WORDS;
  }
}

function getSentencePool(style: TextStyle): string[] {
  switch (style) {
    case "classic":    return CLASSIC_SENTENCES;
    case "readable":   return READABLE_SENTENCES;
    case "startup":    return STARTUP_SENTENCES;
    case "ecommerce":  return ECOMMERCE_SENTENCES;
    case "blog":       return BLOG_SENTENCES;
    case "profile":    return PROFILE_SENTENCES;
  }
}

// ─── Sentence length ranges ───────────────────────────────────────────────────

function sentencesPerParagraph(len: BlockLength): [number, number] {
  switch (len) {
    case "short":  return [2, 3];
    case "medium": return [3, 5];
    case "long":   return [5, 8];
  }
}

// ─── Word generation ──────────────────────────────────────────────────────────

function generateWords(config: LoremConfig): string {
  const pool = getWordPool(config.style);
  const shuffled = shuffle(pool);
  const words: string[] = [];

  while (words.length < config.amount) {
    words.push(...shuffled);
  }

  const result = words.slice(0, config.amount).join(" ");
  return capitalize(result);
}

// ─── Sentence generation ──────────────────────────────────────────────────────

function generateSentences(config: LoremConfig): string[] {
  const pool = getSentencePool(config.style);
  const sentences: string[] = [];
  const shuffled = shuffle(pool);

  while (sentences.length < config.amount) {
    sentences.push(...shuffled);
  }

  const result = sentences.slice(0, config.amount);

  if (config.style === "classic" && config.startWithLorem) {
    result[0] = CLASSIC_OPENING;
  }

  return result;
}

// ─── Paragraph generation ─────────────────────────────────────────────────────

function buildParagraph(style: TextStyle, len: BlockLength, startWithLorem: boolean, isFirst: boolean): string {
  const pool = getSentencePool(style);
  const [min, max] = sentencesPerParagraph(len);
  const count = randInt(min, max);
  const shuffled = shuffle(pool);
  const sentences = shuffled.slice(0, count);

  if (isFirst && startWithLorem && style === "classic") {
    sentences[0] = CLASSIC_OPENING;
  }

  return sentences.join(" ");
}

const SECTION_HEADINGS: Record<TextStyle, string[]> = {
  classic:   ["De Finibus", "De Natura", "Sed Ut Perspiciatis", "Nemo Enim", "Quis Autem"],
  readable:  ["Overview", "Key Points", "Background", "Details", "Summary", "Context"],
  startup:   ["How It Works", "Why It Matters", "Built for Scale", "The Platform", "What's Next"],
  ecommerce: ["Product Details", "What's Included", "Why You'll Love It", "Specifications", "Shipping Info"],
  blog:      ["Background", "The Core Argument", "What the Data Shows", "Implications", "Looking Ahead"],
  profile:   ["About", "Background", "Experience", "Approach", "Outside Work"],
};

const LIST_ITEMS: Record<TextStyle, string[]> = {
  classic:   ["Lorem ipsum dolor sit amet", "Consectetur adipiscing elit", "Sed do eiusmod tempor", "Ut labore et dolore", "Magna aliqua enim ad"],
  readable:  ["Review layout at multiple screen widths", "Check spacing against design tokens", "Verify typography scale consistency", "Ensure content loads within performance budget", "Confirm accessibility at all interactive states"],
  startup:   ["Zero-config setup in under 5 minutes", "End-to-end encryption by default", "Scales automatically with your traffic", "Integrates with your existing stack", "SOC 2 Type II certified"],
  ecommerce: ["Free shipping on all orders over $50", "30-day hassle-free return policy", "Lifetime product support included", "Available in 6 color variants", "Certified by independent quality lab"],
  blog:      ["Research is the foundation of good decisions", "Context changes everything about the answer", "Small consistent habits outperform big sporadic efforts", "The question is usually more important than the answer", "Revisiting assumptions is not a sign of weakness"],
  profile:   ["Available for contract and freelance work", "Specialize in design systems and UI architecture", "Open to remote-first and async teams", "Speak at industry events on request", "Mentor junior designers and developers"],
};

function generateParagraphs(config: LoremConfig): string[] {
  const paragraphs: string[] = [];
  const headings = shuffle([...SECTION_HEADINGS[config.style]]);
  const listItems = LIST_ITEMS[config.style];
  let headingIdx = 0;

  for (let i = 0; i < config.amount; i++) {
    const isFirst = i === 0;

    // Optional heading every 2-3 paragraphs
    if (config.includeHeadings && i > 0 && i % randInt(2, 3) === 0) {
      const heading = headings[headingIdx % headings.length];
      headingIdx++;
      paragraphs.push(`__heading__${heading}`);
    }

    paragraphs.push(buildParagraph(config.style, config.blockLength, config.startWithLorem, isFirst));

    // Optional list after every 3rd paragraph
    if (config.includeLists && i > 0 && i % 3 === 0) {
      paragraphs.push(`__list__${listItems.join("|")}`);
    }
  }

  return paragraphs;
}

// ─── Structured block generation ─────────────────────────────────────────────

function generateStructured(config: LoremConfig): string[] {
  const { structuredBlock, amount } = config;

  switch (structuredBlock) {
    case "hero": {
      return shuffle(HERO_BLOCKS).slice(0, Math.min(amount, HERO_BLOCKS.length)).map((b) =>
        `__hero__${JSON.stringify(b)}`
      );
    }
    case "card": {
      return shuffle(CARD_BLOCKS).slice(0, Math.min(amount, CARD_BLOCKS.length)).map((b) =>
        `__card__${JSON.stringify(b)}`
      );
    }
    case "testimonial": {
      return shuffle(TESTIMONIAL_BLOCKS).slice(0, Math.min(amount, TESTIMONIAL_BLOCKS.length)).map((b) =>
        `__testimonial__${JSON.stringify(b)}`
      );
    }
    case "faq": {
      return shuffle(FAQ_BLOCKS).slice(0, Math.min(amount, FAQ_BLOCKS.length)).map((b) =>
        `__faq__${JSON.stringify(b)}`
      );
    }
    case "product": {
      return shuffle(PRODUCT_BLOCKS).slice(0, Math.min(amount, PRODUCT_BLOCKS.length)).map((b) =>
        `__product__${JSON.stringify(b)}`
      );
    }
    case "about": {
      const block = pick(ABOUT_BLOCKS);
      return [`__about__${JSON.stringify(block)}`];
    }
    case "onboarding": {
      return ONBOARDING_BLOCKS.slice(0, Math.min(amount, ONBOARDING_BLOCKS.length)).map((b) =>
        `__onboarding__${JSON.stringify(b)}`
      );
    }
    case "pricing": {
      return shuffle(PRICING_BLOCKS).slice(0, Math.min(amount, PRICING_BLOCKS.length)).map((b) =>
        `__pricing__${JSON.stringify(b)}`
      );
    }
  }
}

// ─── Serialisers: tokens → plain text ─────────────────────────────────────────

function tokenToPlain(token: string): string {
  if (token.startsWith("__heading__")) return `\n${token.replace("__heading__", "")}\n`;
  if (token.startsWith("__list__")) return token.replace("__list__", "").split("|").map((i) => `• ${i}`).join("\n");

  if (token.startsWith("__hero__")) {
    const b = JSON.parse(token.replace("__hero__", ""));
    return [b.title, b.subtitle, b.body, `→ ${b.cta}`, b.secondary].join("\n\n");
  }
  if (token.startsWith("__card__")) {
    const b = JSON.parse(token.replace("__card__", ""));
    return `${b.title}\n${b.description}`;
  }
  if (token.startsWith("__testimonial__")) {
    const b = JSON.parse(token.replace("__testimonial__", ""));
    return `"${b.quote}"\n— ${b.name}, ${b.role}`;
  }
  if (token.startsWith("__faq__")) {
    const b = JSON.parse(token.replace("__faq__", ""));
    return `Q: ${b.q}\nA: ${b.a}`;
  }
  if (token.startsWith("__product__")) {
    const b = JSON.parse(token.replace("__product__", ""));
    return [`${b.title} — ${b.price}`, b.description, b.features.map((f: string) => `• ${f}`).join("\n")].join("\n\n");
  }
  if (token.startsWith("__about__")) {
    const paragraphs: string[] = JSON.parse(token.replace("__about__", ""));
    return paragraphs.join("\n\n");
  }
  if (token.startsWith("__onboarding__")) {
    const b = JSON.parse(token.replace("__onboarding__", ""));
    return `${b.step}. ${b.title}\n${b.description}`;
  }
  if (token.startsWith("__pricing__")) {
    const b = JSON.parse(token.replace("__pricing__", ""));
    return [`${b.name} — ${b.price}`, b.description, b.features.map((f: string) => `• ${f}`).join("\n"), `→ ${b.cta}`].join("\n\n");
  }

  return token;
}

// ─── Serialisers: tokens → HTML ───────────────────────────────────────────────

function tokenToHtml(token: string): string {
  if (token.startsWith("__heading__")) {
    return `<h2>${token.replace("__heading__", "")}</h2>`;
  }
  if (token.startsWith("__list__")) {
    const items = token.replace("__list__", "").split("|");
    return `<ul>\n${items.map((i) => `  <li>${i}</li>`).join("\n")}\n</ul>`;
  }
  if (token.startsWith("__hero__")) {
    const b = JSON.parse(token.replace("__hero__", ""));
    return [
      `<section class="hero">`,
      `  <h1>${b.title}</h1>`,
      `  <p class="subtitle">${b.subtitle}</p>`,
      `  <p>${b.body}</p>`,
      `  <div class="cta-group">`,
      `    <a href="#" class="btn-primary">${b.cta}</a>`,
      `    <a href="#" class="btn-secondary">${b.secondary}</a>`,
      `  </div>`,
      `</section>`,
    ].join("\n");
  }
  if (token.startsWith("__card__")) {
    const b = JSON.parse(token.replace("__card__", ""));
    return [
      `<div class="card">`,
      `  <h3>${b.title}</h3>`,
      `  <p>${b.description}</p>`,
      `</div>`,
    ].join("\n");
  }
  if (token.startsWith("__testimonial__")) {
    const b = JSON.parse(token.replace("__testimonial__", ""));
    return [
      `<blockquote class="testimonial">`,
      `  <p>"${b.quote}"</p>`,
      `  <footer>`,
      `    <strong>${b.name}</strong>`,
      `    <span>${b.role}</span>`,
      `  </footer>`,
      `</blockquote>`,
    ].join("\n");
  }
  if (token.startsWith("__faq__")) {
    const b = JSON.parse(token.replace("__faq__", ""));
    return [
      `<div class="faq-item">`,
      `  <h3>${b.q}</h3>`,
      `  <p>${b.a}</p>`,
      `</div>`,
    ].join("\n");
  }
  if (token.startsWith("__product__")) {
    const b = JSON.parse(token.replace("__product__", ""));
    return [
      `<div class="product-card">`,
      b.badge ? `  <span class="badge">${b.badge}</span>` : "",
      `  <h2>${b.title}</h2>`,
      `  <p class="price">${b.price}</p>`,
      `  <p>${b.description}</p>`,
      `  <ul>`,
      ...b.features.map((f: string) => `    <li>${f}</li>`),
      `  </ul>`,
      `</div>`,
    ].filter(Boolean).join("\n");
  }
  if (token.startsWith("__about__")) {
    const paragraphs: string[] = JSON.parse(token.replace("__about__", ""));
    return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
  }
  if (token.startsWith("__onboarding__")) {
    const b = JSON.parse(token.replace("__onboarding__", ""));
    return [
      `<div class="step">`,
      `  <span class="step-number">${b.step}</span>`,
      `  <h3>${b.title}</h3>`,
      `  <p>${b.description}</p>`,
      `</div>`,
    ].join("\n");
  }
  if (token.startsWith("__pricing__")) {
    const b = JSON.parse(token.replace("__pricing__", ""));
    return [
      `<div class="pricing-card${b.highlighted ? " highlighted" : ""}">`,
      `  <h3>${b.name}</h3>`,
      `  <p class="price">${b.price} <small>${b.billing}</small></p>`,
      `  <p>${b.description}</p>`,
      `  <ul>`,
      ...b.features.map((f: string) => `    <li>${f}</li>`),
      `  </ul>`,
      `  <a href="#" class="btn">${b.cta}</a>`,
      `</div>`,
    ].join("\n");
  }

  return `<p>${token}</p>`;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generate(config: LoremConfig): GeneratedOutput {
  let tokens: string[] = [];

  switch (config.mode) {
    case "words": {
      const text = generateWords(config);
      return { plain: text, html: `<p>${text}</p>` };
    }
    case "sentences": {
      const sentences = generateSentences(config);
      const plain = sentences.join(" ");
      const html = `<p>${sentences.join(" ")}</p>`;
      return { plain, html };
    }
    case "paragraphs": {
      tokens = generateParagraphs(config);
      break;
    }
    case "structured": {
      tokens = generateStructured(config);
      break;
    }
  }

  const plain = tokens.map(tokenToPlain).join("\n\n");
  const html = tokens.map(tokenToHtml).join("\n\n");

  return { plain, html };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function computeStats(plain: string): LoremStats {
  const trimmed = plain.trim();
  if (!trimmed) return { words: 0, characters: 0, sentences: 0, paragraphs: 0, readingTimeSeconds: 0 };

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = trimmed.length;
  const sentences = (trimmed.match(/[.!?]+/g) ?? []).length;
  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean).length;
  // Average reading speed: 200 wpm
  const readingTimeSeconds = Math.max(1, Math.round((words / 200) * 60));

  return { words, characters, sentences, paragraphs, readingTimeSeconds };
}

export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s read`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} min read`;
}
