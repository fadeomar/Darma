/**
 * Active-navigation matching for the site header.
 *
 * Prefix matching alone lights up two items as soon as one nav route nests
 * under another: `/tools/css-loaders` matched both "Tools" and the flagship
 * "Loaders" entry. Ownership goes to the longest matching href instead, so a
 * descendant route always wins over its parent and exactly one item is active.
 */
export function matchesNavRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function resolveActiveNavHref(pathname: string, hrefs: string[]): string | null {
  let match: string | null = null;

  for (const href of hrefs) {
    if (!matchesNavRoute(pathname, href)) continue;
    if (!match || href.length > match.length) match = href;
  }

  return match;
}
