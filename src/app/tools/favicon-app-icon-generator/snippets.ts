import { createManifest, joinPath, manifestToJson } from "./manifest";
import type { FaviconInput } from "./types";

export function createHtmlHeadSnippet(input: FaviconInput): string {
  if (input.exportPack === "nextjs") {
    return `<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${input.themeColor}">`;
  }

  if (input.exportPack === "pwa") {
    return `<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="${input.themeColor}">`;
  }

  const prefix = input.pathPrefix;
  return `<link rel="icon" href="${joinPath(prefix, "favicon.ico")}" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${joinPath(prefix, "favicon-32x32.png")}">
<link rel="icon" type="image/png" sizes="48x48" href="${joinPath(prefix, "favicon-48x48.png")}">
<link rel="apple-touch-icon" href="${joinPath(prefix, "apple-touch-icon.png")}">
<link rel="manifest" href="${joinPath(prefix, "site.webmanifest")}">
<meta name="theme-color" content="${input.themeColor}">`;
}

export function createNextJsSnippet(input: FaviconInput): string {
  return `# Next.js App Router favicon setup

Place the generated files like this:

src/app/favicon.ico
src/app/icon.png
src/app/apple-icon.png
public/site.webmanifest

Next.js App Router can automatically detect app/favicon.ico, app/icon.png, and app/apple-icon.png.
For the manifest, add this to your metadata or layout head if your project does not already link it:

<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="${input.themeColor}" />

Recommended exported mapping:
- favicon.ico -> src/app/favicon.ico
- android-chrome-512x512.png -> src/app/icon.png
- apple-touch-icon.png -> src/app/apple-icon.png
- site.webmanifest -> public/site.webmanifest
`;
}

export function createInstallReadme(input: FaviconInput): string {
  return `# Favicon & App Icon Package

Generated locally by Darma Favicon & App Icon Generator.

## Standard HTML

Copy the icon files to your public root and paste this in your HTML head:

\`\`\`html
${createHtmlHeadSnippet(input)}
\`\`\`

## Web App Manifest

\`\`\`json
${manifestToJson(createManifest(input)).trim()}
\`\`\`

## Next.js App Router

\`\`\`txt
${createNextJsSnippet(input).trim()}
\`\`\`

## Notes

- Keep favicon filenames stable so browsers and search engines can cache them correctly.
- Test the 16x16 favicon visually; tiny icons need high contrast and simple shapes.
- For PWA installs, prefer a non-transparent background and include 192x192 and 512x512 icons.
- Maskable icons include extra padding because launchers may crop the outer edge.
`;
}

export function createValidatorGuide(): string {
  return `# Favicon validation checklist

Use this checklist after uploading the package to your project:

- HTML references favicon.ico, favicon-32x32.png, apple-touch-icon.png, and site.webmanifest.
- site.webmanifest is valid JSON.
- Manifest icons include 192x192 and 512x512 PNG files.
- Maskable icons keep important artwork inside the safe center area.
- Favicon is square and still readable at 16x16.
- The browser can reach the icon URLs without redirects or blocked assets.
- If using Next.js App Router, app/favicon.ico, app/icon.png, and app/apple-icon.png exist.
`;
}
