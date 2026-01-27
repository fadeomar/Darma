type BuildIframeDocArgs = {
  html?: string | null;
  css?: string | null;
  js?: string | null;
};

/**
 * Builds a complete HTML document for iframe srcDoc.
 * - Keeps defaults minimal and predictable
 * - Escapes </script> to avoid breaking the document
 */
export function buildIframeDoc({ html, css, js }: BuildIframeDocArgs) {
  const safeHtml = html ?? "";
  const safeCss = css ?? "";
  const safeJs = (js ?? "").replace(/<\/script>/gi, "<\\/script>");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50dvh;
      width: 100%;
      position: relative;
    }
    ${safeCss}
  </style>
</head>
<body>
  ${safeHtml}
  <script>${safeJs}<\/script>
</body>
</html>
`.trim();
}
