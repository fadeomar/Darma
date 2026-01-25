// src/features/projects/domain/preview/buildElementPreviewDoc.ts

type PreviewInput = {
  html?: string | null;
  css?: string | null;
  js?: string | null;
};

const DEFAULT_BASE_CSS = `
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #4545452b;
}
`;

/**
 * Builds a safe-ish, deterministic iframe srcDoc for element previews.
 * - Never returns undefined fields
 * - Wraps JS in try/catch so a runtime error doesn't break the entire preview
 * - Keeps CSS scoped to the iframe document
 */
export function buildElementPreviewDoc(input: PreviewInput): string {
  const html = input.html ?? "";
  const css = input.css ?? "";
  const js = input.js ?? "";

  // Prevent accidental </script> breakouts (common bug in srcDoc)
  const safeJs = js.replaceAll("</script>", "<\\/script>");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${DEFAULT_BASE_CSS}\n${css}</style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css">
</head>
<body>
  ${html}
  <script>
    // Keep preview resilient: avoid killing the whole iframe on runtime errors
    try {
      ${safeJs}
    } catch (e) {
      console.error("Element preview error:", e);
    }
  </script>
</body>
</html>`;
}
