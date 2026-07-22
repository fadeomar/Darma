export type ExplorerPublicContentSource = "database" | "json";
export type ExplorerAdminContentSource = "database" | "github";

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() || "database";
}

export function parseExplorerPublicContentSource(
  value: string | undefined,
): ExplorerPublicContentSource {
  const source = normalize(value);
  if (source === "database" || source === "json") return source;
  throw new Error(`Unsupported EXPLORER_CONTENT_SOURCE: ${source}`);
}

export function parseExplorerAdminContentSource(
  value: string | undefined,
): ExplorerAdminContentSource {
  const source = normalize(value);
  if (source === "database" || source === "github") return source;
  throw new Error(`Unsupported EXPLORER_ADMIN_CONTENT_SOURCE: ${source}`);
}
