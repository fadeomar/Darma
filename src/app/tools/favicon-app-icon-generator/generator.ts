import { createBrowserConfigXml, createManifest, joinPath, manifestToJson } from "./manifest";
import { createInstallReadme, createHtmlHeadSnippet, createNextJsSnippet, createValidatorGuide } from "./snippets";
import { renderIconPng } from "./canvas";
import { createIcoFromPngs } from "./ico";
import { APPLE_ICON_SIZES, ICO_SIZES, PWA_ICON_SIZES } from "./presets";
import type { ExportPackId, FaviconInput, GeneratedAsset } from "./types";

function textBlob(text: string, mimeType = "text/plain"): Blob {
  return new Blob([text], { type: `${mimeType};charset=utf-8` });
}

async function pngAsset(input: FaviconInput, filename: string, size: number, options?: { maskablePadding?: boolean; monochrome?: boolean }): Promise<GeneratedAsset> {
  const blob = await renderIconPng(input, size, options);
  return {
    filename,
    mimeType: "image/png",
    blob,
    kind: "image",
    size: blob.size,
    width: size,
    height: size,
    previewUrl: URL.createObjectURL(blob),
  };
}

function textAsset(filename: string, text: string, kind: GeneratedAsset["kind"], mimeType = "text/plain"): GeneratedAsset {
  const blob = textBlob(text, mimeType);
  return { filename, mimeType, blob, kind, size: blob.size, text };
}

function assetKey(asset: GeneratedAsset) {
  return asset.filename;
}

function createPwaManifestJson(input: FaviconInput): string {
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

  return `${JSON.stringify({
    name: input.siteName.trim() || "My App",
    short_name: input.shortName.trim() || "App",
    icons,
    theme_color: input.themeColor,
    background_color: input.manifestBackgroundColor,
    display: input.display,
    orientation: input.orientation,
  }, null, 2)}\n`;
}


function uniqueAssets(assets: GeneratedAsset[]): GeneratedAsset[] {
  const map = new Map<string, GeneratedAsset>();
  assets.forEach((asset) => {
    if (!map.has(assetKey(asset))) {
      map.set(assetKey(asset), asset);
      return;
    }
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
  });
  return [...map.values()];
}

async function coreAssets(input: FaviconInput): Promise<GeneratedAsset[]> {
  const icoPngs = await Promise.all(ICO_SIZES.map(async (size) => ({ size, blob: await renderIconPng(input, size) })));
  const icoBlob = await createIcoFromPngs(icoPngs);

  return [
    { filename: "favicon.ico", mimeType: "image/x-icon", blob: icoBlob, kind: "image", size: icoBlob.size },
    await pngAsset(input, "favicon-16x16.png", 16),
    await pngAsset(input, "favicon-32x32.png", 32),
    await pngAsset(input, "favicon-48x48.png", 48),
    await pngAsset(input, "apple-touch-icon.png", 180),
    await pngAsset(input, "android-chrome-192x192.png", 192),
    await pngAsset(input, "android-chrome-512x512.png", 512),
    ...(input.includeMaskable
      ? [await pngAsset(input, "maskable-icon-192x192.png", 192, { maskablePadding: true }), await pngAsset(input, "maskable-icon-512x512.png", 512, { maskablePadding: true })]
      : []),
    ...(input.includeMonochrome ? [await pngAsset(input, "monochrome-icon-512x512.png", 512, { monochrome: true })] : []),
    textAsset("site.webmanifest", manifestToJson(createManifest(input)), "manifest", "application/manifest+json"),
    textAsset("html-head-snippet.txt", createHtmlHeadSnippet(input), "snippet"),
    textAsset("nextjs-app-router-snippet.txt", createNextJsSnippet(input), "snippet"),
    textAsset("README.md", createInstallReadme(input), "readme", "text/markdown"),
  ];
}

async function modernAssets(input: FaviconInput): Promise<GeneratedAsset[]> {
  return coreAssets(input);
}

