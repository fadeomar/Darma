import { isSafeSvgMarkup } from "./canvas";
import { normalizePathPrefix } from "./manifest";
import { readZipEntries } from "./zip";
import type { FaviconInput, FaviconWarning, FileValidationIssue, GeneratedAsset, ParsedManifest, ReadinessCheck, SmartQualityIssue } from "./types";

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

function normalizeGeneratedFilename(filename: string): string {
  return filename.replace(/^\/+/, "").toLowerCase();
}

function hasAnyFile(filenames: Set<string>, candidates: string[]): boolean {
  return candidates.some((candidate) => filenames.has(normalizeGeneratedFilename(candidate)));
}

function generatedFileSet(generated: GeneratedAsset[]): Set<string> {
  return new Set(generated.map((asset) => normalizeGeneratedFilename(asset.filename)));
}

function getOutputSignals(generated: GeneratedAsset[]) {
  const filenames = generatedFileSet(generated);
  const basenameSet = new Set([...filenames].map((name) => name.split("/").pop() ?? name));
  const hasFavicon = basenameSet.has("favicon.ico");
  const hasSearchPng = basenameSet.has("favicon-48x48.png") || basenameSet.has("icon-48x48.png");
  const hasHtmlSnippet = basenameSet.has("html-head-snippet.txt");
  const hasManifest = hasAnyFile(filenames, ["site.webmanifest", "manifest.webmanifest", "public/site.webmanifest"]);
  const hasApple = hasAnyFile(filenames, ["apple-touch-icon.png", "apple-touch-icon-180x180.png", "src/app/apple-icon.png"]);
  const hasPwa =
    (basenameSet.has("android-chrome-192x192.png") && basenameSet.has("android-chrome-512x512.png")) ||
    (filenames.has("icons/icon-192x192.png") && filenames.has("icons/icon-512x512.png")) ||
    (filenames.has("public/android-chrome-192x192.png") && filenames.has("public/android-chrome-512x512.png"));
  const hasMaskable = [...filenames].some((name) => name.includes("maskable-icon-") && name.endsWith(".png"));
  const hasMonochrome = [...filenames].some((name) => name.includes("monochrome-icon-") && name.endsWith(".png"));

  return { filenames, basenameSet, hasFavicon, hasSearchPng, hasHtmlSnippet, hasManifest, hasApple, hasPwa, hasMaskable, hasMonochrome };
}

function expandHex(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

function hexToRgb(value: string): { r: number; g: number; b: number } | null {
  const expanded = expandHex(value);
  if (!expanded) return null;
  return {
    r: Number.parseInt(expanded.slice(1, 3), 16),
    g: Number.parseInt(expanded.slice(3, 5), 16),
    b: Number.parseInt(expanded.slice(5, 7), 16),
  };
}

function channelLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b);
}

export function contrastRatio(foreground: string, background: string): number | null {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  if (fg === null || bg === null) return null;
  const light = Math.max(fg, bg);
  const dark = Math.min(fg, bg);
  return (light + 0.05) / (dark + 0.05);
}

export function bestReadableColor(background: string): "#000000" | "#ffffff" {
  const black = contrastRatio("#000000", background) ?? 0;
  const white = contrastRatio("#ffffff", background) ?? 0;
  return black >= white ? "#000000" : "#ffffff";
}

function expectedPathPrefix(input: FaviconInput): string {
  if (input.projectProfile === "pwa-complete" || input.exportPack === "pwa") return "/icons/";
  return "/";
}

function normalizedInputPath(input: FaviconInput): string {
  return normalizePathPrefix(input.pathPrefix);
}

