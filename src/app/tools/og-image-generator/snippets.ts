import type { OgGeneratedAsset, OgImageInput } from "./types";

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function createHtmlMetaSnippet(input: OgImageInput, imagePath = "/opengraph-image.png") {
  const title = input.title.trim() || "Social preview title";
  const description = input.subtitle.trim() || "Social preview description";
  const siteUrl = input.siteUrl.trim() || "https://example.com";
  const alt = input.altText.trim() || title;
  return `<title>${escapeAttr(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:url" content="${escapeAttr(siteUrl)}">
<meta property="og:image" content="${escapeAttr(`${siteUrl.replace(/\/$/, "")}${imagePath}`)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeAttr(alt)}">
<meta name="twitter:card" content="${input.twitterCard}">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(description)}">
<meta name="twitter:image" content="${escapeAttr(`${siteUrl.replace(/\/$/, "")}${imagePath}`)}">
<meta name="twitter:image:alt" content="${escapeAttr(alt)}">
`;
}

export function createNextMetadataSnippet(input: OgImageInput) {
  const title = input.title.trim() || "Social preview title";
  const description = input.subtitle.trim() || "Social preview description";
  const siteUrl = input.siteUrl.trim() || "https://example.com";
  return `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  metadataBase: new URL(${JSON.stringify(siteUrl)}),
  openGraph: {
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},
    type: "website",
    url: ${JSON.stringify(siteUrl)},
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: ${JSON.stringify(input.altText.trim() || title)},
      },
    ],
  },
  twitter: {
    card: ${JSON.stringify(input.twitterCard)},
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},
    images: ["/twitter-image.png"],
  },
};
`;
}

export function createNextInstallGuide(input: OgImageInput) {
  return `# Next.js App Router install

Generated for: ${input.title || "Untitled preview"}

## Files

Place these files in your project:

\`\`\`txt
src/app/opengraph-image.png
src/app/twitter-image.png
\`\`\`

Next.js App Router can detect these route segment image files and expose them as social preview metadata.

## Optional metadata

Use \`metadata-snippet.ts\` if you want explicit title, description, and alt text metadata.

## Test

After deploy, paste your URL into social preview/debugger tools and refresh the cache if a platform still shows an old image.
`;
}

export function createSharePreviewHtml(input: OgImageInput) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
${createHtmlMetaSnippet(input).split("\n").map((line) => (line ? `    ${line}` : "")).join("\n")}
  </head>
  <body>
    <main style="font-family: system-ui, sans-serif; max-width: 760px; margin: 48px auto; line-height: 1.6;">
      <h1>${escapeAttr(input.title || "Social preview")}</h1>
      <p>${escapeAttr(input.subtitle || "Open this page in a social preview debugger to test generated metadata.")}</p>
      <img src="./opengraph-image.png" alt="${escapeAttr(input.altText || input.title)}" style="width: 100%; border-radius: 16px; border: 1px solid #ddd;">
    </main>
  </body>
</html>
`;
}

export function createReadme(input: OgImageInput, assets: OgGeneratedAsset[]) {
  const images = assets.filter((asset) => asset.kind === "image");
  return `# OG Image / Social Preview package

Generated locally by Darma.

## Summary

- Title: ${input.title || "Untitled"}
- Description: ${input.subtitle || "No description"}
- Export pack: ${input.exportPack}
- Images: ${images.length}
- Recommended primary image: opengraph-image.png, 1200×630

## Included files

${assets.map((asset) => `- \`${asset.filename}\`${asset.width && asset.height ? ` — ${asset.width}×${asset.height}` : ""}`).join("\n")}

## Install

For regular websites, copy the PNG files to your public assets folder and paste \`html-meta-tags.txt\` into the page head.

For Next.js App Router, use the Next.js export pack and place the files under \`src/app\` as generated.

## QA checklist

- Keep important text inside the safe area.
- Keep the title short enough to read on mobile cards.
- Use a 1200×630 image for broad compatibility.
- Add descriptive alt text for the preview image.
- Refresh social platform caches after deployment.
`;
}

export function createValidationChecklist(input: OgImageInput) {
  return `# Social preview QA checklist

- [ ] Title is under 90 characters: ${input.title.length}/90
- [ ] Description is under 200 characters: ${input.subtitle.length}/200
- [ ] Primary OG image is 1200×630
- [ ] Text stays inside the safe area
- [ ] Contrast is readable on small previews
- [ ] HTML meta tags use absolute image URLs
- [ ] Twitter card type is ${input.twitterCard}
- [ ] Alt text exists: ${input.altText.trim() ? "yes" : "no"}
- [ ] Deployed image URL returns HTTP 200
- [ ] Social cache was refreshed after deploy
`;
}

export function createAssetManifest(assets: OgGeneratedAsset[]) {
  return `${JSON.stringify({
    generated_at: new Date().toISOString(),
    files: assets.map((asset) => ({ filename: asset.filename, type: asset.mimeType, size: asset.size, width: asset.width, height: asset.height })),
  }, null, 2)}\n`;
}
