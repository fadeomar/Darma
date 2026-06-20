import { getSelectedExportPack } from "./presets";
import { renderMockupPng } from "./canvas";
import type { GeneratedMockupAsset, MockupInput } from "./types";

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "app-mockup";
}

export async function generateMockupAssets(input: MockupInput): Promise<GeneratedMockupAsset[]> {
  const pack = getSelectedExportPack(input.exportPackId);
  const prefix = sanitizeFilePart(input.filePrefix);
  const assets: GeneratedMockupAsset[] = [];

  for (const size of pack.sizes) {
    const blob = await renderMockupPng({ ...input, canvasWidth: size.width, canvasHeight: size.height }, size.width, size.height);
    assets.push({
      filename: `${prefix}-${size.filename}`,
      width: size.width,
      height: size.height,
      mimeType: "image/png",
      blob,
      previewUrl: URL.createObjectURL(blob),
    });
  }

  return assets;
}

export function revokeMockupAssetUrls(assets: GeneratedMockupAsset[]) {
  for (const asset of assets) URL.revokeObjectURL(asset.previewUrl);
}

export function createReadme(input: MockupInput, assets: GeneratedMockupAsset[]) {
  const lines = [
    "# App Screenshot Mockup Export",
    "",
    "Generated locally in the browser with Darma App Screenshot / Mockup Generator.",
    "",
    "## Design settings",
    "",
    `- Device frame: ${input.device}`,
    `- Orientation: ${input.orientation}`,
    `- Export pack: ${input.exportPackId}`,
    `- Background mode: ${input.backgroundMode}`,
    `- Screenshot: ${input.screenshotName || "Not provided"}`,
    "",
    "## Files",
    "",
    ...assets.map((asset) => `- ${asset.filename} — ${asset.width}×${asset.height}`),
    "",
    "## Usage tips",
    "",
    "Use landing-page exports for hero sections, social exports for launch posts, app-store exports as draft marketing screenshots, and documentation exports for README/support articles.",
  ];
  return lines.join("\n");
}