export function createReadinessChecks(input: FaviconInput, generated: GeneratedAsset[]): ReadinessCheck[] {
  const signals = getOutputSignals(generated);
  const sourceReady = input.sourceMode === "image" ? Boolean(input.imageDataUrl) : input.sourceMode === "svg" ? Boolean(input.svgText.trim() && isSafeSvgMarkup(input.svgText)) : true;
  const sourceLargeEnough = input.imageMeta ? Math.min(input.imageMeta.width, input.imageMeta.height) >= 512 : input.sourceMode !== "image" || !input.imageDataUrl ? sourceReady : true;
  const transform = input.sourceTransform ?? { zoom: 100, offsetX: 0, offsetY: 0, rotation: 0, fitMode: input.cropMode };
  const framingStable = Math.abs(transform.offsetX) <= 20 && Math.abs(transform.offsetY) <= 20 && Math.abs(transform.rotation) <= 35;
  const textLength = input.sourceMode === "text" ? input.text.trim().length : input.sourceMode === "emoji" ? Array.from(input.emoji.trim()).length : 1;
  const smallSizeReady = sourceReady && textLength <= 2 && input.scale <= 108 && transform.zoom <= 140 && input.padding >= 12;
  const edgeSafe = input.padding >= (input.shape === "circle" ? 20 : 16) && input.scale <= 105 && framingStable;
  const contrast = input.transparentBackground || (input.sourceMode !== "text" && input.sourceMode !== "emoji") ? 4.5 : contrastRatio(input.foregroundColor, input.backgroundColor);
  const contrastReady = contrast === null ? false : contrast >= 4.5;
  const appleReady = signals.hasApple && !input.transparentBackground;
  const pwaReady = signals.hasPwa && signals.hasManifest && Boolean(input.siteName.trim()) && Boolean(input.shortName.trim());
  const maskableReady = signals.hasMaskable && input.includeMaskable && input.padding >= 16;
  const installReady = signals.hasHtmlSnippet && signals.hasManifest && normalizedInputPath(input) === expectedPathPrefix(input);
  const cacheReady = signals.hasFavicon && signals.hasHtmlSnippet;

  return [
    {
      id: "source-quality",
      category: "source",
      label: "Source quality",
      passed: sourceReady && sourceLargeEnough,
      points: sourceReady && sourceLargeEnough ? 12 : sourceReady ? 7 : 0,
      maxPoints: 12,
      detail: sourceReady ? (sourceLargeEnough ? "Source is ready for high-resolution exports." : "Use at least 512×512 for the sharpest app icons.") : "Choose an image, safe SVG, initials, or emoji before exporting.",
    },
    {
      id: "small-size-legibility",
      category: "legibility",
      label: "Small-size legibility",
      passed: smallSizeReady,
      points: smallSizeReady ? 12 : 6,
      maxPoints: 12,
      detail: smallSizeReady ? "The artwork is simple enough for 16×16 and 32×32 previews." : "Favicons need simple artwork, short text, safe padding, and moderate scale.",
    },
    {
      id: "edge-safety",
      category: "edge-safety",
      label: "Edge safety",
      passed: edgeSafe,
      points: edgeSafe ? 10 : 4,
      maxPoints: 10,
      detail: edgeSafe ? "Important artwork has breathing room around the edges." : "Increase padding, reduce scale, or center source framing so mobile launchers do not crop important details.",
    },
    {
      id: "contrast",
      category: "contrast",
      label: "Contrast",
      passed: contrastReady,
      points: contrastReady ? 10 : 4,
      maxPoints: 10,
      detail: contrastReady ? "Foreground and background contrast is readable for small icon sizes." : "Text and emoji icons need stronger contrast against the chosen background.",
    },
    {
      id: "apple-ios",
      category: "apple",
      label: "Apple/iOS readiness",
      passed: appleReady,
      points: appleReady ? 10 : signals.hasApple ? 6 : 0,
      maxPoints: 10,
      detail: appleReady ? "Apple touch icon is present with a solid background." : "iOS home-screen icons work best with a solid background and apple-touch-icon output.",
    },
    {
      id: "pwa-readiness",
      category: "pwa",
      label: "PWA readiness",
      passed: pwaReady,
      points: pwaReady ? 12 : signals.hasPwa ? 7 : 0,
      maxPoints: 12,
      detail: pwaReady ? "Manifest, app names, and 192/512 icons are ready for install surfaces." : "Installable apps need manifest metadata plus 192×192 and 512×512 icons.",
    },
    {
      id: "maskable-readiness",
      category: "maskable",
      label: "Maskable readiness",
      passed: maskableReady,
      points: maskableReady ? 10 : signals.hasMaskable ? 6 : 2,
      maxPoints: 10,
      detail: maskableReady ? "Maskable icons are included with enough safe padding." : "Add maskable icons and keep important artwork inside the safe area.",
    },
    {
      id: "install-readiness",
      category: "install",
      label: "Install readiness",
      passed: installReady,
      points: installReady ? 12 : signals.hasHtmlSnippet ? 7 : 0,
      maxPoints: 12,
      detail: installReady ? "Generated snippets and path prefix match the selected project profile." : "Review path prefix, project type, manifest, and generated snippets before install.",
    },
    {
      id: "cache-readiness",
      category: "cache",
      label: "Cache troubleshooting",
      passed: cacheReady,
      points: cacheReady ? 8 : 3,
      maxPoints: 8,
      detail: cacheReady ? "The package includes the files needed for reliable favicon cache refreshes." : "Include favicon.ico and a clear install snippet so cache issues are easier to debug.",
    },
  ];
}

