import { isSafeSvgMarkup } from "./canvas";
import { normalizePathPrefix } from "./manifest";
import { listZipFileNames } from "./zip";
import type { FaviconInput, FaviconWarning, FileValidationIssue, GeneratedAsset, ParsedManifest, ReadinessCheck } from "./types";

const HEX_PATTERN = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

export function validateFaviconInput(input: FaviconInput): FaviconWarning[] {
  const warnings: FaviconWarning[] = [];

  if (input.sourceMode === "image") {
    if (!input.imageDataUrl) {
      warnings.push({ id: "image-missing", level: "info", title: "Upload an image", message: "Choose a square logo or artwork to generate the icon pack." });
    }

    if (input.imageMeta) {
      const smallest = Math.min(input.imageMeta.width, input.imageMeta.height);
      if (smallest < 512) {
        warnings.push({ id: "source-small", level: "warning", title: "Source below 512×512", message: "The source image may look soft in 512×512 PWA and app icons." });
      }
      if (input.imageMeta.width !== input.imageMeta.height) {
        warnings.push({ id: "source-not-square", level: "warning", title: "Source is not square", message: "The generator will center-fit or crop the artwork. Square sources usually produce cleaner favicons." });
      }
    }
  }

  if (input.sourceMode === "svg") {
    if (!input.svgText.trim()) {
      warnings.push({ id: "svg-empty", level: "info", title: "Paste SVG markup", message: "Paste an inline SVG starting with <svg to render it locally." });
    } else if (!isSafeSvgMarkup(input.svgText)) {
      warnings.push({ id: "svg-unsafe", level: "error", title: "SVG rejected", message: "SVG must start with <svg and cannot include scripts, javascript: URLs, or inline event handlers." });
    }
  }

  if (!isHexColor(input.backgroundColor)) {
    warnings.push({ id: "bg-invalid", level: "error", title: "Invalid background color", message: "Use #RGB or #RRGGBB for the background color." });
  }
  if (!isHexColor(input.foregroundColor)) {
    warnings.push({ id: "fg-invalid", level: "error", title: "Invalid foreground color", message: "Use #RGB or #RRGGBB for the text or emoji color." });
  }
  if (!isHexColor(input.themeColor)) {
    warnings.push({ id: "theme-invalid", level: "error", title: "Invalid theme color", message: "Use #RGB or #RRGGBB for the browser theme color." });
  }
  if (!isHexColor(input.manifestBackgroundColor)) {
    warnings.push({ id: "manifest-bg-invalid", level: "error", title: "Invalid manifest background", message: "Use #RGB or #RRGGBB for the manifest background color." });
  }

  if (!input.pathPrefix.trim().startsWith("/")) {
    warnings.push({ id: "prefix-start", level: "warning", title: "Path prefix should start with /", message: `Current prefix will be normalized to ${normalizePathPrefix(input.pathPrefix)}.` });
  }
  if (input.pathPrefix.trim() && !input.pathPrefix.trim().endsWith("/")) {
    warnings.push({ id: "prefix-end", level: "info", title: "Path prefix normalized", message: `A trailing slash will be added: ${normalizePathPrefix(input.pathPrefix)}.` });
  }

  if (!input.siteName.trim()) {
    warnings.push({ id: "site-missing", level: "warning", title: "Missing site name", message: "The web app manifest should include a full app or website name." });
  }
  if (!input.shortName.trim()) {
    warnings.push({ id: "short-missing", level: "warning", title: "Missing short name", message: "The short name is used by launchers and install prompts when space is limited." });
  }

  if (input.transparentBackground) {
    warnings.push({ id: "transparent-mobile", level: "warning", title: "Transparent mobile icons", message: "Transparent icons can look inconsistent on iOS, Android launchers, and PWA install surfaces." });
  }

  if (input.sourceMode === "text" && input.text.trim().length > 2) {
    warnings.push({ id: "text-small", level: "warning", title: "Text may be tiny", message: "Favicons are very small. One or two letters usually work best at 16×16." });
  }

  if (input.sourceMode === "emoji") {
    warnings.push({ id: "emoji-platform", level: "info", title: "Emoji rendering varies", message: "Emoji style depends on the user's operating system and browser." });
  }

  return warnings;
}

