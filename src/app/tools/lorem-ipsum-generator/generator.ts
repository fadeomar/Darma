import type {
  LoremConfig,
  GeneratedOutput,
  LoremStats,
  TextStyle,
  BlockLength,
  LoremCheck,
  LoremReport,
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

type RandomSource = () => number;

export function createSeededRandom(seed: string): RandomSource {
  let hash = 2166136261;
  const normalized = seed.trim() || "darma-placeholder";
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], random: RandomSource): T {
  return arr[Math.floor(random() * arr.length)];
}

function shuffle<T>(arr: T[], random: RandomSource): T[] {
  const copy = [...arr];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function randInt(min: number, max: number, random: RandomSource): number {
  return Math.floor(random() * (max - min + 1)) + min;
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

function generateWords(config: LoremConfig, random: RandomSource): string {
  const pool = getWordPool(config.style);
  const shuffled = shuffle(pool, random);
  const words: string[] = [];

  while (words.length < config.amount) {
    words.push(...shuffled);
  }

  const result = words.slice(0, config.amount).join(" ");
  return capitalize(result);
}

// ─── Sentence generation ──────────────────────────────────────────────────────

function generateSentences(config: LoremConfig, random: RandomSource): string[] {
  const pool = getSentencePool(config.style);
  const sentences: string[] = [];
  const shuffled = shuffle(pool, random);

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

function buildParagraph(style: TextStyle, len: BlockLength, startWithLorem: boolean, isFirst: boolean, random: RandomSource): string {
  const pool = getSentencePool(style);
  const [min, max] = sentencesPerParagraph(len);
  const count = randInt(min, max, random);
  const shuffled = shuffle(pool, random);
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

function generateParagraphs(config: LoremConfig, random: RandomSource): string[] {
  const paragraphs: string[] = [];
  const headings = shuffle([...SECTION_HEADINGS[config.style]], random);
  const listItems = LIST_ITEMS[config.style];
  let headingIdx = 0;
  let nextHeadingAt = randInt(2, 3, random);

  for (let i = 0; i < config.amount; i++) {
    const isFirst = i === 0;

    // Optional heading every 2-3 paragraphs
    if (config.includeHeadings && i === nextHeadingAt) {
      const heading = headings[headingIdx % headings.length];
      headingIdx += 1;
      paragraphs.push(`__heading__${heading}`);
      nextHeadingAt += randInt(2, 3, random);
    }

    paragraphs.push(buildParagraph(config.style, config.blockLength, config.startWithLorem, isFirst, random));

    // Optional list after every 3rd paragraph
    if (config.includeLists && i > 0 && i % 3 === 0) {
      paragraphs.push(`__list__${listItems.join("|")}`);
    }
  }

  return paragraphs;
}

// ─── Structured block generation ─────────────────────────────────────────────

function generateStructured(config: LoremConfig, random: RandomSource): string[] {
  const { structuredBlock, amount } = config;

  switch (structuredBlock) {
    case "hero": {
      return shuffle(HERO_BLOCKS, random).slice(0, Math.min(amount, HERO_BLOCKS.length)).map((b) =>
        `__hero__${JSON.stringify(b)}`
      );
    }
    case "card": {
      return shuffle(CARD_BLOCKS, random).slice(0, Math.min(amount, CARD_BLOCKS.length)).map((b) =>
        `__card__${JSON.stringify(b)}`
      );
    }
    case "testimonial": {
      return shuffle(TESTIMONIAL_BLOCKS, random).slice(0, Math.min(amount, TESTIMONIAL_BLOCKS.length)).map((b) =>
        `__testimonial__${JSON.stringify(b)}`
      );
    }
    case "faq": {
      return shuffle(FAQ_BLOCKS, random).slice(0, Math.min(amount, FAQ_BLOCKS.length)).map((b) =>
        `__faq__${JSON.stringify(b)}`
      );
    }
    case "product": {
      return shuffle(PRODUCT_BLOCKS, random).slice(0, Math.min(amount, PRODUCT_BLOCKS.length)).map((b) =>
        `__product__${JSON.stringify(b)}`
      );
    }
    case "about": {
      const block = pick(ABOUT_BLOCKS, random);
      return [`__about__${JSON.stringify(block)}`];
    }
    case "onboarding": {
      return ONBOARDING_BLOCKS.slice(0, Math.min(amount, ONBOARDING_BLOCKS.length)).map((b) =>
        `__onboarding__${JSON.stringify(b)}`
      );
    }
    case "pricing": {
      return shuffle(PRICING_BLOCKS, random).slice(0, Math.min(amount, PRICING_BLOCKS.length)).map((b) =>
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
  const random = createSeededRandom(config.seed);

  switch (config.mode) {
    case "words": {
      const text = generateWords(config, random);
      return { plain: text, html: `<p>${text}</p>` };
    }
    case "sentences": {
      const sentences = generateSentences(config, random);
      const plain = sentences.join(" ");
      const html = `<p>${sentences.join(" ")}</p>`;
      return { plain, html };
    }
    case "paragraphs": {
      tokens = generateParagraphs(config, random);
      break;
    }
    case "structured": {
      tokens = generateStructured(config, random);
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
  if (!trimmed) {
    return { words: 0, characters: 0, sentences: 0, paragraphs: 0, readingTimeSeconds: 0, bytes: 0, blocks: 0, uniqueWordRatio: 0 };
  }

  const wordsList = trimmed.match(/[\p{L}\p{N}’'-]+/gu) ?? [];
  const words = wordsList.length;
  const characters = trimmed.length;
  const sentences = (trimmed.match(/[.!?]+(?=\s|$)/g) ?? []).length || (words > 0 ? 1 : 0);
  const blocks = trimmed.split(/\n\s*\n+/).filter(Boolean);
  const paragraphs = blocks.length;
  const readingTimeSeconds = Math.max(1, Math.round((words / 200) * 60));
  const uniqueWords = new Set(wordsList.map((word) => word.toLocaleLowerCase()));

  return {
    words,
    characters,
    sentences,
    paragraphs,
    readingTimeSeconds,
    bytes: new TextEncoder().encode(trimmed).length,
    blocks: blocks.length,
    uniqueWordRatio: words === 0 ? 0 : uniqueWords.size / words,
  };
}

export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s read`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} min read`;
}

function duplicateBlockCount(plain: string): number {
  const blocks = plain
    .split(/\n\s*\n+/)
    .map((block) => block.trim().toLocaleLowerCase())
    .filter(Boolean);
  return blocks.length - new Set(blocks).size;
}

export function buildProductionChecks(config: LoremConfig, output: GeneratedOutput, stats = computeStats(output.plain)): LoremCheck[] {
  const checks: LoremCheck[] = [];

  checks.push({
    id: "seed",
    level: config.seed.trim() ? "success" : "warning",
    title: config.seed.trim() ? "Reproducible seed" : "Fallback seed in use",
    message: config.seed.trim()
      ? `Using seed “${config.seed.trim()}”. Reusing it recreates the same output.`
      : "Add a named seed when the same placeholder content must be regenerated later.",
  });

  if (!output.plain.trim()) {
    checks.push({ id: "empty", level: "danger", title: "No output generated", message: "Increase the amount or choose another content block." });
  } else {
    checks.push({ id: "output", level: "success", title: "Output generated", message: `${stats.words} words across ${stats.blocks} content block${stats.blocks === 1 ? "" : "s"}.` });
  }

  if (stats.words > 1200) {
    checks.push({ id: "large", level: "warning", title: "Large placeholder payload", message: "This output exceeds 1,200 words and may hide layout or performance issues during review." });
  } else {
    checks.push({ id: "large", level: "success", title: "Practical preview size", message: "The generated payload is compact enough for normal mockup and component testing." });
  }

  const duplicateBlocks = duplicateBlockCount(output.plain);
  checks.push({
    id: "duplicates",
    level: duplicateBlocks > 0 ? "warning" : "success",
    title: duplicateBlocks > 0 ? "Repeated blocks detected" : "No exact block duplicates",
    message: duplicateBlocks > 0 ? `${duplicateBlocks} generated block${duplicateBlocks === 1 ? " is" : "s are"} repeated exactly.` : "Each generated block is unique within this output.",
  });

  if (output.html.includes('href="#"')) {
    checks.push({ id: "links", level: "warning", title: "Placeholder links present", message: 'Replace href="#" values before using the HTML in an interactive prototype.' });
  }

  if (config.startWithLorem && config.style !== "classic") {
    checks.push({ id: "opening", level: "info", title: "Classic opening is inactive", message: "“Start with Lorem ipsum” only affects the Classic Latin style." });
  }

  if (config.mode !== "paragraphs" && (config.includeHeadings || config.includeLists)) {
    checks.push({ id: "inactive-options", level: "info", title: "Paragraph options are inactive", message: "Headings and lists are applied only in Paragraphs mode." });
  }

  checks.push({
    id: "placeholder",
    level: "info",
    title: "Replace before publishing",
    message: "Generated copy is intended for layout testing, not production content or factual claims.",
  });

  return checks;
}

export function buildLoremReport(config: LoremConfig, output: GeneratedOutput, generatedAt = new Date().toISOString()): LoremReport {
  const stats = computeStats(output.plain);
  return {
    generatedAt,
    config,
    stats,
    checks: buildProductionChecks(config, output, stats),
    outputs: {
      plainCharacters: output.plain.length,
      htmlCharacters: output.html.length,
      hasPlaceholderLinks: output.html.includes('href="#"'),
    },
  };
}

export function buildPreviewDocument(html: string, title = "Placeholder content preview"): string {
  const safeTitle = title.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #fffdf8; color: #1d1a17; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: clamp(20px, 4vw, 38px); line-height: 1.68; background: #fffdf8; color: #1d1a17; }
    main { max-width: 820px; margin: 0 auto; display: grid; gap: 20px; }
    h1, h2, h3, p { margin-top: 0; }
    h1, h2, h3 { color: #1d1a17; text-wrap: balance; }
    h1 { font-family: Georgia, 'Times New Roman', serif; font-size: clamp(2rem, 6vw, 4rem); line-height: 1.04; letter-spacing: -0.04em; }
    h2 { margin-top: 24px; font-family: Georgia, 'Times New Roman', serif; font-size: 1.65rem; line-height: 1.15; }
    h3 { font-size: 1.05rem; }
    p, li { color: #5d5750; }
    p { max-width: 72ch; }
    ul { padding-left: 1.25rem; }
    a { color: inherit; }
    .hero, .card, .product-card, .pricing-card, .faq-item, .step, .testimonial { border: 1px solid #e1d8cc; border-radius: 18px; background: #fff; padding: 24px; box-shadow: 0 14px 34px rgba(36, 28, 21, .08); }
    .hero { padding: clamp(30px, 7vw, 66px); background: linear-gradient(135deg, rgba(204, 71, 21, .07), transparent 48%), #fff; }
    .subtitle, .price { color: #a63b13; font-weight: 750; }
    .cta-group { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
    .btn-primary, .btn-secondary, .btn { display: inline-flex; align-items: center; min-height: 42px; border-radius: 10px; padding: 10px 16px; text-decoration: none; font-weight: 750; }
    .btn-primary, .btn { background: #cc4715; color: white; }
    .btn-secondary { border: 1px solid #e1d8cc; background: #f7f2ea; color: #6d2b12; }
    .badge { display: inline-flex; border-radius: 999px; background: #fbe9df; color: #8f3210; padding: 5px 10px; font-size: 12px; font-weight: 750; }
    blockquote { margin: 0; }
    footer { display: grid; gap: 2px; margin-top: 16px; }
    @media (max-width: 520px) { body { padding: 16px; } .hero, .card, .product-card, .pricing-card, .faq-item, .step, .testimonial { padding: 18px; border-radius: 14px; } }
  </style>
</head>
<body>
  <main>${html}</main>
</body>
</html>`;
}

export function buildReactStarter(output: GeneratedOutput): string {
  const content = JSON.stringify(output.plain);
  return `export default function PlaceholderContent() {
  const content = ${content};

  return (
    <section aria-label="Placeholder content" style={{ whiteSpace: "pre-wrap" }}>
      {content}
    </section>
  );
}
`;
}

export function buildBlocksCsv(output: GeneratedOutput): string {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = output.plain.split(/\n\s*\n+/).map((block, index) => [String(index + 1), String(computeStats(block).words), block.trim()]);
  return [["block", "words", "content"], ...rows].map((row) => row.map(quote).join(",")).join("\n");
}

export function buildMarkdownReport(report: LoremReport): string {
  const warningCount = report.checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  return `# Placeholder content report

- Generated: ${report.generatedAt}
- Mode: ${report.config.mode}
- Style: ${report.config.style}
- Seed: ${report.config.seed || "(fallback)"}
- Words: ${report.stats.words}
- Characters: ${report.stats.characters}
- Blocks: ${report.stats.blocks}
- Reading time: ${formatReadingTime(report.stats.readingTimeSeconds)}
- Review items: ${warningCount}

## Production checks

${report.checks.map((check) => `- **${check.title}** (${check.level}): ${check.message}`).join("\n")}
`;
}