export function createSmartQualityIssues(input: FaviconInput, generated: GeneratedAsset[]): SmartQualityIssue[] {
  const signals = getOutputSignals(generated);
  const issues: SmartQualityIssue[] = [];
  const sourceReady = input.sourceMode === "image" ? Boolean(input.imageDataUrl) : input.sourceMode === "svg" ? Boolean(input.svgText.trim() && isSafeSvgMarkup(input.svgText)) : true;
  const transform = input.sourceTransform ?? { zoom: 100, offsetX: 0, offsetY: 0, rotation: 0, fitMode: input.cropMode };
  const framingAdjusted = Math.abs(transform.offsetX) > 25 || Math.abs(transform.offsetY) > 25 || Math.abs(transform.rotation) > 45;
  const textValue = input.sourceMode === "emoji" ? input.emoji.trim() : input.text.trim();
  const textLength = Array.from(textValue).length;
  const contrast = !input.transparentBackground && (input.sourceMode === "text" || input.sourceMode === "emoji") ? contrastRatio(input.foregroundColor, input.backgroundColor) : null;
  const expectedPrefix = expectedPathPrefix(input);
  const normalizedPrefix = normalizedInputPath(input);

  if (!sourceReady) {
    issues.push({ id: "source-missing", category: "source", severity: "danger", title: "Source is not ready", message: "Pick an image, paste a safe SVG, type initials, or select an emoji before trusting the export package." });
  } else if (input.imageMeta && Math.min(input.imageMeta.width, input.imageMeta.height) < 512) {
    issues.push({ id: "source-resolution-warning", category: "source", severity: "warning", title: "Source below 512×512", message: "The exported 512×512 app icons may look soft. Use a larger source when available." });
  } else {
    issues.push({ id: "source-ready", category: "source", severity: "success", title: "Source quality looks good", message: "The current source can be converted into browser, Apple, and PWA icon assets." });
  }

  if ((input.sourceMode === "image" || input.sourceMode === "svg") && framingAdjusted) {
    issues.push({ id: "source-framing-offset", category: "source", severity: "info", title: "Source framing is heavily adjusted", message: "Large offsets or rotation can crop important artwork in small icons. Check the source framing preview before export.", action: { id: "center-artwork", label: "Center artwork" } });
  }

  if (input.sourceMode === "text" && textLength > 2) {
    issues.push({ id: "text-too-long", category: "legibility", severity: "warning", title: "Text may disappear at 16px", message: "One or two characters usually work best for favicons. Longer labels become unreadable in browser tabs.", action: { id: "simplify-text", label: "Simplify text" } });
  } else if (input.sourceMode === "emoji" && textLength > 2) {
    issues.push({ id: "emoji-too-long", category: "legibility", severity: "warning", title: "Use one emoji", message: "Multiple emoji characters usually become too small inside favicon and launcher previews.", action: { id: "simplify-text", label: "Keep first emoji" } });
  } else if (input.scale > 112) {
    issues.push({ id: "scale-too-high", category: "legibility", severity: "warning", title: "Artwork is scaled too large", message: "Very large artwork can lose detail and feel cropped at 16×16.", action: { id: "center-artwork", label: "Center artwork" } });
  } else {
    issues.push({ id: "legibility-ready", category: "legibility", severity: "success", title: "Small-size setup looks readable", message: "The current text/emoji length, scale, and spacing are reasonable for tiny favicons." });
  }

  if (input.padding < (input.shape === "circle" ? 20 : 16)) {
    issues.push({ id: "edge-padding-low", category: "edge-safety", severity: "warning", title: "Artwork is close to the edge", message: "Mobile launchers and maskable icon shapes may crop details near the outer edge.", action: { id: "add-safe-padding", label: "Add safe padding" } });
  } else {
    issues.push({ id: "edge-safe", category: "edge-safety", severity: "success", title: "Edge spacing is safe", message: "Important details have enough breathing room for rounded and adaptive icon masks." });
  }

  if (contrast !== null && contrast < 4.5) {
    issues.push({ id: "contrast-low", category: "contrast", severity: contrast < 3 ? "danger" : "warning", title: "Contrast is weak", message: `Estimated contrast is ${contrast.toFixed(1)}:1. Small icons need strong foreground/background separation.`, action: { id: "increase-contrast", label: "Increase contrast" } });
  } else if (input.transparentBackground) {
    issues.push({ id: "contrast-transparent", category: "contrast", severity: "info", title: "Transparent background depends on surface", message: "Transparent favicons can look different on dark tabs, light tabs, iOS, and PWA install screens.", action: { id: "use-solid-background", label: "Use solid background" } });
  } else {
    issues.push({ id: "contrast-good", category: "contrast", severity: "success", title: "Contrast looks usable", message: "The chosen colors should remain visible in small browser and app surfaces." });
  }

  if (input.transparentBackground) {
    issues.push({ id: "ios-transparent-risk", category: "apple", severity: "warning", title: "Transparent Apple icon risk", message: "iOS icons are more predictable with a solid background. Transparency can look inconsistent on home screens.", action: { id: "use-solid-background", label: "Use solid background" } });
  } else if (!signals.hasApple) {
    issues.push({ id: "apple-missing", category: "apple", severity: "warning", title: "Apple touch icon missing", message: "Add an Apple touch icon so iPhone and iPad home-screen shortcuts look polished.", action: { id: "use-recommended-pwa-pair", label: "Use full icon pack" } });
  } else {
    issues.push({ id: "apple-ready", category: "apple", severity: "success", title: "Apple/iOS icon ready", message: "The export contains Apple touch icon coverage with the current background settings." });
  }

  if (!signals.hasPwa || !signals.hasManifest) {
    issues.push({ id: "pwa-missing-pair", category: "pwa", severity: "warning", title: "PWA install assets incomplete", message: "Install prompts need a manifest plus 192×192 and 512×512 PNG icons.", action: { id: "use-recommended-pwa-pair", label: "Use PWA pair" } });
  } else if (!input.siteName.trim() || !input.shortName.trim()) {
    issues.push({ id: "pwa-names-missing", category: "pwa", severity: "warning", title: "Manifest names incomplete", message: "PWA launchers use name and short_name in install prompts and app grids.", action: { id: "fill-app-names", label: "Fill names" } });
  } else if (input.display === "browser" && (input.projectProfile === "pwa-complete" || input.exportPack === "pwa")) {
    issues.push({ id: "pwa-display-browser", category: "pwa", severity: "info", title: "PWA display is browser", message: "Installable apps usually feel more app-like with standalone display mode.", action: { id: "make-installable", label: "Use standalone" } });
  } else {
    issues.push({ id: "pwa-ready", category: "pwa", severity: "success", title: "PWA metadata ready", message: "The manifest and required app icon sizes are present." });
  }

  if (!input.includeMaskable || !signals.hasMaskable) {
    issues.push({ id: "maskable-disabled", category: "maskable", severity: "warning", title: "Maskable icons are not fully enabled", message: "Adaptive Android launchers can crop normal icons. Maskable icons protect the important center artwork.", action: { id: "enable-maskable", label: "Enable maskable" } });
  } else if (input.padding < 16) {
    issues.push({ id: "maskable-padding-low", category: "maskable", severity: "warning", title: "Maskable safe area is tight", message: "Add more padding so important details stay inside the safe area.", action: { id: "add-safe-padding", label: "Add safe padding" } });
  } else {
    issues.push({ id: "maskable-ready", category: "maskable", severity: "success", title: "Maskable support ready", message: "Maskable icon output is included and the artwork has safe spacing." });
  }

  if (normalizedPrefix !== expectedPrefix) {
    issues.push({ id: "path-prefix-mismatch", category: "install", severity: "warning", title: "Path prefix may not match this profile", message: `Selected profile expects ${expectedPrefix}, but current prefix normalizes to ${normalizedPrefix}.`, action: { id: "reset-path-prefix", label: "Reset path prefix" } });
  } else if (!signals.hasHtmlSnippet) {
    issues.push({ id: "install-snippet-missing", category: "install", severity: "warning", title: "Install snippet missing", message: "Generate or switch to an export pack that includes installation code." });
  } else {
    issues.push({ id: "install-ready", category: "install", severity: "success", title: "Install setup ready", message: "Project profile, path prefix, and generated install snippets are aligned." });
  }

  issues.push({ id: "cache-note", category: "cache", severity: "info", title: "Cache reminder", message: "Browsers cache favicons aggressively. After installing, test in a private window or rename files/add a versioned deploy if the old icon appears." });

  return issues;
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
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function issueId(id: string, scope: string): string {
  return `${id}-${scope.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "input"}`;
}

function isTextLikeFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".json") || lower.endsWith(".webmanifest") || lower.endsWith(".xml") || lower.endsWith(".html") || lower.endsWith(".htm") || lower.endsWith(".txt") || lower.endsWith(".md");
}

