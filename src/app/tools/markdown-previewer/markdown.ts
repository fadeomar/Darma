import DOMPurify from "dompurify";
import type { MarkdownOptions, MarkdownRenderResult, MarkdownStats } from "./types";

const LINE_BREAK = /\r\n?/g;
const FENCED_CODE = /^```([\w-]*)\s*$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

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
  const trimmed = url.trim().toLowerCase();
  return !trimmed.startsWith("javascript:") && !trimmed.startsWith("data:") && !trimmed.startsWith("vbscript:");
}

function parseInline(value: string, options: MarkdownOptions): string {
  let text = escapeHtml(value);
  const codePlaceholders: string[] = [];

  text = text.replace(/`([^`]+)`/g, (_, code: string) => {
    const token = `@@CODE_${codePlaceholders.length}@@`;
    codePlaceholders.push(`<code>${code}</code>`);
    return token;
  });

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_match, alt: string, url: string, title?: string) => {
    if (!isSafeUrl(url)) return alt;
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    return `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}"${titleAttr}>`;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_match, label: string, url: string, title?: string) => {
    if (!isSafeUrl(url)) return label;
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    const targetAttrs = options.openLinksInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${escapeAttribute(url)}"${titleAttr}${targetAttrs}>${label}</a>`;
  });

  text = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  codePlaceholders.forEach((html, index) => {
    text = text.replace(`@@CODE_${index}@@`, html);
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
  const rows: string[][] = [];
  let index = startIndex + 2;

  while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
    rows.push(splitTableRow(lines[index]));
    index += 1;
  }

  const thead = `<thead><tr>${headers.map((cell) => `<th>${parseInline(cell, options)}</th>`).join("")}</tr></thead>`;
  const tbody = rows.length
    ? `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${parseInline(cell, options)}</td>`).join("")}</tr>`).join("")}</tbody>`
    : "";

  return { html: `<table>${thead}${tbody}</table>`, nextIndex: index };
}

function closeList(listType: "ul" | "ol" | null): string {
  return listType ? `</${listType}>` : "";
}

export function sanitizeRenderedHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}

export function renderMarkdownToHtml(input: string, options: MarkdownOptions): MarkdownRenderResult {
  const warnings: string[] = [];
  const lines = input.replace(LINE_BREAK, "\n").split("\n");
  const html: string[] = [];
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
      html.push(`<h${level}>${parseInline(heading[2], options)}</h${level}>`);
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
      html.push(`<li>${parseInline(unordered[1], options)}</li>`);
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

  const rawHtml = html.filter(Boolean).join("\n");
  return {
    html: rawHtml,
    sanitizedHtml: options.sanitizeHtml ? sanitizeRenderedHtml(rawHtml) : rawHtml,
    warnings,
  };
}

export function getMarkdownStats(input: string): MarkdownStats {
  const words = input.trim() ? input.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 220));

  return {
    words,
    characters: input.length,
    readingTimeMinutes,
  };
}
