import { validateHtmlHeadText, validateManifestText } from "../../../tools/favicon-app-icon-generator/validation";
import type { FileValidationIssue, ParsedManifest } from "../../../tools/favicon-app-icon-generator/types";

export type WebsiteFaviconCheckResult = {
  ok: boolean;
  inputUrl: string;
  resolvedUrl?: string;
  manifestUrl?: string;
  checkedAssets: number;
  scannedAt: string;
  issues: FileValidationIssue[];
};

type LinkCandidate = {
  tag: string;
  rel: string;
  href: string;
  absoluteUrl: string;
};

type AssetCheck = {
  url: string;
  ok: boolean;
  status?: number;
  contentType?: string;
  error?: string;
};

const FETCH_TIMEOUT_MS = 9000;
const MAX_TEXT_BYTES = 700_000;
const MAX_ASSET_CHECKS = 12;
const USER_AGENT = "DarmaFaviconChecker/1.0 (+https://darma.local/tools/favicon-app-icon-generator)";

function issue(id: string, level: FileValidationIssue["level"], title: string, message: string): FileValidationIssue {
  return { id, level, title, message };
}

function normalizeIssueId(id: string) {
  return `url-${id}`.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
}

function withUrlIssuePrefix(issues: FileValidationIssue[], prefix: string): FileValidationIssue[] {
  return issues.map((item) => ({ ...item, id: normalizeIssueId(`${prefix}-${item.id}`) }));
}

function normalizeWebsiteUrl(value: string): URL {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http and https URLs can be scanned.");
  url.hash = "";
  return url;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...init,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/json,application/manifest+json,image/*,*/*;q=0.8",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readLimitedText(response: Response, maxBytes = MAX_TEXT_BYTES): Promise<string> {
  const body = await response.arrayBuffer();
  const bytes = new Uint8Array(body.slice(0, maxBytes));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function extractHead(html: string): string {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  return match?.[1] ?? html.slice(0, 220_000);
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (!name || name === "link" || name === "meta") continue;
    attrs[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function absolutizeUrl(ref: string, baseUrl: string): string | null {
  const trimmed = ref.trim();
  if (!trimmed || trimmed.startsWith("#") || /^data:/i.test(trimmed) || /^javascript:/i.test(trimmed) || /^mailto:/i.test(trimmed)) return null;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractLinksFromHead(head: string, baseUrl: string): LinkCandidate[] {
  const tags = head.match(/<link\b[^>]*>/gi) ?? [];
  const links: LinkCandidate[] = [];

  tags.forEach((tag) => {
    const attrs = parseAttributes(tag);
    const rel = attrs.rel?.toLowerCase() ?? "";
    const href = attrs.href ?? "";
    const absoluteUrl = absolutizeUrl(href, baseUrl);
    if (!rel || !href || !absoluteUrl) return;
    links.push({ tag, rel, href, absoluteUrl });
  });

  return links;
}

function hasRel(link: LinkCandidate, relName: string): boolean {
  return link.rel.split(/\s+/).includes(relName);
}

function uniqueUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))];
}

function parseManifest(text: string): ParsedManifest | null {
  try {
    return JSON.parse(text) as ParsedManifest;
  } catch {
    return null;
  }
}

function manifestIconUrls(manifest: ParsedManifest | null, manifestUrl: string): string[] {
  if (!manifest?.icons?.length) return [];
  return manifest.icons
    .map((icon) => icon.src)
    .filter((src): src is string => Boolean(src))
    .map((src) => absolutizeUrl(src, manifestUrl))
    .filter((url): url is string => Boolean(url));
}

async function checkAssetReachable(url: string): Promise<AssetCheck> {
  try {
    let response = await fetchWithTimeout(url, { method: "HEAD" }, 6500);
    if (response.status === 405 || response.status === 403 || response.status === 501) {
      response = await fetchWithTimeout(url, { method: "GET", headers: { range: "bytes=0-0" } }, 6500);
    }

    return {
      url,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type") ?? undefined,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error ? error.message : "Unable to fetch asset.",
    };
  }
}