function isManifestFileName(name: string): boolean {
  const base = filenameBasename(name);
  return base === "site.webmanifest" || base === "manifest.webmanifest" || base === "manifest.json" || base.endsWith(".webmanifest");
}

function isHtmlFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".html") || lower.endsWith(".htm") || lower.includes("html-head") || lower.includes("head-snippet");
}

function getTagAttribute(tag: string, attribute: string): string | null {
  const pattern = new RegExp(`${attribute}\\s*=\\s*([\"'])(.*?)\\1`, "i");
  const match = tag.match(pattern);
  return match?.[2]?.trim() ?? null;
}

function htmlLinkReferences(text: string): string[] {
  return [...text.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => getTagAttribute(match[0], "href"))
    .filter((value): value is string => Boolean(value) && !value.startsWith("http") && !value.startsWith("data:") && !value.startsWith("#"));
}

function hasPngAlpha(fileBytes: ArrayBuffer): boolean | null {
  const bytes = new Uint8Array(fileBytes);
  if (bytes.length < 26) return null;
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!pngSignature.every((value, index) => bytes[index] === value)) return null;
  const colorType = bytes[25];
  if (colorType === 4 || colorType === 6) return true;
  const text = new TextDecoder().decode(bytes.slice(8, Math.min(bytes.length, 512 * 1024)));
  if (text.includes("tRNS")) return true;
  return false;
}