export function createReadinessChecks(input: FaviconInput, generated: GeneratedAsset[]): ReadinessCheck[] {
  const filenames = new Set(generated.map((asset) => asset.filename));
  const smallSource = input.imageMeta ? Math.min(input.imageMeta.width, input.imageMeta.height) >= 512 : input.sourceMode !== "image";
  const squareSource = input.imageMeta ? input.imageMeta.width === input.imageMeta.height : true;
  const htmlReady = filenames.has("html-head-snippet.txt");
  const manifestReady = filenames.has("site.webmanifest") || filenames.has("public/site.webmanifest");
  const hasApple = filenames.has("apple-touch-icon.png") || filenames.has("apple-touch-icon-180x180.png") || filenames.has("src/app/apple-icon.png");
  const hasPwa = filenames.has("android-chrome-192x192.png") && filenames.has("android-chrome-512x512.png");
  const hasMaskable = filenames.has("maskable-icon-192x192.png") || filenames.has("icons/maskable-icon-192x192.png");

  return [
    { id: "source-resolution", label: "Source quality", passed: smallSource, points: smallSource ? 15 : 5, maxPoints: 15, detail: smallSource ? "Source quality is enough for 512×512 output." : "Use at least 512×512 for the sharpest app icons." },
    { id: "source-square", label: "Square artwork", passed: squareSource, points: squareSource ? 10 : 5, maxPoints: 10, detail: squareSource ? "Artwork is square or generated from vector/text." : "Non-square artwork will be fit or cropped." },
    { id: "favicon", label: "Browser favicon", passed: filenames.has("favicon.ico"), points: filenames.has("favicon.ico") ? 15 : 0, maxPoints: 15, detail: "favicon.ico includes 16, 32, and 48px PNG entries." },
    { id: "search", label: "Search-friendly PNG", passed: filenames.has("favicon-48x48.png"), points: filenames.has("favicon-48x48.png") ? 10 : 0, maxPoints: 10, detail: "48×48+ square PNG improves quality in modern surfaces." },
    { id: "apple", label: "Apple touch icon", passed: hasApple, points: hasApple ? 10 : 0, maxPoints: 10, detail: "Apple touch icon is included for iOS home screen shortcuts." },
    { id: "pwa", label: "PWA icon pair", passed: hasPwa || input.exportPack === "nextjs", points: hasPwa || input.exportPack === "nextjs" ? 15 : 0, maxPoints: 15, detail: "Manifest-ready 192×192 and 512×512 icons are included." },
    { id: "maskable", label: "Maskable support", passed: hasMaskable, points: hasMaskable ? 10 : 4, maxPoints: 10, detail: hasMaskable ? "Maskable icons include safe padding." : "Add maskable icons for adaptive Android/PWA launchers." },
    { id: "manifest", label: "Manifest", passed: manifestReady, points: manifestReady ? 10 : 0, maxPoints: 10, detail: "site.webmanifest includes app name, colors, display, and icons." },
    { id: "snippets", label: "Install snippets", passed: htmlReady, points: htmlReady ? 5 : 0, maxPoints: 5, detail: "HTML and Next.js setup snippets are generated." },
  ];
}

