import type { FaviconInput, IconPurpose, ParsedManifest } from "./types";

export function normalizePathPrefix(pathPrefix: string): string {
  const trimmed = pathPrefix.trim() || "/";
  const withStart = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withStart.endsWith("/") ? withStart : `${withStart}/`;
}

export function joinPath(pathPrefix: string, filename: string): string {
  const normalized = normalizePathPrefix(pathPrefix);
  return `${normalized}${filename}`.replace(/\/+/g, "/");
}

export function createManifest(input: FaviconInput, options?: { includeMaskable?: boolean; iconBasePath?: string }): ParsedManifest {
  const prefix = options?.iconBasePath ?? input.pathPrefix;
  const icons = [
    {
      src: joinPath(prefix, "android-chrome-192x192.png"),
      sizes: "192x192",
      type: "image/png",
      purpose: "any" as IconPurpose,
    },
    {
      src: joinPath(prefix, "android-chrome-512x512.png"),
      sizes: "512x512",
      type: "image/png",
      purpose: "any" as IconPurpose,
    },
  ];

  if (options?.includeMaskable ?? input.includeMaskable) {
    icons.push(
      {
        src: joinPath(prefix, "maskable-icon-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable" as IconPurpose,
      },
      {
        src: joinPath(prefix, "maskable-icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable" as IconPurpose,
      },
    );
  }

  if (input.includeMonochrome) {
    icons.push({
      src: joinPath(prefix, "monochrome-icon-512x512.png"),
      sizes: "512x512",
      type: "image/png",
      purpose: "monochrome" as IconPurpose,
    });
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

export function manifestToJson(manifest: ParsedManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function createBrowserConfigXml(input: FaviconInput): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="${joinPath(input.pathPrefix, "mstile-150x150.png")}" />
      <TileColor>${input.manifestBackgroundColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
}