function summarizeAssetChecks(checks: AssetCheck[]): FileValidationIssue[] {
  if (!checks.length) {
    return [issue("url-no-linked-assets", "warning", "No linked favicon assets found", "The scanned page did not expose favicon, Apple touch icon, or manifest icon URLs that could be checked.")];
  }

  const failed = checks.filter((check) => !check.ok);
  const suspiciousTypes = checks.filter((check) => check.ok && check.contentType && !/(image|icon|png|svg|json|manifest|octet-stream)/i.test(check.contentType));
  const issues: FileValidationIssue[] = [];

  issues.push(failed.length
    ? issue("url-assets-missing", "warning", "Some linked icon assets are not reachable", `${failed.length}/${checks.length} checked asset(s) failed. Review: ${failed.slice(0, 5).map((item) => `${item.url}${item.status ? ` (${item.status})` : ""}`).join(", ")}.`)
    : issue("url-assets-ok", "success", "Linked icon assets are reachable", `${checks.length} favicon, Apple, manifest, or PWA icon asset(s) responded successfully.`));

  if (suspiciousTypes.length) {
    issues.push(issue("url-suspicious-types", "info", "Some assets returned unusual content types", `Review content-type for: ${suspiciousTypes.slice(0, 4).map((item) => `${item.url} → ${item.contentType}`).join(", ")}.`));
  }

  return issues;
}