export function scoreReadiness(checks: ReadinessCheck[]): number {
  const total = checks.reduce((sum, check) => sum + check.maxPoints, 0);
  const score = checks.reduce((sum, check) => sum + check.points, 0);
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

function tryParseManifest(text: string): ParsedManifest | null {
  try {
    const parsed = JSON.parse(text) as ParsedManifest;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function validateExistingFiles(files: File[]): Promise<FileValidationIssue[]> {
  if (!files.length) {
    return [{ id: "validator-empty", level: "info", title: "Upload files to validate", message: "Drop favicon files, manifest JSON, snippets, or an exported package to inspect common issues." }];
  }

  const expandedNames: string[] = [];
  const materializedFiles: File[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        const zipNames = await listZipFileNames(file);
        expandedNames.push(...zipNames);
      } catch {
        expandedNames.push(file.name);
      }
    } else {
      expandedNames.push(file.name);
      materializedFiles.push(file);
    }
  }

  const names = new Set(expandedNames);
  const lowerNames = new Set(expandedNames.map((name) => name.toLowerCase().split("/").pop() ?? name.toLowerCase()));
  const issues: FileValidationIssue[] = [];

  if (files.some((file) => file.name.toLowerCase().endsWith(".zip"))) {
    issues.push({ id: "zip-read", level: expandedNames.length ? "success" : "warning", title: "ZIP package scanned", message: expandedNames.length ? `Read ${expandedNames.length} filenames from the ZIP package.` : "Could not read ZIP entries. Try uploading the extracted files." });
  }

  if (lowerNames.has("favicon.ico")) {
    issues.push({ id: "has-ico", level: "success", title: "favicon.ico found", message: "Browser fallback favicon is present." });
  } else {
    issues.push({ id: "missing-ico", level: "warning", title: "Missing favicon.ico", message: "Add favicon.ico for broad browser and legacy support." });
  }

  const hasApple = [...lowerNames].some((name) => name.includes("apple-touch-icon"));
  issues.push(hasApple ? { id: "has-apple", level: "success", title: "Apple icon found", message: "An Apple touch icon is present." } : { id: "missing-apple", level: "warning", title: "Missing Apple icon", message: "Add apple-touch-icon.png or apple-touch-icon-180x180.png for iOS shortcuts." });

  const has192 = [...lowerNames].some((name) => name.includes("192") && name.endsWith(".png"));
  const has512 = [...lowerNames].some((name) => name.includes("512") && name.endsWith(".png"));
  issues.push(has192 && has512 ? { id: "has-pwa", level: "success", title: "PWA sizes found", message: "192×192 and 512×512 PNG icons appear to be present." } : { id: "missing-pwa", level: "warning", title: "Missing PWA icon pair", message: "Add both 192×192 and 512×512 PNG icons for install prompts." });

  const manifestFile = materializedFiles.find((file) => ["site.webmanifest", "manifest.webmanifest", "manifest.json"].includes(file.name.toLowerCase()));
  if (manifestFile) {
    const manifest = tryParseManifest(await manifestFile.text());
    if (!manifest) {
      issues.push({ id: "manifest-invalid", level: "error", title: "Manifest is invalid", message: `${manifestFile.name} could not be parsed as JSON.` });
    } else {
      issues.push({ id: "manifest-valid", level: "success", title: "Manifest JSON valid", message: `${manifestFile.name} parsed successfully.` });
      const icons = manifest.icons ?? [];
      const hasManifest192 = icons.some((icon) => icon.sizes?.includes("192x192"));
      const hasManifest512 = icons.some((icon) => icon.sizes?.includes("512x512"));
      const hasMaskable = icons.some((icon) => icon.purpose?.includes("maskable"));
      if (!manifest.name || !manifest.short_name) {
        issues.push({ id: "manifest-names", level: "warning", title: "Manifest names incomplete", message: "Include both name and short_name for better install surfaces." });
      }
      if (!hasManifest192 || !hasManifest512) {
        issues.push({ id: "manifest-icon-sizes", level: "warning", title: "Manifest icon sizes incomplete", message: "Manifest should reference 192×192 and 512×512 icons." });
      }
      if (!hasMaskable) {
        issues.push({ id: "manifest-maskable", level: "info", title: "No maskable purpose", message: "Add maskable icons when you want adaptive Android/PWA launcher support." });
      }
    }
  } else {
    issues.push({ id: "missing-manifest", level: "warning", title: "Missing web manifest", message: "Add site.webmanifest or manifest.webmanifest for PWA/app icon metadata." });
  }

  const unusualNames = [...names].filter((name) => /\s/.test(name));
  if (unusualNames.length) {
    issues.push({ id: "spaces", level: "info", title: "Filenames contain spaces", message: "Prefer lowercase hyphenated icon filenames to reduce URL and cache issues." });
  }

  return issues;
}
function normalizeGeneratedName(name: string): string {
  return name.replace(/^\/+/, "").toLowerCase();
}

function filenameBasename(name: string): string {
  const normalized = normalizeGeneratedName(name);
  return normalized.split("/").pop() ?? normalized;
}

function manifestAssetForPack(input: FaviconInput, generated: GeneratedAsset[]): GeneratedAsset | undefined {
  if (input.exportPack === "pwa") return generated.find((asset) => asset.filename === "manifest.webmanifest");
  if (input.exportPack === "nextjs") return generated.find((asset) => asset.filename === "public/site.webmanifest");
  return generated.find((asset) => asset.filename === "site.webmanifest" || asset.filename === "manifest.webmanifest" || asset.filename === "public/site.webmanifest");
}

function manifestIconReferenceExists(src: string, filenames: Set<string>, basenames: Set<string>): boolean {
  const cleaned = normalizeGeneratedName(src).replace(/^public\//, "");
  const withoutQuery = cleaned.split(/[?#]/)[0] ?? cleaned;
  return filenames.has(withoutQuery) || filenames.has(`public/${withoutQuery}`) || basenames.has(filenameBasename(withoutQuery));
}

function snippetReferences(text: string): string[] {
  const matches = [...text.matchAll(/(?:href|src)=["']([^"']+)["']/gi)];
  return matches
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value) && !value.startsWith("http") && !value.startsWith("data:"));
}

export function validateGeneratedAssets(input: FaviconInput, generated: GeneratedAsset[]): FileValidationIssue[] {
  if (!generated.length) {
    return [{ id: "generated-empty", level: "info", title: "No generated files yet", message: "Generate an icon package before running the self-check." }];
  }

  const issues: FileValidationIssue[] = [];
  const filenames = new Set(generated.map((asset) => normalizeGeneratedName(asset.filename)));
  const basenames = new Set(generated.map((asset) => filenameBasename(asset.filename)));
  const emptyAssets = generated.filter((asset) => (asset.size ?? asset.blob.size) <= 0);
  const duplicateNames = generated
    .map((asset) => normalizeGeneratedName(asset.filename))
    .filter((name, index, names) => names.indexOf(name) !== index);

  if (emptyAssets.length) {
    issues.push({ id: "generated-empty-assets", level: "error", title: "Empty generated files", message: `${emptyAssets.length} generated file(s) appear to be empty. Try regenerating before download.` });
  } else {
    issues.push({ id: "generated-assets-size", level: "success", title: "Generated files have content", message: `${generated.length} file(s) are ready and non-empty.` });
  }

  if (duplicateNames.length) {
    issues.push({ id: "generated-duplicates", level: "warning", title: "Duplicate output names", message: `Duplicate generated path(s): ${[...new Set(duplicateNames)].join(", ")}.` });
  } else {
    issues.push({ id: "generated-unique", level: "success", title: "No duplicate output paths", message: "Every generated file has a unique package path." });
  }

  const manifestAsset = manifestAssetForPack(input, generated);
  if (!manifestAsset?.text) {
    issues.push({ id: "generated-manifest-missing", level: input.exportPack === "nextjs" ? "info" : "warning", title: "Manifest self-check skipped", message: "No readable generated manifest was found for this export pack." });
  } else {
    const manifest = tryParseManifest(manifestAsset.text);
    if (!manifest) {
      issues.push({ id: "generated-manifest-invalid", level: "error", title: "Generated manifest invalid", message: `${manifestAsset.filename} could not be parsed as JSON.` });
    } else {
      issues.push({ id: "generated-manifest-valid", level: "success", title: "Generated manifest valid", message: `${manifestAsset.filename} is valid JSON.` });
      const icons = manifest.icons ?? [];
      const missingIconRefs = icons.filter((icon) => icon.src && !manifestIconReferenceExists(icon.src, filenames, basenames));
      if (missingIconRefs.length) {
        issues.push({ id: "generated-manifest-missing-icons", level: "error", title: "Manifest references missing icons", message: `Missing generated file(s) for: ${missingIconRefs.map((icon) => icon.src).join(", ")}.` });
      } else if (icons.length) {
        issues.push({ id: "generated-manifest-icons", level: "success", title: "Manifest icon paths match", message: `${icons.length} manifest icon reference(s) map to generated files.` });
      }

      const has192 = icons.some((icon) => icon.sizes?.includes("192x192"));
      const has512 = icons.some((icon) => icon.sizes?.includes("512x512"));
      if (!has192 || !has512) {
        issues.push({ id: "generated-manifest-core-sizes", level: "warning", title: "Manifest core sizes incomplete", message: "A complete PWA manifest should reference both 192×192 and 512×512 icons." });
      }

      const hasMaskablePurpose = icons.some((icon) => icon.purpose?.includes("maskable"));
      if (input.includeMaskable && !hasMaskablePurpose) {
        issues.push({ id: "generated-maskable-purpose", level: "warning", title: "Maskable icons not marked", message: "Maskable icons are enabled, but the manifest does not include purpose: maskable." });
      } else if (input.includeMaskable) {
        issues.push({ id: "generated-maskable-ok", level: "success", title: "Maskable manifest entries found", message: "The manifest marks maskable icon variants correctly." });
      }
    }
  }

  const htmlSnippet = generated.find((asset) => asset.filename.endsWith("html-head-snippet.txt") && asset.text);
  if (htmlSnippet?.text) {
    const missingRefs = snippetReferences(htmlSnippet.text).filter((ref) => !manifestIconReferenceExists(ref, filenames, basenames));
    if (missingRefs.length) {
      issues.push({ id: "generated-snippet-missing", level: "warning", title: "HTML snippet references unmatched files", message: `Check these path(s): ${missingRefs.join(", ")}. This may be expected if files are served from another public path.` });
    } else {
      issues.push({ id: "generated-snippet-ok", level: "success", title: "HTML snippet paths look consistent", message: "The generated HTML snippet references files included in the selected package." });
    }
  }

  if (input.exportPack === "nextjs") {
    const required = ["src/app/favicon.ico", "src/app/icon.png", "src/app/apple-icon.png", "public/site.webmanifest"];
    const missing = required.filter((name) => !filenames.has(name));
    issues.push(missing.length ? { id: "generated-nextjs-missing", level: "error", title: "Next.js pack incomplete", message: `Missing: ${missing.join(", ")}.` } : { id: "generated-nextjs-ok", level: "success", title: "Next.js pack structure ready", message: "The package includes App Router icon files and public manifest." });
  }

  if (input.exportPack === "pwa") {
    const required = ["icons/icon-192x192.png", "icons/icon-512x512.png", "manifest.webmanifest"];
    const missing = required.filter((name) => !filenames.has(name));
    issues.push(missing.length ? { id: "generated-pwa-missing", level: "error", title: "PWA pack incomplete", message: `Missing: ${missing.join(", ")}.` } : { id: "generated-pwa-ok", level: "success", title: "PWA pack structure ready", message: "The package includes core PWA icons and manifest." });
  }

  return issues;
}
