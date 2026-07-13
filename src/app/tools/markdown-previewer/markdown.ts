import DOMPurify from "dompurify";
import { MARKDOWN_INPUT_LIMIT } from "./presets";
import type {
  MarkdownAnalysis,
  MarkdownCheckSeverity,
  MarkdownHeading,
  MarkdownOptions,
  MarkdownProductionCheck,
  MarkdownRenderResult,
  MarkdownStats,
} from "./types";

const LINE_BREAK = /\r\n?/g;
const FENCED_CODE = /^```([\w-]*)\s*$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;
const RAW_HTML = /<\/?[a-z][^>]*>/i;
const UNSAFE_PROTOCOL = /(?:javascript|vbscript|data)\s*:/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function isSafeUrl(url: string): boolean {
  return !UNSAFE_PROTOCOL.test(url.trim());
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function slugifyHeading(value: string): string {
  const normalized = stripInlineMarkdown(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "section";
}

function createUniqueSlug(value: string, counts: Map<string, number>): string {
  const base = slugifyHeading(value);
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function parseInline(value: string, options: MarkdownOptions): string {
  const placeholders: string[] = [];
  const store = (html: string) => {
    const token = `\u0000MDTOKEN${placeholders.length}\u0000`;
    placeholders.push(html);
    return token;
  };

  let text = value;

  text = text.replace(/`([^`]+)`/g, (_match, code: string) => store(`<code>${escapeHtml(code)}</code>`));

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_match, alt: string, url: string, title?: string) => {
    if (!isSafeUrl(url)) return escapeHtml(alt);
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    return store(`<img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}" loading="lazy"${titleAttr}>`);
  });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_match, label: string, url: string, title?: string) => {
    if (!isSafeUrl(url)) return escapeHtml(label);
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    const targetAttrs = options.openLinksInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    return store(`<a href="${escapeAttribute(url)}"${titleAttr}${targetAttrs}>${escapeHtml(label)}</a>`);
  });

  text = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<![\w])__([^_]+)__(?![\w])/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/(?<![\w])_([^_]+)_(?![\w])/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  placeholders.forEach((html, index) => {
    text = text.replace(`\u0000MDTOKEN${index}\u0000`, html);
  });

  return text;
}

function splitTableRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(lines: string[], startIndex: number, options: MarkdownOptions): { html: string; nextIndex: number } | null {
  const header = lines[startIndex];
  const separator = lines[startIndex + 1];
  if (!header?.includes("|") || !separator || !TABLE_SEPARATOR.test(separator)) return null;

  const headers = splitTableRow(header);
  const separatorCells = splitTableRow(separator);
  const alignments = separatorCells.map((cell) => {
    const starts = cell.startsWith(":");
    const ends = cell.endsWith(":");
    if (starts && ends) return "center";
    if (ends) return "right";
    return "left";
  });
  const rows: string[][] = [];
  let index = startIndex + 2;

  while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
    rows.push(splitTableRow(lines[index]));
    index += 1;
  }

  const thead = `<thead><tr>${headers.map((cell, cellIndex) => `<th style="text-align:${alignments[cellIndex] ?? "left"}">${parseInline(cell, options)}</th>`).join("")}</tr></thead>`;
  const tbody = rows.length
    ? `<tbody>${rows.map((row) => `<tr>${headers.map((_header, cellIndex) => `<td style="text-align:${alignments[cellIndex] ?? "left"}">${parseInline(row[cellIndex] ?? "", options)}</td>`).join("")}</tr>`).join("")}</tbody>`
    : "";

  return { html: `<div class="markdown-table-wrap"><table>${thead}${tbody}</table></div>`, nextIndex: index };
}

function closeList(listType: "ul" | "ol" | null): string {
  return listType ? `</${listType}>` : "";
}

export function sanitizeRenderedHtml(html: string): string {
  if (typeof DOMPurify.sanitize !== "function") return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel", "loading", "checked", "disabled", "style", "id", "class"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "style"],
    ALLOW_DATA_ATTR: false,
  });
}

