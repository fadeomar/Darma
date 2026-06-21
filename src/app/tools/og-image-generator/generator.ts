import { getExportSizes } from "./presets";
import { renderOgImagePng } from "./canvas";
import { createAssetManifest, createHtmlMetaSnippet, createNextInstallGuide, createNextMetadataSnippet, createReadme, createSharePreviewHtml, createValidationChecklist } from "./snippets";
import type { OgGeneratedAsset, OgImageInput } from "./types";

function textBlob(text: string, mimeType = "text/plain"): Blob {
  return new Blob([text], { type: `${mimeType};charset=utf-8` });
}

function textAsset(filename: string, text: string, kind: OgGeneratedAsset["kind"], mimeType = "text/plain"): OgGeneratedAsset {
  const blob = textBlob(text, mimeType);
  return { filename, mimeType, blob, kind, size: blob.size, text };
}

async function imageAsset(input: OgImageInput, filename: string, width: number, height: number): Promise<OgGeneratedAsset> {
  const blob = await renderOgImagePng(input, width, height);
  return { filename, mimeType: "image/png", blob, kind: "image", size: blob.size, width, height, previewUrl: URL.createObjectURL(blob) };
}

function uniqueAssets(assets: OgGeneratedAsset[]): OgGeneratedAsset[] {
  const map = new Map<string, OgGeneratedAsset>();
  assets.forEach((asset) => {
    const key = asset.filename.toLowerCase();
    if (!map.has(key)) {
      map.set(key, asset);
      return;
    }
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
  });
  return [...map.values()];
}

export async function generateOgAssets(input: OgImageInput): Promise<OgGeneratedAsset[]> {
  const imageSizes = getExportSizes(input.exportPack);
  const images = await Promise.all(imageSizes.map((size) => imageAsset(input, size.filename, size.width, size.height)));
  const docs: OgGeneratedAsset[] = [
    textAsset("html-meta-tags.txt", createHtmlMetaSnippet(input), "snippet"),
    textAsset("metadata-snippet.ts", createNextMetadataSnippet(input), "snippet", "text/typescript"),
    textAsset("social-preview.html", createSharePreviewHtml(input), "html", "text/html"),
    textAsset("validation-checklist.md", createValidationChecklist(input), "readme", "text/markdown"),
  ];

  if (input.exportPack === "nextjs" || input.exportPack === "complete") {
    docs.push(textAsset("nextjs-app-router-instructions.md", createNextInstallGuide(input), "readme", "text/markdown"));
  }

  const assets = uniqueAssets([...images, ...docs]);
  assets.push(textAsset("asset-manifest.json", createAssetManifest(assets), "json", "application/json"));
  assets.push(textAsset("README.md", createReadme(input, assets), "readme", "text/markdown"));
  return uniqueAssets(assets);
}

export function revokeOgAssetUrls(assets: OgGeneratedAsset[]) {
  assets.forEach((asset) => {
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
  });
}
