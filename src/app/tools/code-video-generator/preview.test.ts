import { describe, expect, it } from "vitest";
import { buildPreviewDocument } from "./preview";

const baseProject = {
  title: "Preview",
  css: "body { color: red; }",
  js: "document.body.dataset.ready = 'true';",
};

describe("code video preview document", () => {
  it("normalizes a complete HTML document without nesting it inside body", () => {
    const document = buildPreviewDocument({
      ...baseProject,
      html: `<!doctype html>
<html lang="ar">
<head>
  <title>Demo</title>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="https://fonts.example/font.css">
  <script src="script.js"></script>
  <script type="application/ld+json">{"name":"Demo"}</script>
</head>
<body class="demo">
  <main>Hello</main>
  <script>window.inlineRan = true;</script>
</body>
</html>`,
    });

    expect(document.match(/<html\b/gi)).toHaveLength(1);
    expect(document.match(/<body\b/gi)).toHaveLength(1);
    expect(document).toContain('<html lang="ar">');
    expect(document).toContain('<body class="demo">');
    expect(document).not.toContain('href="style.css"');
    expect(document).toContain('href="https://fonts.example/font.css"');
    expect(document).not.toContain('src="script.js"');
    expect(document).not.toContain("window.inlineRan");
    expect(document).toContain('type="application/ld+json"');
    expect(document).toContain('data-darma-source="style.css"');
    expect(document).toContain('data-darma-source="script.js"');
  });

  it("wraps an HTML fragment as a valid preview document", () => {
    const document = buildPreviewDocument({ ...baseProject, html: "<main>Hello</main>" });
    expect(document).toContain("<!doctype html>");
    expect(document).toContain('<html lang="en">');
    expect(document).toContain("<main>Hello</main>");
  });
});