export function renderMarkdownToHtml(input: string, options: MarkdownOptions): MarkdownRenderResult {
  const warnings: string[] = [];
  const lines = input.replace(LINE_BREAK, "\n").split("\n");
  const html: string[] = [];
  const slugCounts = new Map<string, number>();
  let index = 0;
  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let blockquoteLines: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const content = paragraphLines.join(options.githubLineBreaks ? "<br>" : " ");
    html.push(`<p>${content}</p>`);
    paragraphLines = [];
  };

  const flushBlockquote = () => {
    if (!blockquoteLines.length) return;
    html.push(`<blockquote>${blockquoteLines.map((line) => `<p>${line}</p>`).join("")}</blockquote>`);
    blockquoteLines = [];
  };

  const ensureList = (nextType: "ul" | "ol") => {
    flushParagraph();
    flushBlockquote();
    if (listType !== nextType) {
      html.push(closeList(listType));
      listType = nextType;
      html.push(`<${nextType}>`);
    }
  };

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    const codeFence = rawLine.match(FENCED_CODE);

    if (inCode) {
      if (codeFence) {
        html.push(`<pre><code${codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : ""}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLanguage = "";
        codeLines = [];
      } else {
        codeLines.push(rawLine);
      }
      index += 1;
      continue;
    }

    if (codeFence) {
      flushParagraph();
      flushBlockquote();
      html.push(closeList(listType));
      listType = null;
      inCode = true;
      codeLanguage = codeFence[1] || "";
      index += 1;
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushBlockquote();
      html.push(closeList(listType));
      listType = null;
      index += 1;
      continue;
    }

    const table = renderTable(lines, index, options);
    if (table) {
      flushParagraph();
      flushBlockquote();
      html.push(closeList(listType));
      listType = null;
      html.push(table.html);
      index = table.nextIndex;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushBlockquote();
      html.push(closeList(listType));
      listType = null;
      const level = heading[1].length;
      const slug = createUniqueSlug(heading[2], slugCounts);
      html.push(`<h${level} id="${escapeAttribute(slug)}">${parseInline(heading[2], options)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      flushBlockquote();
      html.push(closeList(listType));
      listType = null;
      html.push("<hr>");
      index += 1;
      continue;
    }

    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      html.push(closeList(listType));
      listType = null;
      blockquoteLines.push(parseInline(quote[1], options));
      index += 1;
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      ensureList("ul");
      const task = unordered[1].match(/^\[([ xX])\]\s+(.+)$/);
      if (task) {
        const checked = task[1].toLowerCase() === "x";
        html.push(`<li class="markdown-task"><input type="checkbox" disabled${checked ? " checked" : ""}> <span>${parseInline(task[2], options)}</span></li>`);
      } else {
        html.push(`<li>${parseInline(unordered[1], options)}</li>`);
      }
      index += 1;
      continue;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      ensureList("ol");
      html.push(`<li>${parseInline(ordered[1], options)}</li>`);
      index += 1;
      continue;
    }

    html.push(closeList(listType));
    listType = null;
    flushBlockquote();
    paragraphLines.push(parseInline(trimmed, options));
    index += 1;
  }

  if (inCode) {
    warnings.push("A fenced code block was not closed. The preview closed it automatically.");
    html.push(`<pre><code${codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : ""}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  flushParagraph();
  flushBlockquote();
  html.push(closeList(listType));

  if (RAW_HTML.test(input)) {
    warnings.push("Raw HTML is shown as text. The preview accepts Markdown syntax only.");
  }

  const rawHtml = html.filter(Boolean).join("\n");
  return {
    html: rawHtml,
    sanitizedHtml: sanitizeRenderedHtml(rawHtml),
    warnings,
  };
}

export function extractMarkdownHeadings(input: string): MarkdownHeading[] {
  const counts = new Map<string, number>();
  const headings: MarkdownHeading[] = [];
  let inCode = false;
  input
    .replace(LINE_BREAK, "\n")
    .split("\n")
    .forEach((line, index) => {
      if (FENCED_CODE.test(line)) {
        inCode = !inCode;
        return;
      }
      if (inCode) return;
      const match = line.trim().match(/^(#{1,6})\s+(.+)$/);
      if (!match) return;
      const text = stripInlineMarkdown(match[2]);
      headings.push({ level: match[1].length, text, slug: createUniqueSlug(match[2], counts), line: index + 1 });
    });
  return headings;
}

export function getMarkdownStats(input: string): MarkdownStats {
  const words = input.trim() ? input.trim().split(/\s+/).filter(Boolean).length : 0;
  const imageMatches = input.match(/!\[[^\]]*\]\([^)]+\)/g) ?? [];
  const linkMatches = input.match(/(^|[^!])\[[^\]]+\]\([^)]+\)/gm) ?? [];
  const fenceCount = (input.match(/^```/gm) ?? []).length;

  return {
    words,
    characters: input.length,
    lines: input ? input.replace(LINE_BREAK, "\n").split("\n").length : 0,
    readingTimeMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 220)),
    headings: extractMarkdownHeadings(input).length,
    links: linkMatches.length,
    images: imageMatches.length,
    codeBlocks: Math.ceil(fenceCount / 2),
    tables: (input.match(/^\s*\|?.+\|.+\n\s*\|?\s*:?-{3,}:?/gm) ?? []).length,
    listItems: (input.match(/^\s*(?:[-*+] |\d+[.)] )/gm) ?? []).length,
  };
}