async function nextJsAssets(input: FaviconInput): Promise<GeneratedAsset[]> {
  const icoPngs = await Promise.all(ICO_SIZES.map(async (size) => ({ size, blob: await renderIconPng(input, size) })));
  const icoBlob = await createIcoFromPngs(icoPngs);
  const publicManifest = manifestToJson(createManifest(input, { iconBasePath: "/" }));

  return [
    { filename: "src/app/favicon.ico", mimeType: "image/x-icon", blob: icoBlob, kind: "image", size: icoBlob.size },
    await pngAsset(input, "src/app/icon.png", 512),
    await pngAsset(input, "src/app/apple-icon.png", 180),
    await pngAsset(input, "public/android-chrome-192x192.png", 192),
    await pngAsset(input, "public/android-chrome-512x512.png", 512),
    ...(input.includeMaskable
      ? [await pngAsset(input, "public/maskable-icon-192x192.png", 192, { maskablePadding: true }), await pngAsset(input, "public/maskable-icon-512x512.png", 512, { maskablePadding: true })]
      : []),
    textAsset("public/site.webmanifest", publicManifest, "manifest", "application/manifest+json"),
    textAsset("instructions-nextjs.md", createNextJsSnippet(input), "readme", "text/markdown"),
    textAsset("html-head-snippet.txt", createHtmlHeadSnippet({ ...input, pathPrefix: "/" }), "snippet"),
    textAsset("README.md", createInstallReadme(input), "readme", "text/markdown"),
  ];
}

async function pwaAssets(input: FaviconInput): Promise<GeneratedAsset[]> {
  const iconAssets = await Promise.all(PWA_ICON_SIZES.map((size) => pngAsset(input, `icons/icon-${size}x${size}.png`, size)));
  const maskable = input.includeMaskable
    ? await Promise.all([192, 512].map((size) => pngAsset(input, `icons/maskable-icon-${size}x${size}.png`, size, { maskablePadding: true })))
    : [];

  return [
    ...iconAssets,
    ...maskable,
    ...(input.includeMonochrome ? [await pngAsset(input, "icons/monochrome-icon-512x512.png", 512, { monochrome: true })] : []),
    await pngAsset(input, "apple-touch-icon.png", 180),
    textAsset("manifest.webmanifest", createPwaManifestJson(input), "manifest", "application/manifest+json"),
    textAsset("html-head-snippet.txt", createHtmlHeadSnippet({ ...input, pathPrefix: "/" }), "snippet"),
    textAsset("README.md", createInstallReadme(input), "readme", "text/markdown"),
  ];
}

async function legacyAssets(input: FaviconInput): Promise<GeneratedAsset[]> {
  const base = await coreAssets(input);
  const apple = await Promise.all(APPLE_ICON_SIZES.map((size) => pngAsset(input, `apple-touch-icon-${size}x${size}.png`, size)));
  return [
    ...base,
    ...apple,
    await pngAsset(input, "mstile-150x150.png", 150),
    textAsset("browserconfig.xml", createBrowserConfigXml(input), "config", "application/xml"),
  ];
}

async function completeAssets(input: FaviconInput): Promise<GeneratedAsset[]> {
  const [base, pwa, legacy, nextjs] = await Promise.all([coreAssets(input), pwaAssets(input), legacyAssets(input), nextJsAssets(input)]);
  return uniqueAssets([
    ...base,
    ...pwa,
    ...legacy,
    ...nextjs,
    textAsset("favicon-validation-checklist.md", createValidatorGuide(), "readme", "text/markdown"),
  ]);
}

export async function generateFaviconAssets(input: FaviconInput, pack: ExportPackId = input.exportPack): Promise<GeneratedAsset[]> {
  switch (pack) {
    case "modern":
      return modernAssets(input);
    case "nextjs":
      return nextJsAssets(input);
    case "pwa":
      return pwaAssets(input);
    case "legacy":
      return legacyAssets(input);
    case "complete":
    default:
      return completeAssets(input);
  }
}

export function revokeGeneratedAssetUrls(assets: GeneratedAsset[]) {
  assets.forEach((asset) => {
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
  });
}