export async function checkWebsiteFavicons(inputUrl: string): Promise<WebsiteFaviconCheckResult> {
  const issues: FileValidationIssue[] = [];
  const scannedAt = new Date().toISOString();
  let url: URL;

  try {
    url = normalizeWebsiteUrl(inputUrl);
  } catch (error) {
    return {
      ok: false,
      inputUrl,
      checkedAssets: 0,
      scannedAt,
      issues: [issue("url-invalid", "error", "Invalid URL", error instanceof Error ? error.message : "Enter a valid http:// or https:// URL.")],
    };
  }

  if (url.protocol !== "https:") {
    issues.push(issue("url-not-https", "warning", "Website is not HTTPS", "Favicons can work on HTTP, but production websites and installable PWAs should use HTTPS."));
  }

  try {
    const htmlResponse = await fetchWithTimeout(url.toString(), { method: "GET" });
    const resolvedUrl = htmlResponse.url || url.toString();
    const contentType = htmlResponse.headers.get("content-type") ?? "";

    if (!htmlResponse.ok) {
      return {
        ok: false,
        inputUrl,
        resolvedUrl,
        checkedAssets: 0,
        scannedAt,
        issues: [
          ...issues,
          issue("url-fetch-failed", "error", "Website could not be fetched", `The page responded with HTTP ${htmlResponse.status}. Check the URL or try again later.`),
        ],
      };
    }

    if (contentType && !/html|xml|text/i.test(contentType)) {
      issues.push(issue("url-content-type", "info", "Page returned a non-HTML content type", `The URL responded with ${contentType}. The checker will still attempt to inspect the response.`));
    } else {
      issues.push(issue("url-fetch-ok", "success", "Website HTML fetched", `The page responded successfully${contentType ? ` with ${contentType}` : ""}.`));
    }

    const html = await readLimitedText(htmlResponse);
    const head = extractHead(html);
    const links = extractLinksFromHead(head, resolvedUrl);
    const manifestLink = links.find((link) => hasRel(link, "manifest"));
    const faviconLinks = links.filter((link) => hasRel(link, "icon") || link.rel.includes("shortcut icon"));
    const appleLinks = links.filter((link) => link.rel.includes("apple-touch-icon"));
    const maskIconLinks = links.filter((link) => link.rel.includes("mask-icon"));

    issues.push(...withUrlIssuePrefix(validateHtmlHeadText(head), "html"));

    if (faviconLinks.length) {
      issues.push(issue("url-favicon-links", "success", "Favicon link tags found", `${faviconLinks.length} rel=icon/shortcut icon link(s) found in the page head.`));
    } else {
      issues.push(issue("url-favicon-links-missing", "warning", "No explicit favicon link found", "Add a rel=icon link to make the favicon predictable across browsers. Browsers may still try /favicon.ico as a fallback."));
    }

    if (appleLinks.length) {
      issues.push(issue("url-apple-links", "success", "Apple touch icon link found", `${appleLinks.length} Apple touch icon link(s) found.`));
    } else {
      issues.push(issue("url-apple-links-missing", "warning", "Apple touch icon not linked", "Add rel=apple-touch-icon for polished iPhone and iPad home-screen shortcuts."));
    }

    if (maskIconLinks.length) {
      issues.push(issue("url-mask-icon", "info", "Safari pinned-tab mask icon found", `${maskIconLinks.length} mask-icon link(s) found. This is optional for many modern setups.`));
    }

    let manifestUrl: string | undefined;
    let manifest: ParsedManifest | null = null;
    let manifestIconRefs: string[] = [];

    if (manifestLink) {
      manifestUrl = manifestLink.absoluteUrl;
      try {
        const manifestResponse = await fetchWithTimeout(manifestUrl, { method: "GET" });
        if (!manifestResponse.ok) {
          issues.push(issue("url-manifest-fetch-failed", "error", "Manifest link is not reachable", `${manifestUrl} responded with HTTP ${manifestResponse.status}.`));
        } else {
          const manifestText = await readLimitedText(manifestResponse, 260_000);
          manifest = parseManifest(manifestText);
          issues.push(issue("url-manifest-fetch-ok", "success", "Manifest fetched", `Manifest was fetched from ${manifestUrl}.`));
          issues.push(...withUrlIssuePrefix(validateManifestText(manifestText), "manifest"));
          manifestIconRefs = manifestIconUrls(manifest, manifestUrl);
        }
      } catch (error) {
        issues.push(issue("url-manifest-fetch-error", "error", "Manifest could not be fetched", error instanceof Error ? error.message : `Unable to fetch ${manifestUrl}.`));
      }
    } else {
      issues.push(issue("url-manifest-link-missing", "warning", "Manifest link missing", "Add rel=manifest so Android, Chromium, and PWA install surfaces can find app metadata and icons."));
    }

    const fallbackFavicon = new URL("/favicon.ico", resolvedUrl).toString();
    const assetUrls = uniqueUrls([
      ...faviconLinks.map((link) => link.absoluteUrl),
      ...appleLinks.map((link) => link.absoluteUrl),
      ...maskIconLinks.map((link) => link.absoluteUrl),
      ...manifestIconRefs,
      fallbackFavicon,
    ]).slice(0, MAX_ASSET_CHECKS);

    const assetChecks = await Promise.all(assetUrls.map(checkAssetReachable));
    issues.push(...summarizeAssetChecks(assetChecks));

    const checkedManifestIcons = manifestIconRefs.length;
    if (manifest && checkedManifestIcons) {
      const has192 = manifest.icons?.some((icon) => icon.sizes?.includes("192x192"));
      const has512 = manifest.icons?.some((icon) => icon.sizes?.includes("512x512"));
      const hasMaskable = manifest.icons?.some((icon) => icon.purpose?.includes("maskable"));
      issues.push(has192 && has512
        ? issue("url-manifest-core-sizes", "success", "Manifest includes core PWA sizes", "The manifest references 192×192 and 512×512 icon sizes.")
        : issue("url-manifest-core-sizes-missing", "warning", "Manifest core icon sizes incomplete", "Add both 192×192 and 512×512 manifest icons for install prompts."));
      issues.push(hasMaskable
        ? issue("url-manifest-maskable", "success", "Maskable manifest icon found", "At least one manifest icon includes purpose: maskable.")
        : issue("url-manifest-maskable-missing", "info", "Maskable manifest icon not found", "Add a maskable icon entry to protect important artwork on adaptive Android launchers."));
    }

    const errors = issues.filter((item) => item.level === "error").length;

    return {
      ok: errors === 0,
      inputUrl,
      resolvedUrl,
      manifestUrl,
      checkedAssets: assetChecks.length,
      scannedAt,
      issues,
    };
  } catch (error) {
    return {
      ok: false,
      inputUrl,
      resolvedUrl: url.toString(),
      checkedAssets: 0,
      scannedAt,
      issues: [
        ...issues,
        issue("url-fetch-error", "error", "Website scan failed", error instanceof Error ? error.message : "Unable to fetch the website."),
      ],
    };
  }
}
