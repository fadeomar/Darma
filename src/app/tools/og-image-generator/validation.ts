import type { OgGeneratedAsset, OgImageInput, OgReadinessCheck, OgWarning } from "./types";

const HEX_RE = /^#[0-9a-f]{6}$/i;

function isValidHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateOgInput(input: OgImageInput): OgWarning[] {
  const warnings: OgWarning[] = [];
  if (!input.title.trim()) warnings.push({ id: "title-empty", level: "error", title: "Title is missing", message: "Add a clear title before exporting social preview images." });
  if (input.title.length > 90) warnings.push({ id: "title-long", level: "warning", title: "Title is long", message: "Long titles may be cropped on social cards. Aim for 60–90 characters." });
  if (input.subtitle.length > 200) warnings.push({ id: "subtitle-long", level: "warning", title: "Description is long", message: "Keep descriptions short so they stay readable in compact previews." });
  if (!input.altText.trim()) warnings.push({ id: "alt-empty", level: "warning", title: "Alt text is missing", message: "Add concise alt text for accessibility and metadata completeness." });
  if (!isValidHttpUrl(input.siteUrl)) warnings.push({ id: "url-invalid", level: "error", title: "Site URL is invalid", message: "Use a full https:// URL so generated metadata can produce absolute image URLs." });
  [input.backgroundColor, input.foregroundColor, input.mutedColor, input.accentColor, input.gradientFrom, input.gradientTo].forEach((color, index) => {
    if (!HEX_RE.test(color)) warnings.push({ id: `color-${index}`, level: "error", title: "Invalid color", message: `${color || "Empty color"} should be a 6-digit hex color like #0f172a.` });
  });
  if (input.backgroundMode === "image" && !input.backgroundImageDataUrl) warnings.push({ id: "missing-background", level: "info", title: "No background image", message: "Upload a background image or switch to solid, gradient, or pattern background." });
  if (input.titleSize > 92 && input.title.length > 55) warnings.push({ id: "large-title", level: "warning", title: "Large title may wrap too much", message: "Reduce title size or shorten the title for cleaner previews." });
  if (!warnings.length) warnings.push({ id: "ready", level: "success", title: "Ready to export", message: "The current image settings look good for a social preview package." });
  return warnings;
}

export function createReadinessChecks(input: OgImageInput, assets: OgGeneratedAsset[]): OgReadinessCheck[] {
  const filenames = new Set(assets.map((asset) => asset.filename.toLowerCase()));
  const hasOg = [...filenames].some((name) => name.endsWith("opengraph-image.png") || name.endsWith("og-image.png"));
  const hasTwitter = [...filenames].some((name) => name.endsWith("twitter-image.png"));
  const hasHtml = [...filenames].some((name) => name.endsWith("html-meta-tags.txt"));
  const hasNext = [...filenames].some((name) => name.endsWith("metadata-snippet.ts") || name.endsWith("nextjs-app-router-instructions.md"));
  const hasAlt = input.altText.trim().length > 0;
  const titleGood = input.title.trim().length > 0 && input.title.length <= 90;
  const descriptionGood = input.subtitle.length <= 200;
  const urlGood = isValidHttpUrl(input.siteUrl);

  return [
    { id: "size", label: "Primary image", passed: hasOg, points: hasOg ? 20 : 0, maxPoints: 20, detail: "Includes a 1200×630 Open Graph image." },
    { id: "twitter", label: "Twitter/X image", passed: hasTwitter, points: hasTwitter ? 12 : 0, maxPoints: 12, detail: "Includes a Twitter/X card image." },
    { id: "title", label: "Title length", passed: titleGood, points: titleGood ? 16 : 6, maxPoints: 16, detail: "Title is present and short enough for most previews." },
    { id: "description", label: "Description length", passed: descriptionGood, points: descriptionGood ? 10 : 4, maxPoints: 10, detail: "Description is concise enough for social previews." },
    { id: "alt", label: "Alt text", passed: hasAlt, points: hasAlt ? 10 : 0, maxPoints: 10, detail: "Alt text helps accessibility and metadata quality." },
    { id: "url", label: "Absolute URL", passed: urlGood, points: urlGood ? 10 : 0, maxPoints: 10, detail: "Site URL can be used for absolute metadata links." },
    { id: "html", label: "HTML metadata", passed: hasHtml, points: hasHtml ? 12 : 0, maxPoints: 12, detail: "Copy-ready HTML meta tags are included." },
    { id: "next", label: "Framework guide", passed: hasNext || input.exportPack !== "nextjs", points: hasNext || input.exportPack !== "nextjs" ? 10 : 0, maxPoints: 10, detail: "Next.js pack includes App Router guidance." },
  ];
}