function analyzeManifestText(text: string, sourceLabel: string, filenames?: Set<string>, basenames?: Set<string>): FileValidationIssue[] {
  const issues: FileValidationIssue[] = [];
  const manifest = tryParseManifest(text);
  if (!manifest) {
    return [{ id: issueId("manifest-invalid", sourceLabel), level: "error", title: "Manifest is invalid", message: `${sourceLabel} could not be parsed as JSON.` }];
  }

  issues.push({ id: issueId("manifest-valid", sourceLabel), level: "success", title: "Manifest JSON valid", message: `${sourceLabel} parsed successfully.` });

  if (manifest.name && manifest.short_name) {
    issues.push({ id: issueId("manifest-names-ok", sourceLabel), level: "success", title: "Manifest names present", message: "Both name and short_name are included for app launchers and install prompts." });
  } else {
    issues.push({ id: issueId("manifest-names", sourceLabel), level: "warning", title: "Manifest names incomplete", message: "Include both name and short_name so install prompts and app launchers have clear labels." });
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  if (!icons.length) {
    issues.push({ id: issueId("manifest-icons-missing", sourceLabel), level: "error", title: "Manifest has no icons", message: "Add icons[] entries for at least 192×192 and 512×512 PNG assets." });
  } else {
    issues.push({ id: issueId("manifest-icons-found", sourceLabel), level: "success", title: "Manifest icons found", message: `${icons.length} icon entr${icons.length === 1 ? "y" : "ies"} found in the manifest.` });
  }

  const has192 = icons.some((icon) => icon.sizes?.includes("192x192"));
  const has512 = icons.some((icon) => icon.sizes?.includes("512x512"));
  if (has192 && has512) {
    issues.push({ id: issueId("manifest-core-sizes-ok", sourceLabel), level: "success", title: "Core PWA sizes present", message: "The manifest references both 192×192 and 512×512 icons." });
  } else {
    issues.push({ id: issueId("manifest-core-sizes", sourceLabel), level: "warning", title: "Manifest core sizes incomplete", message: "A reliable PWA manifest should reference both 192×192 and 512×512 icons." });
  }

  const hasMaskable = icons.some((icon) => icon.purpose?.toLowerCase().includes("maskable"));
  issues.push(hasMaskable
    ? { id: issueId("manifest-maskable-ok", sourceLabel), level: "success", title: "Maskable purpose found", message: "At least one manifest icon is marked for adaptive launcher masks." }
    : { id: issueId("manifest-maskable", sourceLabel), level: "info", title: "No maskable purpose", message: "Add purpose: maskable for Android/PWA adaptive launcher support." });

  const unsafeIconPaths = icons.filter((icon) => icon.src && /\s/.test(icon.src));
  if (unsafeIconPaths.length) {
    issues.push({ id: issueId("manifest-unsafe-paths", sourceLabel), level: "warning", title: "Icon paths contain spaces", message: `Avoid spaces in manifest icon paths: ${unsafeIconPaths.map((icon) => icon.src).join(", ")}.` });
  }

  const missingTypeHints = icons.filter((icon) => icon.src?.endsWith(".png") && icon.type !== "image/png");
  if (missingTypeHints.length) {
    issues.push({ id: issueId("manifest-type-hints", sourceLabel), level: "info", title: "PNG type hints missing", message: "Adding type: image/png to PNG manifest icons helps validators and DevTools display clearer diagnostics." });
  }

  if (!manifest.theme_color || !isHexColor(manifest.theme_color)) {
    issues.push({ id: issueId("manifest-theme", sourceLabel), level: "warning", title: "Theme color missing or invalid", message: "Use a valid hex theme_color so mobile browsers and install prompts can style the app surface." });
  } else {
    issues.push({ id: issueId("manifest-theme-ok", sourceLabel), level: "success", title: "Theme color valid", message: "theme_color is present and uses a valid hex value." });
  }

  if (!manifest.background_color || !isHexColor(manifest.background_color)) {
    issues.push({ id: issueId("manifest-background", sourceLabel), level: "warning", title: "Background color missing or invalid", message: "Use a valid hex background_color to avoid unpredictable install splash or launcher backgrounds." });
  } else {
    issues.push({ id: issueId("manifest-background-ok", sourceLabel), level: "success", title: "Background color valid", message: "background_color is present and uses a valid hex value." });
  }

  if (!manifest.display || manifest.display === "browser") {
    issues.push({ id: issueId("manifest-display", sourceLabel), level: "info", title: "Display mode is browser or missing", message: "Installable PWAs usually feel better with standalone or minimal-ui display mode." });
  }

  if (filenames && basenames) {
    const missingIconRefs = icons.filter((icon) => icon.src && !icon.src.startsWith("http") && !manifestIconReferenceExists(icon.src, filenames, basenames));
    if (missingIconRefs.length) {
      issues.push({ id: issueId("manifest-missing-icon-files", sourceLabel), level: "error", title: "Manifest references missing files", message: `The package does not appear to include: ${missingIconRefs.map((icon) => icon.src).join(", ")}.` });
    } else if (icons.length) {
      issues.push({ id: issueId("manifest-paths-ok", sourceLabel), level: "success", title: "Manifest icon paths look valid", message: "Manifest icon references match files found in the package." });
    }
  }

  return issues;
}

function analyzeHtmlHeadText(text: string, sourceLabel: string, filenames?: Set<string>, basenames?: Set<string>): FileValidationIssue[] {
  const issues: FileValidationIssue[] = [];
  const linkTags = [...text.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const metaTags = [...text.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);

  if (!linkTags.length && !metaTags.length) {
    return [{ id: issueId("html-empty", sourceLabel), level: "error", title: "No HTML head tags found", message: "Paste the <link> and <meta> tags from your document head or favicon snippet." }];
  }

  const relValues = linkTags.map((tag) => (getTagAttribute(tag, "rel") ?? "").toLowerCase());
  const hasIcon = relValues.some((rel) => rel.split(/\s+/).includes("icon") || rel.includes("shortcut icon"));
  const hasApple = relValues.some((rel) => rel.includes("apple-touch-icon"));
  const hasManifest = relValues.some((rel) => rel === "manifest" || rel.split(/\s+/).includes("manifest"));
  const hasThemeColor = metaTags.some((tag) => (getTagAttribute(tag, "name") ?? "").toLowerCase() === "theme-color");

  issues.push(hasIcon
    ? { id: issueId("html-icon-ok", sourceLabel), level: "success", title: "Browser favicon link found", message: "The HTML head includes a favicon/icon link." }
    : { id: issueId("html-icon-missing", sourceLabel), level: "warning", title: "Browser favicon link missing", message: "Add a rel=icon link so browser tabs can find the favicon reliably." });

  issues.push(hasApple
    ? { id: issueId("html-apple-ok", sourceLabel), level: "success", title: "Apple touch icon link found", message: "The HTML head includes iOS home-screen icon support." }
    : { id: issueId("html-apple-missing", sourceLabel), level: "warning", title: "Apple touch icon link missing", message: "Add rel=apple-touch-icon for iPhone and iPad home-screen shortcuts." });

  issues.push(hasManifest
    ? { id: issueId("html-manifest-ok", sourceLabel), level: "success", title: "Manifest link found", message: "The HTML head links to a web app manifest." }
    : { id: issueId("html-manifest-missing", sourceLabel), level: "warning", title: "Manifest link missing", message: "Add rel=manifest when you want PWA/app install metadata." });

  issues.push(hasThemeColor
    ? { id: issueId("html-theme-ok", sourceLabel), level: "success", title: "Theme color meta found", message: "The snippet includes a theme-color meta tag for browser UI tinting." }
    : { id: issueId("html-theme-missing", sourceLabel), level: "info", title: "Theme color meta missing", message: "Add meta name=theme-color for better mobile browser polish." });

  const refs = htmlLinkReferences(text);
  const unsafeRefs = refs.filter((ref) => /\s/.test(ref));
  if (unsafeRefs.length) {
    issues.push({ id: issueId("html-unsafe-refs", sourceLabel), level: "warning", title: "Linked paths contain spaces", message: `Avoid spaces in asset URLs: ${unsafeRefs.join(", ")}.` });
  }

  if (filenames && basenames && refs.length) {
    const missingRefs = refs.filter((ref) => !manifestIconReferenceExists(ref, filenames, basenames));
    if (missingRefs.length) {
      issues.push({ id: issueId("html-missing-files", sourceLabel), level: "warning", title: "HTML references unmatched files", message: `These linked paths were not found in the package: ${missingRefs.join(", ")}. This may be expected if files are served from another folder.` });
    } else {
      issues.push({ id: issueId("html-paths-ok", sourceLabel), level: "success", title: "HTML linked paths look valid", message: "The favicon, Apple, and manifest links map to files found in the package." });
    }
  }

  return issues;
}

export function validateManifestText(text: string): FileValidationIssue[] {
  if (!text.trim()) {
    return [{ id: "manifest-paste-empty", level: "info", title: "Paste manifest JSON", message: "Paste a site.webmanifest or manifest.json file to inspect PWA metadata, icons, colors, and maskable support." }];
  }
  return analyzeManifestText(text, "Pasted manifest");
}

export function validateHtmlHeadText(text: string): FileValidationIssue[] {
  if (!text.trim()) {
    return [{ id: "html-paste-empty", level: "info", title: "Paste HTML head tags", message: "Paste favicon <link> and <meta> tags to inspect browser, Apple, manifest, and theme-color coverage." }];
  }
  return analyzeHtmlHeadText(text, "Pasted HTML head");
}

export function validateWebsiteUrlInput(url: string): FileValidationIssue[] {
  const value = url.trim();
  if (!value) {
    return [{ id: "url-empty", level: "info", title: "Enter a website URL", message: "Paste a live website URL to scan its HTML head, manifest, and linked favicon assets through the backend checker." }];
  }

  try {
    const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("Unsupported protocol");
  } catch {
    return [{ id: "url-invalid", level: "error", title: "Invalid URL", message: "Enter a valid website URL using http:// or https://." }];
  }

  return [];
}

export async function validateExistingFiles(files: File[]): Promise<FileValidationIssue[]> {
  if (!files.length) {
    return [{ id: "validator-empty", level: "info", title: "Upload files to validate", message: "Drop favicon files, manifest JSON, HTML snippets, or an exported ZIP package to inspect common issues." }];
  }

  const expandedNames: string[] = [];
  const textCandidates: Array<{ name: string; text: string }> = [];
  const materializedFiles: File[] = [];
  const zipSummaries: string[] = [];
  let unreadableCompressedTextEntries = 0;

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        const zipEntries = await readZipEntries(file);
        expandedNames.push(...zipEntries.map((entry) => entry.name));
        zipEntries.forEach((entry) => {
          if (entry.text !== undefined) textCandidates.push({ name: entry.name, text: entry.text });
          if (entry.text === undefined && isTextLikeFileName(entry.name) && entry.compressionMethod !== 0) unreadableCompressedTextEntries += 1;
        });
        zipSummaries.push(`${file.name}: ${zipEntries.length} entries`);
      } catch {
        expandedNames.push(file.name);
        zipSummaries.push(`${file.name}: could not read entries`);
      }
    } else {
      expandedNames.push(file.name);
      materializedFiles.push(file);
      if (isTextLikeFileName(file.name) && file.size <= 512 * 1024) {
        textCandidates.push({ name: file.name, text: await file.text() });
      }
    }
  }

  const filenames = new Set(expandedNames.map((name) => normalizeGeneratedName(name)));
  const basenames = new Set(expandedNames.map((name) => filenameBasename(name)));
  const lowerNames = new Set(expandedNames.map((name) => name.toLowerCase().split("/").pop() ?? name.toLowerCase()));
  const issues: FileValidationIssue[] = [];

  if (zipSummaries.length) {
    issues.push({ id: "zip-read", level: expandedNames.length ? "success" : "warning", title: "ZIP package scanned", message: zipSummaries.join(" · ") });
  }

  if (unreadableCompressedTextEntries) {
    issues.push({ id: "zip-compressed-text", level: "info", title: "Some ZIP text files were not readable", message: `${unreadableCompressedTextEntries} compressed text entr${unreadableCompressedTextEntries === 1 ? "y" : "ies"} could only be checked by filename. This lightweight browser ZIP reader reads uncompressed text entries.` });
  }

  const duplicateNames = expandedNames
    .map((name) => normalizeGeneratedName(name))
    .filter((name, index, names) => names.indexOf(name) !== index);
  issues.push(duplicateNames.length
    ? { id: "existing-duplicates", level: "warning", title: "Duplicate package paths", message: `Duplicate path(s): ${[...new Set(duplicateNames)].join(", ")}. Remove duplicates to avoid unpredictable deploy output.` }
    : { id: "existing-unique", level: "success", title: "No duplicate paths", message: "Every uploaded or ZIP entry path appears unique." });

  const unsafeNames = expandedNames.filter((name) => /\s|[^\w./@-]/.test(name));
  if (unsafeNames.length) {
    issues.push({ id: "unsafe-filenames", level: "warning", title: "Some filenames may be unsafe", message: `Prefer lowercase, hyphenated paths without spaces or special characters. Review: ${unsafeNames.slice(0, 6).join(", ")}${unsafeNames.length > 6 ? "…" : ""}` });
  }

  if (lowerNames.has("favicon.ico")) {
    issues.push({ id: "has-ico", level: "success", title: "favicon.ico found", message: "Browser fallback favicon is present." });
  } else {
    issues.push({ id: "missing-ico", level: "warning", title: "Missing favicon.ico", message: "Add favicon.ico for broad browser and legacy fallback support." });
  }

  const hasPngFavicons = [...lowerNames].some((name) => /favicon-(16x16|32x32|48x48)\.png|icon-48x48\.png/.test(name));
  issues.push(hasPngFavicons
    ? { id: "has-png-favicons", level: "success", title: "PNG favicon sizes found", message: "The package includes small PNG favicon assets for modern browsers and search surfaces." }
    : { id: "missing-png-favicons", level: "info", title: "Small PNG favicons not obvious", message: "Consider including 16×16, 32×32, and/or 48×48 PNG fallbacks alongside favicon.ico." });

  const hasApple = [...lowerNames].some((name) => name.includes("apple-touch-icon") || name === "apple-icon.png");
  issues.push(hasApple
    ? { id: "has-apple", level: "success", title: "Apple icon found", message: "An Apple touch icon appears to be present." }
    : { id: "missing-apple", level: "warning", title: "Missing Apple icon", message: "Add apple-touch-icon.png or apple-touch-icon-180x180.png for iOS shortcuts." });

  const has192 = [...lowerNames].some((name) => name.includes("192") && name.endsWith(".png"));
  const has512 = [...lowerNames].some((name) => name.includes("512") && name.endsWith(".png"));
  issues.push(has192 && has512
    ? { id: "has-pwa", level: "success", title: "PWA sizes found", message: "192×192 and 512×512 PNG icons appear to be present." }
    : { id: "missing-pwa", level: "warning", title: "Missing PWA icon pair", message: "Add both 192×192 and 512×512 PNG icons for install prompts." });

  const manifestCandidates = textCandidates.filter((candidate) => isManifestFileName(candidate.name) || candidate.text.trim().startsWith("{"));
  if (manifestCandidates.length) {
    manifestCandidates.slice(0, 3).forEach((candidate) => issues.push(...analyzeManifestText(candidate.text, candidate.name, filenames, basenames)));
  } else if ([...lowerNames].some((name) => name.includes("manifest"))) {
    issues.push({ id: "manifest-unreadable", level: "info", title: "Manifest file found but not parsed", message: "A manifest-like filename exists, but its JSON could not be read from the uploaded package. Upload it directly or use the Manifest tab for full validation." });
  } else {
    issues.push({ id: "missing-manifest", level: "warning", title: "Missing web manifest", message: "Add site.webmanifest or manifest.webmanifest for PWA/app icon metadata." });
  }

  const htmlCandidates = textCandidates.filter((candidate) => isHtmlFileName(candidate.name) || /<link\b|<meta\b/i.test(candidate.text));
  if (htmlCandidates.length) {
    htmlCandidates.slice(0, 3).forEach((candidate) => issues.push(...analyzeHtmlHeadText(candidate.text, candidate.name, filenames, basenames)));
  } else {
    issues.push({ id: "html-snippet-missing", level: "info", title: "No HTML head snippet found", message: "Upload or paste an HTML head snippet to verify rel=icon, apple-touch-icon, manifest, and theme-color links." });
  }

  const applePng = materializedFiles.find((file) => (file.name.toLowerCase().includes("apple-touch-icon") || file.name.toLowerCase() === "apple-icon.png") && file.name.toLowerCase().endsWith(".png"));
  if (applePng) {
    const hasAlpha = hasPngAlpha(await applePng.arrayBuffer());
    if (hasAlpha) {
      issues.push({ id: "apple-alpha-risk", level: "warning", title: "Apple icon may be transparent", message: "The uploaded Apple PNG appears to include an alpha channel. iOS home-screen icons are more predictable with a solid background." });
    }
  }

  const hasMaskableByName = expandedNames.some((name) => name.toLowerCase().includes("maskable"));
  if (!hasMaskableByName && !issues.some((issue) => issue.id.includes("manifest-maskable-ok"))) {
    issues.push({ id: "maskable-not-detected", level: "info", title: "Maskable icon not detected", message: "For adaptive Android/PWA launchers, include a maskable icon file and a manifest icon entry with purpose: maskable." });
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
