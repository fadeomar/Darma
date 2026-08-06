import type { CodeVideoProject } from "./timeline";

function getAttribute(tagAttributes: string, name: string) {
  const match = tagAttributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2]?.trim() ?? "";
}

function isExecutableScript(attributes: string) {
  const type = getAttribute(attributes, "type").toLowerCase();
  if (!type) return true;
  return type === "module" || /^(?:text|application)\/(?:javascript|ecmascript)$/.test(type);
}

function stripExecutableScripts(source: string) {
  return source.replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, (tag, attributes: string) =>
    isExecutableScript(attributes) ? "" : tag,
  );
}

function stripLocalStylesheetLinks(source: string) {
  return source.replace(/<link\b([^>]*)>/gi, (tag, attributes: string) => {
    const rel = getAttribute(attributes, "rel").toLowerCase().split(/\s+/);
    if (!rel.includes("stylesheet")) return tag;

    const href = getAttribute(attributes, "href");
    if (!href || /^(?:https?:|data:|blob:|\/\/)/i.test(href)) return tag;
    return "";
  });
}

function cleanDocumentSection(source: string) {
  return stripLocalStylesheetLinks(stripExecutableScripts(source));
}

function escapeInlineCss(source: string) {
  return source.replace(/<\/style/gi, "<\\/style");
}

function escapeInlineJavaScript(source: string) {
  return source.replace(/<\/script/gi, "<\\/script");
}

function parseHtmlDocument(source: string) {
  const html = source.replace(/^\uFEFF/, "");
  const doctype = html.match(/<!doctype[^>]*>/i)?.[0] ?? "<!doctype html>";
  const htmlAttributes = html.match(/<html\b([^>]*)>/i)?.[1]?.trim() ?? "";
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
  const bodyMatch = html.match(/<body\b([^>]*)>([\s\S]*?)<\/body\s*>/i);

  let body = bodyMatch?.[2] ?? html;
  if (!bodyMatch) {
    body = body
      .replace(/<!doctype[^>]*>/gi, "")
      .replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, "")
      .replace(/<\/?html\b[^>]*>/gi, "")
      .replace(/<\/?body\b[^>]*>/gi, "");
  }

  return {
    doctype,
    htmlAttributes,
    head: headMatch?.[1] ?? "",
    bodyAttributes: bodyMatch?.[1]?.trim() ?? "",
    body,
  };
}

export function buildPreviewDocument(project: CodeVideoProject) {
  const parsed = parseHtmlDocument(project.html);
  const htmlAttributes = parsed.htmlAttributes || 'lang="en"';
  const bodyAttributes = parsed.bodyAttributes ? ` ${parsed.bodyAttributes}` : "";
  const head = cleanDocumentSection(parsed.head);
  const body = cleanDocumentSection(parsed.body);
  const css = escapeInlineCss(project.css);
  const js = escapeInlineJavaScript(project.js);
  const script = js.trim()
    ? `<script data-darma-source="script.js">try {\n${js}\n} catch (error) { console.warn("Darma preview", error); }<\/script>`
    : "";

  return `${parsed.doctype}
<html ${htmlAttributes}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${head}
<style data-darma-source="style.css">html,body{min-height:100%}\n${css}</style>
</head>
<body${bodyAttributes}>
${body}
${script}
</body>
</html>`;
}
