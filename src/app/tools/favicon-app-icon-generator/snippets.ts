import { PROJECT_PROFILES, PWA_ICON_SIZES } from "./presets";
import { createManifest, joinPath, manifestToJson } from "./manifest";
import type { FaviconInput } from "./types";

function selectedProject(input: FaviconInput) {
  return PROJECT_PROFILES.find((profile) => profile.id === input.projectProfile) ?? PROJECT_PROFILES[0];
}

function manifestFileName(input: FaviconInput) {
  return input.exportPack === "pwa" || input.projectProfile === "pwa-complete" ? "manifest.webmanifest" : "site.webmanifest";
}

function createPwaManifestObject(input: FaviconInput) {
  const icons = PWA_ICON_SIZES.map((size) => ({
    src: joinPath("/icons/", `icon-${size}x${size}.png`),
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose: "any",
  }));

  if (input.includeMaskable) {
    icons.push(
      { src: joinPath("/icons/", "maskable-icon-192x192.png"), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: joinPath("/icons/", "maskable-icon-512x512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    );
  }

  if (input.includeMonochrome) {
    icons.push({ src: joinPath("/icons/", "monochrome-icon-512x512.png"), sizes: "512x512", type: "image/png", purpose: "monochrome" });
  }

  return {
    name: input.siteName.trim() || "My App",
    short_name: input.shortName.trim() || "App",
    icons,
    theme_color: input.themeColor,
    background_color: input.manifestBackgroundColor,
    display: input.display,
    orientation: input.orientation,
  };
}

export function createManifestSnippet(input: FaviconInput): string {
  if (input.exportPack === "pwa" || input.projectProfile === "pwa-complete") {
    return `${JSON.stringify(createPwaManifestObject(input), null, 2)}\n`;
  }

  if (input.exportPack === "nextjs" || input.projectProfile === "next-app") {
    return manifestToJson(createManifest(input, { iconBasePath: "/" }));
  }

  return manifestToJson(createManifest(input));
}

export function createStandardHtmlHeadSnippet(input: FaviconInput): string {
  const prefix = input.pathPrefix;
  return `<link rel="icon" href="${joinPath(prefix, "favicon.ico")}" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${joinPath(prefix, "favicon-32x32.png")}">
<link rel="icon" type="image/png" sizes="48x48" href="${joinPath(prefix, "favicon-48x48.png")}">
<link rel="apple-touch-icon" href="${joinPath(prefix, "apple-touch-icon.png")}">
<link rel="manifest" href="${joinPath(prefix, manifestFileName(input))}">
<meta name="theme-color" content="${input.themeColor}">`;
}

export function createHtmlHeadSnippet(input: FaviconInput): string {
  if (input.exportPack === "nextjs" || input.projectProfile === "next-app") {
    return `<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${input.themeColor}">`;
  }

  if (input.exportPack === "pwa" || input.projectProfile === "pwa-complete") {
    return `<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="${input.themeColor}">`;
  }

  return createStandardHtmlHeadSnippet(input);
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

export function createProjectInstallSnippet(input: FaviconInput): string {
  switch (input.projectProfile) {
    case "next-app":
      return createNextJsSnippet(input);
    case "next-pages":
      return `# Next.js Pages Router favicon setup

Copy the generated files into your public folder:

public/favicon.ico
public/favicon-32x32.png
public/favicon-48x48.png
public/apple-touch-icon.png
public/site.webmanifest

Add this to pages/_document.tsx, pages/_app.tsx with next/head, or your shared Head component:

${createStandardHtmlHeadSnippet({ ...input, pathPrefix: "/" })}

Notes:
- Keep the files in public so they are served from the site root.
- If your app already has a Head component, paste the links there instead of duplicating them per page.
`;
    case "vite-react":
      return `# React / Vite favicon setup

Copy the generated files into:

public/

Then paste this inside index.html before </head>:

${createStandardHtmlHeadSnippet({ ...input, pathPrefix: "/" })}

If your app is deployed under a subpath, adjust the path prefix before exporting or update the href values manually.
`;
    case "astro":
      return `# Astro favicon setup

Copy the generated files into:

public/

Add the links to your BaseHead.astro, Layout.astro, or shared head component:

${createStandardHtmlHeadSnippet({ ...input, pathPrefix: "/" })}

Astro serves public files from the site root, so public/favicon.ico becomes /favicon.ico.
`;
    case "nuxt":
      return `# Nuxt favicon setup

Copy the generated files into:

public/

Use one of these approaches:

1. Add the links in app.vue with useHead().
2. Add them to nuxt.config app.head.link.
3. Paste equivalent tags in your layout head if your project uses a custom structure.

Head links:

${createStandardHtmlHeadSnippet({ ...input, pathPrefix: "/" })}

Keep site.webmanifest in public so it is available at /site.webmanifest.
`;
    case "sveltekit":
      return `# SvelteKit favicon setup

Copy the generated files into:

static/

Then add this to src/app.html inside the <head> element:

${createStandardHtmlHeadSnippet({ ...input, pathPrefix: "/" })}

SvelteKit serves static files from the root path, so static/favicon.ico becomes /favicon.ico.
`;
    case "wordpress":
      return `# WordPress favicon setup

Recommended safe approach:
1. Open Appearance > Customize > Site Identity.
2. Upload apple-touch-icon.png or a 512x512 generated icon as the Site Icon.
3. Use the generated package only when your theme/plugin needs manual favicon links.

Manual theme approach for developers:
Paste this in your theme head output, preferably through wp_head hooks or a child theme, not by editing a parent theme directly:

${createStandardHtmlHeadSnippet({ ...input, pathPrefix: input.pathPrefix || "/" })}

Warnings:
- Do not edit a parent theme directly because updates can overwrite your changes.
- If a SEO/cache plugin already manages favicons, avoid duplicate tags.
`;
    case "pwa-complete":
      return `# PWA complete favicon setup

Copy the generated package into your public folder and keep the icons directory intact:

public/icons/
public/manifest.webmanifest
public/apple-touch-icon.png

Add this to your HTML head or app layout:

<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="${input.themeColor}">

Then verify in browser DevTools > Application > Manifest:
- 192x192 icon detected
- 512x512 icon detected
- maskable icon detected when enabled
- name and short_name are correct
`;
    case "legacy-full":
      return `# Legacy full support favicon setup

Upload all generated root files and legacy fallbacks, including:

favicon.ico
favicon-16x16.png
favicon-32x32.png
favicon-48x48.png
apple-touch-icon.png
browserconfig.xml
mstile-150x150.png
site.webmanifest

Paste the generated HTML head snippet:

${createStandardHtmlHeadSnippet(input)}

Use this profile when you need broad fallback coverage for older browsers, Apple shortcuts, Microsoft tiles, and classic favicon behavior.
`;
    case "plain-html":
    default:
      return `# Plain HTML favicon setup

Copy the generated files to your public web root or configured assets folder.

Paste this inside the <head> element of your HTML document:

${createStandardHtmlHeadSnippet(input)}

Recommended upload checklist:
- favicon.ico
- favicon-32x32.png
- favicon-48x48.png
- apple-touch-icon.png
- site.webmanifest
- android-chrome-192x192.png
- android-chrome-512x512.png

If your files live in a subfolder, set the Path prefix before exporting.
`;
  }
}

export function createProjectProfileSummary(input: FaviconInput): string {
  const project = selectedProject(input);
  return `## Selected project setup

**Project type:** ${project.title}  
**Target folder:** ${project.targetFolder}  
**Recommended export pack:** ${project.recommendedPack}

${project.description}

\`\`\`txt
${createProjectInstallSnippet(input).trim()}
\`\`\`
`;
}

export function createInstallReadme(input: FaviconInput): string {
  return `# Favicon & App Icon Package

Generated locally by Darma Favicon & App Icon Generator.

${createProjectProfileSummary(input)}

## Standard HTML

Copy the icon files to your public root and paste this in your HTML head:

\`\`\`html
${createStandardHtmlHeadSnippet(input)}
\`\`\`

## Web App Manifest

\`\`\`json
${createManifestSnippet(input).trim()}
\`\`\`

## Notes

- Keep favicon filenames stable so browsers and search engines can cache them correctly.
- Test the 16x16 favicon visually; tiny icons need high contrast and simple shapes.
- For PWA installs, prefer a non-transparent background and include 192x192 and 512x512 icons.
- Maskable icons include extra padding because launchers may crop the outer edge.
- If your project uses a framework, follow the selected project setup before pasting generic HTML tags.
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
