export function safeFileName(input: string, fallback = "download") {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return cleaned || fallback;
}

export function withExtension(filename: string, extension: string) {
  const safe = safeFileName(filename);
  const normalizedExtension = extension.startsWith(".") ? extension : `.${extension}`;
  return safe.endsWith(normalizedExtension) ? safe : `${safe}${normalizedExtension}`;
}
