import type { GeneratedMockupAsset, MockupInput, MockupReadinessCheck, MockupWarning, PackageCheckResult } from "./types";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validateMockupInput(input: MockupInput): MockupWarning[] {
  const warnings: MockupWarning[] = [];
  if (!input.screenshotDataUrl) {
    warnings.push({ id: "missing-screenshot", level: "warning", title: "No screenshot uploaded", message: "The generator can render a placeholder, but upload a real screenshot before final export." });
  }
  if (input.screenshotWidth && input.screenshotHeight) {
    const shortSide = Math.min(input.screenshotWidth, input.screenshotHeight);
    if (shortSide < 720) warnings.push({ id: "low-resolution", level: "warning", title: "Screenshot may be small", message: "Use a higher-resolution screenshot for crisp exports, especially for 1600px+ mockups." });
    const screenshotRatio = input.screenshotWidth / input.screenshotHeight;
    if (input.device === "phone" && input.orientation === "portrait" && screenshotRatio > 0.8) warnings.push({ id: "phone-ratio", level: "info", title: "Phone frame may crop", message: "This screenshot looks wide for a portrait phone frame. Try contain mode or landscape orientation." });
  }
  const colors = [input.backgroundColor, input.gradientFrom, input.gradientTo, input.foregroundColor, input.mutedColor, input.accentColor];
  if (colors.some((color) => !HEX_RE.test(color))) warnings.push({ id: "invalid-color", level: "error", title: "Invalid color", message: "All colors must be valid hex values like #0f172a." });
  if (!input.title.trim() && input.showText) warnings.push({ id: "missing-title", level: "info", title: "Title is empty", message: "Add a title when exporting marketing mockups with text enabled." });
  if (input.title.length > 76) warnings.push({ id: "long-title", level: "warning", title: "Title may wrap too much", message: "Shorter titles produce more readable social and landing-page mockups." });
  if (input.deviceScale > 104 && input.rotate !== 0) warnings.push({ id: "large-rotated-device", level: "warning", title: "Device may touch edges", message: "A large rotated frame can be cropped on narrow exports. Reduce scale or rotation if needed." });
  if (input.filePrefix.trim().length < 2) warnings.push({ id: "file-prefix", level: "warning", title: "Filename prefix is too short", message: "Use a descriptive prefix such as product-dashboard or mobile-app." });
  return warnings;
}

export function createReadinessChecks(input: MockupInput, assets: GeneratedMockupAsset[]): MockupReadinessCheck[] {
  return [
    { id: "screenshot", label: "Screenshot uploaded", passed: Boolean(input.screenshotDataUrl), detail: input.screenshotName || "Upload a screenshot first." },
    { id: "resolution", label: "Source is high resolution", passed: Math.min(input.screenshotWidth || 0, input.screenshotHeight || 0) >= 720, detail: input.screenshotWidth ? `${input.screenshotWidth}×${input.screenshotHeight}` : "No source dimensions yet." },
    { id: "title", label: "Marketing title ready", passed: !input.showText || input.title.trim().length >= 8, detail: input.showText ? `${input.title.trim().length} characters` : "Text overlay disabled." },
    { id: "colors", label: "Colors are valid", passed: [input.backgroundColor, input.gradientFrom, input.gradientTo, input.foregroundColor, input.mutedColor, input.accentColor].every((color) => HEX_RE.test(color)), detail: "Hex color checks." },
    { id: "exports", label: "Export assets generated", passed: assets.length > 0, detail: assets.length ? `${assets.length} files ready` : "Generate a pack to download." },
    { id: "filename", label: "Filename prefix set", passed: input.filePrefix.trim().length >= 2, detail: input.filePrefix || "No prefix." },
  ];
}

export function scoreReadiness(checks: MockupReadinessCheck[]) {
  if (!checks.length) return 0;
  return Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);
}

export function validateGeneratedAssets(assets: GeneratedMockupAsset[]): PackageCheckResult[] {
  if (!assets.length) return [{ id: "empty", level: "warning", title: "No generated assets", message: "Generate an export pack before downloading." }];
  const results: PackageCheckResult[] = [];
  const names = new Set<string>();
  for (const asset of assets) {
    if (names.has(asset.filename)) results.push({ id: `duplicate-${asset.filename}`, level: "error", title: "Duplicate filename", message: `${asset.filename} appears more than once.` });
    names.add(asset.filename);
    if (asset.blob.size < 2000) results.push({ id: `small-${asset.filename}`, level: "warning", title: "Tiny output file", message: `${asset.filename} is unusually small.` });
    if (asset.width < 800 || asset.height < 600) results.push({ id: `size-${asset.filename}`, level: "warning", title: "Small export size", message: `${asset.filename} is smaller than 800×600.` });
  }
  if (!results.length) results.push({ id: "pass", level: "pass", title: "Export package looks good", message: "Filenames, image dimensions, and generated blobs passed the local checks." });
  return results;
}

export async function validateExistingPackage(files: FileList | File[]): Promise<PackageCheckResult[]> {
  const list = Array.from(files);
  if (!list.length) return [{ id: "none", level: "warning", title: "No files selected", message: "Choose PNG/JPG/WebP mockup exports to inspect." }];
  const results: PackageCheckResult[] = [];
  const images = list.filter((file) => /^image\/(png|jpeg|webp)$/.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name));
  if (!images.length) results.push({ id: "no-images", level: "error", title: "No image files found", message: "The selected package does not include PNG, JPG, or WebP screenshots." });
  for (const file of images) {
    if (file.size > 8 * 1024 * 1024) results.push({ id: `large-${file.name}`, level: "warning", title: "Large file", message: `${file.name} is larger than 8 MB. Consider compressing before upload to production.` });
    if (!/^[a-z0-9._-]+$/i.test(file.name)) results.push({ id: `name-${file.name}`, level: "warning", title: "Filename may be awkward", message: `${file.name} contains characters that can be inconvenient in URLs.` });
  }
  if (!results.length) results.push({ id: "pass", level: "pass", title: "Package files look good", message: `${images.length} image file${images.length === 1 ? "" : "s"} found with reasonable names and sizes.` });
  return results;
}