export function scoreReadiness(checks: OgReadinessCheck[]): number {
  const total = checks.reduce((sum, check) => sum + check.maxPoints, 0);
  if (!total) return 0;
  return Math.round((checks.reduce((sum, check) => sum + check.points, 0) / total) * 100);
}

export function validateGeneratedAssets(assets: OgGeneratedAsset[]): OgWarning[] {
  if (!assets.length) return [{ id: "empty", level: "info", title: "No files generated", message: "Generate a package before running export validation." }];
  const warnings: OgWarning[] = [];
  const names = assets.map((asset) => asset.filename.toLowerCase());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  const empty = assets.filter((asset) => asset.size <= 0);
  if (duplicates.length) warnings.push({ id: "duplicates", level: "warning", title: "Duplicate filenames", message: `Duplicate output paths: ${[...new Set(duplicates)].join(", ")}.` });
  else warnings.push({ id: "unique", level: "success", title: "Unique output paths", message: "Every generated file has a unique path." });
  if (empty.length) warnings.push({ id: "empty-files", level: "error", title: "Empty files", message: `${empty.length} generated file(s) appear empty.` });
  else warnings.push({ id: "non-empty", level: "success", title: "Files have content", message: `${assets.length} file(s) are non-empty.` });
  const ogAsset = assets.find((asset) => asset.width === 1200 && asset.height === 630);
  warnings.push(ogAsset ? { id: "og-size", level: "success", title: "Primary OG size found", message: "A 1200×630 social image is included." } : { id: "og-size-missing", level: "warning", title: "Primary OG size missing", message: "Include a 1200×630 PNG for the broadest social compatibility." });
  return warnings;
}

type ZipEntry = { name: string; compressedSize: number };

function readUint16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

async function listZipEntries(file: File): Promise<ZipEntry[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const entries: ZipEntry[] = [];
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (readUint32(view, offset) !== 0x04034b50) break;
    const compressedSize = readUint32(view, offset + 18);
    const nameLength = readUint16(view, offset + 26);
    const extraLength = readUint16(view, offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > bytes.length) break;
    entries.push({ name: decoder.decode(bytes.slice(nameStart, nameEnd)), compressedSize });
    offset = nameEnd + extraLength + compressedSize;
  }
  return entries;
}

export async function validateExistingPackage(files: File[]): Promise<OgWarning[]> {
  if (!files.length) return [{ id: "checker-empty", level: "info", title: "Upload a package", message: "Upload OG image files or a ZIP package to check common metadata-package issues." }];
  const names: string[] = [];
  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        names.push(...(await listZipEntries(file)).map((entry) => entry.name));
      } catch {
        names.push(file.name);
      }
    } else {
      names.push(file.name);
    }
  }
  const lower = new Set(names.map((name) => name.toLowerCase().split("/").pop() ?? name.toLowerCase()));
  const issues: OgWarning[] = [];
  issues.push({ id: "package-read", level: "success", title: "Package scanned", message: `Found ${names.length} file path(s).` });
  issues.push(lower.has("opengraph-image.png") || lower.has("og-image.png") ? { id: "has-og", level: "success", title: "OG image found", message: "Primary Open Graph image is present." } : { id: "missing-og", level: "warning", title: "Missing OG image", message: "Add opengraph-image.png or og-image.png." });
  issues.push(lower.has("twitter-image.png") ? { id: "has-twitter", level: "success", title: "Twitter image found", message: "Twitter/X image is present." } : { id: "missing-twitter", level: "info", title: "No Twitter image", message: "You can reuse the OG image, but a dedicated twitter-image.png is useful for Next.js and metadata workflows." });
  issues.push(lower.has("html-meta-tags.txt") ? { id: "has-html", level: "success", title: "HTML snippet found", message: "A copy-ready metadata snippet is included." } : { id: "missing-html", level: "warning", title: "Missing HTML snippet", message: "Include HTML meta tags or Next.js metadata instructions with the package." });
  if ([...lower].some((name) => /\s/.test(name))) issues.push({ id: "spaces", level: "info", title: "Filenames contain spaces", message: "Prefer lowercase hyphenated file names for public assets." });
  return issues;
}