function severityPenalty(severity: MarkdownCheckSeverity): number {
  if (severity === "danger") return 25;
  if (severity === "warning") return 10;
  if (severity === "info") return 3;
  return 0;
}

export function buildMarkdownProductionChecks(input: string, headings = extractMarkdownHeadings(input)): MarkdownProductionCheck[] {
  const checks: MarkdownProductionCheck[] = [];
  const lines = input.replace(LINE_BREAK, "\n").split("\n");
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  const fenceLines = lines.filter((line) => /^```/.test(line.trim()));
  let fenceOpen = false;
  let unlabeledFenceOpenings = 0;
  for (const line of lines) {
    const fence = line.trim().match(FENCED_CODE);
    if (!fence) continue;
    if (!fenceOpen && !fence[1]) unlabeledFenceOpenings += 1;
    fenceOpen = !fenceOpen;
  }
  const duplicateHeadingNames = [...new Set(headings.map((heading) => heading.text.toLowerCase()).filter((text, index, all) => all.indexOf(text) !== index))];
  const longLines = lines.filter((line) => line.length > 180).length;
  const emptyImageAlt = (input.match(/!\[\s*\]\([^)]+\)/g) ?? []).length;
  const placeholderLinks = (input.match(/\]\((?:https?:\/\/)?(?:example\.com|localhost)(?:[/:][^)]*)?\)/gi) ?? []).length;
  const unsafeLinks = (input.match(/\]\(\s*(?:javascript|vbscript|data)\s*:[^)]*\)/gi) ?? []).length;

  if (!input.trim()) {
    checks.push({ id: "content", severity: "danger", title: "Document is empty", message: "Add Markdown content before exporting or publishing." });
  } else {
    checks.push({ id: "content", severity: "success", title: "Content ready", message: `${input.length.toLocaleString()} characters are available for preview and export.` });
  }

  if (h1Count === 1) {
    checks.push({ id: "h1", severity: "success", title: "Single document title", message: "The document has one H1, which provides a clear primary title." });
  } else if (h1Count === 0) {
    checks.push({ id: "h1", severity: "warning", title: "Missing H1 title", message: "Add one # heading so the document has a clear title and export filename context." });
  } else {
    checks.push({ id: "h1", severity: "warning", title: "Multiple H1 headings", message: `Found ${h1Count} H1 headings. Most documents should use one H1 and nest sections below it.` });
  }

  const headingJump = headings.find((heading, index) => index > 0 && heading.level > headings[index - 1].level + 1);
  checks.push(headingJump
    ? { id: "heading-order", severity: "warning", title: "Heading level skipped", message: `Line ${headingJump.line} jumps to H${headingJump.level}. Use sequential levels for a clearer outline.` }
    : { id: "heading-order", severity: "success", title: "Heading hierarchy", message: headings.length ? "Heading levels follow a readable sequence." : "Add headings when the document needs multiple sections." });

  checks.push(duplicateHeadingNames.length
    ? { id: "duplicate-headings", severity: "info", title: "Repeated heading labels", message: `Repeated: ${duplicateHeadingNames.slice(0, 3).join(", ")}. Unique labels make anchor links easier to understand.` }
    : { id: "duplicate-headings", severity: "success", title: "Unique section labels", message: "No repeated heading labels were detected." });

  checks.push(fenceLines.length % 2 === 0
    ? { id: "fences", severity: "success", title: "Code fences are balanced", message: fenceLines.length ? `${Math.floor(fenceLines.length / 2)} fenced code block(s) are closed.` : "No fenced code blocks require validation." }
    : { id: "fences", severity: "danger", title: "Unclosed code fence", message: "Close the final triple-backtick block before publishing." });

  if (fenceLines.length && unlabeledFenceOpenings) {
    checks.push({ id: "code-language", severity: "info", title: "Code language missing", message: `${unlabeledFenceOpenings} fenced code block(s) do not specify a language for syntax highlighting.` });
  } else {
    checks.push({ id: "code-language", severity: "success", title: "Code labels", message: fenceLines.length ? "Fenced examples include language labels." : "No code language labels are needed." });
  }

  if (unsafeLinks) {
    checks.push({ id: "unsafe-links", severity: "danger", title: "Unsafe link protocol", message: `${unsafeLinks} link(s) use a blocked data, JavaScript, or VBScript protocol. They are removed from the preview.` });
  } else if (placeholderLinks) {
    checks.push({ id: "unsafe-links", severity: "warning", title: "Placeholder links remain", message: `${placeholderLinks} example or localhost link(s) should be replaced before publishing.` });
  } else {
    checks.push({ id: "unsafe-links", severity: "success", title: "Link protocols", message: "No unsafe or obvious placeholder link targets were detected." });
  }

  checks.push(emptyImageAlt
    ? { id: "image-alt", severity: "warning", title: "Missing image alt text", message: `${emptyImageAlt} image(s) have empty alt text. Add a useful description unless the image is purely decorative.` }
    : { id: "image-alt", severity: "success", title: "Image descriptions", message: "No images with empty alt text were detected." });

  if (input.length > MARKDOWN_INPUT_LIMIT) {
    checks.push({ id: "size", severity: "danger", title: "Input limit exceeded", message: `Keep the document below ${MARKDOWN_INPUT_LIMIT.toLocaleString()} characters for reliable browser editing.` });
  } else if (input.length > MARKDOWN_INPUT_LIMIT * 0.8) {
    checks.push({ id: "size", severity: "warning", title: "Large document", message: "The document is close to the browser editor limit. Consider splitting it into focused pages." });
  } else if (longLines) {
    checks.push({ id: "size", severity: "info", title: "Long source lines", message: `${longLines} source line(s) exceed 180 characters and may be harder to review in diffs.` });
  } else {
    checks.push({ id: "size", severity: "success", title: "Editor size", message: "The document is within the recommended browser editing range." });
  }

  if (RAW_HTML.test(input)) {
    checks.push({ id: "raw-html", severity: "info", title: "Raw HTML detected", message: "Raw HTML is escaped and displayed as text; use supported Markdown syntax for portable output." });
  } else {
    checks.push({ id: "raw-html", severity: "success", title: "Portable Markdown", message: "No embedded raw HTML was detected." });
  }

  return checks;
}

export function analyzeMarkdown(input: string): MarkdownAnalysis {
  const headings = extractMarkdownHeadings(input);
  const checks = buildMarkdownProductionChecks(input, headings);
  const title = headings.find((heading) => heading.level === 1)?.text || headings[0]?.text || "Markdown document";
  const score = Math.max(0, Math.min(100, 100 - checks.reduce((total, check) => total + severityPenalty(check.severity), 0)));

  return {
    stats: getMarkdownStats(input),
    headings,
    checks,
    score,
    title,
  };
}

export function buildStandaloneHtml(renderedHtml: string, title: string): string {
  const safeTitle = escapeHtml(title || "Markdown document");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f6f7f9; color: #172033; }
    main { width: min(880px, calc(100% - 32px)); margin: 40px auto; padding: clamp(24px, 5vw, 56px); box-sizing: border-box; background: #fff; border: 1px solid #dfe3ea; border-radius: 18px; box-shadow: 0 18px 50px rgba(23, 32, 51, .08); }
    h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.6em 0 .65em; color: #101828; }
    h1 { margin-top: 0; font-size: clamp(2rem, 5vw, 3rem); }
    p, li { line-height: 1.75; }
    a { color: #7c3aed; }
    blockquote { margin: 1.5rem 0; padding: .75rem 1rem; border-left: 4px solid #8b5cf6; background: #f5f3ff; }
    code { padding: .15em .35em; border-radius: 5px; background: #f1f3f7; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    pre { overflow: auto; padding: 18px; border-radius: 12px; background: #111827; color: #f9fafb; }
    pre code { padding: 0; background: transparent; color: inherit; }
    .markdown-table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; border: 1px solid #dfe3ea; }
    th { background: #f6f7f9; }
    img { max-width: 100%; height: auto; border-radius: 10px; }
    .markdown-task { list-style: none; margin-left: -1.25rem; }
    @media (prefers-color-scheme: dark) {
      body { background: #0d1117; color: #d5d9e2; }
      main { background: #161b22; border-color: #30363d; box-shadow: none; }
      h1, h2, h3, h4, h5, h6 { color: #f0f3f6; }
      blockquote, th { background: #1f2530; }
      blockquote { border-left-color: #a78bfa; }
      code { background: #262c36; }
      th, td { border-color: #30363d; }
    }
  </style>
</head>
<body>
  <main>
${renderedHtml}
  </main>
</body>
</html>`;
}

export function buildMarkdownReport(input: string, rendered: MarkdownRenderResult, analysis: MarkdownAnalysis): string {
  return JSON.stringify({
    generatedBy: "Darma Markdown Previewer",
    title: analysis.title,
    summary: analysis.stats,
    qualityScore: analysis.score,
    headings: analysis.headings,
    productionChecks: analysis.checks,
    warnings: rendered.warnings,
    sourceCharacters: input.length,
    generatedHtmlCharacters: rendered.sanitizedHtml.length,
  }, null, 2);
}
